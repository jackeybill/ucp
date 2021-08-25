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
import re

import dbUtils
import utils

## Initialize logging
logger =  logging.getLogger()
utils.initialize_logger()

# Read configuration
configuration =  utils.load_osenv()
logging.info(f"read configuration:{len(configuration)}")


# initialize AWS services
S3_CLIENT = boto3.client('s3')
S3_RESOURCE = boto3.resource('s3')
COMPREHEND_MEDICAL_CLIENT = boto3.client('comprehendmedical')
tableName = os.getenv("TABLE_NAME","")
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
            name, s3_enrich_in, s3_enrich_out = process(event)
            logging.info(f"Name:{name}")
            ## update record in dynamoDB
            db = dbUtils.DbUtils(configuration.get("TABLE_NAME",""),DB_RESOURCE, DB_CLIENT,logger)
            db.update_record(name, s3_enrich_in, s3_enrich_out)

        return {    
            'statusCode': 200,
            'body': json.dumps("successfully parsed record and record has been logged into db")
        }
        
    except Exception as ex:
        logging.error("Exception occurred while processing event" + traceback.format_exc())
        
        return {
            'statusCode': 500,
            'body': json.dumps("error occurred while processing xml")
            }
        
    
def process(event):
    
    try:
        ## extract bucket and prefix
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = unquote_plus(event['Records'][0]['s3']['object']['key']) 
        
        ## extract xml, html prefix
        xml_input_prefix = os.getenv("BUCKET_PREFIX_XML_INPUT")
        html_input_prefix = os.getenv("BUCKET_PREFIX_HTML_INPUT")
        
        ## check the folder
        parts = key.split("/")
        subfolder = parts[-2]
        name = os.path.basename(key)
        
        response = S3_CLIENT.get_object(Bucket=bucket,  Key=key)
        content = response['Body'].read().decode('utf-8')
        json_content = json.loads(content)
        
        filename, extension = os.path.splitext(name)
        dynamoDB_filename = filename
        
        if subfolder.lower() == xml_input_prefix.lower():
            text_content = json_content.get("sectionText","") 
            save_path = os.getenv("BUCKET_PREFIX_XML_OUTPUT","")
            dynamoDB_filename+=".xml"
            filetype = "json"
            
        elif subfolder.lower() == html_input_prefix.lower():
            text_content = json_content.get("text","")
            save_path = os.getenv("BUCKET_PREFIX_HTML_OUTPUT","")
            dynamoDB_filename+=".html"
            filetype = "json"
            
        ## call medical comprehend on pdf txt
        elif extension==".txt":
            
            
        else:
            text_content = ""
            logging.error(f"Couldnot   process medical comprehend as subfolder couldnt infer:{subfolder}")
            return 
            
        if len(text_content)>0:
            output = run_medical_comprehend(text_content, filetype)
        else:
            output = {}
            
        
        ## save output
        s3_enrich_out = save_comprehend_output(bucket, save_path, filename, output)
        logging.info(f" Processed: {name}")
        
        return dynamoDB_filename, key, s3_enrich_out
        
    except Exception as ex:
        logging.error("Error occurred why processing and medical comprehend", ex)
        raise Exception("error occurred while processing medical comprehend")

def run_medical_comprehend(text):
    """
    run medical comprehend on text and return entities
    """
    text_blocks = get_text_blocks(text)
         
    entities_result = []   
    entities_result = []
    icd10_result = []
    rx_result = []
    
    for c in text_blocks:
        logging.info(c)
        resultEntitiy = COMPREHEND_MEDICAL_CLIENT.detect_entities_v2(Text=c)
        entities_result.append(resultEntitiy)

        icd10Entitiy = COMPREHEND_MEDICAL_CLIENT.infer_icd10_cm(Text=c)
        icd10_result.append(icd10Entitiy)

        rxEntitiy = COMPREHEND_MEDICAL_CLIENT.infer_rx_norm(Text=c)
        rx_result.append(rxEntitiy)
        
    
    ## talk to Min -
    return   { 
            "annotatedOutput": entities_result, 
            'InferRxNorm': icd10_result, 
            'InferICD10CM':rx_result}

def get_text_blocks(text):
    """
    method to retrieve sentences, construct text blocks
    
    :param text str
    
    :return text blocks for medical comprehend
    
    """
    logging.info(text)
    
    text = text.encode('ascii','ignore').decode('utf-8')
    text = re.sub("\s\s+", " ", text)
    sentences = text.split("\n")
    text_blocks = []
    limit = 5000
    
    if len(sentences) > 0:
        ## text blocks are smaller than 8000 bytes
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) <= limit and len(sentence)>0:
                text_blocks.append(sentence)
            else:
                if len(sentence) <=0:
                    continue 
                
                start = 0
                end = len(sentence)
                while start < end:
                    text_blocks.append(sentence[start:start+limit])
                    start = start + limit
                
        return text_blocks    

def save_comprehend_output(bucket_name, prefix, filename, response):
    out_filename = os.path.join(prefix,filename+".json")
    
    response = S3_CLIENT.put_object(Bucket=bucket_name, Key=out_filename, 
        Body=json.dumps(response))
    
    logging.info(f"processed and saved file:{out_filename}")
    return out_filename