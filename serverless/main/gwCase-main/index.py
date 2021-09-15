import json
import boto3
import os
import urllib.parse
import re
import traceback
import base64
from awsUtils import sendMail, insertData, extractForm, s3Copy, isFileInS3
from pdfUtils import splitPDF
from loginUtils import checkJWT, login
from constants import protocolsList,new71Nct
#import gwCases
import gwCriteria
import criteriaSummary
import studies
import loadStandardEvents
import csv
#import testMe
# runtime = boto3.client('runtime.sagemaker', region_name = 'us-east-2')
runtime = boto3.client('runtime.sagemaker', region_name = 'ap-southeast-1')
s3 = boto3.client('s3')
def getFileName(documentName):
    base, filename = os.path.split(documentName)
    #bucket_key = os.path.splitext(filename)[0]
    return filename

def getPathInfo(event):
    # Started job with bucket: BI clinical study.pdf ; Clinical Pharmacology Protocol
    #return 'ucp-filebucket-dev','comprehend-input/BI clinical study.pdf.txt'
    payload = event['Records'][0]['s3']

    s3BucketName = payload['bucket']['name']
    documentName = urllib.parse.unquote_plus(payload['object']['key'], encoding='utf-8')

    print("Started job with bucket: {}, and file name: {}".format(s3BucketName, documentName))
    return s3BucketName, documentName

def fillIeInfo(e, nct):
    ENDPOINT_NAME='temporalNER'
    value = ""
    # unit = ""
    # lower = ""
    # upper = ""
    modifier = ""
    negation = ""
    relation = ""
    temporal = ""
    index = ""
    omop = ""
    snomed = ""
    source = ""
    criteria = ""
    criteriaIndex = ""
    attributes = ""
    if 'snomedTerm' in e:
        snomed = e['snomedTerm']
    if 'omopTerm' in e:
        omop = e['omopTerm']
    if 'value' in e:
        value = e['value']
    if 'index' in e:
        index = e['index']
    if 'standardized source' in e:
        source = e['standardized source']
    if 'Criteria' in e:
        criteria = e['Criteria']
    if 'Criteria Index' in e:
        criteriaIndex = e['Criteria Index']
    if 'Attributes' in e:
        attributes = e['Attributes']
    #     if '-' in value:
    #         valueList = value.split('-')
    #         modifier = '-'
    #         lower = valueList[0]
    #         upper = valueList[1]
    #     elif 'to' in value:
    #         valueList = value.split('to')
    #         modifier = 'to'
    #         lower = valueList[0]
    #         upper = valueList[1]
    # if 'unit' in e:
    #     unit = e['unit']
    a_unit = ''
    a_value_min = ''
    a_value_max = ''
    if 'Attributes' in e:
        a_values = []
        for a in e['Attributes']:
            if a['Type'] == 'TEST_UNIT' and a_unit == '':
                a_unit = a['Text']
                continue
        
            if a['Type'] == 'TEST_VALUE':
                a_texts = a['Text'].split(' ')
                for a_text in a_texts:
                    joinInt = ''.join(ele for ele in a_text if ele.isdigit() or ele == '.')
                    if len(joinInt) > 0:
                        try:
                            a_v = float(joinInt)
                            a_values.append(a_v)
                        except Exception as exception:
                            print('error')
                        
        if len(a_values) > 1:
            a_value_min = min(a_values)
            a_value_max = max(a_values)
        
            
    try:
        if criteria != '':
            sentences = criteria.split('.')
            for sentence in sentences:
                if e['rawText'] in sentence:
                    modelInput = sentence
                    break
            # print(modelInput)
            data = {"text": modelInput}
            payload=json.dumps(data)
            response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                                  ContentType='application/json',
                                                  Body=payload)
            result = json.loads(response['Body'].read().decode())
        else:
            result = {}
    except Exception as exception:
        # print('model error')
        result = {}

    if result != {}:
        # print(result)
        for name in result:
            for item in result[name]:
                if name == 'temporals':
                    temporal += item
                    temporal += ','
                if name == 'relations':
                    relation += item
                    relation += ','
                if name == 'modifiers':
                    modifier += item
                    modifier += ','
                if name == 'negations':
                    negation += item
                    negation += ','
    fbResult = ''
    if 'fbResult' in e:
        fbResult = e['fbResult']
    
    finalObj =  {
        'nct' : nct,
        'index' : index,
        'raw' : e['rawText'],
        'type' : e['Type'],
        'category' : e['Category'],
        'standardized' : e['Text'],
        'source' : source,
        'value' : value,
        'snomed' : snomed,
        'omop' : omop,
        'modifier' : modifier, 
        'negation' : negation,
        'relation' : relation,
        'temporal' : temporal,
        'lower' : a_value_min,
        'upper' : a_value_max,
        'units'	: a_unit,
        'criteria' : criteria,
        'criteriaIndex' : criteriaIndex,
        'time' : "",
        'fbResult' : fbResult,
        'attributes' : attributes,
        'modelInput' : modelInput
    }
    return finalObj
    

