import json
import base64
import boto3
import os
import re
from datetime import datetime
from urllib.parse import urlparse
from AwsUtils import AwsUtils
from time import gmtime, strftime
from ExtractUtils import ExtractUtils
import csv
from generate_text import convertToTxt

awsUtils:AwsUtils = AwsUtils()
# https://enable-cors.org/server_awsapigateway.html
# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/kendra.html#kendra.Client.query
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

DEFAULT_PAGE_SIZE = 25
bucketName = 'iso-data-zone'
s3_url_base = 'https://iso-data-zone.s3.us-east-2.amazonaws.com/'

lambda_client = boto3.client('lambda', region_name = 'us-east-2')
kendraClient = boto3.client('kendra', region_name='us-east-1')
s3_client = boto3.client('s3')


def convetDate(dateString):
    #return datetime.fromisoformat(dateString[:10])
    return datetime.fromtimestamp(float(dateString)/1000.)

def getResults(indexId, queryText, pageNumber, keyName, keyValue):
    print('indexId=', indexId)
    if keyName:
        if keyValue != '':
            response = kendraClient.query(
                IndexId=indexId,
                PageNumber=pageNumber,
                PageSize=DEFAULT_PAGE_SIZE,
                QueryText=queryText,
                AttributeFilter = {'AndAllFilters': 
                    [ 
                        {"EqualsTo": {"Key": keyName,"Value": {"StringValue": keyValue}}}
                    ]
                }
            )
        else:
            # {"queryText":"What is Avastin used for?","pageNumber":1,"keyName":"Drug_Name=PREMARIN,HEPARIN SODIUM&Medication_Form=TABLET;ORAL,INJECTABLE;INJECTION&Revision_Date=1559318400000,1594656000000","keyValue":""}
            # {'queryText': 'test', 'pageNumber': 1, 'keyName': 'Drug_Name=PREMARIN,HEPARIN SODIUM&Manufacturer=Gabapentin,PREMARIN', 'keyValue': ''}
            conditions = []
            #keyFilter = json.loads(keyName)
            for key in keyName.split('&'):
                if key != '':
                    arr = key.split('=')
                    print('arr=', arr)
                    if arr[0].endswith('_Date') or arr[0].endswith('_Time'):
                        # Revision_Date=1558318400000,1594656000000
                        arrStringValues = arr[1].split(',')
                        condition = {"GreaterThanOrEquals": {"Key": arr[0],"Value": {"DateValue": convetDate(arrStringValues[0])}}}
                        conditions.append(condition)
                        condition = {"LessThanOrEquals": {"Key": arr[0],"Value": {"DateValue": convetDate(arrStringValues[1])}}}
                        conditions.append(condition)
                    else:
                        orConditions = []
                        arrStringValues = arr[1].split(',')
                        for arrStr in arrStringValues:
                            condition = {"EqualsTo": {"Key": arr[0],"Value": {"StringValue": arrStr}}}
                            orConditions.append(condition)
                        conditions.append({"OrAllFilters":orConditions})
            print(conditions)
            #return
            response = kendraClient.query(
                IndexId=indexId,
                PageNumber=pageNumber,
                PageSize=DEFAULT_PAGE_SIZE,
                QueryText=queryText,
                AttributeFilter = {'AndAllFilters': conditions}
                #AttributeFilter = conditions[0]
            )
    else:
        response = kendraClient.query(
            IndexId=indexId,
            PageNumber=pageNumber,
            PageSize=DEFAULT_PAGE_SIZE,
            QueryText=queryText
        )
    #print(response)
    return json.loads(json.dumps(response, indent=4, sort_keys=True, default=str))
    #return {
    #    "statusCode": 200,
    #    "headers": {
    #        "QueryText": queryText
    #    },
    #    "body": json.dumps(response),
    #    "isBase64Encoded": False
    #};
def submitFeedback(indexId, queryId, resultId, relevanceValue):
    response = kendraClient.submit_feedback(
        IndexId=indexId,
        QueryId=queryId,
        ClickFeedbackItems=[
            {
                'ResultId': resultId,
                'ClickTime': datetime.now()
            },
        ],
        RelevanceFeedbackItems=[
            {
                'ResultId': resultId,
                'RelevanceValue': relevanceValue
            },
        ]
    )
    return response
    
