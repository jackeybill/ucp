import json
import re
import boto3
import copy
from operator import itemgetter

s3_client = boto3.client('s3')
runtime = boto3.client('runtime.sagemaker')
ieMapping = {}
omopMapping = {}


OMOP_SNOMED = '1_snomed_term'

def generate_label_empty_entities(content):
    all_words = str(content.strip()).split(' ')
    index = 0
    nnode_result = []
    for item in all_words:
        node_item = {'type': 'span', 'id': index, 'text': item}
        nnode_result.append(node_item)
        index += 1
    return nnode_result


def generate_label_by_start_end(data, hashcode):
    result = copy.copy(data)
    body = data[hashcode]
    # path_names = ['includeAllText', 'inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary','objectivesEndpointsEstimands']
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    for path_name in path_names:
        if len(body[path_name]) == 0:
            continue
        
        if 'otherTable' in body[path_name][0]:
            for row in body[path_name][0]['tableResult']:
                for column in row:
                    content = column['content']
                    for name in ['ICD-10-CM', 'RxNorm', 'Entities']:
                        # print(name)
                        
                        if name not in column['comprehendMedical']:
                            column['comprehendMedical'][name]['Entities'] = []
                            column['comprehendMedical'][name]['Summary'] = {}
                        
                        if name not in column['comprehendMedical'] or 'Entities' not in \
                                column['comprehendMedical'][name] or len(
                                column['comprehendMedical'][name]['Entities']) == 0:
                            column['comprehendMedical'][name]['label'] = generate_label_empty_entities(content)
                            continue
                        model_entities = column['comprehendMedical'][name]['Entities']
                        model_entities = process_entity(column['comprehendMedical'][name]['Entities'])
                        nnode_result = getNodeResult(name, content, model_entities)
                        column['comprehendMedical'][name]['label'] = nnode_result
            
            for otherTable in body[path_name][0]['otherTableResult']:
                for row in otherTable:
                    for column in row:
                        content = column['content']
                        for name in ['ICD-10-CM', 'RxNorm', 'Entities']:
                            
                            if name not in column['comprehendMedical']:
                                column['comprehendMedical'][name]['Entities'] = []
                                column['comprehendMedical'][name]['Summary'] = {}
                            
                            # print(name)
                            if name not in column['comprehendMedical'] or 'Entities' not in \
                                    column['comprehendMedical'][name] or len(
                                    column['comprehendMedical'][name]['Entities']) == 0:
                                column['comprehendMedical'][name]['label'] = generate_label_empty_entities(content)
                                continue
                            model_entities = column['comprehendMedical'][name]['Entities']
                            model_entities = process_entity(column['comprehendMedical'][name]['Entities'])
                            nnode_result = getNodeResult(name, content, model_entities)
                            column['comprehendMedical'][name]['label'] = nnode_result
            continue
            
        content_stand = body[path_name][0]['content']
        if not content_stand or len(content_stand) < 1:
            continue
        
        # content = content_stand.replace('\n',' \n ')
        content = content_stand
        

        for name in ['ICD-10-CM', 'RxNorm', 'Entities']:
            # print(name)
            
            if name in body[path_name][0]['comprehendMedical'] and 'Entities' in \
                    body[path_name][0]['comprehendMedical'][name] and len(
                    body[path_name][0]['comprehendMedical'][name]['Entities']) == 0:
                
                print(f'Empty aws result and generate empty lable, {path_name} - {name}')
                # print(body[path_name][0]['comprehendMedical'][name])
                result[hashcode][path_name][0]['comprehendMedical'][name]['label'] = generate_label_empty_entities(content)
                continue
            
            if name not in body[path_name][0]['comprehendMedical'] or 'Entities' not in \
                    body[path_name][0]['comprehendMedical'][name] or len(
                    body[path_name][0]['comprehendMedical'][name]['Entities']) == 0:
                # print(f'Empty aws result , {name}')
                continue

            model_entities = body[path_name][0]['comprehendMedical'][name]['Entities']
            model_entities = process_entity(body[path_name][0]['comprehendMedical'][name]['Entities'])
            
            nnode_result = getNodeResult(name, content, model_entities)
            # result[hashcode][path_name][0]['comprehendMedical'][name]['label'] = node_result
            result[hashcode][path_name][0]['comprehendMedical'][name]['label'] = nnode_result
            
            # result[hashcode][path_name][0]['content'] = content
    
    return result

    