def extractPdf(event):
    bucketName, bucketKey = getPathInfo(event)
    #s3Copy(bucketName, bucketKey, bucketName, bucketKey.replace("RawDocuments", "error"))
    #return

    if isFileInS3(bucketName, bucketKey.replace("RawDocuments", "output/json")+".json"):
        print('File %s is already uploaded and processed.' % bucketKey)
        return

    fileName = getFileName(bucketKey)
    print('fileName:', fileName)
    
    if fileName.endswith('Medical Form_final.pdf'):
        print("Split PDF into PA and Medical.")
        splitPDF(bucketName, bucketKey, fileName)
    #return
    try:
        print("extract key-value from a form; in case error, save pdf to another folder.")
        extractForm(bucketName, bucketKey, fileName)
    except Exception as e:
        s3Copy(bucketName, bucketKey, bucketName, bucketKey.replace("RawDocuments", "error"))
        print("Exception occurred while processing event" + traceback.format_exc())
        print('Something bad happened when process PDF: ' + fileName)
    
    # Send email
    #sendMail(fileName)
    #result = extractForm()
    #return None
    return {
        'statusCode': 200,
        'body': "success"
    }
    
    
    
def uploadFile(event):
    print('upload file start...')
    body = base64.b64decode(event['name'])
    # file = urlparse(event['file']).path
    # bucket = 'ucp-filebucket-dev'
    bucket = 'ucp-filebucket-dev'
    if "bucket" in event:
        bucket = event['bucket']
    file = event['file']
    key = event['path']
    #print(file)
    print(bucket)
    #return

    path, filename = os.path.split(file)
    s3_client = boto3.client('s3')
    # ucp-filebucket-dev/RawDocuments
    response = s3_client.put_object(Bucket=bucket, ACL="public-read",Key=key + filename, Body=body)


def getCostDic():
    costDic = {}
    with open('./Standard_Events_Dictionary.csv', mode='r') as infile:
        reader = csv.reader(infile, delimiter=',')
        next(reader)
        costDic = {rows[0]:[int(rows[3]),int(rows[4]),int(rows[5]),int(rows[6]),int(rows[7]),int(rows[8]),int(rows[9]),int(rows[10]),int(rows[11]),int(rows[12])] for rows in reader}
    return costDic
    
def rm_test2(nctList):
    ieData = json.loads(findIeItem(nctList)['body'])
    header = ['I/E', 'nct','index','criteria','criteriaIndex','category','type','raw','standardized','standardized source','value','snomed','omop','model input','modifier', 'negation','relation','temporal','lower','upper','unit','facebook result','comprehend result']
    with open('/tmp/ieSummary.csv', 'w', encoding='UTF8') as f:
        # write the header
        writer = csv.writer(f)
        writer.writerow(header)
        for key in ieData:
            if key == 'inResult':
                for item in ieData[key]:
                    data = ['Inclusion', item['nct'],item['index'],item['criteria'],item['criteriaIndex'], item['category'],item['type'],item['raw'],item['standardized'],item['source'],item['value'],item['snomed'],item['omop'],item['modelInput'],item['modifier'], item['negation'],item['relation'],item['temporal'],item['lower'],item['upper'],item['units'],item['fbResult'],item['attributes']]
                    writer.writerow(data)
            elif key == 'exResult':
                for item in ieData[key]:
                    data = ['Exclusion', item['nct'],item['index'],item['criteria'],item['criteriaIndex'], item['category'],item['type'],item['raw'],item['standardized'],item['source'],item['value'],item['snomed'],item['omop'],item['modelInput'],item['modifier'], item['negation'],item['relation'],item['temporal'],item['lower'],item['upper'],item['units'],item['fbResult'],item['attributes']]
                    writer.writerow(data)
            #write the data
            
    s3.put_object(Bucket='ucp-filebucket-dev', Key='summary/exportedIE.csv', Body=open('/tmp/ieSummary.csv', 'rb'))

