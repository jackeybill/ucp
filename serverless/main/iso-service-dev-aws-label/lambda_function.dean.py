import json
import re
import boto3
import copy
from operator import itemgetter

s3_client = boto3.client('s3')
runtime = boto3.client('runtime.sagemaker')

def using_new_format_for_label_edit_aws(data, hashcode):
    """
    For front-end new tab show labels and edit the label
    params:
        data: after process json
        hashcode: generate's hashcode the root key
    """
    body = data[hashcode]
    # path_names = ['includeAllText', 'inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary']
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    for path_name in path_names:
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
        
        content = body[path_name][0]['content']
        # for test
        content = content.replace('\n', '\n ')
        if not content or len(content) < 1:
            continue
        contents = str(content).split(' ')
        for name in ['ICD-10-CM', 'RxNorm', 'Entities', 'MedDRA']:
            value = body[path_name][0]['comprehendMedical'][name]
            all_result = []
            nlp = []
            pid_index = 1
            same_key = []
            nlp_result = []
            nindex = 1
            if not value or 'Entities' not in value:
                continue
            
            for l in value['Entities']:
                
                
                if name == 'MedDRA':
                    l['Score'] = 0
                    
                    
                text = l['Text']
                if len(str(text).split(' ')) > 1:
                    same_list = []
                    n_index = 0
                    same_item = {'header': '', 'child': []}
                    for j in str(text).split(' '):
                        if n_index == 0:
                            same_item['header'] = 'm-' + str(nindex)
                        else:
                            same_item['child'].append('m-' + str(nindex))
                        n_index += 1
                        
                        i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l[
                            'Category'], 'text': j, 'score': l['Score'],
                             'children': []}
                        if name == 'ICD-10-CM' and 'ICD10CMConcepts' in l:
                            if len(l['ICD10CMConcepts']) >= 3:
                                rows = l['ICD10CMConcepts']
                                rows_by_fname = sorted(rows, key=itemgetter('Score'))
                                i['Concepts'] = rows_by_fname[:1]
                            else:
                                i['Concepts'] = l['ICD10CMConcepts']
                        
                        
                        # RxNorm Concepts
                        if name == 'RxNorm' and 'RxNormConcepts' in l:
                            if len(l['RxNormConcepts']) >= 3:
                                rows = l['RxNormConcepts']
                                rows_by_fname = sorted(rows, key=itemgetter('Score'))
                                i['Concepts'] = rows_by_fname[:1]
                            else:
                                i['Concepts'] = l['RxNormConcepts']
                            
                        nlp_result.append(i)
                        nindex += 1
                        
                    same_key.append(same_item)
                    pid_index += 1
                else:
                    i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': l[
                        'Text'], 'score': l['Score'], 'children': []}
                    if name == 'ICD-10-CM' and 'ICD10CMConcepts' in l:
                        if len(l['ICD10CMConcepts']) >= 2:
                            rows = l['ICD10CMConcepts']
                            rows_by_fname = sorted(rows, key=itemgetter('Score'))
                            i['Concepts'] = rows_by_fname[:1]
                        else:
                            i['Concepts'] = l['ICD10CMConcepts']
                    
                    # RxNorm Concepts
                    if name == 'RxNorm' and 'RxNormConcepts' in l:
                        if len(l['RxNormConcepts']) >= 3:
                            rows = l['RxNormConcepts']
                            rows_by_fname = sorted(rows, key=itemgetter('Score'))
                            i['Concepts'] = rows_by_fname[:1]
                        else:
                            i['Concepts'] = l['RxNormConcepts']
                    
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

            label_result = []
            if len(same_key) == 0:
                label_result = all_result
            else:
                for i in same_key:
                    header = i['header']
                    child = i['child']
                    for item in all_result:
                        if item['id'] == header:
                            id_child = []
                            text_value = item['text']
                            for jx in all_result:
                                if jx['id'] in child:
                                    text_value += ' ' + jx['text']
                                    item['children'].extend(jx['children'])
                            # item['text'] = text_value
                            label_result.append(item)

            # print(label_result)
            # data[hashcode][path_name][0]['comprehendMedical'][name]['label'] = all_result
            data[hashcode][path_name][0]['comprehendMedical'][name]['label'] = label_result
            data[hashcode][path_name][0]['content'] = content

    return data


