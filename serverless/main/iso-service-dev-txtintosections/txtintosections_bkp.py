import section_filter as section_filter
import boto3
import json
import urllib.parse
import re
import os
from collections import Counter
from generate_text import convertToTxt

from ExtractUtils import ExtractUtils
from AwsUtils import AwsUtils

def saveToJson(bucketName, bucketKey, inclusionContent, exclusion, eventsSchedule, allBody):
    fileName = getFileName(bucketKey)
    items = []
    awsUtils:AwsUtils = AwsUtils()

    if inclusionContent:
        items.append(getItemInfo('inc-0', fileName, 'inclusionCriteria', 'Inclusion Criteria', inclusionContent, awsUtils.detectComprehendMedical(inclusionContent)))
    if exclusion:
        items.append(getItemInfo('exc-0', fileName, 'exclusionCriteria', 'Exclusion Criteria', exclusion, awsUtils.detectComprehendMedical(exclusion)))
    if eventsSchedule:
        items.append(getItemInfo('evt-0', fileName, 'eventsSchedule', 'Events Schedule', eventsSchedule, awsUtils.detectComprehendMedical(eventsSchedule)))
    # Add all content
    if allBody:
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
        runtime= boto3.client('runtime.sagemaker')
        ENDPOINT_NAME='scispacy'
        base_result = []
        bc5cdr_result = []
        bionlp13cg_result = []
        craft_result = []
        jnlpba_result = []
        mosaic_result = []
        model_results = {}
        for model in ['base','bc5cdr', 'bionlp13cg', 'craft', 'jnlpba']:
            payload=json.dumps({'text':allBody, 'model': model})
            response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                              ContentType='application/json',
                                              Body=payload)
            result = json.loads(response['Body'].read().decode())
            #print(model)
            #print(result)
            model_results[model] = result['ents']
  
        model = 'mosaic-ner'
        payload=json.dumps({'text':allBody, 'model':'mosaic-ner'})
        ENDPOINT_NAME='mosaic'
        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                              ContentType='application/json',
                                              Body=payload)
        result = json.loads(response['Body'].read().decode())
        #print(result)
        model_results[model] = result['entities']
        base_result.extend(model_results['base'])
        base_keyvalue = AddKeyForValue('base_keyvalue','base_Category',base_result,'base')
        bc5cdr_result.extend(model_results['bc5cdr'])
        bc5cdr_keyvalue , bc5cdr_summary = AddKeyForValue('bc5cdr_keyvalue',' bc5cdr_Category',bc5cdr_result,'bc5cdr')
        bionlp13cg_result.extend(model_results['bionlp13cg'])
        bionlp13cg_keyvalue ,  bionlp13cg_summary = AddKeyForValue('bionlp13cg_keyvalue','bionlp13cg_Category',bionlp13cg_result,'bionlp13cg')
        craft_result.extend(model_results['craft'])
        craft_keyvalue ,  craft_summary = AddKeyForValue('craft_keyvalue',' craft_Category',craft_result,'craft')
        jnlpba_result.extend(model_results['jnlpba'])
        jnlpba_keyvalue ,  jnlpba_summary = AddKeyForValue('jnlpba_keyvalue',' jnlpba_Category',jnlpba_result,'jnlpba')
        mosaic_result.extend(model_results['mosaic-ner'])
        mosaic_keyvalue ,  mosaic_summary = AddKeyForValue('mosaic_keyvalue',' mosaic_Category',mosaic_result,'mosaic-ner')
        result = {
                'Entities': {'Entities':entity_result, 'Summary':Entities_summary},
                'ICD-10-CM': {'Entities':icd10_result, 'Summary':icd10_summary},
                'RxNorm': {'Entities':rx_result, 'Summary':rx_summary},
                'Base': {'Entities':base_keyvalue},
                'Bc5cdr': {'Entities':bc5cdr_keyvalue , 'Summary':bc5cdr_summary},
                'Bionlp13cg': {'Entities':bionlp13cg_keyvalue, 'Summary':bionlp13cg_summary},
                'Craft': {'Entities':craft_keyvalue, 'Summary':craft_summary},
                'Jnlpba': {'Entities':jnlpba_keyvalue, 'Summary':jnlpba_summary},
                'Mosaic-ner': {'Entities':mosaic_keyvalue, 'Summary':mosaic_summary}
            }
        # Dean add format raw text
        # items.append(getItemInfo('all-0', fileName, 'allText', 'all Text', convertToTxt(json.loads(allBody)), result))    
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
    util:ExtractUtils = ExtractUtils()
    inclusion_body = util.getItemStartEnd(fileContent, 'Inclusion Criteria')
    exclusion_body = util.getItemStartEnd(fileContent, 'Exclusion Criteria')
    events_body = util.getItemStartEnd(fileContent, 'Events')
    
    
    return saveToJson(bucketName, bucketKey, inclusion_body, exclusion_body, events_body, fileContent)