def process_entity(items):
    startOffsetList = []
    startOffsetListWithoutId = []
    endOffsetList = []
    endOffsetListWithoutId = []
    excludeIndexs = []
    id = 0
    excludeIndexs = []
    sameWordIndex = []
    #     items = json.loads(entity_str)['Entities']
    for item in items:
        # print(item)
        if id in sameWordIndex:
            continue
        sameItemIndex = []
        subitemIndex = 0
       
        # filter word in words
        for subitem in items:
            if item['BeginOffset'] == subitem['BeginOffset'] and item['EndOffset'] == subitem['EndOffset']:
                if item['Category'] == subitem['Category']:
                    subitemIndex += 1
                    continue
                else:
                    sameItemIndex.append(id)
                    sameItemIndex.append(subitemIndex)
                    
            if item['BeginOffset'] > subitem['BeginOffset'] and item['EndOffset'] <= subitem['EndOffset']:
                excludeIndexs.append(id)
            subitemIndex += 1
        if len(sameItemIndex) > 0:
            sameWordIndex.append(sameItemIndex)
        
        startOffsetItem = {'Id': item['Id'], 'BeginOffset': item['BeginOffset']}
        startOffsetList.append(startOffsetItem)
        startOffsetListWithoutId.append(item['BeginOffset'])
        endOffsetItem = {'Id': item['Id'], 'EndOffset': item['EndOffset']}
        endOffsetList.append(endOffsetItem)
        endOffsetListWithoutId.append(item['EndOffset'])
        id += 1

    if len(startOffsetListWithoutId) == len(set(startOffsetListWithoutId)):
        if len(excludeIndexs) > 0:
             for i in excludeIndexs:
                 list(items).pop(i)        
        return items
    else:
        removedOffsetIndex = []
        index = 0
        for item in startOffsetListWithoutId:
            if startOffsetListWithoutId.count(item) > 1:
                sIndex = startOffsetListWithoutId.index(item)
                sameStartOffsetIndexList = [sIndex]
                for i in range(1, startOffsetListWithoutId.count(item)):
                    sIndex = startOffsetListWithoutId.index(item, sIndex + 1)
                    sameStartOffsetIndexList.append(sIndex)

                maxEndOffsetItem = 0
                # removedOffsetIndex = sameStartOffsetIndexList
                keepIndex = 0
                for i in sameStartOffsetIndexList:
                    if maxEndOffsetItem == 0:
                        maxEndOffsetItem = endOffsetListWithoutId[i]
                    else:
                        if endOffsetListWithoutId[i] > maxEndOffsetItem:
                            keepIndex = i
                            maxEndOffsetItem = endOffsetListWithoutId[i]
                        else:
                            # maxEndOffsetItem = endOffsetListWithoutId[i]
                            continue
                # print(maxEndOffsetItem)
                # print(keepIndex)
                for ite in sameStartOffsetIndexList:
                    if keepIndex != ite:
                        removedOffsetIndex.append(ite)
                # removedOffsetIndex.extend(sameStartOffsetIndexList.remove(keepIndex))
                # removedOffsetIndex
                # print(removedOffsetIndex)
                # print('xxxx')
                # if len(sameStartOffsetIndexList) > 0 and keepIndex > 0:
                #     removedOffsetIndex = removedOffsetIndex + sameStartOffsetIndexList.remove(keepIndex)
                # print(removedOffsetIndex)
        # print(removedOffsetIndex)
        
        if len(excludeIndexs) > 0:
            removedOffsetIndex += excludeIndexs
            
        for i in sameWordIndex:
            i.sort()
            t = i
            if list(t)[0] in removedOffsetIndex:
                removedOffsetIndex.remove(list(t)[0])
            
        result = []
        indd = 0
        for j in items:
            if indd not in set(removedOffsetIndex):
                result.append(j)
            indd += 1

        # print(items)
        return result


