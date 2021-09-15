import section_filter as section_filter
import boto3
import json
import urllib.parse
import re
from time import gmtime, strftime
from operator import itemgetter
import os
from collections import Counter
from generate_text import convertToTxt
import inference_section_extraction as infn_sect_extra
import inference_endpoint_extraction as infn_ep_extra
from ExtractUtils import ExtractUtils
from AwsUtils import AwsUtils
#from soaFromResponse import SOAfromResponseUsingPA
from inference_soa_extraction import SOAfromResponseUsingPA
from updateDynamoDB import updateTitle
from clinical_trial_api import fetchNCTDetails
import csv
from rdsUtils import rdsUtils
from constants import protocolsList, soaCheckNcts,noSOA,nctWithIndication,allSoaCheckList
# from criteriaSummary import process_frequency

lambda_client = boto3.client('lambda')
runtime = boto3.client('runtime.sagemaker')
s3 = boto3.client('s3')
rdsDB:rdsUtils = rdsUtils()
ieResult = {}
ieDetailDic = {}
matchingPB = {}
matchingPB[1] = 5
matchingPB[2] = 25
matchingPB[3] = 10
matchingPB[4] = 15
matchingPB[5] = 35
matchingPB[6] = 15
matchingPB[7] = 5
matchingPB[8] = 7
matchingPB[9] = 20
matchingPB[10] = 5
fbCache = {}

def process_summary(allBody):
    awsUtils:AwsUtils = AwsUtils()
    comprehendmedical = boto3.client('comprehendmedical')
    chunk_data = awsUtils.splitContent(allBody)
    entity_result = []
    icd10_result = []
    rx_result = []
    for text in chunk_data:
        entity = comprehendmedical.detect_entities_v2(Text= text)
        entity_result.extend(entity['Entities'])
        #if Category in entity['Entities'].keys():
        cd10Entitiy = comprehendmedical.infer_icd10_cm(Text=text)
        icd10_result.extend(cd10Entitiy['Entities'])
        rxEntitiy = comprehendmedical.infer_rx_norm(Text=text)
        rx_result.extend(rxEntitiy['Entities'])

    Entities_summary = AddKeyForValue('Entities_keyvalue','Entities_Category',entity_result,'Entities')
    icd10_summary = AddKeyForValue('icd10_keyvalue','icd10_Category',icd10_result,'ICD-10-CM') 
    rx_summary = AddKeyForValue('rx_keyvalue','rx_Category',rx_result,'RxNorm')
    return Entities_summary, icd10_summary, rx_summary


def save_to_dynamodb(table, data):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(table)
    if data:
        response = table.put_item(
            Item=data
        )
    else:
        pass

def getExistResult(s3BucketName, documentName):
    # logger.info(f"getExistResult({s3BucketName},{documentName})")
    results = None
    try:
        response = s3.get_object(Bucket=s3BucketName, Key=documentName)
        results = json.loads(response['Body'].read().decode('utf-8'))
    except Exception as e:
        print(e)
        # logger.error(e)
    return results
    
def getCachedAWSResults(text, method='entities'):
    util:ExtractUtils = ExtractUtils()
    comprehendmedical = boto3.client('comprehendmedical')
    
    s3BucketName = 'ucp-filebucket-dev'
    documentName = 'comprehendOutput/'+method+'/'+util.md5_hash(text)+'.json'
    print(f"read aws result from cache: {documentName}")
    results = getExistResult(s3BucketName,documentName)
    if results == None:
        if method == 'entities':
            results = comprehendmedical.detect_entities_v2(Text= text)
        if method == 'icd10':
            results = comprehendmedical.infer_icd10_cm(Text= text)
        if method == 'rxnorm':
            results = comprehendmedical.infer_rx_norm(Text= text)
        s3.put_object(Bucket=s3BucketName, Key=documentName, Body=json.dumps(results))
    return results

def process_result_summary(content):
    #print('content', content)
    awsUtils:AwsUtils = AwsUtils()
    chunk_data = awsUtils.splitContent(content)
    entity_result = []
    icd10_result = []
    rx_result = []
    for text in chunk_data:
        entity = getCachedAWSResults(text, 'entities')
        entity_result.extend(entity['Entities'])
        #if Category in entity['Entities'].keys():
        cd10Entitiy = getCachedAWSResults(text, 'icd10')
        icd10_result.extend(cd10Entitiy['Entities'])
        rxEntitiy = getCachedAWSResults(text, 'rxnorm')
        rx_result.extend(rxEntitiy['Entities'])
    
    Entities_summary = AddKeyForValue('Entities_keyvalue','Entities_Category',entity_result,'Entities')
    icd10_summary = AddKeyForValue('icd10_keyvalue','icd10_Category',icd10_result,'ICD-10-CM') 
    rx_summary = AddKeyForValue('rx_keyvalue','rx_Category',rx_result,'RxNorm')
    
    # no need Time Expression for icd-10-cm
    if 'TIME_EXPRESSION' in icd10_summary:
        del icd10_summary['TIME_EXPRESSION']
    
    # return Entities_summary, icd10_summary, rx_summary
    # en_re, icd_10_re, rx_re = process_summary(content)
    # data['comprehendMedical']['Entities']['Summary'] = en_re
    # data['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
    # data['comprehendMedical']['RxNorm']['Summary'] = rx_re
    # return data
    result = {
                'Entities': {'Entities':entity_result, 'Summary':Entities_summary},
                'ICD-10-CM': {'Entities':icd10_result, 'Summary':icd10_summary},
                'RxNorm': {'Entities':rx_result, 'Summary':rx_summary}
            }
    # s3.put_object(Bucket=s3BucketName, Key=documentName, Body=json.dumps(result))
    
    return result


def saveToJson(bucketName, bucketKey, inclusionContent, exclusion, eventsSchedule, allBody):
    fileName = getFileName(bucketKey)
    items = []
    awsUtils:AwsUtils = AwsUtils()
    

    if inclusionContent:
        # result = process_result_summary(inclusionContent)
        items.append(getItemInfo('inc-0', fileName, 'inclusionCriteria', 'Inclusion Criteria', inclusionContent, process_result_summary(inclusionContent)))
        # print('-----------------')
        # print(items)
    if exclusion:
        # items.append(getItemInfo('exc-0', fileName, 'exclusionCriteria', 'Exclusion Criteria', exclusion, awsUtils.detectComprehendMedical(exclusion)))
        items.append(getItemInfo('exc-0', fileName, 'exclusionCriteria', 'Exclusion Criteria', exclusion, process_result_summary(exclusion)))
    if eventsSchedule:
        items.append(getItemInfo('evt-0', fileName, 'eventsSchedule', 'Events Schedule', eventsSchedule, process_result_summary(eventsSchedule)))
    # Add all content
    if allBody:
        #comprehendmedical = boto3.client('comprehendmedical')
        #chunk_data = awsUtils.splitContent(allBody)
        #entity_result = []
        #icd10_result = []
        #rx_result = []
        # for text in chunk_data:
        #     entity = comprehendmedical.detect_entities_v2(Text= text)
        #     entity_result.extend(entity['Entities'])
        #     #if Category in entity['Entities'].keys():
        #     cd10Entitiy = comprehendmedical.infer_icd10_cm(Text=text)
        #     icd10_result.extend(cd10Entitiy['Entities'])
        #     rxEntitiy = comprehendmedical.infer_rx_norm(Text=text)
        #     rx_result.extend(rxEntitiy['Entities'])
            
        # Entities_summary = AddKeyForValue('Entities_keyvalue','Entities_Category',entity_result,'Entities')    
        # icd10_summary = AddKeyForValue('icd10_keyvalue','icd10_Category',icd10_result,'ICD-10-CM') 
        # rx_summary = AddKeyForValue('rx_keyvalue','rx_Category',rx_result,'RxNorm')
        # runtime= boto3.client('runtime.sagemaker')
        # ENDPOINT_NAME='scispacy'
        # base_result = []
        # bc5cdr_result = []
        # bionlp13cg_result = []
        # craft_result = []
        # jnlpba_result = []
        # mosaic_result = []
        # model_results = {}
        # for model in ['base','bc5cdr', 'bionlp13cg', 'craft', 'jnlpba']:
        #     payload=json.dumps({'text':allBody, 'model': model})
        #     response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
        #                                       ContentType='application/json',
        #                                       Body=payload)
        #     result = json.loads(response['Body'].read().decode())
        #     #print(model)
        #     #print(result)
        #     model_results[model] = result['ents']
  
        # model = 'mosaic-ner'
        # payload=json.dumps({'text':allBody, 'model':'mosaic-ner'})
        # ENDPOINT_NAME='mosaic'
        # response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
        #                                       ContentType='application/json',
        #                                       Body=payload)
        # result = json.loads(response['Body'].read().decode())
        #print(result)
        # model_results[model] = result['entities']
        # base_result.extend(model_results['base'])
        # base_keyvalue = AddKeyForValue('base_keyvalue','base_Category',base_result,'base')
        # bc5cdr_result.extend(model_results['bc5cdr'])
        # bc5cdr_keyvalue , bc5cdr_summary = AddKeyForValue('bc5cdr_keyvalue',' bc5cdr_Category',bc5cdr_result,'bc5cdr')
        # bionlp13cg_result.extend(model_results['bionlp13cg'])
        # bionlp13cg_keyvalue ,  bionlp13cg_summary = AddKeyForValue('bionlp13cg_keyvalue','bionlp13cg_Category',bionlp13cg_result,'bionlp13cg')
        # craft_result.extend(model_results['craft'])
        # craft_keyvalue ,  craft_summary = AddKeyForValue('craft_keyvalue',' craft_Category',craft_result,'craft')
        # jnlpba_result.extend(model_results['jnlpba'])
        # jnlpba_keyvalue ,  jnlpba_summary = AddKeyForValue('jnlpba_keyvalue',' jnlpba_Category',jnlpba_result,'jnlpba')
        # mosaic_result.extend(model_results['mosaic-ner'])
        # mosaic_keyvalue ,  mosaic_summary = AddKeyForValue('mosaic_keyvalue',' mosaic_Category',mosaic_result,'mosaic-ner')
        # result = {
        #         'Entities': {'Entities':entity_result, 'Summary':Entities_summary},
        #         'ICD-10-CM': {'Entities':icd10_result, 'Summary':icd10_summary},
        #         'RxNorm': {'Entities':rx_result, 'Summary':rx_summary},
        #         'Base': {'Entities':base_keyvalue},
        #         'Bc5cdr': {'Entities':bc5cdr_keyvalue , 'Summary':bc5cdr_summary},
        #         'Bionlp13cg': {'Entities':bionlp13cg_keyvalue, 'Summary':bionlp13cg_summary},
        #         'Craft': {'Entities':craft_keyvalue, 'Summary':craft_summary},
        #         'Jnlpba': {'Entities':jnlpba_keyvalue, 'Summary':jnlpba_summary},
        #         'Mosaic-ner': {'Entities':mosaic_keyvalue, 'Summary':mosaic_summary}
        #     }
        # Dean add format raw text
        # items.append(getItemInfo('all-0', fileName, 'allText', 'all Text', convertToTxt(json.loads(allBody)), result)) 
        result = {}
        items.append(getItemInfo('all-0', fileName, 'allText', 'all Text', allBody, result))    
    return items
    
