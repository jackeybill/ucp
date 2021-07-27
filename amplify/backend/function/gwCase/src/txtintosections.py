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
from soaFromResponse import SOAfromResponseUsingPA
from updateDynamoDB import updateTitle
from clinical_trial_api import fetchNCTDetails
import csv

lambda_client = boto3.client('lambda')
runtime = boto3.client('runtime.sagemaker')
s3 = boto3.client('s3')
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
        response = s3.get_object(Bucket=s3BucketName, Key=outputName)
        results = json.loads(response['Body'].read().decode('utf-8'))
    except Exception as e:
        print(e)
        # logger.error(e)
    return results

def process_result_summary(content):
    print('content', content)
    util:ExtractUtils = ExtractUtils()
    #return ('md5:', util.md5_hash(content))
    # s3://iso-data-zone/iso-service-dev/comprehendOutput/content/725e06607cc32e3f4a0cfddd14459cfb.json
    s3BucketName = 'iso-data-zone'
    documentName = 'iso-service-dev/comprehendOutput/content/'+util.md5_hash(content)+'.json'
    results = getExistResult(s3BucketName,documentName)
    if results != None:
        return results
    awsUtils:AwsUtils = AwsUtils()
    comprehendmedical = boto3.client('comprehendmedical')
    chunk_data = awsUtils.splitContent(content)
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
    return result


def saveToJson(bucketName, bucketKey, inclusionContent, exclusion, eventsSchedule, allBody):
    fileName = getFileName(bucketKey)
    items = []
    awsUtils:AwsUtils = AwsUtils()
    

    if inclusionContent:
        # result = process_result_summary(inclusionContent)
        items.append(getItemInfo('inc-0', fileName, 'inclusionCriteria', 'Inclusion Criteria', inclusionContent, process_result_summary(inclusionContent)))
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
           Category.append(item['Category'])
        summary = Counter(Category)
        return summary 
    if model == 'base':
        for item in result:
            value = []
            value.append(item)
            mydict=dict(zip(base_key,value))
            print(mydict)
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
    #s3BucketName = "iso-data-zone"                    #"iso-clinicaltrial-studyprotocols"
    #documentPath = "iso-service-dev/RawDocuments/"    #"study_protocols_eli_lilly_and_company_phase1/"
    
    #document and spoonsor
    #filename = 'NCT01484431.pdf'
    
    #Inferance call
    sectionNames = ['Inclusion Criteria','Exclusion Criteria']
    result = infn_sect_extra.extractSections(fileContent,sectionNames, False)
    #return result
    #infn_sect_extra.nctExtractSections(s3BucketName,documentPath,filename,sectionNames)
    util:ExtractUtils = ExtractUtils()
    #inclusion_body = util.getItemStartEnd(fileContent, 'Inclusion Criteria')
    #exclusion_body = util.getItemStartEnd(fileContent, 'Exclusion Criteria')
    # inclusion_body = util.getItemStartEnd(fileContent, 'INCLUSION CRITERIA')
    # exclusion_body = util.getItemStartEnd(fileContent, 'EXCLUSION CRITERIA')
    events_body = util.getItemStartEnd(fileContent, 'Events')
    # title_body = util.getItemStartEnd(fileContent, 'Title')
    
    # use inference_section_extraction to parse the inclusion/exclusion
    inclusion_body = result['Inclusion Criteria'][0]['text']
    exclusion_body = result['Exclusion Criteria'][0]['text']
    #print('parseTxt: Inclusion Criteria - ' + inclusion_body)
    #print('parseTxt: Exclusion Criteria - ' + exclusion_body)
    #return
    # print('parseTxt: title' + title_body)
    return saveToJson(bucketName, bucketKey, inclusion_body, exclusion_body, events_body, fileContent)

def getPathInfo(event):
    # Started job with bucket: BI clinical study.pdf ; Clinical Pharmacology Protocol
    #return 'iso-data-zone','iso-service-dev/comprehend-input/BI clinical study.pdf.txt'
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

