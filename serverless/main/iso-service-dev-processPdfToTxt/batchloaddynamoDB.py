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
import datetime

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
        metadata = read_data()
        logging.info("read metadata:{}".format(len(metadata)))
        print(len(metadata))
        save_data_dynamoDB(metadata)
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }
    except Exception as ex:
        logging.error("Exception occurred while processing event" + traceback.format_exc())
        return 
    
def read_data():
    """
    Get metadata from csv file
    
    """
    s3_filepath = "reg-intel-service-dev/reg-intel-data-source/tmp/es_data.csv"
    s3_bucketname = "lly-reg-intel-raw-zone-dev"
    
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
            print(row)
            
            continue
        
        ## if the row is empty
        if len(row)==0:
            continue
        
        documentId  = row[0]
        # ['ids', 'names', 'drug_name', 'title', 'bucket_name', 'format', 's3_raw', 's3_enrich_in', 's3_enrich_out', 'source', 'source_urls']
        create_time = datetime.datetime.now().isoformat()
        if row[0] not in metadata:
            metadata[row[0]] = {
                'id':row[0],
                'name' : row[1],
                'drug_name':row[2],
                'title':row[3],
                'bucket_name':row[4],
                'format':row[5],
                's3_raw':row[6],
                's3_enrich_in':row[7],
                's3_enrich_out':row[8],
                'source':row[9],
                'source_url':row[10],
                'create':create_time,
                'last_update':create_time
                
            }
        else:
            print(row[0] + "duplicate record exists")
            continue
        
    return metadata
 
def save_data_dynamoDB(data):
    tableName = "reg_intel_dev_lens"
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(tableName)
    
    with table.batch_writer() as batch:
        for k, v in data.items():
            s3_raw = v.get('s3_raw','')
            if s3_raw=="":
                print(v)
                continue
            table.put_item(Item = v)
            return