def AddKeyForValue(keyvalue,Category,result,model):
    keyvalue = []
    Category = []
    base_key = ['Text']
    models_key = ['Text','BeginOffset','EndOffset','Category']
    if model in ['Entities','ICD-10-CM','RxNorm']:
        for item in result:
            if item['Category'] in ['TIME_EXPRESSION', 'TEST_TREATMENT_PROCEDURE']:
                Category.append(item['Type'])
                continue
            
            Category.append(item['Category'])
        summary = Counter(Category)
        return summary 
    if model == 'base':
        for item in result:
            value = []
            value.append(item)
            mydict=dict(zip(base_key,value))
            #print(mydict)
            keyvalue.append(mydict)
        return keyvalue
    if model in ['bc5cdr', 'bionlp13cg', 'craft', 'jnlpba']:
        for item in result:
            mydict=dict(zip(models_key,item))
            keyvalue.append(mydict)
            Category.append(mydict['Category'])
        summary = Counter(Category)
        return keyvalue ,summary
    if model == 'mosaic-ner':
        for item in result:
            item['EndOffset'] = item.pop('end')
            item['Text'] = item.pop('ent')
            item['Category'] = item.pop('label')
            item['BeginOffset'] = item.pop('start')
            keyvalue.append(item)
            Category.append(item['Category'])
        summary = Counter(Category)
        return keyvalue ,summary


def getFileName(documentName):
    base, filename = os.path.split(documentName)
    bucket_key = os.path.splitext(filename)[0]
    return bucket_key

def getItemInfo(id, filename, objectiveType, title, content, comprehendMedical):
    incItem = {}
    incItem['title'] = title
    incItem['content'] = content
    incItem['comprehendMedical'] = comprehendMedical
    incItem['objectiveType'] = objectiveType
    incItem['id'] = id
    incItem['Filename'] = filename
    incItem['level'] = '1'
    incItem['level_number'] = '1.1'
    return incItem

def parseTxt(bucketName, bucketKey, fileContent):
    #s3 
    #s3BucketName = "ucp-filebucket-dev"                    #"iso-clinicaltrial-studyprotocols"
    #documentPath = "RawDocuments/"    #"study_protocols_eli_lilly_and_company_phase1/"
    
    #document and spoonsor
    #filename = 'NCT01484431.pdf'
    
    #Inferance call
    sectionNames = ['Inclusion Criteria','Exclusion Criteria']
    result = infn_sect_extra.extractSections(fileContent,sectionNames, False)
    #print('txtintosections.parseTxt() result:', result)
    #return result
    #infn_sect_extra.nctExtractSections(s3BucketName,documentPath,filename,sectionNames)
    util:ExtractUtils = ExtractUtils()
    #inclusion_body = util.getItemStartEnd(fileContent, 'Inclusion Criteria')
    #exclusion_body = util.getItemStartEnd(fileContent, 'Exclusion Criteria')
    # inclusion_body = util.getItemStartEnd(fileContent, 'INCLUSION CRITERIA')
    # exclusion_body = util.getItemStartEnd(fileContent, 'EXCLUSION CRITERIA')
    events_body = util.getItemStartEnd(fileContent, 'Events')
    # title_body = util.getItemStartEnd(fileContent, 'Title')
    
    #use inference_section_extraction to parse the inclusion/exclusion
    inclusion_body = ''
    exclusion_body = ''
    nctID = getNctId(bucketKey)
    print(result)
    if 'Inclusion Criteria' in result:
        if not 'name' in result['Inclusion Criteria'] or result['Inclusion Criteria']['name'] != 'Not found':
            inclusion_body = result['Inclusion Criteria'][0]['text']
            inclusion_body = inclusion_body.replace('\n','\r\n\r\n')
            ieResult[nctID] = result
    if 'Exclusion Criteria' in result:
        if not 'name' in result['Exclusion Criteria'] or result['Exclusion Criteria']['name'] != 'Not found':
            exclusion_body = result['Exclusion Criteria'][0]['text']
            exclusion_body = exclusion_body.replace('\n','\r\n\r\n')
    print('ieIndex is ')
    # print(ieIndex)
    if inclusion_body == '' or exclusion_body == '':
        nctID = getNctId(bucketKey)
        inclusion_body_dummy, exclusion_body_dummy = rdsDB.getCriteria(nctID)
        if inclusion_body == '':
            inclusion_body = inclusion_body_dummy
        if exclusion_body == '':
            exclusion_body = exclusion_body_dummy
        
    #print('parseTxt: Inclusion Criteria - ' + inclusion_body)
    #print('parseTxt: Exclusion Criteria - ' + exclusion_body)
    #return
    # print('parseTxt: title' + title_body)
    return saveToJson(bucketName, bucketKey, inclusion_body, exclusion_body, events_body, fileContent)

def getPathInfo(event):
    # Started job with bucket: BI clinical study.pdf ; Clinical Pharmacology Protocol
    #return 'ucp-filebucket-dev','comprehend-input/BI clinical study.pdf.txt'
    payload = event['Records'][0]['s3']
    s3BucketName = payload['bucket']['name']
    documentName = urllib.parse.unquote_plus(payload['object']['key'], encoding='utf-8')

    print("Started job with bucket: {}, and file name: {}".format(s3BucketName, documentName))
    return s3BucketName, documentName

    
def handler_aws_attr_summary(data, hash_value):
    if data:
        body = data[hash_value]
        for firstlevel in body:
            if len(body[firstlevel]) == 0:
                continue
            if 'otherTable' in body[firstlevel]:
                continue
            child = body[firstlevel][0]
            relationshipItems = []
            if 'comprehendMedical' not in child or len(child['comprehendMedical']) == 0:
                continue
            for name in child['comprehendMedical']:
                aws_result_data = child['comprehendMedical'][name]
                if  'Entities' not in aws_result_data:
                    continue
                for entity in aws_result_data['Entities']:
                    if 'Attributes' in entity:
                        for attr in entity['Attributes']:
                            relationshipItem = {entity['Type']: attr['Type']}
                            relationshipItems.append(relationshipItem)

            result_data = []

            from functools import reduce
            data_set = reduce(lambda x, y: x if y in x else x + [y], [[], ] + relationshipItems)

            for ds in data_set:
                result_data_item = ds
                result_data_item['count'] = relationshipItems.count(ds)
                result_data.append(result_data_item)
            data[hash_value][firstlevel][0]['RelationshipSummary'] = result_data
    return data
    
def save_csv(hashcode, d_json):
    datad = {}
    datas = d_json[hashcode]['includeAllText'][0]['comprehendMedical']['Entities']['Entities']
    # datas = d_json['62942bae410fe17939c808ddfc268b48']['includeAllText'][0]['comprehendMedical']['Entities']['Entities']
    datad['Entities'] = datas 
    datas = d_json[hashcode]['includeAllText'][0]['comprehendMedical']['ICD-10-CM']['Entities']
    datad['ICD-10-CM'] = datas 
    datas = d_json[hashcode]['includeAllText'][0]['comprehendMedical']['RxNorm']['Entities']
    datad['RxNorm'] = datas 
    # print(datad)
    item_list = ['Id', 'BeginOffset', 'EndOffset', 'Score', 'Text', 'Category', 'Type']
    content = ','.join(item_list)
    
    for key in datad:
        for item in datad[key]:
            dd = [str(item[k]) for k in item if k in item_list]
            c = ','.join(dd)
            content += '\r\n' + c
    return content
    
    
def get_txt_format(bucketName, bucketKey):
    newbucketKey=bucketKey
    newbucketKey=newbucketKey.replace('comprehend-input','TextractOutput')
    newbucketKey=newbucketKey.replace('.txt','.json')
    print(f'read bucket {bucketName}, key {newbucketKey}')
    
    print('bucket name is : ' + bucketName)
    print('bucket key is : ' + newbucketKey)
    response = s3.get_object(Bucket=bucketName, Key=newbucketKey)
    pdf_json = json.loads(response['Body'].read().decode('utf-8'))
    
    allFormatText = convertToTxt(pdf_json)
    return allFormatText

def get_json_format(bucketName, bucketKey):
    newbucketKey=bucketKey
    newbucketKey=newbucketKey.replace('comprehend-input','TextractOutput')
    newbucketKey=newbucketKey.replace('.txt','.json')
    print(f'read bucket {bucketName}, key {newbucketKey}')
    
    response = s3.get_object(Bucket=bucketName, Key=newbucketKey)
    pdf_json = json.loads(response['Body'].read().decode('utf-8'))

    return pdf_json


