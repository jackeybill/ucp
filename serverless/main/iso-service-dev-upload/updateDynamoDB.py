#!/usr/bin/env python3

import boto3
from botocore.exceptions import ClientError

import json
import time
import datetime
import os
import logging
import urllib.parse
import traceback
import pprint 
from collections import namedtuple
from urllib.parse import urlparse, unquote_plus

from boto3.dynamodb.conditions import Key, Attr

## initialize logging
logger =  logging.getLogger()
formatter = logging.Formatter('[%(asctime)s)] %(filename)s:%(lineno)d} %(levelname)s - %(message)s')
logger.setLevel(logging.INFO)
logger.handlers[0].setFormatter(formatter)

## services
S3_CLIENT = boto3.client('s3')
S3_resource = boto3.resource('s3')
DB = boto3.resource('dynamodb')

tableName = "reg_intel_dev_temp"


mapping = {
    "comprehend-input": "pdf",
    "xml-to-json-conversion":"xml",
    "html-to-json-conversion": "html"
}

def lambda_handler(event, context):
    process(event)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }

def process(event):
    record = event['Records'][0]

    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])
    
    prefixes  = key.split("/")
    subfolder = prefixes[-2]
    file = prefixes[-1]
    
    filename, extension = os.path.splitext(file)
    
    ## extension - txt - pdf, json -> html or xml
    if extension==".txt":
        logging.info("update dynamodb with pdf - s3_enrich_in")
        subfolder = prefixes[-3]
    else:
        logging.info("update dynamodb with html or xml - s3_enrich_in")
        print("html, xml")
        
    raw_file_format = mapping.get(subfolder, "")
    logging.info(f"format: {raw_file_format}")
    print(raw_file_format)
    
    response = update_dynamodb(bucket, key,filename , raw_file_format)
    
    return response
            

def update_dynamodb(bucket, key,filename, raw_file_format):
    #logger.info(f"Update dynamodb with s3_enrich_in:{key}")
    last_update = time.strftime('%Y/%m/%d %H:%M:%S',time.localtime(time.time()))
    
    table = DB.Table(tableName)
    
    
    # Get exit item
    response = table.scan(FilterExpression=Attr('name').eq(filename + "." + raw_file_format))
    
    item = response['Items'][0]
    print(item)
    logger.info("got file from db: {}".format(item))
    
    
    # Update item in db
    
    response = table.update_item(
        Key={
            'id': int(item['id']),
            'name':item['name']
        },
        UpdateExpression="set  s3_enrich_in =:s3_enrich_in, last_update=:ut",
        ExpressionAttributeValues={
            ':s3_enrich_in': key,
            ':ut': last_update
        } )
    
    logger.info("Finished update record {}".format(json.dumps(response)))
    print("update completed")
    return 
                
    

        