#!/usr/bin/env python

import boto3
import json
import time
import os
import logging
from botocore.exceptions import ClientError
from urllib.parse import unquote_plus
import traceback

import re

## import utilities
import txttocomprehend
import utils
import dbUtils

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

tableName = configuration.get("TABLE_NAME","")

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
        ## extract bucket and prefix
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = unquote_plus(event['Records'][0]['s3']['object']['key']) 
        # s3://lly-reg-intel-raw-zone-dev/reg-intel-service-dev/comprehend-input/Adcetris (brentuximab vedotin)/default.aspx.json
        #bucket = 'lly-reg-intel-raw-zone-dev'
        #key = 'reg-intel-service-dev/comprehend-input/Adcetris (brentuximab vedotin)/default.aspx.json'
        
        ## check the folder
        parts = key.split("/")
        
        name = os.path.basename(key)
        filename, extension = os.path.splitext(name)
            
        dynamoDB_filename  = ""
        s3_enrich_out = ""
        if extension == ".json":
            ## extract xml, html prefix
            xml_input_prefix = os.getenv("BUCKET_PREFIX_XML_INPUT")
            html_input_prefix = os.getenv("BUCKET_PREFIX_HTML_INPUT")
            
            subfolder = parts[-2]
            
            response = S3_CLIENT.get_object(Bucket=bucket,  Key=key)
            content = response['Body'].read().decode('utf-8')
            json_content = json.loads(content)
            
            dynamoDB_filename = filename
            text_content = ""
            
            if subfolder.lower() == xml_input_prefix.lower():
                text_content = json_content.get("sectionText","") 
                save_path = os.getenv("BUCKET_PREFIX_XML_OUTPUT","")
                dynamoDB_filename+=".xml"
            else:
                text_content = json_content.get("text","")
                save_path = os.getenv("BUCKET_PREFIX_HTML_OUTPUT","")
                dynamoDB_filename+=".html"
            
            if len(text_content)>0:
                output = run_medical_comprehend(text_content)
            else:
                output = {}
            
            ## save output
            s3_enrich_out = os.path.join(save_path,filename+".json")
            response = S3_CLIENT.put_object(Bucket=bucket, Key=s3_enrich_out, 
                Body=json.dumps(output))
    
            logging.info(f"processed and saved file:{s3_enrich_out}")
            logging.info(f" Processed: {name}")
            
        elif extension == ".txt":
            s3_enrich_out = txttocomprehend.segment_content(bucket, key)
            dynamoDB_filename = filename
            
        else:
            logging.info(f"Extension not found:{extension}")
            
        return dynamoDB_filename, key, s3_enrich_out
        
    except Exception as ex:
        logging.error(f"Error:{traceback.format_exc()}")
        raise Exception(ex.message)
        

def run_medical_comprehend(text):
    """
    run medical comprehend on json text entities
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
    
    #text = text.encode('ascii','ignore').decode('utf-8')
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