def using_new_format_for_label_edit(data, hashcode):
    """
    For front-end new tab show labels and edit the label
    params:
        data: after process json
        hashcode: generate's hashcode the root key
    """
    body = data[hashcode]
    content = body['includeAllText'][0]['content']
    contents = str(content).split(' ')
    for name in ['Bc5cdr', 'Bionlp13cg', 'Craft', 'Jnlpba', 'Mosaic-ner']:
        value = body['includeAllText'][0]['comprehendMedical'][name]
        all_result = []
        nlp = []
        # nlp_labels = []
        # for b in value['Entities']:
        #     # print(b['Text'])
        #     item = {'text': b['Text'], 'category': b['Category']}
        #     if item not in nlp_labels:
        #         nlp_labels.append(item)

        nlp_result = []
        nindex = 1
        for l in value['Entities']:
            text = l['Text']
            if len(str(text).split(' ')) > 1:
                for j in str(text).split(' '):
                    i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': j,
                         'children': []}
                nlp_result.append(i)
            else:
                i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': l['Text'], 'children': []}
                nlp_result.append(i)
            nindex += 1

        index = 1
        mark_item = {}
        child = []
        for i in contents:
            flag = False
            items_dict = {'type': 'span', 'id': index, 'text': i}


            for li in nlp_result:
                if i:
                    pattern = str(li['text'])
                    try:
                        match = re.search(pattern, i)
                        # match = re.search(i, pattern)
                        # match = pattern == i
                        if match and len(list(li['children'])) == 0:
                            children = list(li['children'])
                            children.append(items_dict)
                            li['children'] = children
                            #print(li)
                            flag = True
                            all_result.append(li)
                            index += 1
                            break
                    except:
                        continue

            if not flag:
                index += 1
                # print(items_dict)
                all_result.append(items_dict)


        # print(all_result)
        # print(f'Name:{name}')
        data[hashcode]['includeAllText'][0]['comprehendMedical'][name]['label'] = all_result
        # print(data)
    
    return data
    
    
def processMedDRA(data, hashcode):
    """
    """
    body = data[hashcode]
    #path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary', 'objectivesEndpointsEstimands']
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'briefSummary', 'objectivesEndpointsEstimands']

    model = 'mosaic-ner'

    for path_name in path_names:
        # if path_name == 'scheduleActivities':
        #     continue
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
        if path_name == 'objectivesEndpointsEstimands':
            if 'table' in body[path_name]:
                continue
        content = body[path_name][0]['content']
        if not content or len(content) < 1:
            continue

        allBody = content
        payload = json.dumps({'text': allBody, 'model': 'mosaic-ner'})
        ENDPOINT_NAME = 'mosaic'

        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                           ContentType='application/json',
                                           Body=payload)
        mosaic_result_data = json.loads(response['Body'].read().decode())
        # print("------------------")
        # print(mosaic_result_data)
        # print(dict(mosaic_result)['entities'])
        
        # mosaic_data = mosaic_result['entities']
        # print(mosaic_data)
        
        if mosaic_result_data and 'entities' in mosaic_result_data:
            stand_result, mosaic_summary = AddKeyForValue('Mosaic_keyvalue', 'Mosaic_Category', mosaic_result_data['entities'], 'mosaic-ner')
            data[hashcode][path_name][0]['comprehendMedical']['MedDRA'] = {'Entities': stand_result,
                                                                       'Summary': mosaic_summary}
        else:
            data[hashcode][path_name][0]['comprehendMedical']['MedDRA'] = {}
    return data

def load_title_from_ctti(nct_id):
    sql = "select s.official_title, s.brief_title from studies s where s.nct_id = '%s' limit 1;" % nct_id
    rows = rdsDB.getRowfromDB(sql)
    return rows[0][0], rows[0][1]

def load_brief_from_ctti(nct_id):
    sql = "select bs.description from brief_summaries bs where bs.nct_id ='%s' limit 1;" % nct_id
    value = rdsDB.getValuefromDB(sql) 
    return ' '.join(str(value).strip().replace('\r\n', '\n').replace('\n', '').split())
       
def getNctId(fileName):
    import os
    file = os.path.split(fileName)[1]
    if file.endswith('.txt') and file[:-4].endswith('.pdf'):
        nct_id = file[:-8]
        print(nct_id)
        return nct_id
    else:
        return ''

def removeSpecialChars(str):
    str = re.sub('[^A-Za-z0-9]+', '', str)
    return str.lower()
    
#TODO need to be done
def getSoaProcessedContent(bucketName, bucketKey):
    bucketName = "ucp-filebucket-dev"
    #bucketKey = "comprehend-input/NCT02995733.pdf.txt"
    bucketKey = "comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt"
    
    tabletype = 'list' #'html' 'csv'
    soaRawContent = SOAfromResponseUsingPA(get_json_format(bucketName, bucketKey),jsontype=True,pretty=False,tabletype=tabletype)
    soaProcessedContent = json.loads(soaRawContent)
    #print('soaProcessedContent=', soaProcessedContent)
    for item in soaProcessedContent.items():
        soaProcessedContent = item[1]['table']
        pageNo = item[1]['pages'][0]
        #print('pageNo=', pageNo)
        break
    #print('soaProcessedContent=', soaProcessedContent)
    return soaProcessedContent, pageNo
    
    mapping = {
        'Height':'Height',
        'HbA1c':'Hemoglobin A1c (HbA1c)',
        'Electrocardiogram':'12-lead ECG (central or local)'
    }
    for col1 in soaProcessedContent:
        print('col1=', removeSpecialChars(col1[0]))

def getCostDic():
    costDic = {}
    with open('./Standard_Events_Dictionary.csv', mode='r') as infile:
        reader = csv.reader(infile, delimiter=',')
        costDic = {rows[0]:[rows[2],rows[3],rows[4],rows[5],rows[6],rows[7],rows[8],rows[9],rows[10],rows[11],rows[12]] for rows in reader}
    return costDic

def processEndpoints(bucketName, bucketKey):
    # NCT02133742, NCT03023826, 
    #bucketName = "ucp-filebucket-dev"
    #bucketKey = "comprehend-input/NCT03023826.pdf.txt"
    #bucketKey = "comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt"
    response = get_json_format(bucketName, bucketKey)
    #print(response)
    # path = 'data/processed/textract/document/pfizer/phase2/' #
    # filename = 'NCT02969044.json' #NCT04091061 #Lilly-> #NCT02951780
    # response = loadresponse(filename)
    text = infn_ep_extra.loadtextforResponse(response)
    #print(text)
    tabletype = 'list'
    output = infn_ep_extra.nctExtractObjectivesEndpoints(response,text,tabletype)
    print('endpoint is : ')
    print(output)
    
    result = ''
    if output['type'] == 'table':
        return output, output
    else:
        for item in output['content']:
            #print(output['content'][item]['name'])
            result += output['content'][item]['name'] +'\n'
            text = output['content'][item]['text']
            for txt in text.split('. '):
                result += '\t . ' + txt +'\n'
    return result, output
    #print(result)
    # return result
    #tabletype = 'list' #'html' 'csv'
    #soaRawContent = SOAfromResponseUsingPA(get_json_format(bucketName, bucketKey),jsontype=True,pretty=False,tabletype=tabletype)

def testMe():
    # If Column B is blank, Highlight display "Not Considered as an Activity" ；Fasting Visit NCT02133742.pdf
    #soaProcessedContent, pageNo = getSoaProcessedContent('', '')
    
    #  test for uddateTitle() NCT04255433,NCT04864977,NCT04867785;
    # 
    nctId = 'NCT02133742'
    print('nctId', nctId)
    #updateTitle('study_protocol', nctId, load_title_from_ctti(nctId))
    # NCT02133742 , NCT03023826
    #processEndpoints("ucp-filebucket-dev", "comprehend-input/NCT03023826.pdf.txt")
    #print( load_brief_from_ctti(nctId))
    #print( load_title_from_ctti(nctId))
    #print( rdsDB.getCriteria('NCT00613574'))
    #return

    item = fetchNCTDetails(nctId)
    print( item )
    res = process_result_summary(item['inclusion_criteria'])
    print('res', res)
    #item['inclusion_comprehend'] = process_result_summary(item['inclusion_criteria'])
    #item['exclusion_comprehend'] = process_result_summary(item['exclusion_criteria'])
    
    
    # # ucp-filebucket-dev, and file name: comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt
    #response = s3.put_object(Bucket='ucp-filebucket-dev', Key='comprehendOutput/data/'+nctId+'.json', Body=json.dumps(item))
    return

    #return processSoaProcessedContent(soaProcessedContent)
    
def processSoaProcessedContent(soaProcessedContent):
    soaDic={}
    with open('./StandardizedActivitiesMapping.csv', mode='r') as infile:
        reader = csv.reader(infile, delimiter=',')
        for rows in reader:
            #print(rows)
            if len(rows) < 2:
                value = ''
                category = ''
            elif  len(rows) < 3:
                value = rows[1]
                category = ''
            else:
                value = rows[1]
                category = rows[2]
            soaDic[removeSpecialChars(rows[0])]={"value":value,"category":category}
            #break
        #soaDic = {removeSpecialChars(rows[0]):rows[1]:rows[2] for rows in reader}
    #print(soaDic)
    
    soaRes = []
    soaSummary = {}
    #soaProcessedContent = getSoaProcessedContent('', '')
    for row in soaProcessedContent:
        keyname = removeSpecialChars(row[0])
        if(keyname in soaDic):
            category = soaDic[keyname]['category'].strip().replace(' ','_').upper()
            if category in soaSummary:
                soaSummary[category] +=1
            else:
                soaSummary[category] = 1
            soaRes.append({
                'key' : row[0],
                'value' : soaDic[keyname]['value'],
                'category' : category
            })
    #new_content_s[hash_value]['scheduleActivities'][0]['soaResult'] = soaRes
    #print(soaDic)
    return soaRes,soaSummary, soaDic

def call_meddra(text):
    """
    Call meddra for category is MEDICAL_CONDITION
    :param text:
    :return:
    """
    n_ranks = 1
    ENDPOINT_NAME = 'mosaic-meddra-coding'
    payload = json.dumps({'text': [text], 'n_ranks': n_ranks})
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='application/json',
                                       Body=payload)
    result = json.loads(response['Body'].read().decode())
    # print(result)
    if result and len(result['results']) > 0:
        r = result['results'][0]['preds']

        return r[0]['LLT']
    else:
        return None
        
