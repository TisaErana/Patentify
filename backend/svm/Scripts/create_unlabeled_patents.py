import pymongo

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']

dbLabels = db['labels']
dbPatents = db['patents']
dbAgreedLabels = db['agreed_labels']
dbDisagreedLabels = db['disagreed_labels']
dbUnlabeledPatents = db['unlabeled_patents']
print('Connected to database.')

labeledPatents = []
differentLabels = [element['document'] for element in list(dbLabels.find({ }, {"_id": False, "document": 1}))]
agreedLabels = [element['document'] for element in list(dbAgreedLabels.find({ }, {"_id": False, "document": 1}))]
disagreedLabels = [element['document'] for element in list(dbDisagreedLabels.find({ }, {"_id": False, "document": 1}))]

labeledPatents.extend(differentLabels)
labeledPatents.extend(agreedLabels)
labeledPatents.extend(disagreedLabels)

labeledPatents = list(set(labeledPatents)) # there should not be duplicates, but just in case...

print()
print('Total different labels:', len(differentLabels))
print('Total agreed labels:', len(agreedLabels))
print('Total disagreed labels:', len(disagreedLabels))
print()
print('Unique patents labeled:', len(labeledPatents))
print('Total patents in database', dbPatents.count_documents({ }))
print()

unlabeledPatents = list(dbPatents.find({ 'documentId': { "$nin": labeledPatents } }, {"_id": False, "documentId": 1}))

print('Total patents that are unlabeled:', len(unlabeledPatents))
print()

result = dbUnlabeledPatents.insert_many(unlabeledPatents)
print('Done.')