# Efficient script to insert titles+abstracts and report missing patent information.

import pymongo
import pandas as pd

from pymongo import UpdateOne

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']
dbPatents = db['patents']
dbLabels = db['labels']
print('Connected to database.')

# # load PGPUB data from tsv file:
# applications = pd.read_csv(
#   'data/application.tsv',
#   header = 0, # header at row 0
#   sep = '\t',  # tab separated
#   dtype = { 'document_number': str, 'invention_title': str, 'abstract': str } # let's make it's all strings
# )
# print('Loaded application.tsv into dataframe.')
# print()

# operations = []
# applications.drop(['id', 'type', 'application_number','date', 'country', 'series_code', 'rule_47_flag', 'filename'], axis=1, inplace=True)
# applications.rename(columns={'document_number': 'documentId', 'invention_title': 'title', 'invention_abstract': 'abstract' }, inplace=True)

# # remove those not in database:
# PGPUBs = [element['documentId'] for element in list(dbPatents.find({"patentCorpus": "PGPUB"}, {"_id": False, "documentId": 1}))]
# filtered = applications[applications['documentId'].isin(PGPUBs)]

# del applications

# # build bulk operation:
# for application in filtered.itertuples():
#     operations.append(
#         UpdateOne({ "documentId": application.documentId }, { 
#             "$set": { 
#                 'claims': [],
#                 'title': application.title.strip(),
#                 'abstract': application.abstract.strip()
#             } 
#         })
#     )

# print('Updating PGPUB metadata...')
# result = dbPatents.bulk_write(operations, ordered=False)
# print('Matched', result.matched_count, 'PGPUBs.')
# print('Updated', result.modified_count, 'PGPUBs.')
# print()

# # free up some space:
# del operations
# del filtered
# del result
# #del PGPUBs

# # load pre-2005 PGPUB data from tsv file:
# missing_PGPUB_titles = pd.read_csv(
#   'data/missing_pgpub_title_meta.csv',
#   header = 0, # header at row 0
#   dtype = { 'pub_no': str, 'title': str } # let's make it's all strings
# )
# print('Loaded missing_pgpub_title_meta.csv into dataframe.')
# print()

# missing_PGPUB_abstracts = pd.read_csv(
#   'data/missing_pgpub_abstract_text.csv',
#   header = 0, # header at row 0
#   dtype = { 'pub_no': str, 'abstract': str } # let's make it's all strings
# )
# print('Loaded missing_pgpub_abstract_text.csv into dataframe.')
# print()

# missing_PGPUBs = pd.merge(missing_PGPUB_titles, missing_PGPUB_abstracts, on="pub_no")
# operations = []

# # build bulk operation:
# for application in missing_PGPUBs.itertuples():
#     operations.append(
#         UpdateOne({ "documentId": application.pub_no }, { 
#             "$set": { 
#                 'claims': [],
#                 'title': application.title.strip(),
#                 'abstract': application.abstract.strip()
#             } 
#         })
#     )

# print('Updating missing PGPUB metadata...')
# result = dbPatents.bulk_write(operations, ordered=False)
# print('Matched', result.matched_count, 'PGPUBs.')
# print('Updated', result.modified_count, 'PGPUBs.')
# print()

# # free up some more space:
# del operations
# del missing_PGPUBs
# del missing_PGPUB_titles
# del missing_PGPUB_abstracts

# operations = []

# # load patent data from tsv file:
# patents = pd.read_csv(
#   'data/patent.tsv',
#   header = 0, # header at row 0
#   sep = '\t',  # tab separated
#   dtype = { 'id': str, 'number': str, 'abstract': str } # mixed types, let's make it all strings
# )
# print('Loaded patent.tsv into dataframe.')
# print()

# patents.drop(['type', 'number','date', 'country', 'kind', 'num_claims', 'filename', 'withdrawn'], axis=1, inplace=True)
# patents.rename(columns={'id': 'documentId'}, inplace=True)

# remove those not in database:
USPATs = [element['documentId'] for element in list(dbPatents.find({"patentCorpus": "USPAT"}, {"_id": False, "documentId": 1}))]
# filtered = patents[patents['documentId'].isin(USPATs)]