def getNodeResult(name, content, model_entities):
    skip_ids = []
    exclude_ids = []
    node_result = []
    for model_entity in model_entities:
        # filter out the Category='TIME_EXPRESSION' in 'ICD-10-CM'
        if name == 'ICD-10-CM' and model_entity['Category'] == 'TIME_EXPRESSION':
            continue
        # filter out Category='PROTECTED_HEALTH_INFORMATION' and Type='AGE'
        # if model_entity['Type'] == 'AGE': # and model_entity['Category'] == 'PROTECTED_HEALTH_INFORMATION':
            # iBeginOffset = int(model_entity['BeginOffset'])
            # prefixStr = str(content)[iBeginOffset - 2: iBeginOffset-1].strip()
            # print('prefixStr:', prefixStr)
            # if prefixStr == '[':
            #     continue
            # continue


        if 'Attributes' in model_entity and len(model_entity['Attributes']) > 0:
            attributes = model_entity['Attributes']
            # "Type": "TEST_VALUE",
            # "BeginOffset": 4364,
            # "EndOffset": 4367,
            # "Text": "<80",
            # "Category": "TEST_TREATMENT_PROCEDURE",
            sameIndex = 0
            maxIndex = 0
            attributes_new = []
            lastAttrEndOffset = 0
            if len(attributes) > 2:
                for attr in attributes:
                    attrBeginOffset = int(attr['BeginOffset'])
                    attrEndOffset = int(attr['EndOffset'])

                    if lastAttrEndOffset == attrBeginOffset: #or lastAttrEndOffset == attrBeginOffset - 1:
                        item = attributes_new[-1]
                        item['EndOffset'] = attrEndOffset
                        item['Text'] = item['Text'] + attr['Text']
                    else:
                        attributes_new.append(attr)

                    lastAttrEndOffset = attrEndOffset
            else:
                attributes_new = attributes
            
            for attr in attributes_new:
            # for attr in attributes:
                # if attr['Type'] == 'TEST_VALUE' or attr['Type'] == 'TEST_UNIT':
                attrChildrens = []
                # attrBeginOffsetRaw = int(attr['BeginOffset'])
                # attrEndOffsetRaw = int(attr['EndOffset'])
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
                # attrStartIndex = len(attrStartWords.strip().split(' '))
                attrStartIndex = len(attrStartWords.split(' ')) - 1
                attrStartIndexInit = attrStartIndex
                if attrStartIndexInit == sameIndex:
                    attrStartIndex = attrStartIndex + 1
                attrWord = str(content)[attrBeginOffset: attrEndOffset]
                if attrText.strip() in attrWord.strip():
                    if '/' + attrText.strip() == attrWord:
                        attrText = attrWord
                    for words in str(attrText).split(' '):
                        if attrStartIndexInit > attrStartIndex:
                            attrStartIndexInit = attrStartIndex
                        # print(all_words_content[started_index])
                        if maxIndex > attrStartIndex:
                            attrStartIndex = maxIndex
                        attrChildrens.append({'type': 'span', 'id': attrStartIndex, 'text': str(words).strip()})
                        skip_ids.append(attrStartIndex)
                        attrStartIndex += 1
                        
                    maxIndex = attrStartIndex
                    if attrStartIndexInit == sameIndex:
                        marked_item = node_result[-1]
                        marked_item['children'].extend(attrChildrens)
                    else:
                        if 'Category' not in attr:
                            attr['Category'] = model_entity['Category']
                            
                        category = attr['Category']
                        if  attr['Category'] in ['TEST_TREATMENT_PROCEDURE', 'TIME_EXPRESSION']:
                            category = attr['Type']
                        
                        marked_item = {'id': 'm-' + str(attrStartIndexInit), 'type': 'mark',
                                       'category': category,
                                       'text': attr['Text'], "score": dict(attr).get('Score'),
                                       'children': attrChildrens}
                        if sameIndex == 0:
                            sameIndex = attrStartIndexInit

                        node_result.append(marked_item)
                
                else:
                    print(f'{attrWord} not match attribute value {attrText}')
        #print(model_entity)
        beginOffset = int(model_entity['BeginOffset'])
        endOffset = int(model_entity['EndOffset'])
        
        # if str(content)[endOffset: endOffset + 1] != ' ':
        #     endOffset = endOffset + 1
        while len(str(content)[endOffset: endOffset + 1].strip()) > 0:
        # while str(content)[endOffset: endOffset + 1] != ' ' 
        #         or str(content)[endOffset: endOffset + 1].strip() != '' 
        #         or str(content)[endOffset: endOffset + 1].strip() != None:
            endOffset = endOffset + 1
            # print('!!!!!!------')
            # print('word：1'+ str(content)[endOffset: endOffset + 1] + '1')
            # print(endOffset)
            

        while len(str(content)[beginOffset - 1: beginOffset].strip()) > 0:
            beginOffset = beginOffset - 1

        beforeStr = str(content)[:beginOffset]
        beforeStrs = beforeStr.split(' ')

        start_index = len(beforeStrs) - 1

        entity_word = str(content)[beginOffset: endOffset]
        # print(entity_word)
        entity_words = entity_word.split(' ')
        # print(len(entity_words))
        started_index = start_index
        childrens = []

        for words in entity_words:
            if start_index > started_index:
                start_index = started_index
            childrens.append({'type': 'span', 'id': started_index, 'text': words})
            skip_ids.append(started_index)
            started_index += 1

            
        category = model_entity['Category']
        if  model_entity['Category'] in ['TEST_TREATMENT_PROCEDURE', 'TIME_EXPRESSION']:
            category = model_entity['Type']
        
        marked_item = {'id': 'm-' + str(start_index), 'type': 'mark', 'category': category,
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
    # print(name + ' label: ')
    # print(node_result)
    
    temp_result = node_result
    # print('^^^^^^^^^^^^^')
    # print(node_result)
    # print('^^^^^^^^^^^^^')
    rep_index = []
    ii = 0
    for ir in node_result:
        id = ir['id']
        for irr in node_result:
            if id == irr['id']:
                continue
            for cirr in irr['children']: 
                if str(id) == ('m-' + str(cirr['id'])):
                    # print('get the item in child' + str(id))
                    rep_index.append(ii)
                    
        ii +=1
        
    node_result_ = []

    iin = 0
    for i in node_result:
        if iin not in rep_index:
            node_result_.append(i)
        iin +=1
    
    node_result = node_result_
    
    all_words = str(content.strip()).split(' ')
    # print(all_words)
    index = 0
    nnode_result = []
    for item in all_words:
        if index in skip_ids:
            # print(index)
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
        #############################################################
        if 'otherTable' in body[path_name][0]:
            for row in body[path_name][0]['tableResult']:
                for column in row:
                    if 'ICD-10-CM' not in column['comprehendMedical']:
                        continue
                    
                    # if 'Entities' not in column['comprehendMedical']['ICD-10-CM'] or len(column['comprehendMedical']['ICD-10-CM']['Entities']) == 0:
                    #     medDRA = {'Entities' : [], 'Summary': {}}
                    #     column['comprehendMedical']['MedDRA'] = medDRA
                    #     continue

                    medDRA=copy.deepcopy(column['comprehendMedical']['ICD-10-CM'])
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
                    column['comprehendMedical']['MedDRA'] = medDRA
            for otherTable in body[path_name][0]['otherTableResult']:
                for row in otherTable:
                    for column in row:
                        if 'ICD-10-CM' not in column['comprehendMedical']:
                            continue
                        
                        # if 'Entities' not in column['comprehendMedical']['ICD-10-CM'] or len(column['comprehendMedical']['ICD-10-CM']['Entities']) == 0:
                        #     medDRA = {'Entities' : [], 'Summary': {}}
                        #     column['comprehendMedical']['MedDRA'] = medDRA
                        #     continue

                        medDRA=copy.deepcopy(column['comprehendMedical']['ICD-10-CM'])
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
                        column['comprehendMedical']['MedDRA'] = medDRA
            continue
        #######################################################################
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
    

def processOmop(data, hashcode):
    body = data[hashcode]
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    ENDPOINT_NAME='omop'
    for path_name in path_names:
        print(path_name)
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
        
        #############################################################
        if 'otherTable' in body[path_name][0]:
            for row in body[path_name][0]['tableResult']:
                for column in row:
                    
                    if 'Entities' not in column['comprehendMedical'] or 'Entities' not in column['comprehendMedical']['Entities'] or len(column['comprehendMedical']['Entities']['Entities']) == 0:
                        tagResult = {'Entities' : [], 'Summary': {}}
                        column['comprehendMedical']['Omop'] = tagResult
                        continue

                    cmEntities=copy.deepcopy(column['comprehendMedical']['Entities'])
                    # medDRA = body[path_name][0]['comprehendMedical']['ICD-10-CM']
                    label_datas = cmEntities['label']
                    label_datas_new = []
                    summary_count = 0
                    for label in label_datas:
                        if 'children' in label:
                            children_index = 0
                            concepts = []
                            # for item in label['children']:
                                
                            #     source_word = item['text']
                            #     payload = json.dumps({'term': source_word, 'model': 'omop'})
                            #     # print('omop source_word:' + payload)
                            #     try:
                            #         if not source_word in omopMapping:
                            #             response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                            #                                               ContentType='application/json',
                            #                                               Body=payload)
                            #             omopMapping[source_word] = json.loads(response['Body'].read().decode())
                            #             model_result = omopMapping[source_word]
                            #         else:
                            #             model_result = omopMapping[source_word]
                            #     except Exception as e:
                            #         print("omop model error")
                            #         continue
                                
                            #     if source_word in model_result[source_word] and '1_omop_term' in model_result[source_word][source_word]:
                            #         omop_term = model_result[source_word][source_word]['1_omop_term']
                            #         if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                            #             continue
                            #         concepts.append(omop_term)
                            #         label['children'][children_index]['term'] = omop_term
                            #         summary_count += 1
                            #     children_index += 1
                                
                            # label['Concepts'] = [{'Description': x} for x in concepts]
                            source_word = ' '.join([x['text'] for x in label['children']])
                            payload = json.dumps({'term': source_word, 'model': 'omop'})
                            try:
                                if not source_word in omopMapping:
                                    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                                       ContentType='application/json',
                                                                       Body=payload)
                                    omopMapping[source_word] = json.loads(response['Body'].read().decode())
                                    model_result = omopMapping[source_word]
                                else:
                                    model_result = omopMapping[source_word]
                            except Exception as e:
                                print("omop model error")
                                continue
                            
                            if source_word in model_result[source_word] and '1_omop_term' in model_result[source_word][source_word]:
                                omop_term = model_result[source_word][source_word]['1_omop_term']
                                if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                                    continue
                                label['Concepts'] = [{'Description': omop_term}]
                        label_datas_new.append(label)
                    cmEntities['label'] = label_datas_new
                    column['comprehendMedical']['Omop'] = cmEntities
            for otherTable in body[path_name][0]['otherTableResult']:
                for row in otherTable:
                    for column in row:
                        if 'Entities' not in column['comprehendMedical']:
                            continue
                        
                        # if 'Entities' not in column['comprehendMedical']['Entities'] or len(column['comprehendMedical']['Entities']['Entities']) == 0:
                        #     tagResult = {'Entities' : [], 'Summary': {}}
                        #     column['comprehendMedical']['Omop'] = tagResult
                        #     continue

                        cmEntities=copy.deepcopy(column['comprehendMedical']['Entities'])
                        # medDRA = body[path_name][0]['comprehendMedical']['ICD-10-CM']
                        label_datas = cmEntities['label']
                        label_datas_new = []
                        summary_count = 0
                        for label in label_datas:
                            
                            if 'children' in label:
                                children_index = 0
                                concepts = []
                                # for item in label['children']:
                                #     source_word = item['text']
                                #     payload = json.dumps({'term': source_word, 'model': 'omop'})
                                #     try:
                                #         if not source_word in omopMapping:
                                #             response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                #                                               ContentType='application/json',
                                #                                               Body=payload)
                                #             omopMapping[source_word] = json.loads(response['Body'].read().decode())
                                #             model_result = omopMapping[source_word]
                                #         else:
                                #             model_result = omopMapping[source_word]
                                #     except Exception as e:
                                #         print("omop model error")
                                #         continue
                                #     # mosaic_result = json.loads(response['Body'].read().decode())
                                #     # mosaic_result['results'][0]['preds'][0]['SOC'] = mosaic_result['results'][0]['preds'][0]['BS']
                                #     # del mosaic_result['results'][0]['preds'][0]['BS']
                                #     # label['Concepts'] = mosaic_result['results'][0]['preds']
                                #     # label['category'] = 'ADVERSE_EVENT'
                                #     # summary_count += 1
                                    
                                #     if source_word in model_result[source_word] and '1_omop_term' in model_result[source_word][source_word]:
                                #         omop_term = model_result[source_word][source_word]['1_omop_term']
                                #         if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                                #             continue
                                #         concepts.append(omop_term)
                                #         label['children'][children_index]['term'] = omop_term
                                #         # print('' + json.dumps(label))
                                #         summary_count += 1
                                #     children_index += 1
                                # label['Concepts'] = [{'Description': x} for x in concepts]
                                
                                source_word = ' '.join([x['text'] for x in label['children']])
                                payload = json.dumps({'term': source_word, 'model': 'omop'})
                                try:
                                    if not source_word in omopMapping:
                                        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                                           ContentType='application/json',
                                                                           Body=payload)
                                        omopMapping[source_word] = json.loads(response['Body'].read().decode())
                                        model_result = omopMapping[source_word]
                                    else:
                                        model_result = omopMapping[source_word]
                                except Exception as e:
                                    print("omop model error")
                                    continue
                                
                                if source_word in model_result[source_word] and '1_omop_term' in model_result[source_word][source_word]:
                                    omop_term = model_result[source_word][source_word]['1_omop_term']
                                    if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                                        continue
                                    label['Concepts'] = [{'Description': omop_term}]
                                
                            label_datas_new.append(label)
                        cmEntities['label'] = label_datas_new
                        column['comprehendMedical']['Omop'] = cmEntities
            continue
        #######################################################################
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']:
            continue
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']['Entities'] or len(body[path_name][0]['comprehendMedical']['Entities']['Entities']) == 0:
            omop = {'Entities' : [], 'Summary': {}}
            data[hashcode][path_name][0]['comprehendMedical']['Omop'] = omop
            continue

        omop=copy.deepcopy(body[path_name][0]['comprehendMedical']['Entities'])

        label_datas = omop['label']
        label_datas_new = []
        summary_count = 0
        for label in label_datas:
            if 'children' in label:
                source_word = ' '.join([x['text'] for x in label['children']])
                payload = json.dumps({'term': source_word, 'model': 'omop'})
                try:
                    if not source_word in omopMapping:
                        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                           ContentType='application/json',
                                                           Body=payload)
                        omopMapping[source_word] = json.loads(response['Body'].read().decode())
                        model_result = omopMapping[source_word]
                    else:
                        model_result = omopMapping[source_word]
                        
                    if source_word in model_result[source_word] and '1_omop_term' in model_result[source_word][source_word]:
                        omop_term = model_result[source_word][source_word]['1_omop_term']
                        if str(omop_term) == 'nan' or str(omop_term).lower() == 'nan' or len(str(omop_term).strip()) == 0:
                            label_datas_new.append(label)
                            continue
                        label['Concepts'] = [{'Description': omop_term}]
                        # print(source_word + ' omop result:' + omop_term)
                        # print(label)
                except Exception as e:
                    print("omop model error")
                    continue

            label_datas_new.append(label)
            
        omop['label'] = label_datas_new
        data[hashcode][path_name][0]['comprehendMedical']['Omop'] = omop
    return data
    
    
