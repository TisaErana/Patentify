# simple script to find and delete documents that are missing essential metadata: title, abstract

import pymongo

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']

print('Connected to database.')
print()

missingTitle = [element['documentId'] for element in list(db.patents.find({ 'title': '' }, {"_id": False, "documentId": 1}))]
missingAbstract = [element['documentId'] for element in list(db.patents.find({ 'abstract': '' }, {"_id": False, "documentId": 1}))]

print('Missing Title: ', len(missingTitle))
print('Missing Abstract: ', len(missingAbstract))

def delete_documents(documents):
    print()
    print('Deleted from Patents collection:', db.patents.delete_many({ 'documentId': { '$in': documents } }).deleted_count)
    print('Deleted from Unlabeled_Patents collection:',db.unlabeled_patents.delete_many({ 'documentId': { '$in': documents } }).deleted_count)
    print('Deleted from Uncertain_Patents collection:',db.uncertain_patents.delete_many({ 'documentId': { '$in': documents } }).deleted_count)
    print()

delete_documents(missingTitle)
delete_documents(missingAbstract)