def getFile(file):
    # https://hp5pe11vg7.execute-api.us-east-1.amazonaws.com/prod?file=iso-service-dev/RawDocuments/Clinical%20Pharmacology%20Protocol.docx_0901870c8033813c.pdf
    # "file=iso-service-dev/RawDocuments/208772s004lbl.pdf". s3://iso-data-zone/iso-service-dev/input/data/021743s025lbl.pdf.json
    print(file)
    key = file.replace('RawDocuments','input/data') + '.json'
    result_key = key
    print('key=', key)
    obj = s3_client.get_object(Bucket=bucketName, Key=key)
    #return obj['Body'].read()
    # AWT Textract Results: s3://iso-data-zone/iso-service-dev/TextractOutput/Clinical Pharmacology Protocol.docx_0901870c8033813c.pdf.json
    # tracted text: s3://iso-data-zone/iso-service-dev/comprehend-input/Clinical Pharmacology Protocol.docx_0901870c8033813c.pdf.txt
    keyTxt = key = file.replace('RawDocuments','comprehend-input') + '.txt'
    print('keyTxt=', keyTxt)
    objTxt = s3_client.get_object(Bucket=bucketName, Key=keyTxt)
    result = json.loads(obj['Body'].read())
    result['txt'] = objTxt['Body'].read().decode('utf-8')
    # https://iso-data-zone.s3.us-east-2.amazonaws.com/iso-service-dev/RawDocuments/test.pdf
    result['s3_url'] = file
    result['result_url'] = result_key.replace('comprehend-input','input/data')[:-4] + 'json'
    #print(result)
    
    new_key = file.replace('RawDocuments','TextractOutput') + '.json'
    response = s3_client.get_object(Bucket=bucketName, Key=new_key)
    pdf_json = json.loads(response['Body'].read().decode('utf-8'))
    
    result['txt'] = convertToTxt(pdf_json)


    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }
    
def update_txt(path, updateData):
    print('update path:' + path)
    key = path
    print('update data:')
    print(updateData)
    # updateData = json.loads(updateData)
    doc_body = s3_client.get_object(Bucket=bucketName, Key=key)['Body'].read().decode('utf-8')

    data_json = json.loads(doc_body)
    
    # for k, value in updateData:
    #     if len(value) != 0:
    #         d = {}
    #         d['content'] = value
    #         d['comprehendMedical'] = awsUtils.detectComprehendMedical(value)
    #         data_json[k] = [d]
    
    
    for k, value in data_json.items():
        doc_json = value
    
        if 'inclusionCriteria' not in doc_json.keys() or 'inclusionCriteria' in updateData:
            print('inclusionCriteria exits.')
            inclusionCriteria = updateData['inclusionCriteria']
            print('get data:' + inclusionCriteria)
            if inclusionCriteria:
                if len(doc_json['inclusionCriteria']) == 0:
                    d = {}
                    d['content'] = inclusionCriteria
                    d['comprehendMedical'] = awsUtils.detectComprehendMedical(inclusionCriteria)
                    doc_json['inclusionCriteria'] = [d]
                else:
                    for v in doc_json['inclusionCriteria']:
                        v['content'] = inclusionCriteria
                        v['comprehendMedical'] = awsUtils.detectComprehendMedical(inclusionCriteria)
            print(doc_json)
        
        if 'exclusionCriteria' not in doc_json.keys() or 'exclusionCriteria' in updateData:
            exclusionCriteria = updateData['exclusionCriteria']
            if exclusionCriteria:
                results = []
                if len(doc_json['exclusionCriteria']) == 0:
                    d = {}
                    d['content'] = exclusionCriteria
                    d['comprehendMedical'] = awsUtils.detectComprehendMedical(exclusionCriteria)
                    doc_json['exclusionCriteria'] = [d]
                else:
                    for v in doc_json['exclusionCriteria']:
                        v['content'] = exclusionCriteria
                        v['comprehendMedical'] = awsUtils.detectComprehendMedical(exclusionCriteria)
        
        if 'eventsSchedule' in updateData:
            eventsSchedule = updateData['eventsSchedule']
            if eventsSchedule:
                results = []
                if 'eventsSchedule' not in doc_json.keys() or len(doc_json['eventsSchedule']) == 0:
                    d = {}
                    d['content'] = eventsSchedule
                    d['comprehendMedical'] = awsUtils.detectComprehendMedical(eventsSchedule)
                    doc_json['eventsSchedule'] = [d]
                else:
                    for v in doc_json['eventsSchedule']:
                        v['content'] = eventsSchedule
                        v['comprehendMedical'] = awsUtils.detectComprehendMedical(eventsSchedule)
        
        data_json[k] = doc_json
        print(data_json)
        print(key)
        response = s3_client.put_object(Bucket=bucketName, Key=key, Body=json.dumps(data_json))
        result = data_json
        return {
            'statusCode': json.dumps(result),
            'body': "success"
        }

    