def using_new_format_for_label_edit_aws(data, hashcode):
    """
    For front-end new tab show labels and edit the label
    params:
        data: after process json
        hashcode: generate's hashcode the root key
    """
    body = data[hashcode]
    #path_names = ['includeAllText', 'inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary']
    path_names = ['includeAllText', 'inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'briefSummary']
    for path_name in path_names:
        # InclusionCriteria
        content = body[path_name][0]['content']
        if not content or len(content) < 1:
            continue
        contents = str(content).split(' ')
        for name in ['ICD-10-CM', 'RxNorm', 'Entities']:
            value = body[path_name][0]['comprehendMedical'][name]
            all_result = []
            nlp = []
    
            nlp_result = []
            nindex = 1
            for l in value['Entities']:
                text = l['Text']
                if len(str(text).split(' ')) > 1:
                    for j in str(text).split(' '):
                        i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': j, 'score': l['Score'],
                             'children': []}
                        if name == 'ICD-10-CM' and 'ICD10CMConcepts' in l:
                            if len(l['ICD10CMConcepts']) >=3:
                                rows = l['ICD10CMConcepts']
                                rows_by_fname = sorted(rows, key=itemgetter('Score'))
                                i['Concepts'] = rows_by_fname
                            else:
                                i['Concepts'] = l['ICD10CMConcepts']
                    nlp_result.append(i)
                else:
                    i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': l['Text'], 'score': l['Score'], 'children': []}
                    if name == 'ICD-10-CM' and 'ICD10CMConcepts' in l:
                        if len(l['ICD10CMConcepts']) >=2:
                            rows = l['ICD10CMConcepts']
                            rows_by_fname = sorted(rows, key=itemgetter('Score'))
                            i['Concepts'] = rows_by_fname[:1]
                        else:
                            i['Concepts'] = l['ICD10CMConcepts']
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
                            if match and len(list(li['children'])) == 0:
                                children = list(li['children'])
                                children.append(items_dict)
                                li['children'] = children
                                print(li)
                                flag = True
                                all_result.append(li)
                                index += 1
                                break
                        except:
                            continue
    
                if not flag:
                    index += 1
                    # print(items_dict)
                    # all_result.append(items_dict)
            # print(all_result)
            # print(f'Name:{name}')
            data[hashcode][path_name][0]['comprehendMedical'][name]['label'] = all_result
        # print(data)
    
    return data


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
                            print(li)
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
    import psycopg2
    conn = psycopg2.connect(
        host="aact-db.ctti-clinicaltrials.org",
        database="aact",
        user="mi608",
        password=urllib.parse.unquote_plus('Training@123'))
    #
    # nct_id = 'NCT00613574' 
    #sql = "select s.brief_title from studies s where s.nct_id = '%s' limit 1;" % nct_id
    sql = "select s.official_title, s.brief_title from studies s where s.nct_id = '%s' limit 1;" % nct_id
    print(sql)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchmany(1)
    if len(rows) > 0 and len(rows[0]) > 0:
        print('rows:', rows)
        title = rows[0][1]
        return rows[0][0], title 
    else:
        return '', ''
    cur.close()

def load_brief_from_ctti(nct_id):
    # return ''
    import psycopg2
    conn = psycopg2.connect(
        host="aact-db.ctti-clinicaltrials.org",
        database="aact",
        user="mi608",
        password=urllib.parse.unquote_plus('Training@123'))
    #
    # nct_id = 'NCT00613574'
    sql = "select bs.description from brief_summaries bs where bs.nct_id ='%s' limit 1;" % nct_id
    print(sql)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchmany(1)
    if len(rows) > 0 and len(rows[0]) > 0:
        value = rows[0][0]
        
        value = ' '.join(str(value).strip().replace('\r\n', '\n').replace('\n', '').split())
        
        print(value)

        cur.close()
        print(value)
        return value
    else:
        return ''
    
       
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
    bucketName = "iso-data-zone"
    #bucketKey = "iso-service-dev/comprehend-input/NCT02995733.pdf.txt"
    bucketKey = "iso-service-dev/comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt"
    
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
    #bucketName = "iso-data-zone"
    #bucketKey = "iso-service-dev/comprehend-input/NCT03023826.pdf.txt"
    #bucketKey = "iso-service-dev/comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt"
    response = get_json_format(bucketName, bucketKey)
    #print(response)
    # path = 'data/processed/textract/document/pfizer/phase2/' #
    # filename = 'NCT02969044.json' #NCT04091061 #Lilly-> #NCT02951780
    # response = loadresponse(filename)
    text = infn_ep_extra.loadtextforResponse(response)
    #print(text)
    tabletype = 'html'
    output = infn_ep_extra.nctExtractObjectivesEndpoints(response,text,tabletype)
    print(output)
    result = ''
    if output['type'] == 'table':
        result = output['content']['table']
    else:
        for item in output['content']:
            #print(output['content'][item]['name'])
            result += output['content'][item]['name'] +'\n'
            text = output['content'][item]['text']
            for txt in text.split('. '):
                result += '\t . ' + txt +'\n'
    print(result)
    return result
    #tabletype = 'list' #'html' 'csv'
    #soaRawContent = SOAfromResponseUsingPA(get_json_format(bucketName, bucketKey),jsontype=True,pretty=False,tabletype=tabletype)

