import json
import base64
import boto3
import os
from datetime import datetime

# https://enable-cors.org/server_awsapigateway.html
# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/kendra.html#kendra.Client.query

indexId = '9ee51f9a-3839-46b4-b295-b96d4be2a59d'
DEFAULT_PAGE_SIZE = 25

kendraClient = boto3.client('kendra', region_name='us-east-1')

def convetDate(dateString):
    #return datetime.fromisoformat(dateString[:10])
    return datetime.fromtimestamp(float(dateString)/1000.)

def getResults(queryText, pageNumber, keyName, keyValue):
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
                    if arr[0].endswith('_Date'):
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
    return response
    #return {
    #    "statusCode": 200,
    #    "headers": {
    #        "QueryText": queryText
    #    },
    #    "body": json.dumps(response),
    #    "isBase64Encoded": False
    #};
def submitFeedback(queryId, resultId, relevanceValue):
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
    
def lambda_handler(event, context):
    # TODO implement 'body': '{"username":"xyz","password":"xyz"}'
    print(event)
    body = event #json.loads(event['body'])
    if 'queryText' in body:
        if 'keyName' in body:
            return getResults(body['queryText'],body['pageNumber'],body['keyName'],body['keyValue'])
        else:
            return getResults(body['queryText'],body['pageNumber'],None,None)
    elif 'QueryId' in body:
        # {QueryId = '', ResultId='', RelevanceValue='RELEVANT'}
        return submitFeedback(body['QueryId'], body['ResultId'], body['RelevanceValue'])
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