def generate_label_by_start_end(data, hashcode):
    result = copy.copy(data)
    body = data[hashcode]
    # path_names = ['includeAllText', 'inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary','objectivesEndpointsEstimands']
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    for path_name in path_names:
        if len(body[path_name]) == 0:
            continue
        content_stand = body[path_name][0]['content']
        if not content_stand or len(content_stand) < 1:
            continue
        
        # content = content_stand.replace('\n',' \n ')
        content = content_stand
        

        for name in ['ICD-10-CM', 'RxNorm', 'Entities']:
            print(name)
            if name not in body[path_name][0]['comprehendMedical'] or 'Entities' not in \
                    body[path_name][0]['comprehendMedical'][name] or len(
                    body[path_name][0]['comprehendMedical'][name]['Entities']) == 0:
                continue

            model_entities = body[path_name][0]['comprehendMedical'][name]['Entities']
            
            nnode_result = getNodeResult(name, content, model_entities)
            # result[hashcode][path_name][0]['comprehendMedical'][name]['label'] = node_result
            result[hashcode][path_name][0]['comprehendMedical'][name]['label'] = nnode_result
            
            # result[hashcode][path_name][0]['content'] = content
    
    return result
    
def getNodeResult(name, content, model_entities):
    skip_ids = []
    node_result = []
    for model_entity in model_entities:
        # filter out the Category='TIME_EXPRESSION' in 'ICD-10-CM'
        if name == 'ICD-10-CM' and model_entity['Category'] == 'TIME_EXPRESSION':
            continue
        # filter out Category='PROTECTED_HEALTH_INFORMATION' and Type='AGE'
        if model_entity['Type'] == 'AGE' and model_entity['Category'] == 'PROTECTED_HEALTH_INFORMATION':
            # iBeginOffset = int(model_entity['BeginOffset'])
            # prefixStr = str(content)[iBeginOffset - 2: iBeginOffset-1].strip()
            # print('prefixStr:', prefixStr)
            # if prefixStr == '[':
            #     continue
            continue
        
        if 'Attributes' in model_entity and len(model_entity['Attributes']) > 0:
            attributes = model_entity['Attributes']
            # "Type": "TEST_VALUE",
            # "BeginOffset": 4364,
            # "EndOffset": 4367,
            # "Text": "<80",
            # "Category": "TEST_TREATMENT_PROCEDURE",
            for attr in attributes:
                if attr['Type'] == 'TEST_VALUE':
                    attrChildrens = []
                    attrBeginOffset = int(attr['BeginOffset'])
                    attrEndOffset = int(attr['EndOffset'])
                    
                    while len(str(content)[attrBeginOffset - 1: attrBeginOffset].strip()) > 0:
                        # print(str(content)[attrBeginOffset - 1: attrBeginOffset])
                        attrBeginOffset = attrBeginOffset - 1

                    while len(str(content)[attrEndOffset: attrEndOffset + 1].strip()) > 0:
                        # print(str(content)[attrEndOffset: attrEndOffset + 1])
                        attrEndOffset = attrEndOffset + 1

                    attrText = attr['Text']
                    attrStartWords = str(content.strip())[: attrBeginOffset]
                    attrStartIndex = len(attrStartWords.strip().split(' '))
                    attrStartIndexInit = attrStartIndex
                    attrWord = str(content)[attrBeginOffset: attrEndOffset]
                    if attrText.strip() == attrWord.strip():
                        for words in str(attrText).split(' '):
                            # print(all_words_content[started_index])
                            attrChildrens.append({'type': 'span', 'id': attrStartIndex, 'text': str(words).strip()})
                            skip_ids.append(attrStartIndex)
                            attrStartIndex += 1
                        marked_item = {'id': 'm-' + str(attrStartIndexInit), 'type': 'mark',
                                       'category': attr['Category'],
                                       'text': attr['Text'], "score": dict(attr).get('Score'),
                                       'children': attrChildrens}
                        node_result.append(marked_item)
                        
                    else:
                        print(f'{attrWord} not match attribute value {attrText}')
        
        # print(model_entity)
        beginOffset = int(model_entity['BeginOffset'])
        endOffset = int(model_entity['EndOffset'])
        
        if str(content)[endOffset: endOffset + 1] != ' ':
            endOffset = endOffset + 1
        
        while str(content)[beginOffset - 1: beginOffset] != ' ':
            beginOffset = beginOffset - 1
        
        beforeStr = str(content)[:beginOffset].strip()
        beforeStrs = beforeStr.split(' ')
        
        start_index = len(beforeStrs)
        
        entity_word = str(content)[beginOffset: endOffset]
        # print(entity_word)
        entity_words = entity_word.split(' ')
        # print(len(entity_words))
        started_index = start_index
        childrens = []

        for words in entity_words:
            childrens.append({'type': 'span', 'id': started_index, 'text': words})
            skip_ids.append(started_index)
            started_index += 1
        marked_item = {'id': 'm-' + str(start_index), 'type': 'mark', 'category': model_entity['Category'],
                       'text': model_entity['Text'], "score": dict(model_entity).get('Score'),
                       'children': childrens}

        # print(marked_item)
        if name == 'ICD-10-CM' and 'ICD10CMConcepts' in model_entity:
            if len(model_entity['ICD10CMConcepts']) >= 2:
                rows = model_entity['ICD10CMConcepts']
                rows_by_fname = sorted(rows, key=itemgetter('Score'))
                marked_item['Concepts'] = rows_by_fname[:1]
            else:
                marked_item['Concepts'] = model_entity['ICD10CMConcepts']

        # RxNorm Concepts
        if name == 'RxNorm' and 'RxNormConcepts' in model_entity:
            if len(model_entity['RxNormConcepts']) >= 3:
                rows = model_entity['RxNormConcepts']
                rows_by_fname = sorted(rows, key=itemgetter('Score'))
                marked_item['Concepts'] = rows_by_fname[:1]
            else:
                marked_item['Concepts'] = model_entity['RxNormConcepts']

        node_result.append(marked_item)
        # childrens = []
    # print(skip_ids)
    # all_words = str(content).split(' ')
    #print(name + ' label: ')
    #print(node_result)
    
    all_words = str(content).split(' ')
    #print(all_words)
    index = 0
    nnode_result = []
    for item in all_words:
        if index in skip_ids:
            print(index)
            for it in node_result:
                if it['id'] == 'm-' + str(index):
                    nnode_result.append(it)
                    break
            index += 1
            continue
        
        node_item = {'type': 'span', 'id': index, 'text': item}
        nnode_result.append(node_item)
        index += 1
        
    return nnode_result

