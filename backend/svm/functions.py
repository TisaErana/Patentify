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

from pymongo import InsertOne

# Create base model and save into file
def base_model_creator(client, stopwords, data='data/AI_train_df.pkl'):
    """
    Creates a new base model from seed and antiseed data.
    """
    
    # import training data from pickle file:
    pickledDataFile = open(data, 'rb')
    data = pickle.load(pickledDataFile)
    #print(data)
    
    # format training data for new model:
    data.rename(columns={'AI': 'target'}, inplace=True)
    data['target'] = data.target.map(dict(seed=1, antiseed=0))
    data['text'] = data['abstract_text']+''+data['title']
    data = data.reindex(columns=['id', 'text', 'target'])
    #print(data)

    # Transforms a given text into a vector on the basis of the frequency (count) of each word that occurs in the entire text #
    vectorizer = CountVectorizer(stop_words = stopwords)

    x, y = vectorize(data, vectorizer, training=True)

    # create active learner: 
    learner = ActiveLearner(
        estimator=svm.SVC(kernel='linear', gamma='scale', C=2, probability = True), # estimator uses svm, c is penalty parameter, gamma is kernel coefficient, 
        query_strategy=uncertainty_sampling,
        X_training=x, y_training=y                                                  # this just makes x and y the training values
    )
    
    # save new model:
    dump(learner.estimator,f'models/Final/base_model_{sklearn.__version__}.joblib')
    dump(vectorizer, f'vectorizer_{sklearn.__version__}.joblib')

def model_loader(model = f'base_model_{sklearn.__version__}'):
    estimator = load(f'models/Final/{model}.joblib')
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

def svm_format(client, ids, target, training=False):
    """
    Transforms annotations into something the svm model understands.
    Returns a tuple with the x and y vectorization of the annotations.
    """
    db = client['PatentData']
    collection = db['patents']
    entries = list(collection.find(filter = {'documentId':{'$in':ids}})) # find patents by patent id
    #print(entries)
    #print("length of entries array:", len(entries))
    
    txt = [p['abstract']+''+p['title'] for p in entries]                 # text holds: {abstract + title}
    #print(txt)
    #print("length of text array:", len(txt))
    #target = list(map(lambda x: 1 if x=='Yes' else 0, target))          # target maps the label -> to a 0 or 1.
    
    #print(target)
    #print("length of target array",len(target))
    
    df = pd.DataFrame(data = {'id':ids,'text':txt,'target':target})      # this will put the id, text{abstract and title}, and target into a dataframe
    #print(df)

    return vectorize(df, training=training)                                    

def vectorize(df, vectorizer = None, target='target', training=False):
    if vectorizer == None:
        vectorizer = load(f'vectorizer_{sklearn.__version__}.joblib')

    if training:
        x = vectorizer.fit_transform(df['text'].values) # fit model and then transform shape of array
    else:
        x = vectorizer.transform(df['text'].values).toarray() # only transform the data do not fit it
    
    
    # reduce dimension:
    svd = TruncatedSVD(n_components=100,random_state=42)
    x = svd.fit_transform(x)
    y = df[target].values
    
    return x, y

def calc_f1_score(learner, client, collection='labels'):
    """
    Calculates f1_score based on labels the model has not been trained on.
    collection must be a collection with schema of type ../models/label_model.
    """
    db = client['PatentData']
    test_labels = db[collection].find() # labels which the model has not been trained on.

    ids = [] #               document ids of newly annotated documents.
    target = [] #            classification of newly annotated documents.
    
    for label in test_labels:
        ids.append(label['document'])
        target.append(get_target(label))
    
    print(ids)
    print(target)

    x, y = svm_format(client, ids, target)
    y_predictions = learner.predict(x)

    return f1_score(target, y_predictions, average='weighted')

def calc_f1_score(learner, client, file):
    """
    Calculates f1_score based on annotations saved in pickled dataframe file.
    """
    # import training data from pickle file:
    pickledDataFile = open(file, 'rb')
    data = pickle.load(pickledDataFile)
    print(data)

    x, y_true = svm_format(client, data['doc_id'].values.tolist(), data['Annotated_value'].values.tolist())
    y_predictions = learner.predict(x)

    return f1_score(y_true, y_predictions, average='weighted')

def find_uncertain_patents(learner, client, file='data/decision_boundary-462.pkl'):
    """
    Predicts on data from pickle file, finds patents it is uncertain of, and updates database.
    """
    db = client['PatentData']

    # import data from pickle file:
    pickledDataFile = open(file, 'rb')
    data = pickle.load(pickledDataFile)
    #print(data)

    x, y_true = svm_format(client, data['doc_id'].values.tolist(), data['Annotated_value'].values.tolist())
    
    # # get average certainties:
    # proba = learner.predict_proba(x)
    # # find the hgihest probability per document:
    # max_proba_idx = np.amax(proba, axis=1)
    # # sort probabilities ascending:
    # sorted_proba = np.sort(max_proba_idx)
    
    # print(proba)
    # print(max_proba_idx)
    # print(sorted_proba)

    operations = []
    uncertain_indexes = uncertainty_sampling(learner, x, 110)

    for index in uncertain_indexes:
        documentId = data['doc_id'].values[index] 
        document = db['patents'].find_one({ 'documentId': documentId  })

        operations.append(
            InsertOne({ 
                "documentId": documentId,
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
