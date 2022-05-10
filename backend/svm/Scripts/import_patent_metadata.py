# multi-threaded, (almost) crash-proof script to import all patent metadata into the database.
# requires the 'patents' collection to be empty at first or to not contain any of the documents in the files.

from enum import unique
import sys
import time
import pymongo
import pandas as pd

from threading import Thread
from pymongo import UpdateOne, InsertOne
from concurrent.futures import ThreadPoolExecutor, wait

# connect to database:
client = pymongo.MongoClient("mongodb://localhost:27017/PatentData")
db = client['PatentData']

dbPatents = db['patents']
print('Connected to database.')

# configuration:
PATENTS_TSV = 'data/patent.tsv'
MISSING_USPAT_ABSTRACTS = 'data/missing_patent_abstract_text.csv'

PGPUB_TSV = 'data/application.tsv'
MISSING_PGPUB_METADATA = 'data/missing_pgpub_title_meta.csv'
MISSING_PGPUB_ABSTRACTS = 'data/missing_pgpub_abstract_text.csv'

MAX_CLAIM_BULK_OPERATIONS = 5500
PATENT_CLAIMS_TSV_DIR = 'data/patent_claims'
PGPUB_CLAIMS_TSV_DIR = 'data/application_claims'

PATENT_MISSING_CLAIMS_CSV = 'data/missing_patent_claims_text.csv'
PGPUB_MISSING_CLAIMS_CSV = 'data/missing_pgpub_claims_text.csv'

# process USPATs:
def process_USPATs():
    operations = []
    start = time.time()

    patents = pd.read_csv(PATENTS_TSV,
        header = 0, 
        sep = '\t', 
        usecols = ['id', 'date', 'abstract', 'title', 'type'],
        dtype = { 'id': str, 'date': str, 'abstract': str }
    )
    patents = patents[~patents['type'].isin(['defensive publication', 'design'])] # exclude defensive publications and design documents

    patentCount = len(patents.index)
    print('[USPATs_Thread]: total USPATs to be imported:', patentCount)

    # build bulk operation:
    for patent in patents.itertuples():
        operations.append(
            InsertOne({ 
                "documentId": patent.id,
                'date': '' if pd.isna(patent.date) else patent.date.strip(), 
                'title': '' if pd.isna(patent.title) else patent.title.strip(),
                'abstract': '' if pd.isna(patent.abstract) else patent.abstract.strip(),
                'patentCorpus': 'USPAT',
                'claims': []
            })
        )

    # execute bulk operation:
    result = dbPatents.bulk_write(operations, ordered=False)
    print('[USPATs_Thread]:', result.bulk_api_result)

    # create index for faster update operations:
    dbPatents.create_index([('documentId', pymongo.ASCENDING)], unique=True)

    operations = []

    patents = pd.read_csv(MISSING_USPAT_ABSTRACTS,
        header = 0,
        usecols = ['pat_no', 'abstract'],  
        dtype = { 'pat_no': str, 'abstract': str }
    )
    missingCount = len(patents.index)
    print('[USPATs_Thread]: total missing USPATs to be imported:', missingCount)

    # build bulk operation:
    for patent in patents.itertuples():   
        operations.append(
            UpdateOne({ "documentId": patent.pat_no }, { 
                "$set": {
                    'abstract': '' if pd.isna(patent.abstract) else patent.abstract.strip()
                } 
            })
        )

    # execute bulk operation:
    result = dbPatents.bulk_write(operations, ordered=False)
    print('[USPATs_Thread]:', result.bulk_api_result)

    print('[USPATs_Thread]: elapsed time:', (time.time()) - start, 'seconds')