def getPathInfo(event):
    # Started job with bucket: BI clinical study.pdf ; Clinical Pharmacology Protocol
    #return 'iso-data-zone','iso-service-dev/comprehend-input/BI clinical study.pdf.txt'
    payload = event['Records'][0]['s3']

    s3BucketName = payload['bucket']['name']
    documentName = urllib.parse.unquote_plus(payload['object']['key'], encoding='utf-8')

    print("Started job with bucket: {}, and file name: {}".format(s3BucketName, documentName))
    return s3BucketName, documentName
    
    
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
    s3 = boto3.client('s3')
    newbucketKey=bucketKey
    newbucketKey=newbucketKey.replace('comprehend-input','TextractOutput')
    newbucketKey=newbucketKey.replace('.txt','.json')
    print(f'read bucket {bucketName}, key {newbucketKey}')
    
    response = s3.get_object(Bucket=bucketName, Key=newbucketKey)
    pdf_json = json.loads(response['Body'].read().decode('utf-8'))
    
    allFormatText = convertToTxt(pdf_json)
    return allFormatText
    
    

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
    
    # body = data[hashcode]
    # content = body['includeAllText'][0]['content']
    # contents = str(content).split(' ')
    # for name in ['Bc5cdr', 'Bionlp13cg', 'Craft', 'Jnlpba', 'Mosaic-ner']:
    #     value = body['includeAllText'][0]['comprehendMedical'][name]
    #     all_result = []
    #     nlp = []
    #     nlp_labels = []
    #     for b in value['Entities']:
    #         print(b['Text'])
    #         item = {'text': b['Text'], 'category': b['Category']}
    #         if item not in nlp_labels:
    #             nlp_labels.append(item)

    #     nlp_result = []
    #     nindex = 1
    #     for l in nlp_labels:
    #         i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['category'], 'text': l['text'], 'children': []}
    #         nindex += 1
    #         nlp_result.append(i)

    #     index = 1
    #     mark_item = {}
    #     child = []
    #     for i in contents:
    #         flag = False
    #         items_dict = {'type': 'span', 'id': index, 'text': i}
    #         index += 1

    #         for li in nlp_result:
    #             if i:
    #                 pattern = str(li['text'])
    #                 try:
    #                     match = re.search(pattern, i)
    #                     if match:
    #                         children = list(li['children'])
    #                         children.append(items_dict)
    #                         li['children'] = children
    #                         print(li)
    #                         flag = True
    #                         break
    #                 except:
    #                     continue
    #         if not flag:
    #             print(items_dict)
    #             all_result.append(items_dict)

    #     data[hashcode]['includeAllText'][0]['comprehendMedical'][name]['label'] = all_result + nlp_result
    
    return data


def lambda_handler(event, context):
    print("event: {}".format(event))
    bucketName, bucketKey = getPathInfo(event)
    if not bucketKey.endswith('.txt'):
        return

    s3 = boto3.client('s3')
    response = s3.get_object(Bucket=bucketName, Key=bucketKey)
    txt = response['Body'].read().decode('utf-8')
    
    new_key = bucketKey.replace('comprehend-input','TextractOutput').replace('.txt','.json')
    print(f'read bucket:{bucketName}, key:{new_key}')
    response = s3.get_object(Bucket=bucketName, Key=new_key)
    pdf_json = json.loads(response['Body'].read().decode('utf-8'))
    
    new_txt = convertToTxt(pdf_json)
    
    # data = parseTxt(bucketName, bucketKey, txt)
    data = parseTxt(bucketName, bucketKey, new_txt)

    print("Input json:", data)
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
    new_content = using_new_format_for_label_edit(protocol,hash_value)
    response = s3.put_object(Bucket=bucketName, Key=prefixName+'/input/data/'+getFileName(bucketKey)+'.json', Body=json.dumps(new_content))
    
    # Dean Add export CSV file
    content = save_csv(hash_value, protocol)
    # iso-service-dev/bak/ProtocolExtraction/
    response = s3.put_object(Bucket=bucketName, Key=prefixName+'/bak/ProtocolExtraction/csv/'+getFileName(bucketKey)+'.csv', Body=content)
    
    return {'message': 'ok'}