def callOmop(source_word):
    """
    Call Omop model to get result
    """
    ENDPOINT_NAME = 'omop'
    payload = json.dumps({'term': source_word, 'model': 'omop'})
    try:
        if not source_word in omopMapping:
            response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                               ContentType='application/json',
                                               Body=payload)
            omopMapping[source_word] = json.loads(response['Body'].read().decode())
            model_result = omopMapping[source_word]
        else:
            model_result = omopMapping[source_word]
    except Exception as e:
        print("omop model error")
        return '',''
    # model_result = json.loads(response['Body'].read().decode())
    omop_term = ''
    snomed_term = ''
    if source_word in model_result[source_word] and '1_omop_term' in model_result[source_word][source_word]:
        omop_term = model_result[source_word][source_word]['1_omop_term']
        
    if source_word in model_result[source_word] and '1_snomed_term' in model_result[source_word][source_word]:
        snomed_term = model_result[source_word][source_word]['1_snomed_term']
    
    if str(omop_term) == 'nan':
        omop_term = ''
    if str(snomed_term) == 'nan':
        snomed_term = ''
    return omop_term, snomed_term
    

def proessOmopEntities(entities):
    """
    Update AWS Entities set omopTerm and snomedTerm value
    """
    if len(entities) > 0:
        for entity in entities:
            # print(entity)
            # if entity[''] in ['MEDICAL_CONDITION','MEDICATION','TEST_TREATMENT_PROCEDURE']:
            omop_term, snomed_term = callOmop(entity['Text'])
            entity['omopTerm'] = omop_term
            entity['snomedTerm'] = snomed_term
            ieMapping[entity['Text']] = {
                'omopTerm' : omop_term,
                'snomedTerm' : snomed_term
            }
    return entities
    
    