def rm_test3(nctList):
    soaData = json.loads(findSoaItem(nctList)['body'])
    header = ['nct', 'category', 'raw', 'standardized']
    with open('/tmp/soaSummary.csv', 'w', encoding='UTF8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for item in soaData['soaItemList']:
            data = [item['nctID'], item['category'], item['raw'], item['standardized']]
            writer.writerow(data)
    s3.put_object(Bucket='ucp-filebucket-dev', Key='summary/exportedSOA.csv', Body=open('/tmp/soaSummary.csv', 'rb'))

def rm_test4(nctList):
    header = ['nct', 'I/E', 'criterion', 'relation']
    with open('/tmp/facebookSummary.csv', 'w', encoding='UTF8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        
        for nct in protocolsList:
            try:
                modelResult = s3.get_object(Bucket='ucp-filebucket-dev', Key='facebookModel/'+str(nct)+'.json')['Body']
            except Exception as e:
                continue
            modelResult = json.loads(modelResult.read())
            for ieKey in modelResult:
                for num in modelResult[ieKey]['cfg_results']['criterion']:
                    data = [nct, str(ieKey), modelResult[ieKey]['cfg_results']['criterion'][num],  modelResult[ieKey]['cfg_results']['relation'][num]]
                    writer.writerow(data)
    s3.put_object(Bucket='ucp-filebucket-dev', Key='summary/exportedFB.csv', Body=open('/tmp/facebookSummary.csv', 'rb'))
        
    
def findSoaItem(inputList):
    bucketName = 'ucp-filebucket-dev'
    s3_client = boto3.client('s3')
    soaItemList = []
    if(len(inputList) == 0):
        soaSummaryObj = s3_client.get_object(Bucket=bucketName, Key='summary/soaSummary.json')['Body']
        soaSummaryObj = json.loads(soaSummaryObj.read())
        actIndex = soaSummaryObj['actIndex']
        for nct in actIndex:
            for item in actIndex[nct]:
                newResultObj = {
                    'nctID' : nct,
                    'category' : item['category'],
                    'raw' : item['raw'],
                    'standardized' : item['standardized']
                }
                soaItemList.append(newResultObj)
    else:
        soaSummaryObj = s3_client.get_object(Bucket=bucketName, Key='summary/soaSummary.json')['Body']
        soaSummaryObj = json.loads(soaSummaryObj.read())
        actIndex = soaSummaryObj['actIndex']
        for nct in inputList:
            if(nct in actIndex):
                for item in actIndex[nct]:
                    newResultObj = {
                        'nctID' : nct,
                        'category' : item['category'],
                        'raw' : item['raw'],
                        'standardized' : item['standardized']
                    }
                    soaItemList.append(newResultObj)
    result = {
        'soaItemList' : soaItemList
    }
    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }

def findIeItem(inputList):
    bucketName = 'ucp-filebucket-dev'
    s3_client = boto3.client('s3')
    ieSummaryObj = s3_client.get_object(Bucket=bucketName, Key='summary/ieSummary.json')['Body']
    ieSummaryObj = json.loads(ieSummaryObj.read())
    inDic = ieSummaryObj['inclusionCriteria']
    exDic = ieSummaryObj['exclusionCriteria']
    inResult = []
    exResult = []
    if(len(inputList) == 0):
        for nct in inDic:
            for item in inDic[nct]:
                for e in inDic[nct][item]:
                    inResult.append(fillIeInfo(e, nct))
        for nct in exDic:
            for item in exDic[nct]:
                for e in exDic[nct][item]:
                    exResult.append(fillIeInfo(e, nct))
    else:
        for nct in inputList:
            if nct in inDic:
                for item in inDic[nct]:
                    for e in inDic[nct][item]:
                        inResult.append(fillIeInfo(e, nct))
        for nct in inputList:
            if nct in exDic:
                for item in exDic[nct]:
                    for e in exDic[nct][item]:
                        exResult.append(fillIeInfo(e, nct))
    result = {
        'inResult' : inResult,
        'exResult' : exResult
    }
    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }
def findMeanCost(inputList):
    bucketName = 'ucp-filebucket-dev'
    s3_client = boto3.client('s3')
    totalCost = 0
    totalPB = 0
    denom = 0
    if(len(inputList) == 0):
        soaSummaryObj = s3_client.get_object(Bucket=bucketName, Key='summary/soaSummary.json')['Body']
        soaSummaryObj = json.loads(soaSummaryObj.read())
        nctCostPbMap = soaSummaryObj['nctCostPbMap']
        for key in nctCostPbMap:
            if(nctCostPbMap[key]['cost'] != 0 or nctCostPbMap[key]['pb'] != 0):
                totalCost += nctCostPbMap[key]['cost']
                totalPB += nctCostPbMap[key]['pb']
                denom += 1
    else:
        soaSummaryObj = s3_client.get_object(Bucket=bucketName, Key='summary/soaSummary.json')['Body']
        soaSummaryObj = json.loads(soaSummaryObj.read())
        nctCostPbMap = soaSummaryObj['nctCostPbMap']
        for nct in inputList:
            if(nct in nctCostPbMap):
                if(nctCostPbMap[nct]['cost'] != 0 or nctCostPbMap[nct]['pb'] != 0):
                    totalCost += nctCostPbMap[nct]['cost']
                    totalPB += nctCostPbMap[nct]['pb']
                    denom += 1
    if(denom > 0):
        resultCost = totalCost / denom
        resultPB = totalPB / denom
        print("cost result is {} divided by {} = {}".format(totalCost, denom, resultCost))
        print("pb result is {} divided by {} = {}".format(totalPB, denom, resultPB))
    else:
        resultCost = 0
        resultPB = 0
    result = {
        'Cost' : resultCost,
        'PB' : resultPB
    }
    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }

def handler(event, context):
    print('event:', event)
    #testMe.main()
    #return
    datas = None

    if 'module' in event:
        moduleName = event['module']
        if moduleName == 'criteria':
            ret = gwCriteria.handler(event, context)
            #print('datas=', json.loads(datas['Payload'].read()))
            datas = json.loads(ret['Payload'].read())

    if 'method' in event:
        methodName = event['method']
        if methodName == 'login':
            return login(event['body']['username'], event['body']['password'])
        # if methodName == 'listCases':
        #     datas = gwCases.listCases(event['body']['filters'])
        # if methodName == 'getCase':
        #     datas = gwCases.getCase(event['body']['caseID'])
            
    if 'summary' in event:
        method = event['method']
        if method == 'getLists':
            return criteriaSummary.getLists()
        if method == 'summaryNctids':
            return criteriaSummary.handler(event['body']['nct_ids'])
        if method == 'default':
            s3 = boto3.client('s3')
            data = s3.get_object(Bucket='ucp-filebucket-dev', Key='summary/all_summary.json')['Body'].read()
            # return {'statusCode':200, 'body': certeriaSummary.load_from_dynamodb('NCT0000000')['Summary'] }
            return {'statusCode':200, 'body': data }
            
    if 'studies' in event:
        method = event['method']
        if method == 'list':
            params = []
            if 'nct_ids' in event:
                params = event['nct_ids']
            return studies.list(params)
        if method == 'listIndication':
            return studies.listIndication()
            
        if method == 'nctids':
            return studies.list_nct_id()
    
    if "path" in event:
        uploadFile(event)
        return {
            'statusCode': 200,
            'body': "success"
        }
        
    if 'standard_events' in event:
        return {
            'statusCode': 200,
            'body': loadStandardEvents.loadStandardEvents()
        } 
    
    if 'schedule_activities' in event:
        costDic = getCostDic()
        s3 = boto3.client('s3')
        data = s3.get_object(Bucket='ucp-filebucket-dev', Key='summary/scheduleOfActivitiesFrequency.json')['Body'].read()
        data = json.loads(data)
        for key in data:
            if(key != 'summary'):
                protocolList = data[key]
                for i in range(len(protocolList)):
                    protocol = protocolList[i]
                    standardized = protocol['Standard Event']
                    if(standardized in costDic):
                        data[key][i]['soaWeights'] = costDic[standardized]
        return {
            'statusCode': 200,
            'body': json.dumps(data)
        } 
        
    
    if "Records" in event:
        return extractPdf(event)
    
    if "token" in event:
        return checkJWT(event['token'])
    
    if 'findMeanCost' in event:
        params = event['findMeanCost']
        return findMeanCost(params['nctList'])
        
    if 'findSoaItem' in event:
        params = event['findSoaItem']
        if 'rm_test' in params:
            rm_test3(params['nctList'])
            return
        return findSoaItem(params['nctList'])
    
    if 'findIeItem' in event:
        params = event['findIeItem']
        if 'rm_test' in params:
            rm_test2(params['nctList'])
            return
        return findIeItem(params['nctList'])
    
    if 'findFacebook' in event:
        params = event['findFacebook']
        rm_test4(params['nctList'])
        return 
    
    return {
        'statusCode': 200,
        'body': datas
    }
    #sendMail('Patient 3_PA _ Medical Form_final.pdf')
    #data = {"Member's name: ":"Jane Doe","Member's plan ID number: ":'A2473'}
    #data = {'CaseID': '001', "Member's Name": 'John Doe', 'Provider ID': 'hdk39999', 'DOB': '03/03/1996', 'Member ID': '7371287321'}
    #print(insertData(data))
    #return