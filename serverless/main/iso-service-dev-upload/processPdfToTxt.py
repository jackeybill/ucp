# -*- coding: utf-8 -*-
import boto3
import json
import time
import os
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

prefixName = os.environ['SERVICE']+'-'+os.environ['STAGE']


def getTextractPagesResult(jobId):
    '''
    Get textract pages result
    params:
        jobId: textract jobid
    '''
    logger.info(f"Start get result by jobId : {jobId}")
    pages = []

    # Get textract client 
    client = boto3.client('textract')
    response = client.get_document_text_detection(JobId=jobId)

    #  Handler failed status
    if response['JobStatus'] == 'FAILED':
            bucketName = os.environ['BUCKET_NAME']
            objectKey = prefixName+'/log/error/processPdfToTxt/'
            statusMessage = response['StatusMessage']
            # Save error log
            save_error_log(bucketName=bucketName, objectKey=objectKey, body="Failed on textract pdf with Error:{}".format(statusMessage))
            raise Exception


    pages.append(response)
    logger.info("Resultset page recieved: {}".format(len(pages)))
    nextToken = None
    if('NextToken' in response):
        nextToken = response['NextToken']

    # Get all result by nextToken and jobid
    while(nextToken):
        response = client.get_document_text_detection(JobId=jobId, NextToken=nextToken)

        pages.append(response)
        logger.info("Resultset page recieved: {}".format(len(pages)))
        nextToken = None
        if('NextToken' in response):
            nextToken = response['NextToken']
    logger.info(f"Finish get result with jobId : {jobId}")
    return pages


def conver_to_txt(pages):
    '''
    Conver pages into text content
    params:
        pages: textract result pages
    return:
        pages into text content
    '''
    logger.info("Conver total: {} to txt.".format(len(pages)))
    # logger.info("Get pages contents: {}".format(pages))
    fileContent = ""
    for resultPage in pages:
        for item in resultPage["Blocks"]:
            if item["BlockType"] == "LINE":
                fileContent += item["Text"] + "\n"
    return fileContent

def getNewFileName(objectName, subfix, prefix):
    PATH_SPLIT = '/'
    path_strs = objectName.split(PATH_SPLIT)
    # Check file should in folder
    if len(path_strs) > 1:
        path_strs[1] = prefix
        path_strs[-1] += "."+subfix
        new_object_name = PATH_SPLIT.join(path_strs)
        #out_object_name = new_object_name[:-3] + subfix
        return new_object_name
    return None

def save_to_s3(bucketName, objectName, pages):
    '''
    Save textract result into S3 bucket 
    params:
        bucketName: save textract result bucket
        objectName: save textract result bucket's object name
        pages: textract result pages
    '''
    # Check file should in folder
    if objectName:
        out_object_txt_name  = getNewFileName(objectName, 'txt', 'comprehend-input')
        out_object_json_name = getNewFileName(objectName, 'json', 'TextractOutput')

        s3_client = boto3.client('s3')
        # Saved to Txt format
        logger.info(f"Write text to bucket:{bucketName}, key:{out_object_txt_name}")
        response = s3_client.put_object(Bucket=bucketName, Key=out_object_txt_name, Body=conver_to_txt(pages))

        #  Saved to Json format
        logger.info(f"Write json to bucket:{bucketName}, key:{out_object_json_name}")
        response = s3_client.put_object(Bucket=bucketName, Key=out_object_json_name, Body=json.dumps(pages))


def save_error_log(bucketName, objectKey, body):
    '''
    Saved to Error log to bucket
    params:
        bucketName: save error bucket
        objectName: save error bucket's object name
        body: error message
    '''
    s3_client = boto3.client('s3')
    #  Add time ms to file name
    t = time.time()
    file_name = 'error-' + str(int(round(t * 1000))) + '.log'
    logger.info("Write error log to bucket:{}, key:{}".format(bucketName, objectKey + file_name))
    s3_client.put_object(Bucket=bucketName, Key=objectKey + file_name, Body=body)

    
