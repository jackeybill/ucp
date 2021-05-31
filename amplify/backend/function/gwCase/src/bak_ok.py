import json
import base64
import boto3
import os
from datetime import datetime

indexId = '9ee51f9a-3839-46b4-b295-b96d4be2a59d'
DEFAULT_PAGE_SIZE = 25

def convetDate(dateString):
    return datetime.fromisoformat(dateString[:10])

def getResults(queryText, pageNumber, keyName, keyValue):
    kendraClient = boto3.client('kendra', region_name='us-east-1')
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
            conditions = []
            #keyFilter = json.loads(keyName)
            for key in keyName.split('&'):
                if key != '':
                    arr = key.split('=')
                    print('arr=', arr)
                    if arr[0].endswith('_Date1'):
                        #dd 'marketingDate','revisionDate'2009-11-24T00:00:00.000Z
                        condition = {"GreaterThanOrEquals": {"Key": arr[0],"Value": {"DateValue": convetDate(arr[1])}}}
                        conditions.append(condition)
                        condition = {"LessThanOrEquals": {"Key": arr[0],"Value": {"DateValue": convetDate(arr[2])}}}
                    else:
                        arrStringValues = arr[1].split(',')
                        condition = {"EqualsTo": {"Key": arr[0],"Value": {"StringValue": arrStringValues[0]}}}
                    conditions.append(condition)
            print(conditions)
            #return
            response = kendraClient.query(
                IndexId=indexId,
                PageNumber=pageNumber,
                PageSize=DEFAULT_PAGE_SIZE,
                QueryText=queryText,
                AttributeFilter = {'AndAllFilters': conditions
                }
            )
    else:
        response = kendraClient.query(
            IndexId=indexId,
            PageNumber=pageNumber,
            PageSize=DEFAULT_PAGE_SIZE,
            QueryText=queryText
        )
    #print(response)
    return response
    #return {
    #    "statusCode": 200,
    #    "headers": {
    #        "QueryText": queryText
    #    },
    #    "body": json.dumps(response),
    #    "isBase64Encoded": False
    #};
    
def lambda_handler(event, context):
    # TODO implement 'body': '{"username":"xyz","password":"xyz"}'
    print(event)
    body = event #json.loads(event['body'])
    if 'queryText' in body:
        if 'keyName' in body:
            return getResults(body['queryText'],body['pageNumber'],body['keyName'],body['keyValue'])
        else:
            return getResults(body['queryText'],body['pageNumber'],None,None)
    else:
        body = base64.b64decode(event['name'])
        file = event['file']
        key = event['path']
        print(file)
        path, filename = os.path.split(file)
        
        s3_client = boto3.client('s3')
        response = s3_client.put_object(Bucket="lly-aads-lens-nlp-dev-pwc", Key=key + filename, Body=body)
        # result = {\"file\": \"filename\", \"msg\": \"upload success!\"}
        return {
            'statusCode': response,
            'body': "success"
        }