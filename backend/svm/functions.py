import sklearn
import pymongo
import pickle
import json

from sklearn.feature_extraction.text import CountVectorizer
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
def base_model_creator(client, stopwords):
    db = client['PatentData']
    collection = db['CSV_Patents']
    results = collection.find(limit = 500, filter = {'grp_ml': 'seed'})
    seeds = pd.DataFrame(list(results))
    antiseeds = pd.DataFrame(list(collection.find(limit = 500, filter = {'grp_ml': 'antiseed'})))
    
    
    seeds['text'] = seeds['abstract']+""+seeds['title']
    antiseeds['text'] = antiseeds['abstract']+""+antiseeds['title']
    df = seeds.append(antiseeds)
    df = df.reset_index(drop=True)
    data = df[['_id','text','grp_ml']]
    data['grp_ml']= data.grp_ml.map(dict(seed=1, antiseed=0))

#     stopwords = []
#     with open('stopwords.txt') as f:
#         lines = f.readlines()
#         for line in lines:
#             stopwords.append(line[:-1])
    #Prepare Data                                           #the stop words are the words that arent going to be used in the model
    
    vectorizer = CountVectorizer(stop_words = stopwords)    #Transform a given text into a vector on the basis of the frequency (count) of each word that occurs in the entire text#
    X = vectorizer.fit_transform(data['text'].values)       #fit model and then transform shape of array
    svd = TruncatedSVD(n_components=100,random_state=42)       #reduces dimension
    X = svd.fit_transform(X)
    y = data['grp_ml'].values                                   
    #X, y = vectorize(data, stopwords, target = 'grp_ml')


    # Create Learner
    learner = ActiveLearner(
        estimator=svm.SVC(kernel='linear', gamma='scale', C=2, probability = True),         #estimator uses svm, c is penalty parameter, gamma is kernel coeeficcient, 
        query_strategy=uncertainty_sampling,
        X_training=X, y_training=y                                                          #this just makes x and y the training values
    )
    
    # joblib dump
    
    dump(learner.estimator,'models/Final/base_model.joblib')
    dump(vectorizer, 'vectorizer.joblib')
    sleep(3)
    

def model_loader(model = 'base_model_working'):
    estimator = load(f"models/Final/{model}.joblib")
    return estimator



def svm_format(client, ids, target, stopwords):
    """
    Transforms annotations into something the svm model understands.
    Result is a tuple with the proper vectorization of the annotations.
    """
    db = client['PatentData']
    collection = db['patents']
    entries = list(collection.find(filter = {'documentId':{'$in':ids}}))            #find patents by patent id
    print(entries)
    print("entries Length", len(entries))
    txt = [p['abstract']+''+p['title'] for p in entries]                            #text hold the abstract and title
    print(txt)
    print("text length", len(txt))
    #target = list(map(lambda x: 1 if x=='Yes' else 0, target))                      #target maps the label -> to a 0 or 1.
    print(target)
    print("Target length",len(target))
    df = pd.DataFrame(data = {'id':ids,'text':txt,'target':target})                 #this will put the id, text{abstract and title}, and target{label??} into a dataframe
    print(df)
    return vectorize(df, stopwords, vect = True)                                    
    

def vectorize(df, stopwords, target='target', vect = False):
#     if vect:
    vectorizer = load("vectorizer.joblib")
#     else:
#         vectorizer = CountVectorizer(stop_words = stopwords)
    X = vectorizer.transform(df['text'].values).toarray()
#     print(X)
#     print(X.shape)
    svd = TruncatedSVD(n_components=100,random_state=42)
    X = svd.fit_transform(X)
#     print(X)
    y = df['target'].values
    return X, y


  