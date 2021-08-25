#!/usr/bin/env python3

import boto3
import json
import time
import os
import logging
from botocore.exceptions import ClientError
from urllib.parse import unquote_plus
import traceback
import csv

import re

## import utilities
import dbUtils

## Initialize logging
logger =  logging.getLogger()


# initialie AWS
DB_RESOURCE = boto3.resource('dynamodb')
DB_CLIENT = boto3.client('dynamodb')

S3_RESOURCE = boto3.resource('s3')
S3_CLIENT = boto3.client('s3')

def lambda_handler(event, context):
    """
    event 
    """
    try:
        metadata = read_metadata()
        logging.info("read metadata:{}".format(len(metadata)))
        
        save_metadata_dynamoDB(metadata)
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }
    except Exception as ex:
        logging.error("Exception occurred while processing event" + traceback.format_exc())
        return 
    
def read_metadata():
    """
    Get metadata from csv file
    
    """
    s3_filepath = os.getenv("S3_PREFIX_CSV","")
    s3_bucketname = os.getenv("BUCKET_NAME","")
    
    response = S3_CLIENT.get_object(Bucket=s3_bucketname,  Key=s3_filepath)
    
    ## read content from the response
    content = response['Body'].read().decode('utf-8')
    lines = content.split("\n")
    logging.info("Read csv file, no of lines:{}".format(len(lines)))
    header = True
    
    metadata = {}
    csv_reader = csv.reader(lines,delimiter=",",quotechar='"')
    for row in csv_reader:
        if header:
            header=False
            continue
        
        ## if the row is empty
        if len(row)==0:
            continue
        
        documentId  = row[0]
        if row[0] not in metadata:
            metadata[row[0]] = {
                'document_id':row[0],
                'brand_name' : row[1],
                'generic_name':row[2],
                'manufacturer':row[3],
                'pos_neg_study':row[4],
                'tagged_sentences':row[5]
                
            }
        else:
            print(row[0] + "duplicate record exists")
            continue
        
    return metadata
 
def save_metadata_dynamoDB(metadata):
    tableName = "reg_intel_dev_rule_metadata"
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(tableName)
    
    with table.batch_writer() as batch:
        for k, v in metadata.items():
            documentId = v.get('document_id','')
            if documentId=="":
                continue
            table.put_item(Item = v)