def error_sns_handler(file_name, error_msg):
    '''
    Trigger SNS when got error
    params:
        file_name: file name which got error on process
        error_msg: error message detail
    '''
    logger.info(f"Trigger SNS on error for file:{file_name}")
    # Get config from os evn
    snsTopic = os.environ['NOTIFICATION_ARN']
    sns_client = boto3.client('sns')
    # Publsh error to SNS
    sns_client.publish(
        TopicArn=snsTopic,
        Message=json.dumps(error_msg),
        Subject='ProcessPdfToTxt Error on file: ' + file_name,
        MessageStructure='json'
    )
    logger.info("Trigger SNS on error done")


def update_log(source_bucket, target_bucket, file_name, successful):
    '''
    Update_log function for updating data into dynamodb table
    '''
    logger.info(f"Update log with file_name:{file_name}, successful: {successful}")
    db = boto3.resource('dynamodb')
    table = db.Table(prefixName+'-log')

    # Get exit item
    response = table.get_item(
        Key={
            "file_name": file_name
        }
    )
    item = response['Item']
    logger.info("Get file log from db: {}".format(item))

    # Update item in db
    response = table.update_item(
        Key={
            'file_name': file_name
        },
        UpdateExpression="set  successful =:s, source_bucket=:sb, target_bucket=:tb, create_time=:ct",
        ExpressionAttributeValues={
            ':s': successful,
            ':sb': source_bucket,
            ':tb': target_bucket,
            ':ct': item['create_time']
        },
        ReturnValues="UPDATED_NEW"
    )
    logger.info("Finished update record {}".format(json.dumps(response)))


def get_target_bucket(documentName):
    '''
    Get target bucket name
    params:
        documentName: S3 objectKey
    return:
        target bucket name
    '''
    path_strs = documentName.split('/')
    target_bucket =  path_strs[-2][:-5] + 'out'
    return target_bucket


def lambda_handler(event, context):
    '''
    Trigger by SNS when textract done
    '''
    # print("event: {}".format(event))
    logger.info("event: {}".format(event))
    # Get body from SNS message
    sqsBody = event['Records'][0]['body']
    payload = json.loads(sqsBody)
    msg = json.loads(payload['Message'])
    # Get aws textract jobid and status from sns's message
    jobId = msg['JobId']
    status = msg['Status']
    logger.info("Get job result with jobid {} with status {}".format(jobId, status))
    # Get S3 bucket info
    s3BucketName = msg['DocumentLocation']['S3Bucket']
    documentName = msg['DocumentLocation']['S3ObjectName']
    if not documentName.endswith('.pdf'):
        return
    path,  file_name = os.path.split(documentName)
    target_bucket =  get_target_bucket(documentName)
    try:
        pages = getTextractPagesResult(jobId)
        logger.info("Save result into S3 start")
        save_to_s3(bucketName=s3BucketName, objectName=documentName, pages=pages)
    except Exception as e:
        logger.info("processPdfToTxt Error: {}".format(e))
        update_log(source_bucket=s3BucketName, target_bucket=target_bucket, file_name=file_name, successful='NO')
        objectKey = prefixName+'/log/error/processPdfToTxt/'
        # Save error log
        save_error_log(bucketName=s3BucketName, objectKey=objectKey, body="Failed on processPdfToTxt handler Event {} with Error:{}".format(event, e))
        # Trigger SNS error
        error_sns_handler(file_name, e)
        # Retrun error with message
        return  {
            'code': 400,
            'msg': "Failed on processPdfToTxt handler event {} with Error: {}".format(event, e)
        }
    # Update success log in db
    update_log(source_bucket=s3BucketName, target_bucket=target_bucket, file_name=file_name, successful='Yes')
    return {
        'code': 200,
        'msg': "Success hanlder processPdfToTxt process!"
    }
    