def process_frequency(data, total):
    """
    Process certeria frequency
    :param data:
    :param total:
    :return:
    """
    # print(data)

    inclusionCriterias = []
    exclusionCriterias = []

    for i in data:
        for j in i:
            if 'inclusionCriteria' in j:
                inclusionCriterias.append(j['inclusionCriteria'])
            if 'exclusionCriteria' in j:
                exclusionCriterias.append(j['exclusionCriteria'])

    criterias_dict = {'inclusionCriteria': inclusionCriterias, 'exclusionCriteria': exclusionCriterias}
    allCriteriaResult = []
    for criteria_name in ['inclusionCriteria', 'exclusionCriteria']:
        criteria_value = criterias_dict[criteria_name]
        criteriaChildsText = []
        criteriaChildsCategory = []
        criteriaChilds = []

        for i in criteria_value:
            for c in i:
                childs = i[c]
                for child in childs:
                    child_item = {'Category': child['Category'], 'Text': child['Text']}
                    criteriaChilds.append(child_item)
                    criteriaChildsCategory.append(child['Category'])
                    criteriaChildsText.append(child['Text'])
        criteriaChildsCategorySet = set(criteriaChildsCategory)
        result_items = []
        for c in criteriaChildsCategorySet:
            result_item_child_text = []
            result_item_child = []
            for child in criteriaChilds:
                result_item_child_text.append(child['Text'])
            for ite in set(result_item_child_text):
                result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                          'Frequency': result_item_child_text.count(ite) / total})
            result_item = {c: result_item_child}
            result_items.append(result_item)
        allCriteriaResult.append({criteria_name: result_items})
        # print({criteria_name: result_item})
    # print(allCriteriaResult)
    allCriteriaResult.append({'total': total})
    # print('Done')
    return allCriteriaResult

def flatten_json(y):
    out = {}
    def flatten(x, name=''):
        if type(x) is dict:
            for a in x:
                flatten(x[a], name + str(a) + '.')
        elif type(x) is list:
            i = 0
            for a in x:
                flatten(a, name + str(i) + '.')
                i += 1
        else:
            out[name[:-1]] = x

    flatten(y)
    return out

def process_category(data):
    category = []
    result = {}
    for d in data:
        if len(category) > 0 and d['Category'] in category:
            result[d['Category']].append(d)
            continue
        else:
            # i = {d['Category']: [d]}
            category.append(d['Category'])
            result[d['Category']] = [d]
    # print(result)
    process_frequency(result, len(data))
    return result
    
def process(data, soaDic, nct_id):
    """
    Process aws's comprehend result
    :param data:
    :return:
    """
    try:
        fbModelResult = s3.get_object(Bucket='ucp-filebucket-dev', Key='facebookModel/'+str(nct_id)+'.json')['Body']
        fbModelResult = json.loads(fbModelResult.read())
    except Exception as exception:
        fbModelResult = None
    criteriaSummary = []
    for t in ['inclusionCriteria', 'exclusionCriteria']:
        summary = {}
        if not len(data[t]) >= 1:
            continue
        comprehendMedical = data[t][0]['comprehendMedical']
        category_text_items = []
        names = []
        en_items = []
        for name in ['ICD-10-CM', 'RxNorm', 'Entities']:
            names.append(name)
            # label = process_label(comprehendMedical[name], data[t])
            for en in comprehendMedical[name]['Entities']:
                content = data[t][0]['content']
                # split into diff group
                en_item = {'Category': en['Category'], 'Text': en['Text'], 'Type': en['Type'], 'Score': en['Score'],
                           'Group': name}
                # print(en_item)
                if t == 'inclusionCriteria':
                    if nct_id in ieResult:
                        en_item['index'] = ieResult[nct_id]['Inclusion Criteria'][0]['index']
                        ieTree = ieResult[nct_id]['Inclusion Criteria'][0]['json']
                        ieTree = flatten_json(ieTree)
                        entityBegin = en['BeginOffset']
                        entityEnd = en['EndOffset']
                        for sectionKeys in ieTree:
                            beginIndex = content.find(ieTree[sectionKeys])
                            if entityBegin >= beginIndex and entityEnd <= beginIndex + len(ieTree[sectionKeys]):
                                en_item['Criteria Index'] = str(sectionKeys)
                                en_item['Criteria'] = ieTree[sectionKeys]
                                if fbModelResult is not None:
                                    for fbCriteria in fbModelResult['inclusion']['cfg_results']['criterion']:
                                        if fbModelResult['inclusion']['cfg_results']['criterion'][fbCriteria] in ieTree[sectionKeys]:
                                            if en_item['Text'] in fbModelResult['inclusion']['cfg_results']['criterion'][fbCriteria]:
                                                en_item['fbResult'] = fbModelResult['inclusion']['cfg_results']['relation'][fbCriteria]
                                # if not ieTree[sectionKeys] in fbCache:
                                #     fbData = {
                                #         'nct_id' : [nct_id],
                                #         'title' : [dbItem['brief_title']],
                                #         'has_us_facility' : ['false'],
                                #         'conditions': [dbItem['indication']],
                                #         'eligibility_criteria' : [ieTree[sectionKeys]]
                                #     }
                                #     payload=json.dumps(fbData)
                                #     fbResponse = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                #                                           ContentType='application/json',
                                #                                           Body=payload)
                                #     fbResult = json.loads(fbResponse['Body'].read().decode())
                                #     fbCache[ieTree[sectionKeys]] = fbResult
                                # else:
                                #     fbResult = fbCache[ieTree[sectionKeys]]
                                # for num in fbResult['cfg_results']['criterion']:
                                #     if str(fbResult['cfg_results']['criterion'][num]['name']).lower()== en_item['Text'].lower():
                                #         en_item['fbResult'] = fbResult['cfg_results']['criterion'][num]
                                #         break
                                # break
                        # for sectionKey in ieTree:
                        #     if en_item['Text'] in ieTree[sectionKey]:
                        #         en_item['Criteria Index'] = str(sectionKey)
                        #         en_item['Criteria'] = ieTree[sectionKey]
                        # for sectionKey in ieResultJson:
                        #     if type(ieResultJson[sectionKey]) == type("str"):
                        #         if en_item['Text'] in ieResultJson[sectionKey]:
                        #             en_item['Criteria Index'] = str(sectionKey)
                        #             en_item['Criteria'] = ieResultJson[sectionKey]
                        #     else:
                        #         for innerSectionKey in ieResultJson[sectionKey]:
                        #             if en_item['Text'] in ieResultJson[sectionKey][innerSectionKey]:
                        #                 en_item['Criteria Index'] = str(sectionKey)+'.'+str(innerSectionKey)
                        #                 en_item['Criteria'] = ieResultJson[sectionKey][innerSectionKey]
                if t == 'exclusionCriteria':
                    if nct_id in ieResult:
                        en_item['index'] = ieResult[nct_id]['Exclusion Criteria'][0]['index']
                        ieTree = ieResult[nct_id]['Exclusion Criteria'][0]['json']
                        ieTree = flatten_json(ieTree)
                        entityBegin = en['BeginOffset']
                        entityEnd = en['EndOffset']
                        for sectionKeys in ieTree:
                            beginIndex = content.find(ieTree[sectionKeys])
                            if entityBegin >= beginIndex and entityEnd <= beginIndex + len(ieTree[sectionKeys]):
                                en_item['Criteria Index'] = str(sectionKeys)
                                en_item['Criteria'] = ieTree[sectionKeys]
                                if fbModelResult is not None:
                                    for fbCriteria in fbModelResult['exclusion']['cfg_results']['criterion']:
                                        if fbModelResult['exclusion']['cfg_results']['criterion'][fbCriteria] in ieTree[sectionKeys]:
                                            if en_item['Text'] in fbModelResult['exclusion']['cfg_results']['criterion'][fbCriteria]:
                                                en_item['fbResult'] = fbModelResult['exclusion']['cfg_results']['relation'][fbCriteria]
                                # if not ieTree[sectionKeys] in fbCache:
                                #     fbData = {
                                #         'nct_id' : [nct_id],
                                #         'title' : [dbItem['brief_title']],
                                #         'has_us_facility' : ['false'],
                                #         'conditions': [dbItem['indication']],
                                #         'eligibility_criteria' : [ieTree[sectionKeys]]
                                #     }
                                #     payload=json.dumps(fbData)
                                #     fbResponse = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                #                                           ContentType='application/json',
                                #                                           Body=payload)
                                #     fbResult = json.loads(fbResponse['Body'].read().decode())
                                #     fbCache[ieTree[sectionKeys]] = fbResult
                                # else:
                                #     fbResult = fbCache[ieTree[sectionKeys]]
                                # for num in fbResult['cfg_results']['criterion']:
                                #     if str(fbResult['cfg_results']['criterion'][num]['name']).lower()== en_item['Text'].lower():
                                #         en_item['fbResult'] = fbResult['cfg_results']['criterion'][num]
                                #         break
                                # break
                        # for sectionKey in ieTree:
                        #     if en_item['Text'] in ieTree[sectionKey]:
                        #         en_item['Criteria Index'] = str(sectionKey)
                        #         en_item['Criteria'] = ieTree[sectionKey]
                        # for sectionKey in ieResultJson:
                        #     if type(ieResultJson[sectionKey]) == type("str"):
                        #         if en_item['Text'] in ieResultJson[sectionKey]:
                        #             en_item['Criteria Index'] = str(sectionKey)
                        #             en_item['Criteria'] = ieResultJson[sectionKey]
                        #     else:
                        #         for innerSectionKey in ieResultJson[sectionKey]:
                        #             if en_item['Text'] in ieResultJson[sectionKey][innerSectionKey]:
                        #                 en_item['Criteria Index'] = str(sectionKey)+'.'+str(innerSectionKey)
                        #                 en_item['Criteria'] = ieResultJson[sectionKey][innerSectionKey]
                category_text_item = {'Category': en['Category'], 'Text': en['Text']}
                # Process those entities which have 'Attributes‘
                if 'Attributes' in en and len(en['Attributes']) > 0:
                    # print('Attrs')
                    # print(en['Attributes'])
                    a = []
                    en_item['Attributes'] = en['Attributes']
                    for att in en['Attributes']:
                        at = {}
                        if att['Type'] == 'TEST_VALUE':
                            at['TEST_VALUE'] = att['Text']
                            en_item['value'] = att['Text']
                            beginOffset = att['BeginOffset']
                            endOffset = att['EndOffset']
                            
                            lastSpace = content.rfind('\n\t',0,beginOffset)
                            nextSpace = content.find('\n\t',endOffset,len(content))
                            if lastSpace != -1 and nextSpace != -1:
                                en_item['value'] = content[lastSpace+4:nextSpace]
                        if att['Type'] == 'TEST_UNIT':
                            at['TEST_UNIT'] = att['Text']
                            en_item['unit'] = att['Text']
                        # print(at)
                # call meddra model to get 'LLT' name if the category is MEDICAL_CONDITION
                en_item['rawText'] = en_item['Text']
                en_item['Text'] = ""
                if en_item['Category'] == 'MEDICAL_CONDITION':
                    result = call_meddra(en_item['rawText'])
                    if result is not None:
                        en_item['Text'] = result
                        en_item['standardized source'] = 'meddra'
                if en_item['Category'] == 'TEST_TREATMENT_PROCEDURE':
                    if removeSpecialChars(en_item['rawText']) in soaDic:
                        en_item['Text'] = soaDic[removeSpecialChars(en_item['rawText'])]['value']
                        en_item['standardized source'] = 'soa mapping'
                if name == 'RxNorm' and 'RxNormConcepts' in en:
                    if len(en['RxNormConcepts']) >=2:
                        rows = en['RxNormConcepts']
                        rows_by_fname = sorted(rows, key=itemgetter('Score'))
                        en_item['Text'] = rows_by_fname[:1]
                    else:
                        en_item['Text'] = en['RxNormConcepts']
                    if type(en_item['Text']) == type([]):
                        en_item['Text'] = en_item['Text'][0]['Description']
                    en_item['standardized source'] = 'RxNorm highest score'
                
                # print(en_item)
                # filter out the duplicated items
                if category_text_item not in category_text_items:
                    category_text_items.append(category_text_item)
                    en_items.append(en_item)
            # data[t]['comprehendMedical'][name]['label'] = label
        # print(en_items)
        # calculate the summary by each category
        summary = process_category(en_items)
        data[t][0]['comprehendMedical']['summary'] = summary
        criteriaSummary.append({t: summary})
    return data, criteriaSummary

