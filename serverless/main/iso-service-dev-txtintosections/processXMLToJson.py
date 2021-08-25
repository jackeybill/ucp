#!/usr/bin/env python

import boto3
import json
import time
import os
import logging
from botocore.exceptions import ClientError
from urllib.parse import unquote_plus
from utils import remove_prefixes
from drug_label import DrugLabel
from MetaUtils import MetaUtils
from utils import load_osenv, initialize_logger, get_json_filename


# Initialize logging
logger = logging.getLogger()
initialize_logger()

# Read configuration
config = load_osenv()

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
metaUtils:MetaUtils = MetaUtils()

def lambda_handler(event, context):

    # Event from s3
    logging.info("Received event:" + json.dumps(event))

    # parse xml file
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        # process the metadata with pdf/html files
        if key[-3:].lower() != 'xml':
            meta = metaUtils.createMetadata(bucket, key)
            metaUtils.saveMetadata(bucket, key, meta)
            return

        response = parse_xml_file(bucket, key)

        if not response[0]:
            return {
                'statusCode': 500,
                'body': json.dumps("error occurred while processing xml")
            }

        # save json to s3 bucket
        json_response = response[1]
        xml_source_url = response[2]

        # Save Sections
        s3_response = save_json(json_response['sections'], xml_source_url)
        
        if not s3_response[0]:
            return {
                'statusCode': 500,
                'body': json.dumps("error occurred while saving to s3")
            }
        # Delete Sections
        del json_response['sections']
        # Save metadata
        meta = metaUtils.createMetadataByXml(bucket, key, json_response, s3_response[1])
        metaUtils.saveMetadata(bucket, s3_response[1], meta)
        # save to dynamodb
        # save_to_dynamodb({"source_url":xml_source_url,"json_url":s3_response[1]})

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }


def parse_xml_file(bucket, key):
    """
    Method to parse xml to json
    """
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        xml_string = response['Body'].read()
        logging.info(f"XML file is read: {len(xml_string)}")

        source_url = key

        clean_xml_string = remove_prefixes(xml_string)
        dl = DrugLabel(clean_xml_string)
        json_response = dl.process()

        #logging.info(f"XML file was successfully parsed", extra_data={
        #             "json_response": len(json_response)})

        return (True, json_response, source_url)

    except Exception as ex:
        # tb = traceback.format_exc()
        # logging.error(tb)
        logging.error("Error occurred while parse_xml_file", ex)
        return (False, None, None)


def save_json(data, src_xml_url):
    """
    Method to save json parsed data to s3

    """
    s3_json_bucket = config.get("BUCKET_PREFIX_JSON", "")
    s3_bucket_name = config.get("BUCKET_NAME", "")
    filename = get_json_filename(src_xml_url, s3_json_bucket)

    try:
        # Save result in json format
        s3.put_object(Bucket=s3_bucket_name,
                      Key=filename, Body=json.dumps(data))
        #logging.info(f" Successfully saved the data to s3 bucket",
        #             extra_data={"s3_url": filename})
        return (True, filename)

    except ClientError as e:
        logging.error("Error occurred while saving to s3", e)
        return (False, None)


# def save_to_dynamodb(source_url, json_url):
    # tablename = config.get("DYNAMODB_TABLE","")
    # response = table.scan(ProjectionExpression='id')
