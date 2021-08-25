import re
import json
import boto3
import time
import os.path


#Update using golden protocol activity list
protocol_activity_lst = {'protocol activity','clinical assessments', 'performance status', 'tumor history', 'complete physical examination', 'pregnancy test', 
'height', 'contraception check', 'hematology', 'abbreviated physical examination', 'cru confinement', 'blood chemistry', 'ecog performance status', 
'weight', 'coagulation', 'study day', 'baseline signs and symptoms', 'study treatment administration', 'visit window (days)', 'physical examination', 
'other clinical assessments', 'vital signs', 'adverse event monitoring', 'ct or mri scan or equivalent', 'visit identifier', 'randomization', 
'study treatment', 'visit window', 'urine drug test', 'tumor assessments', 'admission to cru', 'protocol activity', 'informed consent', 'urinalysis', 
'serious and non-serious adverse event monitoring', 'laboratory studies', 'medical history', 'outpatient visit', 'inclusion/exclusion criteria', 
'laboratory', 'demography', 'registration and treatment', 'registration', 'adverse events', 'body weight', 'informed consent demography',
'trial period:','scheduled hour','informed consent','study procedures',# Added for Merck
'informed consent','visit','demographics', #NCT03285594
'study period','visit number','study day', #NCT03550378
'visit type','visit #'
} 

## Testing
path_raw_activity = './raw_activities.csv'
if os.path.isfile(path_raw_activity):
    with open(path_raw_activity, mode='r') as f:
        raw_activity_lst = f.read().splitlines()
        raw_activity_lst = set(raw_activity_lst[1:])
        #print(raw_activity_lst)
        protocol_activity_lst.update(raw_activity_lst)
else:
    print("raw_activities.csv not found at location: "+path_raw_activity)
########

### Textract ###
def startJob(s3BucketName, objectName):
    response = None
    client = boto3.client('textract')
    response = client.start_document_analysis(
    DocumentLocation={
     'S3Object': {
     'Bucket': s3BucketName,
     'Name': objectName
     }}, FeatureTypes=['TABLES'])
    return response["JobId"]

def isJobComplete(jobId):
    time.sleep(5)
    client = boto3.client('textract')
    response = client.get_document_analysis(JobId=jobId)
    status = response["JobStatus"]
    while(status == "IN_PROGRESS"):
        time.sleep(5)
        response = client.get_document_analysis(JobId=jobId)
        status = response["JobStatus"]
    return status

def getJobResults(jobId):
    pages = []
    client = boto3.client('textract')
    response = client.get_document_analysis(JobId=jobId)
    pages.append(response)
    nextToken = None
    if('NextToken' in response):
        nextToken = response['NextToken']
    while(nextToken):
        response = client.get_document_analysis(JobId=jobId, NextToken=nextToken)
        pages.append(response)
        nextToken = None
        if('NextToken' in response):
            nextToken = response['NextToken']
    return pages

def get_textract_response(s3BucketName,documentPath,filename):
    filename = documentPath+filename
    #print(f'Processing -- {filename}')
    jobId = startJob(s3BucketName, filename)
    #print("Started textract job with id: {}".format(jobId))
    raw = ''
    response = None
    if(isJobComplete(jobId)):
        response = getJobResults(jobId)
    return response

### Textract table ###
def getresponseforpage(response,pageno):
    pageresponse = []
    for r in response:
        blocks=r['Blocks']
        for block in blocks:
            if int(block['Page']) == pageno:
                pageresponse.append(block)
    return pageresponse

def gettableblocks(blocks):
    blocks_map = {}
    table_blocks = []
    for block in blocks:
        blocks_map[block['Id']] = block
        if block['BlockType'] == "TABLE":
            table_blocks.append(block)
    if len(table_blocks) <= 0:
        #print("NO Table FOUND")
        return None,None  
    #print(f"Found {len(table_blocks)} Tables")
    return blocks_map,table_blocks

def get_rows_columns_map(table_result, blocks_map):
    rows = {}
    for relationship in table_result['Relationships']:
        if relationship['Type'] == 'CHILD':
            for child_id in relationship['Ids']:
                cell = blocks_map[child_id]
                if cell['BlockType'] == 'CELL':
                    row_index = cell['RowIndex']
                    col_index = cell['ColumnIndex']
                    if row_index not in rows:
                        rows[row_index] = {}                  
                    rows[row_index][col_index] = get_text(cell, blocks_map)
    return rows

