# usage: python .\remove_duplicates.py > delete.results

# WARNING: this script does not take into account multiple users/annotators labeling documents.
# WARNING: this script will only leave 1 annotation per document.
import pymongo

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']
patents = db['labels']
print('Connected to database.')


labeledPatents = patents.find({ }, {"_id": False, "document": 1}).distinct('document')
print('Found', len(labeledPatents), 'unique labels.')


for patent in labeledPatents:
    patentTotal = 0
    match = patents.count_documents({ 'document': patent })

    if match > 1:
        for i in range(1, match):
            result = patents.delete_one({ 'document': patent })
            patentTotal += result.deleted_count
    
    print(patent, ': found', match, 'total records,', 'deleted', patentTotal, 'duplicates.')
print('Done.')