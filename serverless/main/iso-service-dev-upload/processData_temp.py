#!/usr/bin/env python

import boto3
import json
import time
import os
import logging
from botocore.exceptions import ClientError
from urllib.parse import unquote_plus
from bs4 import BeautifulSoup
import traceback

import re

## import utilities
import utils
import dbUtils
import processXML
import processHTML
import processPDF
import processExcel

## Initialize logging
logger =  logging.getLogger()
utils.initialize_logger()

# Read configuration
configuration =  utils.load_osenv()
logging.info(f"read configuration:{len(configuration)}")

DB_RESOURCE = boto3.resource('dynamodb')
DB_CLIENT = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
     Method load dynamoDb with list of files
    
    :param event
    :param context
    
    """
    try:
        
        if "Records" in event:
            metadata = process(event)
            if len(metadata)>0:
                db = dbUtils.DbUtils(configuration.get("TABLE_NAME",""),DB_RESOURCE, DB_CLIENT,logger)
                db.insert_record(metadata)
                
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
    try:
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        
        
        prefixes  = key.split("/")
        subfolder = prefixes[-2]
        filename = prefixes[-1]
                
        if filename.endswith(".xml"):
            metadata = processXML.process(bucket,key,configuration)
            
        elif filename.endswith(".html") or filename.endswith(".htm"):
            metadata = processHTML.process(bucket,key,configuration)
                    
        elif filename.endswith(".pdf"):
            metadata = processPDF.process(bucket,key,configuration)

        elif filename.endswith(".xlsx"):
            metadata = processExcel.process(bucket,key,configuration)
            
        else:
            logging.error(f"metadata not extracted, extension not found:{filename}")
            metadata = {}
            
        if len(metadata)>0:
            metadata['bucket_name'] = bucket
            
        return metadata
        
    except Exception as ex:
        logging.error(f"error while parsing and extracting metadata:{key}")
        raise Exception(f"Error parsing and extracting metadata:{key}")
        

