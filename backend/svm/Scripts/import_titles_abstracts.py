import pymongo
import pandas as pd

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']
patents = db['patents']
print('Connected to database.')

# load PGPUB data from tsv file:
df = pd.read_csv(
  'application.tsv',
  header = 0, # header at row 0
  sep = '\t'  # tab separated
)
print('Loaded application.tsv into dataframe.')

#print(df.columns)
#print(df.head(4))
#print(df[df.document_number == 20210259522])

PGPUBtotal = 0
PGPUBs = patents.find({"patentCorpus": "PGPUB"}, {"_id": False, "documentId": 1})
print('Retrieved PGPUB list from database.')
print()

print('Updating metadata...')
for item in PGPUBs:
  metadata = df[df.document_number == int(item['documentId'])]
  #print(metadata)

  if metadata.empty:
    print('PGPUB', item['documentId'], 'is not in application.tsv. Skipping.')
    continue

  result = patents.update_one({"documentId": item['documentId']}, {
    "$set": 
    {
      "title": metadata.invention_title.values[0].strip(),
      "abstract": metadata.invention_abstract.values[0].strip()
    }})
  
  PGPUBtotal += result.modified_count

print('Done.')
print('Total PGPUB Documents Modified:', PGPUBtotal)
print()

# load granted patent data from tsv file:
df = pd.read_csv(
  'patent.tsv',
  header = 0, # header at row 0
  sep = '\t',  # tab separated
  dtype = { 'id': str, 'abstract': str } # mixed types, let's make it all strings
)
print('Loaded patent.tsv into dataframe.')

USPATtotal = 0
USPATs = patents.find({"patentCorpus": "USPAT"}, {"_id": False, "documentId": 1})
print('Retrieved USPAT list from database.')
print()

print('Updating metadata...')
for item in USPATs:
  metadata = df[df.id == item['documentId']]
  #print(metadata)

  if metadata.empty:
    print('USPAT', item['documentId'], 'is not in patent.tsv. Skipping.')
    continue
  if metadata.abstract.values[0] == "" or metadata.abstract.values[0] == "NULL" or (not isinstance(metadata.abstract.values[0], str)):
    print('USPAT', item['documentId'], 'is not missing abstract in petent.tsv. Skipping.')
    continue

  result = patents.update_one({"documentId": item['documentId']}, {
    "$set": 
    {
      "title": str(metadata.title.values[0]).strip(),
      "abstract": str(metadata.abstract.values[0]).strip()
    }})
  
  USPATtotal += result.modified_count

print('Done.')
print('Total USPAT Documents Modified:', USPATtotal)
print('Total Documents Modified:', PGPUBtotal + USPATtotal)