def runFacebook(nct_id, runI, runE, protocol):
    if runI == False and runE == False:
        return 'need to specify at least on criteria'
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table('studies')
    ENDPOINT_NAME = 'clinical-ner'
    response = table.get_item(
        Key={
            'nct_id': nct_id
        }
    )
    dbItem  = response['Item']
    criteria = dbItem['criteria']
    for item in protocol:
        if type(protocol[item]) == type({}):
            hashVal = item
            break
    if runI and runE:
        try:
            exCriteria = protocol[hashVal]['exclusionCriteria'][0]['content']
            inCriteria = protocol[hashVal]['inclusionCriteria'][0]['content']
        except Exception as e:
            exPos = criteria.find('Exclusion Criteria')
            inCriteria = criteria[0:exPos]
            exCriteria = criteria[exPos:len(criteria)]
    elif runI and not runE:
        #add only inclusion
        try:
            inCriteria = protocol[hashVal]['inclusionCriteria'][0]['content']
        except Exception as e:
            exPos = criteria.find('Exclusion Criteria')
            inCriteria = criteria[0:exPos]
    else:
        try:
            exCriteria = protocol[hashVal]['exclusionCriteria'][0]['content']
        except Exception as e:
            #add only exclusion
            exPos = criteria.find('Exclusion Criteria')
            exCriteria = criteria[exPos:len(criteria)]
    try:
        try:
            oldResult = s3.get_object(Bucket='ucp-filebucket-dev', Key='facebookModel/'+nct_id+'.json')['Body']
            oldResult = json.loads(oldResult.read())
            modelResult = {}
            if runI:
                inResult = oldResult['inclusion']
                modelResult['inclusion'] = inResult
            if runE:
                exResult = oldResult['exclusion']
                modelResult['exclusion'] = exResult
            print('using cache')
        except Exception as e:
            modelResult = {}
            if runI:
                
                inCriteria = 'Inclusion Criteria:\r\n\r\n' + inCriteria
                print('facebook data is:')
                print(inCriteria)
                
                data = {
                    '#nct_id' : [nct_id],
                    'title' : [dbItem['brief_title']],
                    'has_us_facility' : ['false'],
                    'conditions': [dbItem['indication']],
                    'eligibility_criteria' : [inCriteria]
                }
                payload=json.dumps(data)
                response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                       ContentType='application/json',
                                                       Body=payload)
                inResult = json.loads(response['Body'].read().decode())
                modelResult['inclusion'] = inResult
            if runE:
                exCriteria = 'Exclusion Criteria:\r\n\r\n' + exCriteria
                print('facebook data is:')
                print(exCriteria)
                data = {
                    '#nct_id' : [nct_id],
                    'title' : [dbItem['brief_title']],
                    'has_us_facility' : ['false'],
                    'conditions': [dbItem['indication']],
                    'eligibility_criteria' : [exCriteria]
                }
                payload=json.dumps(data)
                response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                       ContentType='application/json',
                                                       Body=payload)
                exResult = json.loads(response['Body'].read().decode())
                modelResult['exclusion'] = exResult
            s3.put_object(Bucket='ucp-filebucket-dev', Key='facebookModel/'+nct_id+'.json',Body=json.dumps(modelResult))
    except Exception as e:
        print(e)
        modelResult = {}
    # print(modelResult)
    return modelResult

def rm_test6():
    # count = 0
    print(len(set(nctWithIndication)))
    # for nct in nctWithIndication:
    #     if nct in protocolsList:
    #         count += 1
    # print(count)
