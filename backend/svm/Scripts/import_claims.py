import pymongo
import pandas as pd

from pymongo import UpdateOne

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']
dbPatents = db['patents']
dbLabels = db['labels']
print('Connected to database.')

print('Started processing patent_claims_all.tsv...')
print()

matched_count_total = 0
modified_count_total = 0

USPATs = [element['documentId'] for element in list(dbPatents.find({"patentCorpus": "USPAT"}, {"_id": False, "documentId": 1}))]
print('Total USPATs in database:', len(USPATs))

cycle = 0
for patent in USPATs:
  claims = []

  # load USPAT claims from tsv file:
  uspatClaims = pd.read_csv(
    'data/patent_claims_all.tsv',
    header = 0, # header at row 0
    sep = '\t',  # tab separated
    chunksize = 10000000, # process in chunks
    usecols = ['patent_id', 'text', 'claim_number'],
    dtype = { 'patent_id': str, 'claim_number': int } # let's make it's all strings
  )

  for chunk in uspatClaims:
    chunk = chunk[chunk['patent_id'].isin([patent])]
    
    for entry in chunk.itertuples():
      claims.append([entry.claim_number, entry.text.strip()])

  claims.sort(key=lambda x : x[0])
  print(claims)
  claims = [element[1] for element in claims]
  print(claims)

  result = dbPatents.bulk_write([
    UpdateOne({ "documentId": patent}, { 
      "$set": { 
          "claims": claims
        } 
      }        
    )
  ], ordered=False)

  print('--> Done with USPAT claim import cycle', cycle, '<--')

  cycle += 1
  matched_count_total += result.matched_count
  modified_count_total += result.modified_count

print('Started processing application_claims_all.tsv...')
print()

PGPUBs = [element['documentId'] for element in list(dbPatents.find({"patentCorpus": "PGPUB"}, {"_id": False, "documentId": 1}))]
print('Total PGPUBs in database:', len(PGPUBs))

cycle = 0
for patent in PGPUBs:
  claims = []

  # load USPAT claims from tsv file:
  applicationClaims = pd.read_csv(
    'data/application_claim_all.tsv',
    header = 0, # header at row 0
    sep = '\t',  # tab separated
    chunksize = 10000000, # process in chunks
    usecols = ['document_number', 'text'],
    dtype = { 'document_number': str, 'text': str } # let's make it's all strings
  )

  for chunk in applicationClaims:
    chunk = chunk[chunk['document_number'].isin([patent])]
    
    for entry in chunk.itertuples():
      claims.append(entry.text.strip())

  claims.sort(key=lambda x : int(x[0:2].strip()))
  print(claims)

  result = dbPatents.bulk_write([
    UpdateOne({ "documentId": patent}, { 
      "$set": { 
          "claims": claims
        } 
      }        
    )
  ], ordered=False)

  print('--> Done with PGPUB claim import cycle', cycle, '<--')

  cycle += 1
  matched_count_total += result.matched_count
  modified_count_total += result.modified_count

print()
print('Matched', matched_count_total, 'documents.')
print('Updated', modified_count_total, 'documents.')
print()