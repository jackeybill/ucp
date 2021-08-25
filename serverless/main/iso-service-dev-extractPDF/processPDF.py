#!/usr/bin/env python3

import boto3
import json
import time
import os
import logging
from botocore.exceptions import ClientError
from urllib.parse import unquote_plus
import traceback
import re
import extract_metadata

import utils

## import utilities:
from AwsUtils import AwsUtils

logger = logging.getLogger()

awsUtils:AwsUtils = AwsUtils()

def process(bucket, key, configuration):
    # 1. extract metadata
    S3_RESOURCE = boto3.resource('s3')
    obj = S3_RESOURCE.Object(bucket, key)
    metadata = extract_metadata.get_metadata_pdf(obj,key)
    
    ## 2. save json to raw documents folder
    prefixes = key.split("/")
    
    path = "/".join(prefixes[-2:])
    new_object_name = os.path.join(configuration.get("S3_PDF_RAW_DOCUMENTS_PREFIX",""),path)
    awsUtils.s3_body_copy(bucket, key, bucket, new_object_name)
    
    ## 3. copy to kendra
    kendra_bucket_name = configuration.get("S3_KENDRA_BUCKET_NAME","lly-reg-intel-kendra-index-r1-dev")
    new_filepath = configuration.get("S3_KENDRA_PDF_PREFIX","raw-kendra-documents/rfi-documents")

    awsUtils.s3_body_copy(bucket, key, kendra_bucket_name, os.path.join(new_filepath,path))
    logging.info(f"3. saved json successfully to kendra bucket location: {os.path.join(new_filepath,path)}")
    
    
    
    ## 4. extract metadata and copy metadata for kendra - Talk to Vatsal
    new_key = os.path.join("meta","rfi-documents",prefixes[-2],os.path.basename(key))
    new_key += '.metadata.json'
    awsUtils.s3_body_copy(bucket, 'reg-intel-service-dev/'+new_key, kendra_bucket_name, 'raw-kendra-documents/'+new_key)
    logging.info(f"4. extracted and saved metadata into kendra bucket:{new_key}")
    
    logging.info(f"returning metadata")
    return metadata
    