# process PGPUBs:
def process_PGPUBs():
    operations = []
    start = time.time()

    applications = pd.read_csv(PGPUB_TSV,
        header = 0, 
        sep = '\t', 
        usecols = ['document_number', 'date', 'invention_title', 'invention_abstract'],
        dtype = { 'document_number': str, 'date': str, 'invention_abstract': str }
    )
    applicationCount = len(applications.index)
    print('[PGPUBs_Thread]: total PGPUBs to be imported:', applicationCount)

    # build bulk operation:
    for application in applications.itertuples():
        operations.append(
            InsertOne({ 
                "documentId": application.document_number,
                'date': '' if pd.isna(application.date) else application.date.strip(), 
                'title': '' if pd.isna(application.invention_title) else application.invention_title.strip(),
                'abstract': '' if pd.isna(application.invention_abstract) else application.invention_abstract.strip(),
                'patentCorpus': 'PGPUB',
                'claims': []
            })
        )
    
    # execute bulk operation:
    result = dbPatents.bulk_write(operations, ordered=False)
    print('[PGPUBs_Thread]:', result.bulk_api_result)

    operations = []

    applications = pd.read_csv(MISSING_PGPUB_METADATA,
        header = 0, 
        usecols = ['pub_no', 'pub_dt', 'title'],
        dtype = { 'pub_no': str, 'pub_dt': str, 'title': str }
    )
    applicationCount = len(applications.index)
    print('[PGPUBs_Thread]: total missing PGPUB metadata to be imported:', applicationCount)

    # build bulk operation:
    for application in applications.itertuples():   
        operations.append(
            UpdateOne({ "documentId": application.pub_no }, { 
                "$set": {
                    'date': application.pub_dt.strip(),
                    'title': application.title.strip(),
                    'patentCorpus': 'PGPUB'
                } 
            }, upsert=True)
        )

    # execute bulk operation:
    result = dbPatents.bulk_write(operations, ordered=False)
    print('[PGPUBs_Thread]:', result.bulk_api_result)

    operations = []

    applications = pd.read_csv(MISSING_PGPUB_ABSTRACTS,
        header = 0, 
        usecols = ['pub_no', 'abstract'],
        dtype = { 'pub_no': str, 'abstract': str }
    )
    applicationCount = len(applications.index)
    print('[PGPUBs_Thread]: total missing PGPUB abstracts to be imported:', applicationCount)

    # build bulk operation:
    for application in applications.itertuples():   
        operations.append(
            UpdateOne({ "documentId": application.pub_no }, { 
                "$set": {
                    'abstract': '' if pd.isna(application.abstract) else application.abstract.strip()
                } 
            })
        )

    # execute bulk operation:
    result = dbPatents.bulk_write(operations, ordered=False)
    print('[PGPUBs_Thread]:', result.bulk_api_result)

    print('[PGPUBs_Thread]: elapsed time:', (time.time()) - start, 'seconds')

# process claims:
def process_claims(year, thread, dir, id_col):
    total = 0
    nDocuments = 0
    
    patents = pd.read_csv(
        f'{dir}/{"claims" if thread == "USPAT" else "claim"}_{year}.tsv',
        header = 0, # header at row 0
        sep = '\t',  # tab separated
        usecols = [ id_col, 'text'],
        dtype = { id_col: str } # let's make it's all strings
    )

    documents = set(patents[id_col].values) # find all unique document ids
    nDocuments = len(documents) # number of documents we need to import claims for
    sys.stdout.write(f'\n\n[{year}_{thread}_Claims_Thread]: documents to import: {nDocuments}\n')

    operations = []
    for patent in documents:
        claims = []
        
        filtered = patents[patents[id_col].isin([patent])]
        #print(filtered)

        for claim in filtered.itertuples():
            if not(pd.isna(claim.text)):
                claims.append(claim.text.strip())
        
        try:
            # sort based on number in text (ex: '1 .' or '12.')
            claims.sort(key=lambda x : int(x[0:2].replace('.','').strip()))
        except:
            #sys.stdout.write(f'\n[{year}_{thread}_Claims_Thread]: unable to sort {thread} {patent}, claims are not properly numbered')
            pass

        if len(claims) > 0:
            operations.append(
                UpdateOne({ "documentId": patent }, { 
                    "$set": {
                        'claims': claims
                    } 
                })
            )  
            # result = dbPatents.update_one({ "documentId": patent}, { 
            #     "$set": { 
            #         "claims": claims
            #     } 
            # })

            #sys.stdout.write(f'\n[{year}_USPAT_Claims_Thread]: USPAT {patent}, \n{result.raw_result}\n')
        else:
            sys.stdout.write(f'\n[{year}_{thread}_Claims_Thread]: unable to import {thread} {patent} claims, none found')

        
        # limit size of bulk operations:
        if len(operations) >= MAX_CLAIM_BULK_OPERATIONS:
            total += len(operations)
            result = dbPatents.bulk_write(operations, ordered=False)
            sys.stdout.write(f'\n[{year}_{thread}_Claims_Thread]: bulk claims update operation: \n\n{result.bulk_api_result}\ntotal so far: {total}/{nDocuments}\n')
            operations = []
        
        
    # perform left over bulk operations:
    if len(operations) > 0:
        total += len(operations)
        result = dbPatents.bulk_write(operations, ordered=False)
        sys.stdout.write(f'\n[{year}_{thread}_Claims_Thread]: bulk claims update operation: \n\n{result.bulk_api_result}\n')
        sys.stdout.write(f'\n[{year}_{thread}_Claims_Thread]: total {thread}s imported: {total}/{nDocuments}\n')


