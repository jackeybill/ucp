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


import drug_label
import utils

## import utilities:
from MetaUtils import MetaUtils
from AwsUtils import AwsUtils

logger = logging.getLogger()

awsUtils:AwsUtils = AwsUtils()
metaUtils:MetaUtils = MetaUtils()

def process(bucket, key, configuration):
    
    try:
        prefixes  = key.split("/")
        subfolder = prefixes[-2]
        filename = prefixes[-1]
        
        ## 1. parse xml
        json_response = parse_xml_file(bucket, key)
        logging.info(f"1. parsed json successfully: {key}")
        
        ## 2. save json to s3
        dest_path = configuration.get("S3_DEST_PREFIX_XML","")
        s3_json_filename, json_filename = utils.save_json(json_response,bucket,key,dest_path)
        logging.info(f"2. saved json successfully: {s3_json_filename}")
        
        ## 3. copy to kendra
        kendra_bucket_name = configuration.get("S3_KENDRA_BUCKET_NAME","lly-reg-intel-kendra-index-r1-dev")
        new_json_filepath = configuration.get("S3_KENDRA_XML_PREFIX","raw-kendra-documents/fda-labels/xml-to-json-conversion")
        awsUtils.s3_body_copy(bucket, s3_json_filename, kendra_bucket_name, os.path.join(new_json_filepath,json_filename))
        logging.info(f"3. saved json successfully to kendra bucket location: {os.path.join(new_json_filepath,json_filename)}")
    
        ## 4. extract metadata and copy metadata for kendra
        meta_response = json_response.copy()
        meta = metaUtils.createMetadataByXml(bucket, key, meta_response, "")
        metaUtils.saveMetadata(kendra_bucket_name, os.path.join("fda-labels/xml-to-json-conversion",json_filename), meta)
        logging.info(f"4. extracted and saved metadata into kendra bucket: {meta}")
    
        ## 5. build metadata to save in dynamoDB - for data lineage
        setid = json_response.get('setId','')
        source_url = "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={}".format(setid)
        
        documentId = json_response.get('documentId','')
        metadata  = {'name':filename, 
                     'drug_name': json_response.get('drugName',''), 
                     'documentId':documentId, 
                     'title':json_response.get('title',''),
                     'source': "dailyMed",
                     'source_url':source_url,
                     's3_raw':key,
                     'format':'xml',
                     'splId':setid
                     
                    }
        
        logging.info(f"5. metadata for dynamoDB: {meta}")
        return metadata
        
    except Exception as ex:
        logging.error(traceback.format_exc())
        raise Exception("Exception has occurred was processing xml" + ex.message)

## Helper functions
def parse_xml_file(bucket, key):
    """
    Method to parse xml to json
    """
    try:
        S3_CLIENT = boto3.client('s3')
        response = S3_CLIENT.get_object(Bucket=bucket, Key=key)
        xml_string = response['Body'].read()
        logging.info(f"XML file is read: {len(xml_string)}")
        
        clean_xml_string = utils.remove_prefixes(xml_string)
        dl = drug_label.DrugLabel(clean_xml_string)
        json_response = dl.process()
        
        return json_response
        
    except Exception as ex:
        logging.error(ex)
        raise Exception("Error occurred while parsing xml")