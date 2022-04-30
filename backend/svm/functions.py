import sklearn
import pymongo
import pickle
import json

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from sklearn.decomposition import TruncatedSVD
from sklearn import svm

from modAL.uncertainty import uncertainty_sampling
from modAL.models import ActiveLearner

from joblib import dump, load

import pandas as pd
import numpy as np

from time import sleep
from datetime import datetime

from pymongo import InsertOne

from configuration import *

# GLOBALS:
model_filename = None

# load stopwords
try:
    stopwords = []                          
    with open('stopwords.txt') as f:                
        lines = f.readlines()
        for line in lines:
            stopwords.append(line[:-1])             
except FileNotFoundError:
    print('stopwords.txt not found, seeting stopwords="english"')
    stopwords= "english"                                                    #this adds all the stop words from a stopwords text file

# Train base model with annotations in database:
def train_base_model(client, learner):
    """
    If set in the configuration, 

    this will train the base model from all annotations in db, save as working model,
    and switch to the working model.
    """
    if TRAIN_BASE_MODEL:
        db = client['PatentData']

        oneAnnotator = db.labels.find({ })
        agreedLabels = db.agreed_labels.find({ })
        disagredLabels = db.disagreed_labels.find({ "consensus": { "$exists": True } })

        ids = [] #               document ids of newly annotated documents.
        target = [] #            classification of newly annotated documents.
        
        for annotation in oneAnnotator:
            ids.append(annotation['document'])
            target.append(get_target(annotation))

        for annotation in agreedLabels:
            ids.append(annotation['document'])
            target.append(get_target(annotation['consensus']))

        for annotation in disagredLabels:
            ids.append(annotation['document'])
            target.append(get_target(annotation['consensus']))

        print('[TRAIN_BASE_MODEL]: found', len(ids), 'documents, training...')
        
        #print(len(set(ids)))
        #print(len(target))
        #print(svm_format(client, ids, target))
        
        x, y = vectorize(svm_format(client, ids, target))
        learner.teach(X=x, y=y)

        # switch to working model:
        global model_filename

        model_filename = f'models/working_model_[scikit-learn-{sklearn.__version__}].joblib'
        dump(learner.estimator, model_filename)

        print('[TRAIN_BASE_MODEL]: training successful, switched to working_model')

# Create base model and save into file
def base_model_creator(client, data='data/seed_antiseed_476.pkl'):
    """
    Creates a new base model from seed and antiseed data.
    """
    
    # import training data from pickle file:
    pickledDataFile = open(data, 'rb')
    data = pickle.load(pickledDataFile)
    #print(data)
    #print(data[data['AI'] == 'seed'])
    #print(data[data['AI'] == 'antiseed'])
    #print(len(set(data['id'].values)))
    
    # format training data for new model:
    data.rename(columns={'AI': 'target'}, inplace=True)
    data['target'] = data.target.map(dict(seed=1, antiseed=0))
    data['text'] = data['abstract_text']+''+data['title']
    data = data.reindex(columns=['id', 'text', 'target'])
    #print(data)

    x, y = vectorize(data)

    # create active learner: 
    learner = ActiveLearner(
        estimator=svm.SVC(kernel='linear', gamma='scale', C=2, probability = True), # estimator uses svm, c is penalty parameter, gamma is kernel coefficient, 
        query_strategy=uncertainty_sampling,
        X_training=x, y_training=y                                                  # this just makes x and y the training values
    )
    
    # save base model:
    global model_filename 
    model_filename = f'models/base_model_[scikit-learn-{sklearn.__version__}].joblib'
    
    dump(learner.estimator, model_filename)

def model_loader():
    global model_filename 

    try: # to load a working model that has been trained on more than see/antiseed data:
        model_filename = f'models/working_model_[scikit-learn-{sklearn.__version__}].joblib'
        estimator = load(model_filename)
    except FileNotFoundError: # try to load the base model:
        model_filename = f'models/base_model_[scikit-learn-{sklearn.__version__}].joblib'
        estimator = load(model_filename)

    return estimator

def get_target(entry):
    """
    Processes a label entry and calculates it's target.
    Returns if annotation concludes the document is in AI category or not.
    """
    values = list(map(lambda x: 1 if x=='Yes' else 0, [
        entry['mal'], 
        entry['hdw'], 
        entry['evo'], 
        entry['spc'], 
        entry['vis'], 
        entry['nlp'], 
        entry['pln'], 
        entry['kpr']
    ]))
    #print(values)

    return int(any(values))