def getFileList():
    # iso-data-zone/iso-service-dev/RawDocuments
    print('Get file list...')
    paginator = s3_client.get_paginator('list_objects')
    operation_parameters = {'Bucket': bucketName,
                            'Prefix': 'iso-service-dev/RawDocuments/'
    }
    page_iterator = paginator.paginate(**operation_parameters)
    fileLists = []
    count = 0
    flag = False
    for page in page_iterator:
        print(page['Contents'])
        keys = page['Contents']
        for k in keys:
            if str(k['Key']).endswith('.pdf'):
                #print('process {}'.format(print(k['Key'])))
                fileLists.append(k['Key'])
                count = count + 1
                
                if count >= 25:
                    flag = True
                    break
                #break
        if flag:
            break
        #break
    print('list size:s', len(fileLists))
    return {
        "statusCode": 200,
        "body": json.dumps(fileLists)
    }
    
def update_protocol_job(file_name,status, lastUpdate):
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table('study_protocol')
    response = table.update_item(
        Key={
                'file_name': file_name
            },
        UpdateExpression="set #s=:r, lastUpdate=:p",
        ExpressionAttributeValues={
            ':r': status,
            ':p': lastUpdate
        },
        ExpressionAttributeNames={
            '#s': "status"
        },
        ReturnValues="UPDATED_NEW"
    )
    
def removeSpecialChars(str):
    str = re.sub('[^A-Za-z0-9]+', '', str)
    return str.lower()
    