# # missingUSPATs = filtered[filtered['abstract'].isnull()]
# # missingUSPATs = missingUSPATs['documentId'].tolist()
# # missingUSPATs = ['PN/{}'.format(elem) for elem in missingUSPATs]
# # missingUSPATs = ' OR '.join(missingUSPATs)

# # print(missingUSPATs)

# # with open('missing.txt', 'w') as f:
# #     for item in missingUSPATs:
# #         f.write("%s\n" % item)

# filtered = filtered[~filtered['abstract'].isnull()]

# del patents

# # build bulk operation:
# for patent in filtered.itertuples():  
#     operations.append(
#         UpdateOne({ "documentId": patent.documentId }, { 
#             "$set": { 
#                 'claims': [],
#                 'title': patent.title.strip(),
#                 'abstract': patent.abstract.strip()
#             } 
#         })
#     )

# print('Updating USPAT metadata...')
# result = dbPatents.bulk_write(operations, ordered=False)
# print('Matched', result.matched_count, 'USPATs.')
# print('Updated', result.modified_count, 'USPATs.')
# print()

# # free up some space:
# del operations
# del filtered
# del result

# insert missing USPAT abstracts:
operations = []

# load patent data from tsv file:
patents = pd.read_csv(
  'data/missing_patent_abstract_text.csv',
  header = 0, # header at row 0
  dtype = { 'pat_no': str, 'abstract': str } # mixed types, let's make it all strings
)
print('Loaded missing_patent_abstract_text.csv into dataframe.')
print()

patents.rename(columns={'pat_no': 'documentId'}, inplace=True)
filtered = patents[patents['documentId'].isin(USPATs)]

# build bulk operation:
for patent in filtered.itertuples():  
    operations.append(
        UpdateOne({ "documentId": patent.documentId }, { 
            "$set": { 
                'abstract': patent.abstract.strip()
            } 
        })
    )

print('Updating missing USPAT metadata...')
result = dbPatents.bulk_write(operations, ordered=False)
print('Matched', result.matched_count, 'USPATs.')
print('Updated', result.modified_count, 'USPATs.')
print()

# release resources:
del result
del patents
del filtered
del operations

# operations = []
# labelOperations = []

# # load patent crosswalk data from tsv file:
# crosswalk = pd.read_csv(
#   'data/granted_patent_crosswalk.tsv',
#   header = 0, # header at row 0
#   sep = '\t',  # tab separated
#   dtype = { 'document_number': str, 'patent_number': str }
# )
# print('Loaded granted_patent_crosswalk.tsv into dataframe.')
# print()

# filtered = crosswalk[crosswalk['document_number'].isin(PGPUBs)]

# # build bulk operation:
# for application in filtered.itertuples():
#     operations.append(
#         UpdateOne({ "documentId": application.document_number }, { 
#             "$set": { 
#                 'documentId': application.patent_number.strip(),
#                 'patentCorpus': 'USPAT'
#             } 
#         })
#     )

#     labelOperations.append(
#         UpdateOne({ "document": application.document_number }, { 
#             "$set": { 
#                 'document': application.patent_number.strip()
#             } 
#         })
#     )

# print('Upgrading granted PGPUBs to USPATs...')
# result = dbPatents.bulk_write(operations, ordered=False)
# result2 = dbLabels.bulk_write(labelOperations, ordered=False)
# print('Matched', result.matched_count, 'PGPUBs to USPATs.')
# print('Updated', result.modified_count, 'PGPUBs to USPATs.')
# print('Matched', result2.matched_count, 'PGPUBs to USPATs labels.')
# print('Updated', result2.modified_count, 'PGPUBs to USPATs labels.')
# print()


# # free up some space:
# del labelOperations
# del operations
# del crosswalk
# del result2
# del result

# missing = list(dbPatents.find({ "title" : { "$exists" : False } }))
# missing_count = dbPatents.count_documents({ "title" : { "$exists" : False } })

# with open('missing.txt', 'w') as f:
#     f.write('Patents with missing metadata: ')
#     f.write(str(missing_count))
#     f.write(' documents\n')
#     for item in missing:
#         f.write("%s\n" % item)
        
# print('Wrote documents with missing metadata to missing.txt')
# print()

# print('Done.')