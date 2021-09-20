#!/usr/bin/env python3

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
import extract_metadata

import utils

## import utilities:
from AwsUtils import AwsUtils

logger = logging.getLogger()

awsUtils:AwsUtils = AwsUtils()

def process(bucket, key, configuration):
    
    try:
        prefixes  = key.split("/")
        subfolder = prefixes[-2]
        filename = prefixes[-1]
        
        ## 1. parse html
        # s3://lly-reg-intel-raw-zone-dev/reg-intel-service-dev/reg-intel-data-source/rfi-documents/Adcetris (brentuximab vedotin)/default.aspx.html
        json_response = parse_html_file(bucket, key)
        logging.info(f"1. parsed json successfully: {key}")
        
        ## 2. save json to s3
        dest_path = configuration.get("S3_DEST_PREFIX_HTML","reg-intel-service-dev/comprehend-input")
        s3_json_filename, json_filename = utils.save_json(json_response,bucket,key,os.path.join(dest_path, subfolder))
        logging.info(f"2. saved json successfully: {s3_json_filename}")
        
        ## 3. copy to kendra
        kendra_bucket_name = configuration.get("S3_KENDRA_BUCKET_NAME","lly-reg-intel-kendra-index-r1-dev")
        new_filepath = configuration.get("S3_KENDRA_HTML_PREFIX","raw-kendra-documents/rfi-documents")

        awsUtils.s3_body_copy(bucket, key, kendra_bucket_name, os.path.join(new_filepath, subfolder, filename))
        logging.info(f"3. saved json successfully to kendra bucket location: {os.path.join(new_filepath,filename)}")
    
       
        
        
        ## 4. extract metadata and copy metadata for kendra - Talk to Vatsal
        # s3://lly-reg-intel-raw-zone-dev/reg-intel-service-dev/meta/rfi-documents/Adcetris (brentuximab vedotin)/default.aspx.html.metadata.json
        new_key = os.path.join("meta","rfi-documents",subfolder,filename)
        new_key += '.metadata.json'
        awsUtils.s3_body_copy(bucket, 'reg-intel-service-dev/'+new_key, kendra_bucket_name,'raw-kendra-documents/'+new_key)
        logging.info(f"4. extracted and saved metadata into kendra bucket:{new_key}")
        
        ## 5. build metadata to save in dynamoDB - for data lineage
        metadata  = {'name':filename, 
            'drug_name': os.path.splitext(filename)[0], 
            'title':json_response.get("title",""),
            'source': json_response.get("source",""),
            'source_url':json_response.get("url",""),
            's3_raw':key,
            'format':'html'
            }
              
        logging.info(f"5. metadata for dynamoDB: {metadata}")
        
        return metadata
        
    except Exception as ex:
        logging.error(traceback.format_exc())
        raise Exception("Exception has occurred was processing xml" + ex.message)

## Helper functions
def parse_html_file(bucket,key):
    prefixes = key.split("/")
    filename = prefixes[-1]
    
    S3_CLIENT = boto3.client('s3')

    response = S3_CLIENT.get_object(Bucket=bucket,  Key=key)
    logger.info('Reading {} from {}'.format(key, bucket))
    
    ## blacklist
    blacklist = [
	'[document]',
	'noscript',
	'header',
	'html',
	'meta',
	'head', 
	'input',
	'script','style', 'link'
	]
    
    ## read content from the response
    content = response['Body'].read().decode('utf-8')
    soup = BeautifulSoup(content, "html.parser")
    output = {}
    text = soup.find_all(text=True)
    
    title = soup.find('title')
    if title!=None:
        title = title.text
    else:
        title = ""
        
    result= ""
    for t in text:
        if t.parent.name not in blacklist:
            result += '{} '.format(t)           
    
    url = ""
    url = soup.find("meta",  property="og:url")
    if url is not None:
        url = url['content']
    else:
        url = ''
    
    logging.info(url if url!='' else "No meta url given")
    
    output["title"] = title
    output["text"] = result
    output["url"] = re.escape(url) if url!='' else ''
    output["source"] = extract_metadata.get_source_from_url(filename)
        
    return output