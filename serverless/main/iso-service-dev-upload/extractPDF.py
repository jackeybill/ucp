# -*- coding: utf-8 -*-
import os
import json
import boto3
import time
import logging
import urllib.parse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

prefixName = os.environ['SERVICE']+'-'+os.environ['STAGE']

def startAsyncJob(bucketName, objectName, snsTopic, snsRole):
    '''
    Start textract async job
    params:
        bucketName: source file bucket
        objectName: source file key
        snsTopic: SNS topic
        snsRole: SNS role
    return:
        jobId: textract job id
    '''
    logger.info("Starting job with bucketName: {}, objectName: {}, snsRole: {}, snsTopic: {}".format(bucketName, objectName, snsRole, snsTopic))
    # Get textract client
    client = boto3.client('textract')
    response = client.start_document_text_detection(
            DocumentLocation={
                'S3Object': {
                    'Bucket': bucketName,
                    'Name': objectName
                }
            },
            NotificationChannel= {
              "RoleArn": snsRole,
              "SNSTopicArn": snsTopic
           }
        )
    logger.info("Response from textract: {}".format(response))
    return response["JobId"]


def save_error_log(bucketName, objectKey, body):
    '''
    Saved to Error log to bucket
    '''
    s3_client = boto3.client('s3')
    #  Add time ms to file name
    t = time.time()
    file_name = 'error-' + str(int(round(t * 1000))) + '.log'
    s3_client.put_object(Bucket=bucketName, Key=objectKey + file_name, Body=body)


def error_sns_handler(file_name, error_msg):
    '''
    Trigger SNS when got error
    params:
        file_name: file name which got error on process
        error_msg: error message detail
    '''
    logger.info("Trigger SNS on error for file:{}".format(file_name))
    snsTopic = os.environ['NOTIFICATION_ARN']
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=snsTopic,
        Message=json.dumps(error_msg),
        Subject='ProcessPdfToTxt Error on file:' + file_name,
        MessageStructure='json'
    )
    logger.info("Trigger SNS on error done")


def insert_log(source_bucket, target_bucket, file_name, successful):
    '''
    Insert_log function for inserting data into dynamodb table
    '''
    logger.info(f"Insert log with source_bucket: {source_bucket}, target_bucket: {target_bucket}, file_name:{file_name}, successful:{successful}")
    db = boto3.resource('dynamodb')
    table = db.Table(prefixName+'-log')
    create_time = time.strftime('%Y/%m/%d %H:%M:%S',time.localtime(time.time()))
    table.put_item(
        Item={
            'source_bucket': source_bucket,
            'target_bucket': target_bucket,
            'file_name': file_name,
            'successful': successful,
            'create_time': create_time
        }
    )


def update_log(source_bucket, target_bucket, file_name, successful):
    '''
    Update_log function for updating data into dynamodb table
    '''
    logger.info(f"Update log with file_name:{file_name}, successful: {successful}")
    db = boto3.resource('dynamodb')
    table = db.Table(prefixName+'-log')

    response = table.get_item(
        Key={
            "file_name": file_name
        }
    )
    item = response['Item']
    # print(item)

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
    target_bucket =  path_strs[0][:-5] + 'out'
    return target_bucket


def lambda_handler(event, context):
    '''
    Trigger by S3 Notification and start async aws textract job
    '''
    logger.info(f"extractPDF Handler event: {event}")
    # Get S3 bucket info from SQS Records
    s3_data = event['Records'][0]['s3']
    bucketName = s3_data['bucket']['name']
    objectName = urllib.parse.unquote_plus(s3_data['object']['key'], encoding='utf-8') #s3_data['object']['key']
    if not objectName.endswith('.pdf'):
        return
    # Get SNS info from os environ config
    snsTopic = os.environ['TEXTRACT_NOTIFICATION_ARN']
    snsRole = os.environ['ROLE_ARN']

    path, file_name = os.path.split(objectName)
    target_bucket = get_target_bucket(objectName)
    try:
        insert_log(source_bucket=bucketName, target_bucket=target_bucket, file_name=file_name, successful='Inprocess')
        # arn:aws:sns:us-east-2:608494368293:AmazonTextractExtractPDF-dev
        logger.info("Start async job with bucket: {}, object: {}, topic:{}, role:{}".format(bucketName, objectName, snsTopic, snsRole))
        jobId = startAsyncJob(bucketName, objectName, snsTopic, snsRole)
        logger.info("Get textract jobId:{}".format(jobId))
    except Exception as e:
        logger.error("extractPDF Error: {}".format(e))
        update_log(source_bucket=bucketName, target_bucket=target_bucket, file_name=file_name, successful='NO')
        objectKey = prefixName+'/log/error/extractPDF/'
        # Saved to Error log
        save_error_log(bucketName=bucketName, objectKey=objectKey, body="Failed on extractPDF handler Event {} with Error:{}".format(event, e))
        error_sns_handler(file_name, e)
        return {
            'code': 400,
            'msg:': "Failed hanlder extractPDF with Error:{}".format(e)
        }
    return {
        'code': 200,
        'msg': "Success hanlder extractPDF process!"
    }