def get_text(result, blocks_map):
    text = ''
    if 'Relationships' in result:
        for relationship in result['Relationships']:
            if relationship['Type'] == 'CHILD':
                for child_id in relationship['Ids']:
                    word = blocks_map[child_id]
                    if word['BlockType'] == 'WORD':
                        text += word['Text'] + ' '
                    if word['BlockType'] == 'SELECTION_ELEMENT':
                        if word['SelectionStatus'] =='SELECTED':
                            text +=  ''#'X ' #Already have selected component  
    return text

def to_sup(s):
    sups = {u'0': u'\u2070',
            u'1': u'\xb9',
            u'2': u'\xb2',
            u'3': u'\xb3',
            u'4': u'\u2074',
            u'5': u'\u2075',
            u'6': u'\u2076',
            u'7': u'\u2077',
            u'8': u'\u2078',
            u'9': u'\u2079'}
    return ''.join(sups.get(char, char) for char in s)

def replaceSubstring(text):
  x = re.search(r'( \d+)$|(\d+)$|(\d+ )$', text)
  if x:
    ss = x.group()
    output = text.replace(ss,to_sup(ss))
    return output
  else:
    return removeSubscript(text)
    
def removeSubscript(text):
    #output = text.strip('0123456789').strip()
    m = r'(^ \d+)|(^\d+ )|(\d+)$|(\d+ )$'
    output = re.sub(m, "", text)
    output = output.strip()
    return output

def generate_table_csv(table_result, blocks_map):
    table = ''
    rows = get_rows_columns_map(table_result, blocks_map)    
    for row_index, cols in rows.items():     
        for col_index, text in cols.items():
            if col_index == 1:
                table += '{}'.format(removeSubscript(text)) + ","
            else:
                table += '{}'.format(text) + ","
        table += '\n'       
    table += '\n'
    return table

def generate_table(table_result, blocks_map):
    table = []
    rows = get_rows_columns_map(table_result, blocks_map)
    
    for row_index, cols in rows.items():  
        table_row = []
        for col_index, text in cols.items():
            if col_index == 1:
                table_row.append(removeSubscript(text)) # Process subscripts #replaceSubstring(text)
            else:    
                table_row.append(text.strip())
        table.append(table_row)     
    return table

def processTable(blocks_map,table_blocks,csv=True):
    tablelst = []
    for table in table_blocks:
        if csv:
            tb = generate_table_csv(table, blocks_map)
        else:
            tb = generate_table(table, blocks_map)
        tablelst.append(tb)
    return tablelst

### SOA Extraction ###
def findSOAPageLst(response):
    pagematch = set()
    for r in response:
        blocks=r['Blocks']
        blocks_map = {}
        table_blocks = []
        for block in blocks:
            blocks_map[block['Id']] = block
            if block['BlockType'] == "LINE":
                text = block['Text']
                #'^(SCHEDULE|Schedule) (OF|of) (ACTIVITIES|Activities$|EVENTS)'
                #'^((SCHEDULE|Schedule) (OF|of|Of) (ACTIVITIES|Activities$|EVENTS))|^(Protocol Activity)'
                pattern_soa = '^((SCHEDULE|Schedule) (OF|of|Of) (ACTIVITIES|Activities$|EVENTS))'
                if re.match(pattern_soa, text): #,re.IGNORECASE
                    top = block['Geometry']['BoundingBox']['Top']
                    pageno = block['Page']
                    try:
                        nextblock = blocks[blocks.index(block)+1]['Text']
                    except:
                        nextblock = '0'
                    if not nextblock.isdigit() and top<.2:     #top<.2:
                        #print(pageno,'-->',text,top,nextblock)
                        pagematch.add(pageno)
    return list(sorted(pagematch))

def tablefromNCTdocument(response,page,csv=True):
    blocks = getresponseforpage(response,page)
    blocks_map,table_blocks = gettableblocks(blocks)
    if blocks_map != None or table_blocks != None:
        tables = processTable(blocks_map,table_blocks,csv)
        return tables
    else:
        return []