def testMe():
    # If Column B is blank, Highlight display "Not Considered as an Activity" ；Fasting Visit NCT02133742.pdf
    #soaProcessedContent, pageNo = getSoaProcessedContent('', '')
    
    #  test for uddateTitle() NCT04255433,NCT04864977,NCT04867785
    nctId = 'NCT02133742'
    #updateTitle('study_protocol', nctId, load_title_from_ctti(nctId))
    processEndpoints("iso-data-zone", "iso-service-dev/comprehend-input/NCT03023826.pdf.txt")
    return

    item = fetchNCTDetails(nctId)
    print( item )
    
    res = process_result_summary(item['inclusion_criteria'])
    print('res', res)
    #item['inclusion_comprehend'] = process_result_summary(item['inclusion_criteria'])
    #item['exclusion_comprehend'] = process_result_summary(item['exclusion_criteria'])
    
    
    # # iso-data-zone, and file name: iso-service-dev/comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt
    #response = s3.put_object(Bucket='iso-data-zone', Key='iso-service-dev/comprehendOutput/data/'+nctId+'.json', Body=json.dumps(item))
    return

    #return processSoaProcessedContent(soaProcessedContent)
    
def processSoaProcessedContent(soaProcessedContent):
    soaDic={}
    with open('./StandardizedActivitiesMapping.csv', mode='r') as infile:
        reader = csv.reader(infile, delimiter='\t')
        for rows in reader:
            #print(rows)
            if not rows[1]:
                rows[1] = 'Not Considered as an Activity'
            soaDic[removeSpecialChars(rows[0])]={"value":rows[1],"category":rows[2]}
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
    