def svm_format(client, ids, target):
    """
    Finds document metadata and formats it into a dataframe.
    @returns a dataframe compatible with the vectorize() function.
    """
    db = client['PatentData']
    collection = db['patents']
    entries = list(collection.find(filter = {'documentId':{'$in':ids}})) # find patents by patent id
    #print(entries)
    print("length of entries array:", len(entries))
    
    txt = [p['abstract']+''+p['title'] for p in entries]                 # text holds: {abstract + title}
    #print(txt)
    #print("length of text array:", len(txt))
    #target = list(map(lambda x: 1 if x=='Yes' else 0, target))          # target maps the label -> to a 0 or 1.
    
    #print(target)
    print("length of target array",len(target))
    
    df = pd.DataFrame(data = {'id':ids,'text':txt,'target':target})      # this will put the id, text{abstract and title}, and target into a dataframe
    #print(df)

    return df                                    

def vectorize(df, target='target'):
    """
    Transforms annotations into something the svm model understands.
    @param df: a dataframe generated with the svm_format() function.
    @returns a tuple with the x and y vectorization of the annotations.
    """
    
    # Transforms a given text into a vector on the basis of the frequency (count) of each word that occurs in the entire text #
    vectorizer = CountVectorizer(stop_words = stopwords)

    #print(df)
    #print(df['text'])
    #print(df['text'].to_numpy())
    
    x = vectorizer.fit_transform(df['text'].to_numpy()) # build vocabulary and transform data

    #print(x.todense())
    #print(vectorizer.get_feature_names())
    
    # reduce dimension:
    svd = TruncatedSVD(n_components=N_COMPONENTS, random_state=42)
    x = svd.fit_transform(x)
    y = df[target].values

    #print(x)
    #print(y)

    return x, y

def svm_metrics_init(learner, client):
    """
    Saves the model filename, the boot time, and current f1_score.
    """
    db = client['PatentData']
    svm_metrics = db.svm_metrics.find_one()
    svm_command = db.svm_command.find_one()

    f1_score = calc_f1_score(learner, client)
    currentDateTime = datetime.utcnow()

    # check if there is already a metrics entry:
    if svm_metrics == None:
        db.svm_metrics.insert_one({ 
            "model_filename": model_filename,

            "f1_scores": [ { "score": f1_score, "date": currentDateTime } ],
            "uncertain_F1_score": -1,

            "initializedAt": currentDateTime,
            "uncertainUpdatedAt": datetime.utcnow()
        })
    else: # let's update it:
        db.svm_metrics.update_one(
        {
            "_id": svm_metrics["_id"]
        }, 
        {
            "$set": {
                "model_filename": model_filename,
                
                "initializedAt": currentDateTime
            },
            "$push": {
                "f1_scores": {
                    "$each": [ { "score": f1_score, "date": currentDateTime } ],
                    "$slice": -F1_SCORE_MAX # negative value returns last n elements
                }
            }
        })

    # insert command entry if it does not alreay exist:
    if svm_command == None:
        db.svm_command.insert_one({ 
            "command": 'ready'
        })
    elif not(svm_command['command'] == 'acknowledged'):
        db.svm_command.update_one({ "_id": svm_command["_id"]}, {
            "$set": { 
                "command": 'ready'
            }
        })
    
    print('[INFO]: svm metrics initialized')

def update_svm_metrics(client, operations):
    """
    Updates the svm metrics in the database.
    @param client: the db client connection.
    @param operations: a mongoDB compatible object with update operations.
    """
    db = client['PatentData']
    svm_metrics = db.svm_metrics.find_one()

    db.svm_metrics.update_one({
        "_id": svm_metrics["_id"]
    }, operations)

def acknowledge_svm_command(client):
    """
    Acknowledge the last command was successfully executed.
    @param client: the db client connection.
    """
    client['PatentData'].svm_command.find_one_and_update({}, {
        "$set": {
            "command": 'acknowledged'
        }
    })