def removeSpecialChars(str):
    return re.sub('[^A-Za-z0-9]+', '', str)

def checkTableColumnsMatch(table1,table2):
    min_rows = min([len(table1),len(table2)])
    headers_matched = 0
    for r in range(min_rows):
        tr1 = table1[r] #re.sub(r'[\+ ]', '', ''.join(table1[r])) #table1[r]
        tr2 = table2[r] #re.sub(r'[\+ ]', '', ''.join(table2[r])) #table2[r]
        tr1 = [removeSpecialChars(x.lower()) for x in tr1 if x != '']
        tr2 = [removeSpecialChars(x.lower()) for x in tr2 if x != '']
        if tr1 == tr2: #Todo
            result = True
            headers_matched += 1
        else: 
            return headers_matched
        #elif table1[r][0] == '' and table2[r][0] == '':
    return headers_matched

def trimcombinetable(table,matchheaders):
    trimmedtable = []
    for _row in table[matchheaders+1:]: #Remove Matched columns
        row = [re.sub(r'^X.*', 'X', r) for r in _row]  
        if row[0] != '' and row[0] != None:
            if 'X' in row:
                trimmedtable.append(row)
            elif row[0] != '' and all(elem == '' for elem in row[1:]): #All row values empty except the first column
                trimmedtable.append(row)
    return trimmedtable

def combineTables(table1,table2,matchheaders):
    output = table1
    #output += table2[matchheaders+1:]
    output += trimcombinetable(table2,matchheaders)
    return output

def array2htmltable(table):
    q = "<table>"
    for i in [(table[0:1], 'th'), (table[1:], 'td')]:
        q += "".join([
                "<tr>%s</tr>" % str(_mm) 
                for _mm in [
                    "".join(
                        [
                            "<%s>%s</%s>" % (i[1], str(_q), i[1]) 
                            for _q in _m
                        ]
                    ) for _m in i[0]
                ] ])+""
    q += "</table>"
    return q

def SOAtableAnalysis(table):
    tableAnalysis = {}
    len_row = len(table[0][1:]) #Excluding the first column
    for row in table[1:]:
        if row[0] != '' and row[0] != None:
            if ('X' in row): #or (row[0] != '' and all(elem == '' for elem in row[1:])):
                activity = {}
                activity['name'] = row[0]
                activity['CPT'] = ''
                activity['totalVisits'] = row.count('X')
                if len(row) != 0:
                    activity['frequency'] = activity['totalVisits']/len_row
                else:
                    activity['frequency'] = 0
                tableAnalysis[activity['name']] = activity
    return tableAnalysis

def SOAfromResponse(response,tabletype,jsontype=False,pretty=False):
    pagelist = sorted(findSOAPageLst(response))
    output = {}
    for page in pagelist:
        pageno = page
        tables = tablefromNCTdocument(response,page,False)
        if len(tables) == 0:
            return
        combinetable = tables[0]
        pagefound = [pageno]
        continueSearch = True
        #while (pageno+1 not in pagelist) and continueSearch == True:
        while continueSearch == True:
            pageno += 1
            tables = tablefromNCTdocument(response,pageno,False)
#             if len(tables) == 0:
#                 continueSearch = False
            for table in tables:
                headerMatch = checkTableColumnsMatch(combinetable,table)
                if headerMatch>0:
                    combinetable = combineTables(combinetable,table,headerMatch)
                    pagefound.append(pageno)
                    if pageno in pagelist:
                        pagelist.remove(pageno)
                else:
                    continueSearch = False
                    break   
        if tabletype == 'csv':
            outputtable = ''
            for r in combinetable:
                outputtable += ','.join(r)+'\n'
        elif tabletype == 'html':
            outputtable = array2htmltable(combinetable)
        else:
            outputtable = combinetable      
        analysis = SOAtableAnalysis(combinetable)
        output[page] = {'table':outputtable,'analysis':analysis,'pages':pagefound}
    if jsontype and pretty:
        return json.dumps(output,indent=2)
    elif jsontype:
        return json.dumps(output)
    else:
        return output