def rm_test5():
    bucketName = 'ucp-filebucket-dev'
    header = ['nct', 'inclusion-Kanak', 'exclusion-Kanak', 'inclusion-CTTI', 'exclusion-CTTI', 'source']
    with open('/tmp/ieContent.csv', 'w', encoding='UTF8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for nct in protocolsList:
            bucketKey = 'comprehend-input/' + nct + '.pdf.txt'
            response = s3.get_object(Bucket=bucketName, Key=bucketKey)
            txt = response['Body'].read().decode('utf-8')
            sectionNames = ['Inclusion Criteria','Exclusion Criteria']
            result = infn_sect_extra.extractSections(txt,sectionNames, False)
            source = ""
            # print(result)
            # break
            iContent = ''
            eContent = ''
            if 'Inclusion Criteria' in result:
                if not 'name' in result['Inclusion Criteria'] or result['Inclusion Criteria']['name'] != 'Not found':
                    iContent = result['Inclusion Criteria'][0]['text']
                    source = 'Kanak'
            if 'Exclusion Criteria' in result:
                if not 'name' in result['Exclusion Criteria'] or result['Exclusion Criteria']['name'] != 'Not found':
                    eContent = result['Exclusion Criteria'][0]['text']
                    source = 'Kanak'
            inclusion_body_dummy, exclusion_body_dummy = rdsDB.getCriteria(nct)
            if inclusion_body_dummy != None:
                if source == '':
                    source = 'CTTI'
            else:
                inclusion_body_dummy = ''
            if exclusion_body_dummy != None:
                if source == '':
                    source = 'CTTI'
            else:
                exclusion_body_dummy = ''
            # runFacebook(nct, True, True, outputObj)
            data = [nct, iContent.strip(), eContent.strip(), inclusion_body_dummy.strip(), exclusion_body_dummy.strip(), source]
            writer.writerow(data)
    s3.put_object(Bucket='ucp-filebucket-dev', Key='summary/ieContentSummary.csv', Body=open('/tmp/ieContent.csv', 'rb'))
    
def rm_test3():
    res_dic = {}
    nctList = []
    bucketName = 'ucp-filebucket-dev'
    bucketKey = 'summary/soaSummary.json'
    soaSummaryObj = s3.get_object(Bucket=bucketName, Key=bucketKey)['Body']
    soaSummaryObj = json.loads(soaSummaryObj.read())
    actIndex = soaSummaryObj['actIndex']
    print(len(allSoaCheckList))
    for key in actIndex:
        if key in allSoaCheckList:
            if actIndex[key] == []:
                nctList.append(key)
    res_dic['nctList'] = nctList
    print(len(nctList))
    s3.put_object(Bucket=bucketName, Key='summary/detailedSOA.json', Body=json.dumps(res_dic))
    
def rm_test():
    res_dic = {}
    ie3 = ['NCT03214380', 'NCT02561078', 'NCT03736785']
    for item in ie3:
        res_dic[item] = {
            'hasInclusion' : False,
            'hasExclusion' : False,
            'inclusionFromDB' : '',
            'exclusionFromDB' : ''
        }
        bucketName = 'ucp-filebucket-dev'
        bucketKey = 'comprehend-input/' + item + '.pdf.txt'
        response = s3.get_object(Bucket=bucketName, Key=bucketKey)
        txt = response['Body'].read().decode('utf-8')
        sectionNames = ['Inclusion Criteria','Exclusion Criteria']
        result = infn_sect_extra.extractSections(txt,sectionNames, False)
        s3.put_object(Bucket=bucketName, Key='summary/ieRawOutput/'+item+'.json', Body=json.dumps(result))
        continue
        # print(result)
        # break
        if 'Inclusion Criteria' in result:
            if not 'name' in result['Inclusion Criteria'] or result['Inclusion Criteria']['name'] != 'Not found':
                res_dic[item]['hasInclusion'] = True
                # return {
                #     'body' : result
                # }
                ieDetailDic[item] = 'Kanak'
        if 'Exclusion Criteria' in result:
            if not 'name' in result['Exclusion Criteria'] or result['Exclusion Criteria']['name'] != 'Not found':
                res_dic[item]['hasExclusion'] = True
                ieDetailDic[item] = 'Kanak'
        if res_dic[item]['hasInclusion'] == False or res_dic[item]['hasExclusion'] == False:
            inclusion_body_dummy, exclusion_body_dummy = rdsDB.getCriteria(item)
            if res_dic[item]['hasInclusion'] == False:
                if inclusion_body_dummy != None:
                    res_dic[item]['inclusionFromDB'] = True
                    ieDetailDic[item] = 'CTTI'
            if res_dic[item]['hasExclusion'] == False:
                if exclusion_body_dummy != None:
                    res_dic[item]['exclusionFromDB'] = True
                    ieDetailDic[item] = 'CTTI'
    s3.put_object(Bucket=bucketName, Key='summary/detailedIE.json', Body=json.dumps(res_dic))
    # return 0
    
def rm_test2():
    ieData = s3.get_object(Bucket='ucp-filebucket-dev', Key='summary/detailedIE.json')['Body']
    ieData = json.loads(ieData.read())
    header = ['nct', 'hasInclusion', 'hasExclusion', 'inclusionFromDB', 'exclusionFromDB']
    with open('/tmp/ie.csv', 'w', encoding='UTF8') as f:
        # write the header
        writer = csv.writer(f)
        writer.writerow(header)
        for key in ieData:
            data = [key, ieData[key]['hasInclusion'], ieData[key]['hasExclusion'],ieData[key]['inclusionFromDB'],ieData[key]['exclusionFromDB']]
            #write the data
            writer.writerow(data)
    s3.put_object(Bucket='ucp-filebucket-dev', Key='summary/detailedIE.csv', Body=open('/tmp/ie.csv', 'rb'))

def kanak_test(event):
    print("Test event - Kanak")
    if 'nctList' not in event:
        return None
    output = {}
    for nct in event['nctList']:
        bucketName = 'ucp-filebucket-dev'
        bucketKey = f'TextractOutput/{nct}.pdf.json'
        response = get_json_format(bucketName, bucketKey)
        text = infn_ep_extra.loadtextforResponse(response)
        output[nct] = {}
        if 'soa' in event['process']:
            output[nct]['soa'] = SOAfromResponseUsingPA(response,jsontype=False,pretty=False,tabletype='list')
        if 'ie' in event['process']:
            sectionNames = ['Inclusion Criteria','Exclusion Criteria']
            output[nct]['ie'] = infn_sect_extra.extractSections(text,sectionNames,jsontype=False,pretty=False)
    return(output)
    
def lambda_handler(event, context):
    print("event: {}".format(event))
    if 'testKanak' in event:
        return kanak_test(event)
    if 'testRM' in event:
        # rm_test()
        # print(len(ieDetailDic))
        # rm_test5()
        rm_test3()
        return
    if 'testMe' in event:
        return testMe()
    #TEST for the Schedule of Activities
    # processScheduleOfActivities()
    # return
    bucketName, bucketKey = getPathInfo(event)
    # ucp-filebucket-dev, and file name: comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt
    #bucketName = 'ucp-filebucket-dev'
    #bucketKey = 'comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt'
    if not bucketKey.endswith('.txt'):
        return
    
    print("########################## ")
    print(bucketKey)
    
    response = s3.get_object(Bucket=bucketName, Key=bucketKey)
    txt = response['Body'].read().decode('utf-8')
    print(len(txt))
    #new_key = bucketKey.replace('comprehend-input','TextractOutput').replace('.txt','.json')
    #print(f'read bucket:{bucketName}, key:{new_key}')
    #response = s3.get_object(Bucket=bucketName, Key=new_key)
    #pdf_json = json.loads(response['Body'].read().decode('utf-8'))
    
    #new_txt = convertToTxt(pdf_json)
    
    data = parseTxt(bucketName, bucketKey, txt)
    #data = parseTxt(bucketName, bucketKey, new_txt)
    #print("Input json:", data)
    #return

    d = dict()
    extractUtils:ExtractUtils = ExtractUtils()
    hash_value = extractUtils.md5_hash(bucketKey)
    d[hash_value] = data
    protocol = section_filter.run(d)
    # print(protocol)
    protocol['filepath'] = bucketKey
    
    # save to S3
    prefixName = os.environ['SERVICE']+'-'+os.environ['STAGE']
    protocol[hash_value]['includeAllText'] = protocol[hash_value]['allText']
    
    del protocol[hash_value]['allText']
    protocol[hash_value]['includeAllText'][0]['content'] = get_txt_format(bucketName, bucketKey)
    #print(protocol)
    
    # Mock for testing
    # demo_data = protocol[hash_value]['includeAllText']
    # del demo_data[0]['comprehendMedical']['Bc5cdr']
    # del demo_data[0]['comprehendMedical']['Bionlp13cg']
    # del demo_data[0]['comprehendMedical']['Craft']
    # del demo_data[0]['comprehendMedical']['Jnlpba']
    # del demo_data[0]['comprehendMedical']['Mosaic-ner']
    nct_id = getNctId(bucketKey)
    
    incItem = {}    
    title = 'Protocol I7T-MC-RMAA Disposition of [14C]-LY2623091 following Oral Administration in Healthy Subjects'
        
    awsUtils:AwsUtils = AwsUtils()
    if len(nct_id) > 0:
        title, briefTitle = load_title_from_ctti(nct_id)
        # update the 'study_protocol'
        updateTitle('study_protocol', nct_id, briefTitle)
        incItem['briefTitle'] = briefTitle
        
    incItem['title'] = title
    incItem['content'] = title
    incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(title)
    en_re, icd_10_re, rx_re = process_summary(title)
    incItem['comprehendMedical']['Entities']['Summary'] = en_re
    incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
    incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
    protocol[hash_value]['protocolTitle']  = [incItem]
    
    brief = 'The information contained in this protocol is confidential and is intended for the use of clinical investigators. It is the property of Eli Lilly and Company or its subsidiaries and should not be copied by or distributed to persons not involved in the clinical investigation of LY2623091, unless such persons are bound by a confidentiality agreement with Eli Lilly and Company or its subsidiaries. This document and its associated attachments are subject to United States Freedom of Information Act (FOIA) Exemption 4.'
    
    if len(nct_id) > 0:
        brief = load_brief_from_ctti(nct_id)
    #print(brief)
    incItem = {}
    incItem['title'] = brief
    incItem['content'] = brief
    incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(brief)
    en_re, icd_10_re, rx_re = process_summary(brief)
    incItem['comprehendMedical']['Entities']['Summary'] = en_re
    incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
    incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
    protocol[hash_value]['briefSummary']  = [incItem]
    
    # call Facebook model
    runI = True
    runE = True
    if (len(protocol[hash_value]['inclusionCriteria'])>0 and  'content' in protocol[hash_value]['inclusionCriteria'][0] and len(protocol[hash_value]['inclusionCriteria'][0]['content']) == 0):
        runI = False

    if (len(protocol[hash_value]['exclusionCriteria'])>0 and 'content' in protocol[hash_value]['exclusionCriteria'][0] and len(protocol[hash_value]['exclusionCriteria'][0]['content']) == 0):
        runE = False

    
    # facebookModelResult = runFacebook(nct_id, runI, runE, protocol)
    
    
    #############################################################################
    #                            Endpoint                                       #
    #############################################################################
    print(nct_id)
    endpoints, endpointOutput = processEndpoints(bucketName, bucketKey)
    relationResult = []
    
    if type(endpoints) == type({}) and 'type' in endpoints and endpoints['type'] == 'table':
        endpointTable = endpoints['content']['table']
        if 'other_tables' in endpoints:
            otherTables = []
            for otherTableKey in endpoints['other_tables']:
                otherTables.append(endpoints['other_tables'][otherTableKey]['table'])
        
        resultTable = []
        for row in endpointTable:
            newResultRow = []
            for column in row:
                incItem = {}
                if column == '':
                    column = 'N/A'
                incItem['title'] = column
                incItem['content'] = column
                incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(column)
                en_re, icd_10_re, rx_re = process_summary(column)
                incItem['comprehendMedical']['Entities']['Summary'] = en_re
                incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
                incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
                
                
                ############################
                #         meddra           #
                ############################
                payload = json.dumps({'text': column, 'model': 'mosaic-ner'})
                ENDPOINT_NAME = 'mosaic'
                response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                   ContentType='application/json',
                                                   Body=payload)
                mosaic_result_data = json.loads(response['Body'].read().decode())
                if mosaic_result_data and 'entities' in mosaic_result_data:
                    stand_result, mosaic_summary = AddKeyForValue('Mosaic_keyvalue', 'Mosaic_Category', mosaic_result_data['entities'], 'mosaic-ner')
                    incItem['comprehendMedical']['MedDRA'] = {'Entities': stand_result,
                                                                               'Summary': mosaic_summary}
                else:
                    incItem['comprehendMedical']['MedDRA'] = {}
                
                ############################
                #           aws label      #
                ############################
                relationshipItems = []
                for name in incItem['comprehendMedical']:
                    aws_result_data = incItem['comprehendMedical'][name]
                    if  'Entities' not in aws_result_data:
                        continue
                    for entity in aws_result_data['Entities']:
                        if 'Attributes' in entity:
                            for attr in entity['Attributes']:
                                relationshipItem = {entity['Type']: attr['Type']}
                                relationshipItems.append(relationshipItem)
                from functools import reduce
                data_set = reduce(lambda x, y: x if y in x else x + [y], [[], ] + relationshipItems)
                for ds in data_set:
                    result_data_item = ds
                    result_data_item['count'] = relationshipItems.count(ds)
                    relationResult.append(result_data_item)
                
                newResultRow.append(incItem)
            resultTable.append(newResultRow)
        resultOtherTables = []
        for otherTable in otherTables:
            resultOtherTable = []
            for row in otherTable:
                newResultRow = []
                for column in row:
                    incItem = {}
                    if column == '':
                        column = 'N/A'
                    incItem['title'] = column
                    incItem['content'] = column
                    incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(column)
                    en_re, icd_10_re, rx_re = process_summary(column)
                    incItem['comprehendMedical']['Entities']['Summary'] = en_re
                    incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
                    incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
                    
                    payload = json.dumps({'text': column, 'model': 'mosaic-ner'})
                    ENDPOINT_NAME = 'mosaic'
                    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                       ContentType='application/json',
                                                       Body=payload)
                    mosaic_result_data = json.loads(response['Body'].read().decode())
                    if mosaic_result_data and 'entities' in mosaic_result_data:
                        stand_result, mosaic_summary = AddKeyForValue('Mosaic_keyvalue', 'Mosaic_Category', mosaic_result_data['entities'], 'mosaic-ner')
                        incItem['comprehendMedical']['MedDRA'] = {'Entities': stand_result,
                                                                                   'Summary': mosaic_summary}
                    else:
                        incItem['comprehendMedical']['MedDRA'] = {}
                    
                    relationshipItems = []
                    for name in incItem['comprehendMedical']:
                        aws_result_data = incItem['comprehendMedical'][name]
                        if  'Entities' not in aws_result_data:
                            continue
                        for entity in aws_result_data['Entities']:
                            if 'Attributes' in entity:
                                for attr in entity['Attributes']:
                                    relationshipItem = {entity['Type']: attr['Type']}
                                    relationshipItems.append(relationshipItem)
                    from functools import reduce
                    data_set = reduce(lambda x, y: x if y in x else x + [y], [[], ] + relationshipItems)
                    for ds in data_set:
                        result_data_item = ds
                        result_data_item['count'] = relationshipItems.count(ds)
                        relationResult.append(result_data_item)
                    
                    newResultRow.append(incItem)
                resultOtherTable.append(newResultRow)
            resultOtherTables.append(resultOtherTable)
            
        protocol[hash_value]['objectivesEndpointsEstimands'] = [{
            'table': endpointTable,
            'otherTable': otherTables,
            'tableResult' : resultTable,
            'otherTableResult': resultOtherTables,
            'RelationshipSummary' : relationResult,
            'title' : 'Objective Endpoints Estimands',
            'content' : 'Objective Endpoints Estimands Content',
            'comprehendMedical' : {},
            'objectiveType' : 'objectivesEndpointsEstimands',
            'id' : 'obj-0'
        }]
    else:
        if len(endpoints) == 0:
            endpoints='Mr . Nesser is a 52 - year - old Caucasian male with an extensive past medical history that includes coronary artery disease , atrial fibrillation , hypertension , hyperlipidemia , presented to North ED with complaints of chills , nausea , acute left flank pain and some numbness in his left leg.'    
        incItem = {}
        incItem['title'] = endpoints
        incItem['content'] = endpoints
        incItem['raw'] = endpointOutput
        # newContent = ''
        # for key in endpointOutput['content']:
        #     epName = endpointOutput['content'][key]['name']
        #     epText = endpointOutput['content'][key]['text']
        #     ENDPOINT_NAME='endpoint-202108051044'
        #     epData = {
        #         'text': epText
        #     }
        #     payload=json.dumps(epData)
        #     response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
        #                               ContentType='application/json',
        #                               Body=payload)
        #     result = json.loads(response['Body'].read().decode())
        #     predicted_categ = result['predicted_categ']
        #     predicted_tags = result['predicted_tags']
        #     newContent += '###################################\n'
        #     newContent += 'Endpoint Name: \n\t' + epName + '\n'
        #     newContent += 'Predicted Category: \n\t' + predicted_categ +'\n'
        #     newContent += 'Predicted Tags: \n\t' + predicted_tags + '\n'
        #     newContent += 'Original Text: \n#############\n' + epText +'\n################'
        #     newContent += '\n###################################\n'
        # incItem['content'] = newContent
        if len(endpoints) > 80000:
            endpoints = endpoints[:80000]
        incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(endpoints)
        en_re, icd_10_re, rx_re = process_summary(endpoints)
        incItem['comprehendMedical']['Entities']['Summary'] = en_re
        incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
        incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
        protocol[hash_value]['objectivesEndpointsEstimands']  = [incItem]
    
    # protocol[hash_value]['objectivesEndpointsEstimands']  = []
    
    #############################################################################
    #                            SOA                                            #
    #############################################################################
    pageNo = 1
    tabletype = 'list' #'html' 'csv'
    soaRawContent = SOAfromResponseUsingPA(get_json_format(bucketName, bucketKey),jsontype=True,pretty=False,tabletype=tabletype)
    soaProcessedContent = json.loads(soaRawContent)
    soaTableList = soaProcessedContent
    # for item in soaProcessedContent.items():
    #     soaProcessedContent = item[1]['table']
    #     pageNo = item[1]['pages'][0]
    #     break
    maximumMatched = 0
    for key in soaTableList:
        if len(soaTableList[key]['protocol_matched']) > maximumMatched:
            soaProcessedContent = soaTableList[key]['table']
            pageNo = soaTableList[key]['pages'][0]
            maximumMatched = len(soaTableList[key]['protocol_matched'])
    soaList = []
    
    sumText = ''
    # protocolList = []
    # for row in soaProcessedContent[4:len(soaProcessedContent)]:
    xPos = -1
    rowNum = 0
    for row in soaProcessedContent:
        rowNum += 1
        # protocolList.append(row[0])
        if(len(row[0])<1):
            continue
        sumText += str(row[0])
        sumText += ','
        if(xPos != -1):
            continue
        for column in row:
            if 'X' in column:
                xPos = rowNum

    soaObj = {
        'title' : 'Schedule of Activities',
        'content' : sumText,
        'comprehendMedical' : {},
        'objectiveType' : 'scheduleActivities',
        'id' : 'sch-0',
        'RelationshipSummary' : []
    }
    # protocolEntityList = []
    # protocolIcdList = []
    # protocolRxNormList = []
    # for item in protocolList:
    #     if(len(item)) == 0:
    #         item = 'Empty String'
    #         # protocolEntityList.append({})
    #         # protocolIcdList.append({})
    #         # protocolRxNormList.append({})
    #         # continue
    #     soaComprehendMedical = awsUtils.detectComprehendMedical(item)
    #     dummyEntity = soaComprehendMedical['Entities']
    #     dummyICD = soaComprehendMedical['ICD-10-CM']
    #     dummyRxNorm = soaComprehendMedical['RxNorm']
    #     en_re, icd_10_re, rx_re = process_summary(item)
    #     dummyEntity['Summary'] = en_re
    #     dummyICD['Summary'] = icd_10_re
    #     dummyRxNorm['Summary'] = rx_re
    #     protocolEntityList.append(dummyEntity)
    #     protocolIcdList.append(dummyICD)
    #     protocolRxNormList.append(dummyRxNorm)
    
    # print(len(protocolEntityList))
    # print(len(protocolIcdList))
    # print(len(protocolRxNormList))
    # print(len(protocolList))
    # print(protocolList)
    
    # soaObj['comprehendMedical']['Entities'] = protocolEntityList
    # soaObj['comprehendMedical']['ICD-10-CM'] = protocolIcdList
    # soaObj['comprehendMedical']['RxNorm'] = protocolRxNormList
    
    soaList.append(soaObj)
    protocol[hash_value]['scheduleActivities']  = soaList
    
    new_content = protocol
    
    
    # for pwc model lable need editor
    # new_content = using_new_format_for_label_edit(new_content,hash_value)

    # set status
    
    # updateItem = {
    #     'file_name': getFileName(bucketKey),
    #     'status' : 'Not started'
    #   }
    # lambda_client.invoke_async(FunctionName='dean-dev-protocol-job', InvokeArgs=json.dumps({'method':'update', 'body':updateItem}))
    
    # Add call meddra process
    new_content = processMedDRA(new_content, hash_value)
    print('processing handler_aws_attr_summary')
    
    new_content_s = handler_aws_attr_summary(new_content, hash_value)
    #print(new_content_s)
    
    new_content_s[hash_value]['scheduleActivities'][0]['table'] = soaProcessedContent
    # with open('./StandardizedActivitiesMapping.csv', mode='r') as infile:
    #     reader = csv.reader(infile)
    #     soaDic = {removeSpecialChars(rows[0]):rows[1] for rows in reader}
    # print(len(soaDic))
    # soaRes = []
    # for row in soaProcessedContent:
    #     if(removeSpecialChars(row[0]) in soaDic):
    #         soaRes.append({
    #             'key' : row[0],
    #             'value' : soaDic[removeSpecialChars(row[0])]
    #         })
    soaRes, soaSummary, soaDic = processSoaProcessedContent(soaProcessedContent)
    
    
    #############################################################################
    #                            COST/PB                                        #
    #############################################################################
    costDic = getCostDic()
    itemCost = {}
    totalCost = 0
    for row in soaProcessedContent:
        keyname = removeSpecialChars(row[0])
        if(keyname in soaDic):
            value = soaDic[keyname]['value']
            if(value in costDic):
                cost = int(costDic[value][0])
                x = 0
                for column in row:
                    if 'X' in column:
                        x += 1
                itemCost[row[0]] = {
                    'base' : cost,
                    'amount' : x,
                    'total' : cost * x
                }
                totalCost += cost * x
    
    pbTotalAmount = 0
    pbTotalList = []
    pbDimensionalList = []
    pbExcessList = []
    if(xPos != -1):
        for column in range(1, len(soaProcessedContent[xPos])):
            pbCount = {}
            pbCount[1] = 0
            pbCount[2] = 0
            pbCount[3] = 0
            pbCount[4] = 0
            pbCount[5] = 0
            pbCount[6] = 0
            pbCount[7] = 0
            pbCount[8] = 0
            pbCount[9] = 0
            pbCount[10] = 0
            for row in soaProcessedContent[xPos-1:]:
                keyname = removeSpecialChars(row[0])
                if(keyname in soaDic):
                    value = soaDic[keyname]['value']
                    if(value in costDic):
                        if(column < len(row) and 'X' in row[column]):
                            for x in range (1,11):
                                pbCount[x] += int(costDic[value][x])
            pbTotal = 0
            pbDimensional = {}
            pbExcess = {}
            for x in range(1, 11):
                if(pbCount[x] == 1):
                    pbTotal += matchingPB[x]
                    pbDimensional[x] = matchingPB[x]
                    pbExcess[x] = 0
                elif(pbCount[x] > 1):
                    pbTotal += matchingPB[x]
                    pbTotal += pbCount[x] - 1
                    pbDimensional[x] = matchingPB[x]
                    pbExcess[x] = pbCount[x] - 1
                else:
                    pbDimensional[x] = 0
                    pbExcess[x] = 0
            pbTotalList.append(pbTotal)
            pbDimensionalList.append(pbDimensional)
            pbExcessList.append(pbExcess)
            pbTotalAmount += pbTotal

    new_content_s[hash_value]['scheduleActivities'][0]['soaResult'] = soaRes
    new_content_s[hash_value]['scheduleActivities'][0]['soaSummary'] = soaSummary
    new_content_s[hash_value]['scheduleActivities'][0]['xPos'] = xPos
    new_content_s[hash_value]['scheduleActivities'][0]['pageNo'] = pageNo
    new_content_s[hash_value]['scheduleActivities'][0]['totalCost'] = totalCost
    new_content_s[hash_value]['scheduleActivities'][0]['itemCost'] = itemCost
    new_content_s[hash_value]['scheduleActivities'][0]['pbInfo'] = {
        'total' : pbTotalAmount,
        'dimensional' : pbDimensionalList,
        'excess' : pbExcessList,
        'byDay' : pbTotalList
    }
    
    # Save to db
    # save_to_dynamodb(table, t_item)
    # lambda_client.invoke_async(FunctionName='dean-dev-protocol-job', InvokeArgs=json.dumps({'method':'save', 'body':t_item}))


    soaSummaryObj = s3.get_object(Bucket=bucketName, Key=prefixName + '/summary/soaSummary.json')['Body']
    soaSummaryObj = json.loads(soaSummaryObj.read())
    nctCostPbMap = soaSummaryObj['nctCostPbMap']
    nctCostPbMap[nct_id] = {
        'cost' : totalCost,
        'pb' : pbTotalAmount
    }
    
    #############################################################################
    #                            soa_item                                       #
    #############################################################################
    
    soaResultList = []
    if(xPos != -1):
        for row in soaProcessedContent[xPos-1:]:
            rawEvent = row[0]
            if(removeSpecialChars(rawEvent) in soaDic):
                soaResultList.append({
                    'raw' : rawEvent,
                    'standardized' : soaDic[removeSpecialChars(rawEvent)]['value'],
                    'category' : soaDic[removeSpecialChars(rawEvent)]['category']
                })
            else:
                soaResultList.append({
                    'raw' : rawEvent,
                    'standardized' : "",
                    'category' : ""
                })
    s3.put_object(Bucket=bucketName, Key=prefixName + '/summary/nct_soa_result/' + nct_id + '_soa.json', Body=json.dumps({
        'result' : soaResultList
    }))
    # for item in soaRes:
    #     standardized = item['value']
    #     if(standardized in actIndex):
    #         #existing activity
    #         nctList = actIndex[standardized]['nctList']
    #         rawMap = actIndex[standardized]['raw']
    #         if(nct_id in nctList):
    #             pass
    #         else:
    #             nctList.append(nct_id)
    #             actIndex[standardized]['nctList'] = nctList
    #             rawMap[nct_id] = item['key']
    #             actIndex[standardized]['raw'] = rawMap
            
    #     else:
    #         #new activity
    #         nctList = []
    #         nctList.append(nct_id)
    #         actIndex[standardized] = {}
    #         actIndex[standardized]['nctList'] = nctList
    #         actIndex[standardized]['category'] = item['category']
    #         actIndex[standardized]['raw'] = {
    #             nct_id : item['key']
    #         }
            
            
    # soaSummaryObj['actIndex'] = actIndex
    
    soaSummaryObj['actIndex'][nct_id] = soaResultList
    soaSummaryObj['nctCostPbMap'] = nctCostPbMap
    
    s3.put_object(Bucket=bucketName, Key=prefixName + '/summary/soaSummary.json', Body=json.dumps(soaSummaryObj))
    
    
    #############################################################################
    #                            IE                                             #
    #############################################################################
    
    ieData, criteriaSummary = process(new_content_s[hash_value], soaDic, nct_id)
    
    # print(ieData)
    # print(criteriaSummary)
    
    # item = {
    #     'nct_id': nct_id, 
    #     'summary': json.dumps(criteriaSummary)
    # }
    # dynamodb = boto3.resource('dynamodb')
    # table = dynamodb.Table('study_summary')
    # response = table.put_item(
    #     Item=item
    # )
    # try:
    #     table2 = dynamodb.Table('studies')
    #     response = table2.update_item(
    #         Key={
    #                 'nct_id': nct_id
    #             },
    #         UpdateExpression="set #s=:r",
    #         ExpressionAttributeValues={
    #             ':r': json.dumps(criteriaSummary)
    #         },
    #         ExpressionAttributeNames={
    #             '#s': "ie_output"
    #         },
    #         ReturnValues="UPDATED_NEW"
    #     )
    # except Exception as e:
    #     print("update dynamodb failed")
    s3.put_object(Bucket=bucketName, Key=prefixName + '/summary/nct_ie_result/' + nct_id + '_ie.json', Body=json.dumps({
        'result' : criteriaSummary
    }))
    
    
    # ieSummaryObj = s3.get_object(Bucket=bucketName, Key=prefixName + '/summary/ieSummary.json')['Body']
    # ieSummaryObj = json.loads(ieSummaryObj.read())
    # iHistory = ieSummaryObj['inclusion']
    # eHistory = ieSummaryObj['exclusion']
    # eList = new_content_s[hash_value]['exclusionCriteria'][0]['comprehendMedical']['Entities']['Entities']
    # iList = new_content_s[hash_value]['inclusionCriteria'][0]['comprehendMedical']['Entities']['Entities']
    # iNew = []
    # eNew = []
    # for item in eList:
    #     eNew.append({
    #         'category' : item['Category'],
    #         'raw' : item['Text']
    #     })
    # eHistory[nct_id] = eNew 
    # for item in iList:
    #     iNew.append({
    #         'category' : item['Category'],
    #         'raw' : item['Text']
    #     })
    # iHistory[nct_id] = iNew 
    # ieSummaryObj['inclusion'] = iHistory
    # ieSummaryObj['exclusion'] = eHistory
    
    ieSummaryObj = s3.get_object(Bucket=bucketName, Key=prefixName + '/summary/ieSummary.json')['Body']
    ieSummaryObj = json.loads(ieSummaryObj.read())
    iHistory = ieSummaryObj['inclusionCriteria']
    eHistory = ieSummaryObj['exclusionCriteria']
    hasIn = False
    hasEx = False
    for item in criteriaSummary:
        for key in item:
            if key == 'inclusionCriteria':
                iHistory[nct_id] = item[key]
                hasIn = True
            if key == 'exclusionCriteria':
                eHistory[nct_id] = item[key]
                hasEx = True
    if not hasIn:
        iHistory[nct_id] = {}
    if not hasEx:
        eHistory[nct_id] = {}
    ieSummaryObj['inclusionCriteria'] = iHistory
    ieSummaryObj['exclusionCriteria'] = eHistory
    
    s3.put_object(Bucket=bucketName, Key=prefixName + '/summary/ieSummary.json', Body=json.dumps(ieSummaryObj))
    
    # try:
    #     loopVar = ['inclusionCriteria','exclusionCriteria']
    #     for ie in loopVar:
    #         ieText = new_content_s[hash_value][ie][0]['content']
    #         ENDPOINT_NAME='omop-202108100654'
    #         payload=json.dumps({'text': ieText,'model':'omop'})
    #         response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
    #                                   ContentType='application/json',
    #                                   Body=payload)
    #         result = json.loads(response['Body'].read().decode())
    #         print("omop result is: ")
    #         print(result)
    #         resultDic = {}
    #         for sentence in result:
    #             for keyword in result[sentence]:
    #                 resultDic[keyword] = result[sentence][keyword]
    #                 if '1_omop_term' in result[sentence][keyword] and '1_snomed_term' in result[sentence][keyword]:
    #                     resultDic[keyword] = {
    #                         '1_omop_term' : result[sentence][keyword]['1_omop_term'],
    #                         '1_snomed_term' : result[sentence][keyword]['1_snomed_term']
    #                     }
    #                 else:
    #                     resultDic[keyword] = {
    #                         '1_omop_term' : result[sentence][keyword]['1_omop_term'],
    #                         '1_snomed_term' : result[sentence][keyword]['1_snomed_term']
    #                     }
    #         for item in new_content_s[hash_value][ie][0]['comprehendMedical']['Entities']['Entities']:
    #             if item['Text'] in resultDic:
    #                 item['omop'] = resultDic[item['Text']]
    #                 item['1_omop_term'] = resultDic[item['Text']]['1_omop_term']
    #                 item['1_snomed_term'] = resultDic[item['Text']]['1_snomed_term']
    #         # print(new_content_s[hash_value][ie][0]['comprehendMedical']['Entities']['Entities'])
    # except Exception as e:
    #     print("omop error")
    #     print(e)

    response = s3.put_object(Bucket=bucketName, Key=prefixName+'/input/data/'+getFileName(bucketKey)+'.json', Body=json.dumps(new_content_s))
    print("save result success!")
    # lambda_client.invoke_async(FunctionName='iso-service-dev-aws-summary', InvokeArgs=json.dumps({'bucket':bucketName, 'key':prefixName+'/input/data/'+getFileName(bucketKey)+'.json'}))
    # lambda_client.invoke_async(FunctionName='iso-service-dev-aws-label', InvokeArgs=json.dumps({'bucket':bucketName, 'key':prefixName+'/input/data/'+getFileName(bucketKey)+'.json'}))
    print('call iso-service-dev-aws-label')
    # Dean Add export CSV file
    # content = save_csv(hash_value, protocol)
    # bak/ProtocolExtraction/
    # response = s3.put_object(Bucket=bucketName, Key=prefixName+'/bak/ProtocolExtraction/csv/'+getFileName(bucketKey)+'.csv', Body=content)
    
    return {'message': 'ok'}