def save_label_result(content, key, status, lastUpdate):
    """
    Saving label edit into json
    """
    base, filename = os.path.split(key)
    if str(filename).endswith('.json'):
        filename = filename[:-5]
    update_protocol_job(filename, status, lastUpdate)
    tf = s3_client.get_object(Bucket=bucketName, Key=key)['Body']
    td = json.loads(tf.read())
    
    
    for item in content:
        hash_code = item
        body = content[hash_code]
        path_names = ['inclusionCriteria', 'exclusionCriteria', 'protocolTitle', 'objectivesEndpointsEstimands', 'briefSummary']
        
        if 'scheduleActivities' in body:
            soa = body['scheduleActivities'][0]
            table = soa['table']
            soaResult = soa['soaResult']
            td[hash_code]['scheduleActivities'][0]['table'] = table
            td[hash_code]['scheduleActivities'][0]['soaResult'] = soaResult
            soaSummary = {}
            for item in soaResult:
                if not item['category'] in soaSummary:
                    soaSummary[item['category']] = 1
                else:
                    soaSummary[item['category']] += 1
            td[hash_code]['scheduleActivities'][0]['soaSummary'] = soaSummary
            xPos = td[hash_code]['scheduleActivities'][0]['xPos']
            soaDic = getSoaDic()
            costDic = getCostDic()
            itemCost = {}
            totalCost = 0
            for row in table:
                keyname = removeSpecialChars(row[0])
                if (keyname in soaDic):
                    value = soaDic[keyname]['value']
                    if (value in costDic):
                        cost = int(costDic[value][0])
                        x = 0
                        for column in row:
                            if (column == 'X'):
                                x += 1
                        itemCost[row[0]] = {
                            'base': cost,
                            'amount': x,
                            'total': cost * x
                        }
                        totalCost += cost * x

            pbTotalAmount = 0
            pbTotalList = []
            pbDimensionalList = []
            pbExcessList = []
            for column in range(1, len(table[xPos])):
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
                for row in table[xPos - 1:]:
                    keyname = removeSpecialChars(row[0])
                    if (keyname in soaDic):
                        value = soaDic[keyname]['value']
                        if (value in costDic):
                            if (row[column] == 'X'):
                                for x in range(1, 11):
                                    pbCount[x] += int(costDic[value][x])
                pbTotal = 0
                pbDimensional = {}
                pbExcess = {}
                for x in range(1, 11):
                    if (pbCount[x] == 1):
                        pbTotal += matchingPB[x]
                        pbDimensional[x] = matchingPB[x]
                    elif (pbCount[x] > 1):
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
            
            td[hash_code]['scheduleActivities'][0]['totalCost'] = totalCost
            td[hash_code]['scheduleActivities'][0]['itemCost'] = itemCost
            td[hash_code]['scheduleActivities'][0]['pbInfo'] = {
                'total' : pbTotalAmount,
                'dimensional' : pbDimensionalList,
                'excess' : pbExcessList,
                'byDay' : pbTotalList
            }
            s3_client.put_object(Bucket=bucketName, Key=key, Body=json.dumps(td))
            break

        # table = []
        # soaResult = []
        # if 'soaTable' in body:
        #     soaTable = body['soaTable']
        #     if 'table' in soaTable:
        #         table = soaTable['table']
        #     if 'soaResult' in soaTable:
        #         soaResult = soaTable['soaResult']
        # if table != []:
        #     td[hash_code]['scheduleActivities']['table'] = table
        #     table = []
        
        # if soaResult != []:
        #     td[hash_code]['scheduleActivities']['soaResult'] = soaResult
        #     soaSummary = {}
        #     for item in soaResult:
        #         if not item['category'] in soaSummary:
        #             soaSummary[item['category']] = 1
        #         else:
        #             soaSummary[item['category']] += 1
        #     td[hash_code]['scheduleActivities']['soaSummary'] = soaSummary
        #     soaResult = []
            
        
        for path_name in path_names:
            if path_name == 'objectivesEndpointsEstimands' and path_name in body and ('table' in body['objectivesEndpointsEstimands'][0]
            or 'otherTable' in body['objectivesEndpointsEstimands'][0]
            or 'tableResult' in body['objectivesEndpointsEstimands'][0]
            or 'otherTableResult' in body['objectivesEndpointsEstimands'][0]):
                if 'table' in content[hash_code][path_name][0]:
                    td[hash_code][path_name][0]['table'] = content[hash_code][path_name][0]['table']
                if 'otherTable' in content[hash_code][path_name][0]:
                    td[hash_code][path_name][0]['otherTable'] = content[hash_code][path_name][0]['otherTable']
                if 'tableResult' in content[hash_code][path_name][0]:
                    td[hash_code][path_name][0]['tableResult'] = content[hash_code][path_name][0]['tableResult']
                if 'otherTableResult' in content[hash_code][path_name][0]:
                    td[hash_code][path_name][0]['otherTableResult'] = content[hash_code][path_name][0]['otherTableResult']
                totalSummary = {}
                for row in td[hash_code][path_name][0]['tableResult']:
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
                for table in td[hash_code][path_name][0]['otherTableResult']:
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
                td[hash_code][path_name][0]['totalSummary'] = totalSummary
                print(totalSummary)
                continue
            if path_name not in body or len(body[path_name]) == 0:
                continue
            for model in body[path_name][0]['comprehendMedical']:
                # print(body['includeAllText'][0]['comprehendMedical'][model]['label'])
                # print(td[hash_code]['includeAllText'][0]['comprehendMedical'][model])
                td[hash_code][path_name][0]['comprehendMedical'][model]['label'] = content[hash_code][path_name][0]['comprehendMedical'][model]['label']
        
        s3_client.put_object(Bucket=bucketName, Key=key, Body=json.dumps(td))
        break
    return {
            'statusCode': 200,
            'body': "success"
    }
    
def getSoaDic():
    soaDic={}
    with open('./StandardizedActivitiesMapping.csv', mode='r') as infile:
        reader = csv.reader(infile, delimiter=',')
        for rows in reader:
            #print(rows)
            if not rows[1]:
                rows[1] = 'Not Considered as an Activity'
            soaDic[removeSpecialChars(rows[0])]={"value":rows[1],"category":rows[2]}
            #break
        #soaDic = {removeSpecialChars(rows[0]):rows[1]:rows[2] for rows in reader}
    #print(soaDic)
    return soaDic
    
def getCostDic():
    costDic = {}
    with open('./Standard_Events_Dictionary.csv', mode='r') as infile:
        reader = csv.reader(infile, delimiter=',')
        costDic = {rows[0]:[rows[2],rows[3],rows[4],rows[5],rows[6],rows[7],rows[8],rows[9],rows[10],rows[11],rows[12]] for rows in reader}
    return costDic
    