def processSnomed(data, hashcode):
    body = data[hashcode]
    path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'scheduleActivities', 'briefSummary',
                  'objectivesEndpointsEstimands']

    ENDPOINT_NAME='omop'
    for path_name in path_names:
        # InclusionCriteria
        if len(body[path_name]) == 0:
            continue
        
        #############################################################
        if 'otherTable' in body[path_name][0]:
            for row in body[path_name][0]['tableResult']:
                for column in row:
                    if 'Entities' not in column['comprehendMedical']:
                        continue
                    
                    # if 'Entities' not in column['comprehendMedical']['Entities'] or len(column['comprehendMedical']['Entities']['Entities']) == 0:
                    #     tagResult = {'Entities' : [], 'Summary': {}}
                    #     column['comprehendMedical']['Snomed'] = tagResult
                    #     continue

                    cmEntities=copy.deepcopy(column['comprehendMedical']['Entities'])
                    # medDRA = body[path_name][0]['comprehendMedical']['ICD-10-CM']
                    label_datas = cmEntities['label']
                    label_datas_new = []
                    summary_count = 0
                    for label in label_datas:
                        if 'children' in label:
                            children_index = 0
                            concepts = []
                            for item in label['children']:
                                
                                source_word = item['text']
                                payload = json.dumps({'term': source_word, 'model': 'omop'})
                                try:
                                    if not source_word in omopMapping:
                                        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                                           ContentType='application/json',
                                                                           Body=payload)
                                        omopMapping[source_word] = json.loads(response['Body'].read().decode())
                                        model_result = omopMapping[source_word]
                                    else:
                                        model_result = omopMapping[source_word]
                                except Exception as e:
                                    print("omop model error")
                                    continue
                                # print('omop source_word:' + payload)
                                # model_result = json.loads(response['Body'].read().decode())
                                # print('model_result: '+ json.dumps(model_result))
                                if source_word in model_result[source_word] and OMOP_SNOMED in model_result[source_word][source_word]:
                                    omop_term = model_result[source_word][source_word][OMOP_SNOMED]
                                    if str(omop_term) == 'nan':
                                        continue
                                    # concepts.append({'Description': omop_term})
                                    concepts.append(omop_term)
                                    label['children'][children_index]['term'] = omop_term
                                    
                                children_index += 1
                                
                            label['Concepts'] = [{'Description': x} for x in concepts]
                            
                        label_datas_new.append(label)
                    cmEntities['label'] = label_datas_new
                    # cmEntities['Summary'] = {"ADVERSE_EVENT": summary_count}
                    # entities = []
                    # for entity in cmEntities['Entities']:
                    #     entity['Category'] = 'ADVERSE_EVENT'
                    #     entities.append(entity)
                    # cmEntities['Entities'] = entities
                    column['comprehendMedical']['Snomed'] = cmEntities
            for otherTable in body[path_name][0]['otherTableResult']:
                for row in otherTable:
                    for column in row:
                        if 'Entities' not in column['comprehendMedical']:
                            continue
                        
                        # if 'Entities' not in column['comprehendMedical']['Entities'] or len(column['comprehendMedical']['Entities']['Entities']) == 0:
                        #     tagResult = {'Entities' : [], 'Summary': {}}
                        #     column['comprehendMedical']['Snomed'] = tagResult
                        #     continue

                        cmEntities=copy.deepcopy(column['comprehendMedical']['Entities'])
                        # medDRA = body[path_name][0]['comprehendMedical']['ICD-10-CM']
                        label_datas = cmEntities['label']
                        label_datas_new = []
                        summary_count = 0
                        for label in label_datas:
                            
                            if 'children' in label:
                                children_index = 0
                                concepts = []
                                # for item in label['children']:
                                    
                                #     source_word = item['text']
                                #     payload = json.dumps({'term': source_word, 'model': 'omop'})
                                #     try:
                                #         if not source_word in omopMapping:
                                #             response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                #                                               ContentType='application/json',
                                #                                               Body=payload)
                                #             omopMapping[source_word] = json.loads(response['Body'].read().decode())
                                #             model_result = omopMapping[source_word]
                                #         else:
                                #             model_result = omopMapping[source_word]
                                #     except Exception as e:
                                #         print("omop model error")
                                #         continue
                                #     # print('omop source_word:' + payload)
                                #     # model_result = json.loads(response['Body'].read().decode())
                                #     # print('model_result: '+ json.dumps(model_result))
                                #     if source_word in model_result[source_word] and '1_snomed_term' in model_result[source_word][source_word]:
                                #         omop_term = model_result[source_word][source_word]['1_snomed_term']
                                #         if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                                #             continue
                                #         concepts.append(omop_term)
                                #         label['children'][children_index]['term'] = omop_term
                                        
                                #     children_index += 1
                                
                                # label['Concepts'] = [{'Description': x} for x in concepts]
                                
                                source_word = ' '.join([x['text'] for x in label['children']])
                                payload = json.dumps({'term': source_word, 'model': 'omop'})
                                try:
                                    if not source_word in omopMapping:
                                        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                                           ContentType='application/json',
                                                                           Body=payload)
                                        omopMapping[source_word] = json.loads(response['Body'].read().decode())
                                        model_result = omopMapping[source_word]
                                    else:
                                        model_result = omopMapping[source_word]
                                except Exception as e:
                                    print("omop model error")
                                    continue
                                
                                if source_word in model_result[source_word] and '1_snomed_term' in model_result[source_word][source_word]:
                                    omop_term = model_result[source_word][source_word]['1_snomed_term']
                                    if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                                        label_datas_new.append(label)
                                        continue
                                    label['Concepts'] = [{'Description': omop_term}]
                            label_datas_new.append(label)
                            
                        cmEntities['label'] = label_datas_new
                        # cmEntities['Summary'] = {"ADVERSE_EVENT": summary_count}
                        # entities = []
                        # for entity in cmEntities['Entities']:
                        #     entity['Category'] = 'ADVERSE_EVENT'
                        #     entities.append(entity)
                        # cmEntities['Entities'] = entities
                        column['comprehendMedical']['Snomed'] = cmEntities
            continue
        #######################################################################
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']:
            continue
        
        if 'Entities' not in body[path_name][0]['comprehendMedical']['Entities'] or len(body[path_name][0]['comprehendMedical']['Entities']['Entities']) == 0:
            snomed = {'Entities' : [], 'Summary': {}}
            data[hashcode][path_name][0]['comprehendMedical']['Snomed'] = snomed
            continue

        omop=copy.deepcopy(body[path_name][0]['comprehendMedical']['Entities'])
        
        label_datas = omop['label']
        label_datas_new = []
        summary_count = 0
        for label in label_datas:
            if 'children' in label:
                children_index = 0
                concepts = []
                
                # for item in label['children']:
                #     source_word = item['text']
                #     payload = json.dumps({'term': source_word, 'model': 'omop'})
                #     try:
                #         if not source_word in omopMapping:
                #             response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                #                                               ContentType='application/json',
                #                                               Body=payload)
                #             omopMapping[source_word] = json.loads(response['Body'].read().decode())
                #             model_result = omopMapping[source_word]
                #         else:
                #             model_result = omopMapping[source_word]
                #     except Exception as e:
                #         print("omop model error")
                #         continue
                #     if source_word in model_result[source_word] and '1_snomed_term' in model_result[source_word][source_word]:
                #         omop_term = model_result[source_word][source_word]['1_snomed_term']
                #         if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                #             continue
                #         concepts.append(omop_term)
                #         # concepts.append({'Description': omop_term})
                #         label['children'][children_index]['term'] = omop_term
                    
                #     children_index += 1
                # label['Concepts'] = [{'Description': x, 'Score' : 1.00, 'Code': ''} for x in concepts]
                
                source_word = ' '.join([x['text'] for x in label['children']])
                payload = json.dumps({'term': source_word, 'model': 'omop'})
                try:
                    if not source_word in omopMapping:
                        response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                           ContentType='application/json',
                                                           Body=payload)
                        omopMapping[source_word] = json.loads(response['Body'].read().decode())
                        model_result = omopMapping[source_word]
                    else:
                        model_result = omopMapping[source_word]
                except Exception as e:
                    print("omop model error")
                    continue
                
                if source_word in model_result[source_word] and '1_snomed_term' in model_result[source_word][source_word]:
                    omop_term = model_result[source_word][source_word]['1_snomed_term']
                    if str(omop_term) == 'nan' or len(omop_term.strip()) == 0:
                        label_datas_new.append(label)
                        continue
                    label['Concepts'] = [{'Description': omop_term}]
            
            label_datas_new.append(label)
        
        
        omop['label'] = label_datas_new
        
        data[hashcode][path_name][0]['comprehendMedical']['Snomed'] = omop
        
        # Update comprehendMedical Entities Entities add omop result
        data[hashcode][path_name][0]['comprehendMedical']['Entities']['Entities'] = proessOmopEntities(body[path_name][0]['comprehendMedical']['Entities']['Entities'])
    return data


