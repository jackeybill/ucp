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
import ucpCases
#import testMe
def getFileName(documentName):
    base, filename = os.path.split(documentName)
    #bucket_key = os.path.splitext(filename)[0]
    return filename

def getPathInfo(event):
    # Started job with bucket: BI clinical study.pdf ; Clinical Pharmacology Protocol
    #return 'iso-data-zone','iso-service-dev/comprehend-input/BI clinical study.pdf.txt'
    payload = event['Records'][0]['s3']

    s3BucketName = payload['bucket']['name']
    documentName = urllib.parse.unquote_plus(payload['object']['key'], encoding='utf-8')

    print("Started job with bucket: {}, and file name: {}".format(s3BucketName, documentName))
    return s3BucketName, documentName

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
    bucket = 'iso-data-zone'
    if "bucket" in event:
        bucket = event['bucket']
    file = event['file']
    key = event['path']
    #print(file)
    print(bucket)
    #return

    path, filename = os.path.split(file)
    s3_client = boto3.client('s3')
    # iso-data-zone/iso-service-dev/RawDocuments
    response = s3_client.put_object(Bucket=bucket, ACL="public-read",Key=key + filename, Body=body)
    
def handler(event, context):
    print('event:', event)
    #testMe.main()
    #return

    if 'method' in event:
        methodName = event['method']
        if methodName == 'login':
            return login(event['body']['username'], event['body']['password'])
        if methodName == 'listCases':
            datas = ucpCases.listCases(event['body']['filters'])
        if methodName == 'getCase':
            datas = ucpCases.getCase(event['body']['caseID'])
        return {
            'statusCode': 200,
            'body': json.dumps(datas)
        }
    
    if "path" in event:
        uploadFile(event)
        return {
            'statusCode': 200,
            'body': "success"
        }
    
    if "Records" in event:
        return extractPdf(event)
    
    if "token" in event:
        return checkJWT(event['token'])
        
    return {
        'statusCode': 200,
        'body': "success"
    }
    #sendMail('Patient 3_PA _ Medical Form_final.pdf')
    #data = {"Member's name: ":"Jane Doe","Member's plan ID number: ":'A2473'}
    #data = {'CaseID': '001', "Member's Name": 'John Doe', 'Provider ID': 'hdk39999', 'DOB': '03/03/1996', 'Member ID': '7371287321'}
    #print(insertData(data))
    #return