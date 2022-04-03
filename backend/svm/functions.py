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

    x, y = vectorize(data)

    # create active learner: 
    learner = ActiveLearner(
        estimator=svm.SVC(kernel='linear', gamma='scale', C=2, probability = True), # estimator uses svm, c is penalty parameter, gamma is kernel coefficient, 
        query_strategy=uncertainty_sampling,
        X_training=x, y_training=y                                                  # this just makes x and y the training values
    )
    
    # save new model:
    dump(learner.estimator,'models/Final/base_model.joblib')
    dump(vectorizer, 'vectorizer.joblib')

def model_loader(model = 'base_model'):
    estimator = load(f"models/Final/{model}.joblib")
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

def svm_format(client, ids, target, stopwords):
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

    return vectorize(df, stopwords, vect = True)                                    

def vectorize(df, target='target'):
    vectorizer = load("vectorizer.joblib")
    x = vectorizer.transform(df['text'].values).toarray() # fit model and then transform shape of array
    
    # reduce dimension:
    svd = TruncatedSVD(n_components=100,random_state=42)
    x = svd.fit_transform(x)
    y = df[target].values
    
    return x, y

def calc_f1_score(learner, client):
    """
    Calculates f1_score based on labels the model has not been trained on.
    """
    db = client['PatentData']
    test_labels = db['test_labels'].find() # labels which the model has not been trained on.

    ids = [] #               document ids of newly annotated documents.
    target = [] #            classification of newly annotated documents.
    
    for label in test_labels:
        ids.append(label['document'])
        target.append(get_target(label))
    
    print(ids)
    print(target)

    x, y = svm_format(client, ids, target, '')
    y_predictions = learner.predict(x)

    print(f1_score(target, y_predictions, average='weighted'))

    return 0