# process missing claims:
def process_missing_claims(thread, file, id_col, text_col):
    total = 0
    nDocuments = 0
    
    patents = pd.read_csv(
        file,
        header = 0,
        usecols = [ id_col, text_col ],
        dtype = { id_col: str, text_col: str }
    )

    documents = set(patents[id_col].values) # find all unique document ids
    nDocuments = len(documents) # number of documents we need to import claims for
    sys.stdout.write(f'\n\n[{thread}_Missing_Claims_Thread]: documents to import: {nDocuments}\n')

    operations = []
    for patent in documents:
        claims = []
        
        filtered = patents[patents[id_col].isin([patent])]
        #print(filtered)

        for claim in filtered.itertuples():
            claims.append(getattr(claim, text_col).strip())
        
        try:
            # sort based on number in text (ex: '1 .' or '12.')
            claims.sort(key=lambda x : int(x[0:2].replace('.','').strip()))
        except:
            #sys.stdout.write(f'\n[{thread}_Missing_Claims_Thread]: unable to sort {thread} {patent}, claims are not properly numbered')
            pass

        if len(claims) > 0:
            operations.append(
                UpdateOne({ "documentId": patent }, { 
                    "$set": {
                        'claims': claims
                    } 
                })
            )  
            # result = dbPatents.update_one({ "documentId": patent}, { 
            #     "$set": { 
            #         "claims": claims
            #     } 
            # })

            #sys.stdout.write(f'\n[{year}_USPAT_Claims_Thread]: USPAT {patent}, \n{result.raw_result}\n')
        else:
            sys.stdout.write(f'\n[{thread}_Missing_Claims_Thread]: unable to import {thread} {patent} claims, none found')

        
        # limit size of bulk operations:
        if len(operations) >= MAX_CLAIM_BULK_OPERATIONS:
            total += len(operations)
            result = dbPatents.bulk_write(operations, ordered=False)
            sys.stdout.write(f'\n[{thread}_Missing_Claims_Thread]: bulk claims update operation: \n\n{result.bulk_api_result}\ntotal so far: {total}/{nDocuments}\n')
            operations = []
        
        
    # perform left over bulk operations:
    if len(operations) > 0:
        total += len(operations)
        result = dbPatents.bulk_write(operations, ordered=False)
        sys.stdout.write(f'\n[{thread}_Missing_Claims_Thread]: bulk claims update operation: \n\n{result.bulk_api_result}\n')
        sys.stdout.write(f'\n[{thread}_Missing_Claims_Thread]: total {thread} imported: {total}/{nDocuments}\n')


uspats_thread = Thread(target=process_USPATs)
pgpubs_thread = Thread(target=process_PGPUBs)

# these use way too much memory to be executed in parallel:

print('Started processing USPATs...')
uspats_thread.start()
uspats_thread.join()
print('Finished processing USPATs.')

print('Started processing PGPUBs...')
pgpubs_thread.start()
pgpubs_thread.join()
print('Finished processing PGPUBs.')

# execute a thread/year to import claims:

threads = []
start = time.time()
with ThreadPoolExecutor(max_workers=2) as executor:
    for year in range(1976, 2022):
        future = executor.submit(process_claims, year, 'USPAT', PATENT_CLAIMS_TSV_DIR, 'patent_id')
        threads.append(future)
    for year in range(2005, 2022):
        future = executor.submit(process_claims, year, 'PGPUB', PGPUB_CLAIMS_TSV_DIR, 'document_number')
        threads.append(future)
    
    future = executor.submit(process_missing_claims, 'USPAT', PATENT_MISSING_CLAIMS_CSV, 'pat_no', 'claim_text')
    threads.append(future)
    
    future = executor.submit(process_missing_claims, 'PGPUB', PGPUB_MISSING_CLAIMS_CSV, 'pub_no', 'claim_text')
    threads.append(future)

wait(threads)

# print any thread exceptions:
for thread in threads:
    print(thread.result())

print('[Claims_Import]: elapsed time:', (time.time()) - start, 'seconds')


# find missing patents
missingDate = [element['documentId'] for element in list(dbPatents.find({ 'date': '' }, {"_id": False, "documentId": 1}))]
missingTitle = [element['documentId'] for element in list(dbPatents.find({ 'title': '' }, {"_id": False, "documentId": 1}))]
missingAbstract = [element['documentId'] for element in list(dbPatents.find({ 'abstract': '' }, {"_id": False, "documentId": 1}))]
missingClaims = [element['documentId'] for element in list(dbPatents.find({ 'claims': [] }, {"_id": False, "documentId": 1}))]

#print('Missing Date:', missingDate)
#print('Missing Title:', missingTitle)
#print('Missing Abstract:', missingAbstract)
#print('Missing Claims:', missingClaims)

if len(missingDate) > 0:
    with open('missing.date.txt', 'w') as f:
        for item in missingDate:
            f.write("%s\n" % item)
if len(missingTitle) > 0:
    with open('missing.title.txt', 'w') as f:
        for item in missingTitle:
            f.write("%s\n" % item)
if len(missingAbstract) > 0:
    with open('missing.abstract.txt', 'w') as f:
        for item in missingAbstract:
            f.write("%s\n" % item)
if len(missingClaims) > 0:
    with open('missing.claims.txt', 'w') as f:
        for item in missingClaims:
            f.write("%s\n" % item)