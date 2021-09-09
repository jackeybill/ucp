import json
import urllib
from datetime import date
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bucket_name = 'ucp-filebucket-dev'

def lambda_handler(event, context):
    s3_client = boto3.client('s3')
    directory_name="ucp-filebucket-dev/RawDocuments"
    s3_client.put_object(Bucket=bucket_name, Key=(directory_name+'/'))  
    logger.info("Folder created")