def findMeanCost(nctList):
    totalCost = 0
    totalPB = 0
    for nct in nctList:
        key = 'iso-service-dev/input/data/' + nct + '.pdf.json'
        tf = s3_client.get_object(Bucket=bucketName, Key=key)['Body']
        td = json.loads(tf.read())
        totalCost += td[list(td.keys())[0]]['scheduleActivities'][0]['totalCost']
        totalPB += td[list(td.keys())[0]]['scheduleActivities'][0]['pbInfo']['total']
    resultCost = totalCost / len(nctList)
    resultPB = totalPB / len(nctList)
    print("cost result is {} divided by {} = {}".format(totalCost, len(nctList), resultCost))
    print("pb result is {} divided by {} = {}".format(totalPB, len(nctList), resultPB))
    result = {
        'Cost' : resultCost,
        'PB' : resultPB
    }
    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }

def lambda_handler(event, context):
    # TODO implement 'body': '{"username":"xyz","password":"xyz"}'
    print(event)
    # index kendra for the ISO
    # print(awsUtils.createIndex('KendraIndexISO', 'index for the ISO searching'))
    #awsUtils.tuneIndex('393df2aa-8932-4b65-ade6-40aa1fd967d9')
    
    #awsUtils.tuneFaersIndex('25fd0e32-2c4d-4f00-be8e-015623bf1209')
    # return

    indexId = '96ab781c-3609-431c-a6e1-50dbcb44ea1a'
    body = event #json.loads(event['body'])
    if 'queryText' in body:
        if 'ds' in body:
            if body['ds'] == 'Faers':
                indexId = 'cf91bf24-7cf2-49ff-8e87-c79132c7c6d6'
                print('test=', indexId)
        if 'keyName' in body:
            return getResults(indexId, body['queryText'],body['pageNumber'],body['keyName'],body['keyValue'])
        else:
            return getResults(indexId, body['queryText'],body['pageNumber'],None,None)
    elif 'QueryId' in body:
        # {QueryId = '', ResultId='', RelevanceValue='RELEVANT'}
        return submitFeedback(indexId, body['QueryId'], body['ResultId'], body['RelevanceValue'])
    elif 'history' in body:
        return getFileList()
    elif 'queryStringParameters' in body:
        queryString = body['queryStringParameters']
        if queryString:
            if queryString['file']:
                print(queryString)
                return getFile(queryString['file'])
            else:
                return getFileList()
        else:
            return getFileList()
    elif 'updateData' in body:
        updateData = body['updateData']
        path = body['path']
        return update_txt(path, updateData)
    elif 'savelabel' in body:
        save_params = body['savelabel']
        return save_label_result(save_params['content'], save_params['key'], save_params['status'], save_params['lastUpdate'])
    elif 'findMeanCost' in body:
        params = body['findMeanCost']
        return findMeanCost(params['nctList'])
    else:
        print('upload file start...')
        body = base64.b64decode(event['name'])
        # file = urlparse(event['file']).path
        bucket = bucketName
        if "bucket" in event:
            bucket = event['bucket']
        file = event['file']
        key = event['path']
        #print(file)
        print(bucket)
        #return
        
        path, filename = os.path.split(file)
        nctID = filename.split('.')[0]
        #print(event)
        table = 'study_protocol'
        t_item = {
            "file_name": file,
            "status": 'Not started',
            "lastUpdate": strftime("%m/%d/%Y", gmtime())
        }
        if 'nctID' in event:
            if len(event['nctID']) > 0:
                t_item['nctID'] = event['nctID']
            else:
                t_item['nctID'] = nctID
        if 'protocolName' in event:
            if len(event['protocolName']) > 0:
                t_item['protocolName'] = event['protocolName']
            else:
                t_item['protocolName'] = nctID
        print('t_item=', t_item)
        #return

        lambda_client.invoke_async(FunctionName='dean-dev-protocol-job', InvokeArgs=json.dumps({'method':'save', 'body':t_item}))
        
        # iso-data-zone/iso-service-dev/RawDocuments
        #response = s3_client.put_object(Bucket=bucket, Key=key + filename, Body=body)
        response = s3_client.put_object(Bucket=bucket, ACL="public-read", Key=key + filename, Body=body, ContentDisposition='inline', ContentType='application/pdf')
        response = s3_client.put_object(Bucket='ucp-docs', ACL="public-read", Key=key + filename, Body=body, ContentDisposition='inline', ContentType='application/pdf')
        # result = {\"file\": \"filename\", \"msg\": \"upload success!\"}
        #print(response)
        #print('upload file start...')
        return {
            'statusCode': 200,
            'body': "success"
        }