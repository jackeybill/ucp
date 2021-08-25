import json
import boto3
import time
import urllib.parse
from datetime import datetime
import decimal
import requests
from requests_aws4auth import AWS4Auth

def runJob(r_endpoint, body):
    clientSagemaker = boto3.client('runtime.sagemaker')
    response = clientSagemaker.invoke_endpoint(EndpointName=r_endpoint,
                                       ContentType='plain/text',
                                       Body=body)
    result = json.loads(response['Body'].read().decode())
    return result
    
def startNotebookInstance(name):
    client = boto3.client('sagemaker')
    response = client.start_notebook_instance(
        NotebookInstanceName=name
    )
    return response

def save2DynamoDB(key, text):
    print(key)
    db = boto3.resource('dynamodb')
    table = db.Table('protocol')
    
    try:
        currentStats = table.get_item(
            Key = {
                'id': key
            }
        )
        if 'Item' not in currentStats.keys():
            statItem = {
                'id': key,
                'blocks': text
            }
            print(f'New Record: {statItem["id"]}')
            table.put_item(Item=statItem)
    except Exception as e:
        print(e)
        return e

def lambda_handler(event, context):
    print(event)
    body_data = event['Records'][0]['body']
    # print(body_data)
    data = json.loads(body_data)['Records'][0]
    print(data)
    s3_data = data['s3']
    bucket = s3_data['bucket']['name']
    key = urllib.parse.unquote_plus(s3_data['object']['key'], encoding='utf-8')
    #bucket = "lly-aads-lens-nlp-dev-pwc"
    #key = "input/ProcessedOutput/Clinical Pharmacology Protocol.docx_0901870c8033813c.pdf.json"

    # Get the object from the event and show its content type
    try:
        s3 = boto3.client('s3')
        response = s3.get_object(Bucket=bucket, Key=key)
        jsonContent = "{}".format(response['Body'].read())
        save2DynamoDB(key, jsonContent)
        
        region = 'us-east-2'
        service = 'es'
        credentials = boto3.Session().get_credentials()
        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
        
        # es config () 
        # lilly's ES: https://search-nlp-es-5wanb4pg34re6bstmpflsjwc3i.us-east-2.es.amazonaws.com
        host = 'https://vpc-nlp-es-ncrqt5hmt23o7snb36vmktwgty.us-east-2.es.amazonaws.com'
        index = 'jsonindexs'
        type = 'jsontype'
        url = host + '/' + index + '/' + type
        
        headers = { "Content-Type": "application/json" }
        content = {"content": jsonContent}
        #r = requests.post(url, auth=awsauth, json=content, headers=headers)
        #print("get response:{}".format(r))
        
        #result = runJob("DEMO-r-endpoint-202001170455","predict");
        result = startNotebookInstance('inference')
        return result
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e