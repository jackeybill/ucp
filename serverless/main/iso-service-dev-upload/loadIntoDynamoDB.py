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
from utils import load_osenv,get_html_title, get_pages
from extract_metadata import get_metadata_pdf,get_metadata_html,get_metadata_xml, make_id


## initialize logging
logger =  logging.getLogger()
formatter = logging.Formatter('[%(asctime)s)] %(filename)s:%(lineno)d} %(levelname)s - %(message)s')
logger.setLevel(logging.INFO)
logger.handlers[0].setFormatter(formatter)

## load configuration
configuration = load_osenv()
logging.info(f"read configuration:{len(configuration)}")

## services
S3_CLIENT = boto3.client('s3')
S3_resource = boto3.resource('s3')
DB_CLIENT = boto3.resource('dynamodb')

tableName = "reg_intel_dev_temp"

def lambda_handler(event, context):
    """
    Method load dynamoDb with list of files
    
    :param event
    :param context
    
    """
    try:
        
        if "Records" in event:
            item = process(event)
            if len(item)>0:
                write_to_dynamodb(item)
    except Exception as ex:
        
        logging.error("Exception occurred while processing event" + traceback.format_exc())
        return {
                'statusCode': 500,
                'body': json.dumps("error occurred while processing xml")

            }
        
    
    return {    
        'statusCode': 200,
        'body': json.dumps("successfully parsed record and record has been logged into db")
    }
    

def process(event):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        
        
        prefixes  = key.split("/")
        subfolder = prefixes[-2]
        filename = prefixes[-1]
                
        if filename.endswith(".xml"):
            ## extract xml metadata
            metadata = get_metadata_xml(bucket,key)
        elif filename.endswith(".html"):
            ## html metadata
            metadata = get_metadata_html(bucket,key)
        elif filename.endswith(".pdf"):
            # extract pdf metadata
            metadata = get_metadata_pdf(bucket,key)
        else:
            logging.error(f"metadata not extracted, extension not found:{filename}")
            metadata = {}
            
        print(metadata)
            
        
    logging.info(f" metadata extracted: {metadata}")
    return metadata
            
def write_to_dynamodb(item):
    table = DB_CLIENT.Table(tableName)
    
    logger.info(f"Insert record into dynamodb: {item['s3_raw']}")
    create_time = time.strftime('%Y/%m/%d %H:%M:%S',time.localtime(time.time()))
    
    s3_raw = item.get("s3_raw")
    table.put_item(Item = {
        'id': make_id(),
        'name':item["name"],
        'drug_name':item["drug_name"] if item["drug_name"]!="" else s3_raw,
        'title':item["title"] if item["title"]!="" else s3_raw,
        'source':item["source"] if item["source"]!="" else s3_raw,
        'source_url': item["source_url"] if item["source_url"]!="" else s3_raw,
        's3_raw':s3_raw,
        'format':item.get("format"),
        'last_update':create_time
    })
    
    
    
        
    
    