# def matchProtocolActivityTable(table):
#     first_col = [r[0].lower().strip() for r in table]
#     pa_match =  protocol_activity_lst & set(first_col) #set(protocol_activity_lst) & first_col_unique   #sum(x in first_col_str for x in protocol_activity_lst)
#     #pa_match_pc = len(pa_match)/len(len_first_col)*100
#     return pa_match,first_col

# def matchProtocolActivityTable(table):
#     max_pa_match,protocol_col = set(),None
#     for i in [0,1]:
#         if len(table[0])>i:
#             first_col = [r[i].lower().strip() for r in table]
#             pa_match =  protocol_activity_lst & set(first_col) #set(protocol_activity_lst) & first_col_unique   #sum(x in first_col_str for x in protocol_activity_lst)
#             if len(pa_match)>len(max_pa_match):
#                 max_pa_match = pa_match
#                 protocol_col = first_col
#             #pa_match_pc = len(pa_match)/len(len_first_col)*100
#     return max_pa_match,first_col

def matchProtocolActivityTable(table):
    max_pa_match,protocol_col = set(),None
    for i in [0,1]: # Consider 2nd column for Takeda case
        first_col = []
        for r in table:
            if len(r)>i:
                first_col.append(r[i].lower().strip())
        pa_match =  protocol_activity_lst & set(first_col) #set(protocol_activity_lst) & first_col_unique   #sum(x in first_col_str for x in protocol_activity_lst)
        if len(pa_match)>len(max_pa_match):
            max_pa_match = pa_match
            protocol_col = first_col
    return max_pa_match,first_col

def SOAfromResponseUsingPA(response,tabletype,jsontype=False,pretty=False):
    page_count = response[0]['DocumentMetadata']['Pages']
    tables_count = 0
    output = {}
    pagelist = list(range(page_count+1))
    SOA_pagelist = sorted(findSOAPageLst(response))
    for page in pagelist:
        pageno = page
        tables = tablefromNCTdocument(response,page,False)
        if len(tables) == 0:
            continue    
        combinetable = [] #combinetable = tables[0]
        for _row in tables[0]:
            row = [re.sub(r'^X.*', 'X', r) for r in _row]
            combinetable.append(row)
        pagefound = [pageno]
        continueSearch = True
        while continueSearch == True and pageno<pagelist[-1]:
            pageno += 1
            if pageno in SOA_pagelist: #TODO
                break #To consider seperate tables based of findSOAPageLst()
            tables = tablefromNCTdocument(response,pageno,False)
            for table in tables:
                headerMatch = checkTableColumnsMatch(combinetable,table)
                if headerMatch>0:
                    combinetable = combineTables(combinetable,table,headerMatch)
                    pagefound.append(pageno)
                    if pageno in pagelist:
                        pagelist.remove(pageno)
                else:
                    continueSearch = False
                    break     
        ### checkPA #########
        pa_match,first_col = matchProtocolActivityTable(combinetable)
        if len(pa_match)>2:
            if tabletype == 'csv':
                outputtable = ''
                for r in combinetable:
                    outputtable += ','.join(r)+'\n'
            elif tabletype == 'html':
                outputtable = array2htmltable(combinetable)
            else:
                outputtable = combinetable     
            output[tables_count] = {'table':outputtable,'pages':pagefound,'protocol_matched':list(pa_match),'raw_activities':first_col}
            tables_count+=1
        #####################  
    if jsontype and pretty:
        return json.dumps(output,indent=2)
    elif jsontype:
        return json.dumps(output)
    else:
        return output

#### Test from local json ###
# from os.path import join
# def loadresponse(filename):
#     if filename.endswith('.json'):  
#         with open(join(path, filename), "rb") as f:
#             print(f'Reading: {filename}')
#             response = json.load(f)
#             return response
#     return None
# path = 'data/processed/textract/document/error/' #'data/processed/textract/document/pfizer/phase1/'
# filename = 'NCT00736632.json' #'NCT02841267.json' NCT03077607 #NCT02129205 NCT02222922 NCT02367456 NCT02841267
# response = loadresponse(filename)
# #output = SOAfromResponse(response,jsontype=False,pretty=False,tabletype='html')
# tabletype = 'csv' #'html' 'csv'
# output = SOAfromResponseUsingPA(response,jsontype=True,pretty=True,tabletype=tabletype)
# print(output)