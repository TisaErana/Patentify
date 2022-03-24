from itertools import cycle
from functions import *
from time import time

from sklearn.metrics import f1_score

#stablish connection to the database

client = MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']       
cluster = db['labels']

#load stopwords

try:
    stopwords = []                          
    with open('stopwords.txt') as f:                
        lines = f.readlines()
        for line in lines:
            stopwords.append(line[:-1])             
except FileNotFoundError:
    print('stopwords.txt not found, seeting stopwords="english"')
    stopwords= "english"                                                    #this adds all the stop words from a stopwords text file

#create learner and check for base_learner
    
learner = None
try:
    print("Checking for Base Model")
    base_estimator = model_loader()
    print("Model Successfully loaded")
except FileNotFoundError:
    print("File not Found, creating a base model")
    base_model_creator(client, stopwords)
    base_estimator = model_loader()

if learner is None:
    learner = ActiveLearner(
        estimator=base_estimator,
        query_strategy=uncertainty_sampling
    )


# main logic loop. Open the stream and look for updates to labels database, each 3 updates (3 for testing 100 for prod(?)) the model will learn
# the new labels which will be processed first. finally we will dump the resume token in order to continue with the process later on
    
entries = 0
cycleCount = 1

ids = []
target = []
try:
    db_stream = None
    continue_starter = None
    continue_after = None
    try:
        continue_after = continue_starter = load('continue_token.joblib')
        db_stream = cluster.watch(resume_after=continue_starter)
        print('[INFO]: found resume token:', continue_starter)
    except FileNotFoundError:
        db_stream = cluster.watch()  
        continue_after = continue_starter = db_stream._resume_token
        print('[INFO]: no resume token found, using latest resume token:', continue_starter)
        
    with db_stream as stream:
        print("Listening...")
        while stream.alive:
            change = stream.next()
            if change is not None:
                entry = change['fullDocument']
                print(f'Entry:{entry}')

                entries +=1
                ids.append(entry['document'])

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

                isAI = int(any(values))
                target.append(isAI)

                if entries > 3:
                    continue_after = change['_id']
                    print(ids)
                    print(target)
                    X, y = to_learn(client, ids, target, stopwords)
                    #sleep(5)
                    learner.teach(X=X, y=y)
                    entries = 0
                    ids = []
                    target = []    

                    print("[INFO]: done with cycle", cycleCount)
                    cycleCount += 1

                if cycleCount % 3 == 0:
                    print(f'[AUTO-SAVE {time():0.0f}]: saved latest model and continue_token')
                    dump(learner.estimator, f'models/Final/auto-save_latest.joblib')
                    dump(continue_after,'continue_token.joblib')
except KeyboardInterrupt:
    print("Interrupted")

print("Finalizing ...")
if continue_after is not continue_starter:
    print("Dumping continue_after")
    dump(learner.estimator, f'models/Final/model_at_{time():0.0f}.joblib')
    dump(continue_after,'continue_token.joblib')
else:
    print("No successful iterations... No changes will be made.")