def processMedDRA(data, hashcode):
    """
    """
    body = data[hashcode]
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    ENDPOINT_NAME = 'mosaic-meddra-coding'
    for path_name in path_names:
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
        
        if 'ICD-10-CM' not in body[path_name][0]['comprehendMedical']:
            continue
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']['ICD-10-CM'] or len(body[path_name][0]['comprehendMedical']['ICD-10-CM']['Entities']) == 0:
            medDRA = {'Entities' : [], 'Summary': {}}
            data[hashcode][path_name][0]['comprehendMedical']['MedDRA'] = medDRA
            continue
        
        medDRA=copy.deepcopy(body[path_name][0]['comprehendMedical']['ICD-10-CM'])
        # medDRA = body[path_name][0]['comprehendMedical']['ICD-10-CM']
        label_datas = medDRA['label']
        label_datas_new = []
        summary_count = 0
        for label in label_datas:
            if 'children' in label:
                source_word = ' '.join([x['text'] for x in label['children']])
                payload = json.dumps({'text': [source_word], 'n_ranks': 1})
    
                response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                   ContentType='application/json',
                                                   Body=payload)
                mosaic_result = json.loads(response['Body'].read().decode())
                mosaic_result['results'][0]['preds'][0]['SOC'] = mosaic_result['results'][0]['preds'][0]['BS']
                del mosaic_result['results'][0]['preds'][0]['BS']
                label['Concepts'] = mosaic_result['results'][0]['preds']
                label['category'] = 'ADVERSE_EVENT'
                summary_count += 1
            label_datas_new.append(label)
        
        
        medDRA['label'] = label_datas_new
        medDRA['Summary'] = {"ADVERSE_EVENT": summary_count}
        
        entities = []
        for entity in medDRA['Entities']:
            entity['Category'] = 'ADVERSE_EVENT'
            entities.append(entity)
        medDRA['Entities'] = entities
        
        data[hashcode][path_name][0]['comprehendMedical']['MedDRA'] = medDRA

    return data