def handle_command(client, learner, change):
    """
    Process commands sent from frontend.
    @param client: the db client connection.
    @param learner: the active learner object.
    @param the change object from the watch stream.
    """
    command = change['updateDescription']['updatedFields']['command']

    if command == 'calc_f1_score':
        currentDateTime = datetime.utcnow()
        
        update_svm_metrics(client, {
            "$push": {
                "f1_scores": {
                    "$each": [ { "score": calc_f1_score(learner, client), "date": currentDateTime } ],
                    "$slice": -F1_SCORE_MAX # negative value returns last n elements
                }
            }
        })
        acknowledge_svm_command(client)

# def calc_f1_score(learner, client, collection='labels'):
#     """
#     Calculates f1_score based on labels the model has not been trained on.
#     collection must be a collection with schema of type ../models/label_model.
#     """
#     db = client['PatentData']
#     test_labels = db[collection].find() # labels which the model has not been trained on.

#     ids = [] #               document ids of newly annotated documents.
#     target = [] #            classification of newly annotated documents.
    
#     for label in test_labels:
#         ids.append(label['document'])
#         target.append(get_target(label))
    
#     print(ids)
#     print(target)

#     x, y = svm_format(client, ids, target)
#     y_predictions = learner.predict(x)

#     return f1_score(target, y_predictions, average='weighted')

def calc_f1_score(learner, client, file='data/decision_boundary-462.pkl'):
    """
    Calculates f1_score based on annotations saved in pickled dataframe file.
    """
    # import training data from pickle file:
    pickledDataFile = open(file, 'rb')
    data = pickle.load(pickledDataFile)
    #print(data)

    x, y_true = vectorize(svm_format(client, data['doc_id'].values.tolist(), data['Annotated_value'].values.tolist()))
    y_predictions = learner.predict(x)

    return f1_score(y_true, y_predictions, average='weighted')

def find_uncertain_patents(learner, client):
    """
    Predicts on data from pickle file, finds patents it is uncertain of, and updates database.
    """
    db = client['PatentData']

    if 'base_model' in model_filename:
        # import data from pickle file:
        pickledDataFile = open('data/decision_boundary-462.pkl', 'rb')
        data = pickle.load(pickledDataFile)
        #print(data)
        
        data.rename(columns={'doc_id': 'id'}, inplace=True)
        x, y_true = vectorize(svm_format(client, data['id'].values.tolist(), data['Annotated_value'].values.tolist()))
    else:
        # sample from unlabeled patents:
        ids = [element['documentId'] for element in list(db.unlabeled_patents.aggregate([ { "$sample": { "size": UNCERTAIN_SAMPLE_SIZE } } ]))]
        data = svm_format(client, ids, [None] * len(ids))
        x, _ = vectorize(data)
        

    # # get average certainties:
    # proba = learner.predict_proba(x)
    # # find the highest probability per document:
    # max_proba_idx = np.amax(proba, axis=1)
    # # sort probabilities ascending:
    # sorted_proba = np.sort(max_proba_idx)
    
    # print(proba)
    # print(max_proba_idx)
    # print(sorted_proba)

    operations = []
    uncertain_indexes = uncertainty_sampling(learner, x, int((UNCERTAIN_SAMPLE_SIZE * UNCERTAIN_SAMPLE_PERCENT)))

    for index in uncertain_indexes:
        documentId = data['id'].values[index] 
        document = db['patents'].find_one({ 'documentId': documentId  })

        operations.append(
            InsertOne({ 
                "documentId": documentId,
                'date': document['date'],
                'title': document['title'],
                'abstract': document['abstract'],
                'claims': document['claims'],
                'patentCorpus': document['patentCorpus']
            })
        )

    # verify that the values are correct:
    #print(data['doc_id'].values[uncertain_indexes[0]])
    #print(proba[uncertain_indexes[0]])

    result = db['uncertain_patents'].bulk_write(operations, ordered=False)
    print(result.bulk_api_result)

    # update uncertain f1_score
    f1_score = calc_f1_score(learner, client)
    currentDateTime = datetime.utcnow()

    update_svm_metrics(client, {
        "$set": {              
            "uncertain_F1_score": f1_score,
            "uncertainUpdatedAt": currentDateTime
        },
        "$push": {
            "f1_scores": {
                "$each": [ { "score": f1_score, "date": currentDateTime } ],
                "$slice": -F1_SCORE_MAX # negative value returns last n elements
            }
        }
    })