def lambda_handler(event, context):
    print("event: {}".format(event))
    if 'testMe' in event:
        return testMe()
    #TEST for the Schedule of Activities
    # processScheduleOfActivities()
    # return
    bucketName, bucketKey = getPathInfo(event)
    # iso-data-zone, and file name: iso-service-dev/comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt
    #bucketName = 'iso-data-zone'
    #bucketKey = 'iso-service-dev/comprehend-input/Clinical Pharmacology Protocol 887663.pdf.txt'
    if not bucketKey.endswith('.txt'):
        return

    response = s3.get_object(Bucket=bucketName, Key=bucketKey)
    txt = response['Body'].read().decode('utf-8')
    
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
    print(protocol)
    
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
    if len(nct_id) > 0 and len(load_title_from_ctti(nct_id)) > 0:
        title, briefTitle = load_title_from_ctti(nct_id) # 'Protocol I7T-MC-RMAA Disposition of [14C]-LY2623091 following Oral Administration in Healthy Subjects'
        #TODO update the 'study_protocol'
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
    
    if len(nct_id) > 0 and len(load_brief_from_ctti(nct_id)) > 0:
        brief = load_brief_from_ctti(nct_id)
    print(brief)
    incItem = {}
    incItem['title'] = brief
    incItem['content'] = brief
    incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(brief)
    en_re, icd_10_re, rx_re = process_summary(brief)
    incItem['comprehendMedical']['Entities']['Summary'] = en_re
    incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
    incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
    protocol[hash_value]['briefSummary']  = [incItem]
    
    endpoints = processEndpoints(bucketName, bucketKey)
    if len(endpoints) == 0:
        endpoints='Mr . Nesser is a 52 - year - old Caucasian male with an extensive past medical history that includes coronary artery disease , atrial fibrillation , hypertension , hyperlipidemia , presented to North ED with complaints of chills , nausea , acute left flank pain and some numbness in his left leg.'    
    incItem = {}
    incItem['title'] = endpoints
    incItem['content'] = endpoints
    incItem['comprehendMedical'] = awsUtils.detectComprehendMedical(endpoints)
    en_re, icd_10_re, rx_re = process_summary(endpoints)
    incItem['comprehendMedical']['Entities']['Summary'] = en_re
    incItem['comprehendMedical']['ICD-10-CM']['Summary'] = icd_10_re
    incItem['comprehendMedical']['RxNorm']['Summary'] = rx_re
    protocol[hash_value]['objectivesEndpointsEstimands']  = [incItem]
    
    # protocol[hash_value]['objectivesEndpointsEstimands']  = []
    
    pageNo = 1
    tabletype = 'list' #'html' 'csv'
    soaRawContent = SOAfromResponseUsingPA(get_json_format(bucketName, bucketKey),jsontype=True,pretty=False,tabletype=tabletype)
    soaProcessedContent = json.loads(soaRawContent)
    for item in soaProcessedContent.items():
        soaProcessedContent = item[1]['table']
        pageNo = item[1]['pages'][0]
        break
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
            if(column == 'X'):
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
    
    # for aws label need editor
    # new_content = using_new_format_for_label_edit_aws(new_content,hash_value)
    
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
    print(new_content_s)
    
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
                    if(column == 'X'):
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
                    if(row[column] == 'X'):
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
    
    
    response = s3.put_object(Bucket=bucketName, Key=prefixName+'/input/data/'+getFileName(bucketKey)+'.json', Body=json.dumps(new_content_s))
    print("save result success!")
    
    
    
    
    
    soaSummaryObj = s3.get_object(Bucket=bucketName, Key=prefixName + '/summary/soaSummary.json')['Body']
    soaSummaryObj = json.loads(soaSummaryObj.read())
    nctCostPbMap = soaSummaryObj['nctCostPbMap']
    nctCostPbMap[nct_id] = {
        'cost' : totalCost,
        'pb' : pbTotalAmount
    }
    
    soaResultList = []
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
    s3.put_object(Bucket=bucketName, Key=prefixName + '/summary/nct_soa_result/' + nct_id + '.json', Body=json.dumps({
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
    
    
    ##IE
    ieSummaryObj = s3.get_object(Bucket=bucketName, Key=prefixName + '/summary/ieSummary.json')['Body']
    ieSummaryObj = json.loads(ieSummaryObj.read())
    iHistory = ieSummaryObj['inclusion']
    eHistory = ieSummaryObj['exclusion']
    eList = new_content_s[hash_value]['exclusionCriteria'][0]['comprehendMedical']['Entities']['Entities']
    iList = new_content_s[hash_value]['inclusionCriteria'][0]['comprehendMedical']['Entities']['Entities']
    iNew = []
    eNew = []
    for item in eList:
        eNew.append({
            'category' : item['Category'],
            'raw' : item['Text']
        })
    eHistory[nct_id] = eNew 
    for item in iList:
        iNew.append({
            'category' : item['Category'],
            'raw' : item['Text']
        })
    iHistory[nct_id] = iNew 
    ieSummaryObj['inclusion'] = iHistory
    ieSummaryObj['exclusion'] = eHistory
    
    s3.put_object(Bucket=bucketName, Key=prefixName + '/summary/ieSummary.json', Body=json.dumps(ieSummaryObj))
    
    
    
    # lambda_client.invoke_async(FunctionName='iso-service-dev-aws-summary', InvokeArgs=json.dumps({'bucket':bucketName, 'key':prefixName+'/input/data/'+getFileName(bucketKey)+'.json'}))
    lambda_client.invoke_async(FunctionName='iso-service-dev-aws-label', InvokeArgs=json.dumps({'bucket':bucketName, 'key':prefixName+'/input/data/'+getFileName(bucketKey)+'.json'}))
    
    # Dean Add export CSV file
    # content = save_csv(hash_value, protocol)
    # iso-service-dev/bak/ProtocolExtraction/
    # response = s3.put_object(Bucket=bucketName, Key=prefixName+'/bak/ProtocolExtraction/csv/'+getFileName(bucketKey)+'.csv', Body=content)
    
    return {'message': 'ok'}