def update_json(bucket, key, body):
    print('update_json')
    print(body)
    response = s3_client.put_object(Bucket=bucket, Key=key, Body=json.dumps(body))


def format_entities(d, hashcode):
    # d = copy(nndata)
    body = d[hashcode]
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    for path_name in path_names:
        
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']:
            continue
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']['Entities'] or len(body[path_name][0]['comprehendMedical']['Entities']['Entities']) == 0:
            continue
        
        # data = json.loads(f.read())
        # print(data)
        entities_data = body[path_name][0]['comprehendMedical']['Entities']['Entities']
        result = []
        removed_ids = []
        for entity in entities_data:
            if entity['Id'] in removed_ids:
                continue
            beginOffSet = entity['BeginOffset']
            endOffSet = entity['EndOffset']
            entityId = entity['Id']
            subchinld = []
            for e in entities_data:
                if e['BeginOffset'] == beginOffSet and e['EndOffset'] == endOffSet and e['Id'] == entityId:
                    continue
                if e['BeginOffset'] >= beginOffSet and e['EndOffset'] <= endOffSet:
                    # print(e)
                    subchinld.append(e)
                    removed_ids.append(e['Id'])
            if len(subchinld) > 0 and entity['Id'] not in removed_ids:
                node = entity
                node['SubChild'] = subchinld
                
                result.append(node)
                removed_ids.append(entity['Id'])
            
        for entity in entities_data:
            if entity['Id'] not in removed_ids:
                result.append(entity)
        
        # ids = []        
        # for item in result:
        #     if item['Id'] not in ids:
        #         ids.append(item['Id'])
            
        # afterdupt = []
        # for id in ids:
        #     for item in in result:
        #         if item['Id'] == id:
        #             afterdupt.append(item)
        
        
        
                
                
        # print(json.dumps(afterdupt))
        d[hashcode][path_name][0]['comprehendMedical']['Entities']['Entities'] = result
    return d


def load_json_data(bucket, key):
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    data = json.loads(obj['Body'].read())
    # print(data)
    for sub in data:
        if sub == 'filepath':
            continue

        # data_p = using_new_format_for_label_edit(data, sub)
        data_aws = generate_label_by_start_end(data, sub)
        print("add label:")
        print(data_aws)
        data_aws_med = processMedDRA(data_aws, sub)
        new_format_data = format_entities(data_aws_med, sub)
        update_json(bucket, key, new_format_data)
        break


def lambda_handler(event, context):
    # return testMe()
    

    bucket = 'ucp-filebucket-dev'
    # key = 'iso-service-dev/input/data/WWQC-POL-6.3 Test Method Validation v7.pdf.json'
    load_json_data(event['bucket'], event['key'])
    return {
        'statusCode': 200,
        'body': json.dumps('Finished!')
    }

def testMe():
    # testJson = 'test.1.json'
    testJson = 'test.json'
    with open(testJson) as f:
        data = json.loads(f.read())
        #print(data)
        
        result = getNodeResult('ICD-10-CM', data['Text'], data['Entities'])
        #print(result)
        return result

if __name__ == '__main__':
    with open('Clinical Pharmacology Protocol 887663.pdf.json') as f:
        data = json.loads(f.read())
        print(data)
        for sub in data:
            if sub == 'filepath':
                continue

            # data_p = using_new_format_for_label_edit(data, sub)
            # data_aws = using_new_format_for_label_edit_aws(data, sub)
            data_aws = generate_label_by_start_end(data, sub)
            print(data_aws)

