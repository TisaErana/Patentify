# Short-circuit script to import document claims somewhat-efficiently and in order.

from enum import unique
import pymongo
import pandas as pd

from threading import Thread

from pymongo import UpdateOne

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']
dbPatents = db['patents']
dbLabels = db['labels']
print('Connected to database.')

def process_USPATs():
  ## import USPAT claims:

  total_patents_in_db = 0
  matched_count_total = 0
  modified_count_total = 0

  USPATs = [element['documentId'] for element in list(dbPatents.find({"patentCorpus": "USPAT"}, {"_id": False, "documentId": 1}))]

  total_patents_in_db += len(USPATs)

  print('Total USPATs in database:', total_patents_in_db)

  cycle = 0
  for patent in USPATs:
    claims = []
    
    # improve speed by starting at lower end when patent number is newer: 
    if len(patent) >= 8:
      lookupRange = list(range(2021, 1975, -1))
    else:
      lookupRange = list(range(1976, 2022))
    
    for year in lookupRange:
      #print('USPAT Scanning', year, '...')
      
      # load USPAT claims from tsv file:
      uspatClaims = pd.read_csv(
        f'data/patent_claims/claims_{year}.tsv',
        header = 0, # header at row 0
        sep = '\t',  # tab separated
        usecols = ['patent_id', 'text'],
        dtype = { 'patent_id': str } # let's make it's all strings
      )

      filtered = uspatClaims[uspatClaims['patent_id'].isin([patent])]

      for claim in filtered.itertuples():
          claims.append(claim.text.strip())

      # sort based on number in text (ex: '1 .' or '12.')
      claims.sort(key=lambda x : int(x[0:2].replace('.','').strip()))

      if len(claims) > 0:
        result = dbPatents.update_one({ "documentId": patent}, 
        { 
          "$set": { 
              "claims": claims
            } 
        })

        print('--> Done with USPAT', patent,'claim import cycle', cycle, ', year:', year,'<--')
        break # short-circuit: found claims in current year, no need to check all other files.

    if len(claims) == 0:
      print('/--> PROBLEM with USPAT', patent, 'claim import cycle', cycle, 'missing claims, checked all years <--\\')

    cycle += 1
    matched_count_total += result.matched_count
    modified_count_total += result.modified_count

  print('----------------> USPAT Summary <----------------')
  print('USPAT Matched', matched_count_total, 'documents.')
  print('USPAT Updated', modified_count_total, 'documents.')
  print()

def process_PGPUBs():
  ## import PGPUB claims:

  matched_count_total = 0
  modified_count_total = 0

  PGPUBs = [element['documentId'] for element in list(dbPatents.find({"patentCorpus": "PGPUB"}, {"_id": False, "documentId": 1})) if int(element['documentId'][0:4]) >= 2005]
  PGPUBs.sort(key=int)

  print('Total PGPUBs 2005+ in database:', len(PGPUBs))

  cycle = 0
  for patent in PGPUBs:
    claims = []
    year = patent[0:4] # get year from document number

    # load USPAT claims from tsv file:
    applicationClaims = pd.read_csv(
      f'data/application_claims/claim_{year}.tsv',
      header = 0, # header at row 0
      sep = '\t',  # tab separated
      usecols = ['document_number', 'text'],
      dtype = { 'document_number': str, 'text': str } # let's make it's all strings
    )

    filtered = applicationClaims[applicationClaims['document_number'].isin([patent])]

    for claim in filtered.itertuples():
        claims.append(claim.text.strip())

    # sort based on number in text (ex: '1 .' or '12.')
    claims.sort(key=lambda x : int(x[0:2].strip()))
    
    if len(claims) > 0:
      result = dbPatents.update_one({ "documentId": patent}, 
      { 
        "$set": { 
            "claims": claims
          } 
      })

      print('--> Done with PGPUB', patent,'claim import cycle', cycle, ', year:', year ,'<--')
    else:
      print('/--> PROBLEM with PGPUB', patent, 'claim import cycle', cycle, 'missing claims, year: ', year, '<--\\')

    cycle += 1
    matched_count_total += result.matched_count
    modified_count_total += result.modified_count

  print('----------------> PGPUB Summary <----------------')
  print('PGPUB Matched', matched_count_total, 'documents.')
  print('PGPUB Updated', modified_count_total, 'documents.')
  print()

uspats_thread = Thread(target=process_USPATs)
pgpubs_thread = Thread(target=process_PGPUBs)

print('Started processing USPAT claims...')
uspats_thread.start()
print('Started processing 2005-2021 PGPUB claims...')
pgpubs_thread.start()
print()

uspats_thread.join()
pgpubs_thread.join()

# ## import missing claims:
# print('Started processing missing claims...')
# print()

# count = 1
# total = 0

# operations = []
# missing_match_count = 0
# missing_update_count = 0

# missingPatentClaims = pd.read_csv(
#     'data/missing_patent_claims_text.csv',
#     header = 0, # header at row 0
#     usecols = ['pat_no', 'claim_text'],
#     dtype = { 'pat_no': str, 'claim_text': str } # let's make it's all strings
# )

# # go through each patent and create bulk operations:
# uniquePatents = pd.Series({c: missingPatentClaims['pat_no'].unique() for c in missingPatentClaims})
# total = len(uniquePatents['pat_no'])

# for patent in uniquePatents['pat_no']:
#   claims = missingPatentClaims[missingPatentClaims['pat_no'] == patent]
#   claimList = []

#   for claim in claims.itertuples():
#     claimList.append(claim.claim_text)

#   operations.append(
#       UpdateOne({ "documentId": patent }, { 
#           "$set": { 
#               'claims': claimList
#           } 
#       })
#   )
#   print('Missing USPAT claims', f'{count}/{total}', 'metadata found.')
#   count += 1

# missingApplicationClaims = pd.read_csv(
#     'data/missing_pgpub_claims_text.csv',
#     header = 0, # header at row 0
#     usecols = ['pub_no', 'claim_idx', 'claim_text'],
#     dtype = { 'pub_no': str, 'claim_idx': int, 'claim_text': str } # set types
# )

# count = 1
# total = 0

# # go through each patent and create bulk operations:
# uniquePatents = pd.Series({c: missingApplicationClaims['pub_no'].unique() for c in missingApplicationClaims})
# total = len(uniquePatents['pub_no'])

# for patent in uniquePatents['pub_no']:
#   claims = missingApplicationClaims[missingApplicationClaims['pub_no'] == patent]
#   claimList = []

#   for claim in claims.itertuples():
#     claimList.append([claim.claim_idx, claim.claim_text])

#   claimList.sort(key=lambda x : x[0])
#   claimList = [element[1] for element in claimList]
  
#   operations.append(
#       UpdateOne({ "documentId": patent }, { 
#           "$set": { 
#               'claims': claimList
#           } 
#       })
#   )
#   print('Missing PGPUB claims', f'{count}/{total}', 'metadata found.')
#   count += 1

# print()
# print('Executing bulk operation...')
# result = dbPatents.bulk_write(operations, ordered=False)
# missing_match_count += result.matched_count
# missing_update_count += result.modified_count

# print('----------------> Summary <----------------')
# print('Missing Matched', missing_match_count, 'documents.')
# print('Missing Updated', missing_update_count, 'documents.')
# print()
