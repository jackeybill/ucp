import json
import re
import boto3
from operator import itemgetter

s3_client = boto3.client('s3')

def using_new_format_for_label_edit(data, hashcode):
    """
    For front-end new tab show labels and edit the label
    params:
        data: after process json
        hashcode: generate's hashcode the root key
    """
    body = data[hashcode]
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary','objectivesEndpointsEstimands']
    
    for path_name in path_names:
        if len(body[path_name]) == 0:
            continue
        content = body[path_name][0]['content']
        contents = str(content).split(' ')
        names = []
        for nn in body[path_name][0]['comprehendMedical']:
            if nn != 'Base':
                names.append(nn)
        # ['Bc5cdr', 'Bionlp13cg', 'Craft', 'Jnlpba', 'Mosaic-ner']
        for name in names:
            value = body[path_name][0]['comprehendMedical'][name]
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
                        i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': j,'score': l['Score'], 'children': []}
                    nlp_result.append(i)
                else:
                    i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': l['Text'], 'score': l['Score'], 'children': []}
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
            data[hashcode][path_name][0]['comprehendMedical'][name]['label'] = all_result
        # print(data)
    return data

def using_new_format_for_label_edit_aws(data, hashcode):
    """
    For front-end new tab show labels and edit the label
    params:
        data: after process json
        hashcode: generate's hashcode the root key
    """
    body = data[hashcode]
    # path_names = ['includeAllText', 'inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary']
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary','objectivesEndpointsEstimands']
    
    for path_name in path_names:
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
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
                        i = {'id': 'm-' + str(nindex), 'type': 'mark', 'category': l['Category'], 'text': j, 'score': l['Score'], 'children': []}
                        if name == 'ICD-10-CM' and 'ICD10CMConcepts' in l:
                            if len(l['ICD10CMConcepts']) >=3:
                                rows = l['ICD10CMConcepts']
                                rows_by_fname = sorted(rows, key=itemgetter('Score'))
                                i['Concepts'] = rows_by_fname[:1]
                            else:
                                i['Concepts'] = l['ICD10CMConcepts']
                        nlp_result.append(i)
                        nindex += 1
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
                    
            data[hashcode][path_name][0]['comprehendMedical'][name]['label'] = all_result
    
    return data
    

def update_json(bucket, key, body):
    response = s3_client.put_object(Bucket=bucket, Key=key, Body=json.dumps(body))


def load_json_data(bucket, key):
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    data = json.loads(obj['Body'].read())
    print(data)
    for sub in data:
        if sub == 'filepath':
            continue
    
        data_p = using_new_format_for_label_edit(data, sub)
        data_aws = using_new_format_for_label_edit_aws(data_p, sub)
        
        update_json(bucket, key, data_aws)
    
    
def lambda_handler(event, context):
    print("event: {}".format(event))
    #bucket= 'iso-data-zone'
    # key = 'iso-service-dev/input/data/WWQC-POL-6.3 Test Method Validation v7.pdf.json'
    load_json_data(event['bucket'], event['key'])
    return {
        'statusCode': 200,
        'body': json.dumps('Finished!')
    }
