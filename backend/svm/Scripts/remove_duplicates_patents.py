# usage: python .\remove_duplicates.py > delete.results

# WARNING: this script does not take into account multiple users/annotators labeling documents.
# WARNING: this script will only leave 1 annotation per document.
import pymongo

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']
patents = db['patents']
print('Connected to database.')


patentsList =   list(patents.find({ }, {"_id": False, "documentId": 1}))
print('Found', len(patentsList), 'unique patents.')


for patent in patentsList:
    patentTotal = 0
    match = patents.count_documents({ 'documentId': patent['documentId'] })
    if match > 1:
        for i in range(1, match):
            result = patents.delete_one({ 'documentId': patent['documentId'] })
            patentTotal += result.deleted_count
    
    print(patent, ': found', match, 'total records,', 'deleted', patentTotal, 'duplicates.')
print('Done.')