def update_json(bucket, key, body):
    # print('update_json')
    # print(body)
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
        
        ###################################
        if 'otherTable' in body[path_name][0]:
            for row in body[path_name][0]['tableResult']:
                for column in row:
                    if 'Entities' not in column['comprehendMedical']:
                        continue
                    
                    if 'Entities' not in column['comprehendMedical']['Entities'] or len(column['comprehendMedical']['Entities']['Entities']) == 0:
                        continue
                    entities_data = column['comprehendMedical']['Entities']['Entities']
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

                    subChildList = []
                    for item in result:
                        if 'SubChild' in item:
                            subChildList.extend(item['SubChild'])
                        if 'Attributes' in item:
                            for i in item['Attributes']:
                                for j in item['Attributes']:
                                    if i['BeginOffset'] == j['BeginOffset'] and i['EndOffset'] == j['EndOffset'] and i['Id'] == j['Id']:
                                        continue
                                    if i['BeginOffset'] >= j['BeginOffset'] and i['EndOffset'] <= j['EndOffset']:
                                        item['Attributes'].remove(j)
                            subChildList.extend(item['Attributes'])
            
                    for i in subChildList:
                        for item in result:
                            if item['BeginOffset'] > i['BeginOffset'] and item['EndOffset'] <= i['EndOffset']:
                                result.remove(item)
                            
                    for i in result:
                        for j in result:
                            if 'Attributes' in j:
                                for su in j['Attributes']:
                                    if su['BeginOffset'] >= i['BeginOffset'] and su['EndOffset'] <= i['EndOffset']:
                                        j['Attributes'].remove(su)
                    
                    for i in result:
                        for j in result:
                            if 'Attributes' in j:
                                for su in j['Attributes']:
                                    if i['BeginOffset'] >= su['BeginOffset'] and i['EndOffset'] < su['EndOffset']:
                                        result.remove(i)
                                    # if i['BeginOffset'] >= su['BeginOffset'] and i['EndOffset'] <= su['EndOffset']:
                                    #     result.remove(i)

                    column['comprehendMedical']['Entities']['Entities'] = result
            for otherTable in body[path_name][0]['otherTableResult']:
                for row in otherTable:
                    for column in row:
                        if 'Entities' not in column['comprehendMedical']:
                            continue
                        
                        if 'Entities' not in column['comprehendMedical']['Entities'] or len(column['comprehendMedical']['Entities']['Entities']) == 0:
                            continue
                        entities_data = column['comprehendMedical']['Entities']['Entities']
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
    
                        subChildList = []
                        for item in result:
                            if 'SubChild' in item:
                                subChildList.extend(item['SubChild'])
                            if 'Attributes' in item:
                                for i in item['Attributes']:
                                    for j in item['Attributes']:
                                        if i['BeginOffset'] == j['BeginOffset'] and i['EndOffset'] == j['EndOffset'] and i['Id'] == j['Id']:
                                            continue
                                        if i['BeginOffset'] >= j['BeginOffset'] and i['EndOffset'] <= j['EndOffset']:
                                            item['Attributes'].remove(j)
                                subChildList.extend(item['Attributes'])
                
                        for i in subChildList:
                            for item in result:
                                if item['BeginOffset'] > i['BeginOffset'] and item['EndOffset'] <= i['EndOffset']:
                                    result.remove(item)
                                
                        for i in result:
                            for j in result:
                                if 'Attributes' in j:
                                    for su in j['Attributes']:
                                        if su['BeginOffset'] >= i['BeginOffset'] and su['EndOffset'] <= i['EndOffset']:
                                            j['Attributes'].remove(su)
                        
                        for i in result:
                            for j in result:
                                if 'Attributes' in j:
                                    for su in j['Attributes']:
                                        if i['BeginOffset'] >= su['BeginOffset'] and i['EndOffset'] < su['EndOffset']:
                                            result.remove(i)
                                        # if i['BeginOffset'] >= su['BeginOffset'] and i['EndOffset'] <= su['EndOffset']:
                                        #     result.remove(i)
    
                        column['comprehendMedical']['Entities']['Entities'] = result
            
            totalSummary = {}
            for row in body[path_name][0]['tableResult']:
                for column in row:
                    for itemKey in column['comprehendMedical']:
                        for summaryKey in column['comprehendMedical'][itemKey]['Summary']:
                            if not itemKey in totalSummary:
                                totalSummary[itemKey] = {}
                                totalSummary[itemKey][summaryKey] = column['comprehendMedical'][itemKey]['Summary'][summaryKey]
                            else:
                                if summaryKey in totalSummary[itemKey]:
                                    totalSummary[itemKey][summaryKey] =  totalSummary[itemKey][summaryKey] + column['comprehendMedical'][itemKey]['Summary'][summaryKey]
                                else:
                                    totalSummary[itemKey][summaryKey] =  column['comprehendMedical'][itemKey]['Summary'][summaryKey]
                        # for entity in column['comprehendMedical'][itemKey]['Entities']:
                        #     if 'SubChild' in entity:
                        #         for subChild in entity['SubChild']:
                        #             totalSummary[itemKey][subChild['Category']] = totalSummary[itemKey][subChild['Category']] - 1
        
                            

            for table in body[path_name][0]['otherTableResult']:
                for row in table:
                    for column in row:
                        for itemKey in column['comprehendMedical']:
                            for summaryKey in column['comprehendMedical'][itemKey]['Summary']:
                                if not itemKey in totalSummary:
                                    totalSummary[itemKey] = {}
                                    totalSummary[itemKey][summaryKey] = column['comprehendMedical'][itemKey]['Summary'][summaryKey]
                                else:
                                    if summaryKey in totalSummary[itemKey]:
                                        totalSummary[itemKey][summaryKey] =  totalSummary[itemKey][summaryKey] + column['comprehendMedical'][itemKey]['Summary'][summaryKey]
                                    else:
                                        totalSummary[itemKey][summaryKey] =  column['comprehendMedical'][itemKey]['Summary'][summaryKey]
                            # for entity in column['comprehendMedical'][itemKey]['Entities']:
                            #     if 'SubChild' in entity:
                            #         for subChild in entity['SubChild']:
                            #             totalSummary[itemKey][subChild['Category']] = totalSummary[itemKey][subChild['Category']] - 1

                    
            
            body[path_name][0]['totalSummary'] = totalSummary           
            continue
        ###################################
        
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
        
        
        subChildList = []
        for item in result:
            if 'SubChild' in item:
                subChildList.extend(item['SubChild'])
            if 'Attributes' in item:
                for i in item['Attributes']:
                    for j in item['Attributes']:
                        if i['BeginOffset'] == j['BeginOffset'] and i['EndOffset'] == j['EndOffset'] and i['Id'] == j['Id']:
                            continue
                        if i['BeginOffset'] >= j['BeginOffset'] and i['EndOffset'] <= j['EndOffset']:
                            item['Attributes'].remove(j)
                subChildList.extend(item['Attributes'])

        for i in subChildList:
            for item in result:
                if item['BeginOffset'] > i['BeginOffset'] and item['EndOffset'] <= i['EndOffset']:
                    result.remove(item)
            
                
        for i in result:
            for j in result:
                if 'Attributes' in j:
                    for su in j['Attributes']:
                        if su['BeginOffset'] >= i['BeginOffset'] and su['EndOffset'] <= i['EndOffset']:
                            j['Attributes'].remove(su)
        
        for i in result:
            for j in result:
                if 'Attributes' in j:
                    for su in j['Attributes']:
                        if i['BeginOffset'] >= su['BeginOffset'] and i['EndOffset'] < su['EndOffset']:
                            result.remove(i)
                        # if i['BeginOffset'] >= su['BeginOffset'] and i['EndOffset'] <= su['EndOffset']:
                        #     result.remove(i)
        
        # print(json.dumps(afterdupt))
        d[hashcode][path_name][0]['comprehendMedical']['Entities']['Entities'] = result
    return d

def updateIeSummary(nctId):
    ieSummaryObj = s3_client.get_object(Bucket='iso-data-zone', Key='iso-service-dev/summary/ieSummary.json')['Body']
    ieSummaryObj = json.loads(ieSummaryObj.read())
    for ie in ieSummaryObj:
        ieOfNct = ieSummaryObj[ie][nctId]
        for ieType in ieOfNct:
            for entity in ieOfNct[ieType]:
                if entity['rawText'] in ieMapping:
                    entity['snomedTerm'] = ieMapping[entity['rawText']]['snomedTerm']
                    entity['omopTerm'] = ieMapping[entity['rawText']]['snomedTerm']
    s3_client.put_object(Bucket='iso-data-zone', Key='iso-service-dev/summary/ieSummary.json', Body=json.dumps(ieSummaryObj))
        
    
def getNctId(key):
    import os
    file = os.path.split(key)[1]
    return file.split('.')[0]


def load_json_data(bucket, key):
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    data = json.loads(obj['Body'].read())
    # print(data)
    for sub in data:
        if sub == 'filepath':
            continue

        # data_p = using_new_format_for_label_edit(data, sub)
        data_aws = generate_label_by_start_end(data, sub)
        # print("add label:")
        # print(data_aws)
        data_aws_med = processMedDRA(data_aws, sub)
        data_aws_omop = processOmop(data_aws, sub)
        data_aws_snomed = processSnomed(data_aws_omop, sub)
        new_format_data = format_entities(data_aws_snomed, sub)
        update_json(bucket, key, new_format_data)
        updateIeSummary(getNctId(key))
        break


def lambda_handler(event, context):
    # return testMe()
    

    bucket = 'iso-data-zone'
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

# if __name__ == '__main__':
#     with open('Clinical Pharmacology Protocol 887663.pdf.json') as f:
#         data = json.loads(f.read())
#         # print(data)
#         for sub in data:
#             if sub == 'filepath':
#                 continue

#             # data_p = using_new_format_for_label_edit(data, sub)
#             data_aws = generate_label_by_start_end(data, sub)
#             # print(data_aws)

