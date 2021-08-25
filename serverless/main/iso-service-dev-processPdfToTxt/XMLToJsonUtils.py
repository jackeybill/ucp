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
from utils import load_osenv, initialize_logger, get_json_filename

class XMLToJsonUtils():
    # Initialize logging
    logger = logging.getLogger()
    initialize_logger()

    # Read configuration
    config = load_osenv()

    # Initialize AWS services
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')

    def toJson(self, bucket, key):
        print("XMLToJsonUtilsbucket:{}, key:{}".format(bucket, key))
        response = self.parse_xml_file(bucket, key)
        if response[0]:
            json_response = response[1]
            xml_source_url = response[2]

            # Save Sections
            s3_response = self.save_json(json_response['sections'], xml_source_url)
            if s3_response[0]:
                return json_response, s3_response[1]
                # save to dynamodb
                # save_to_dynamodb({"source_url":xml_source_url,"json_url":s3_response[1]})
        return None, None

    def parse_xml_file(self, bucket, key):
        """
        Method to parse xml to json
        """
        try:
            response = self.s3.get_object(Bucket=bucket, Key=key)
            xml_string = response['Body'].read()
            self.logger.info(f"XML file is read: {len(xml_string)}")

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
            self.logger.error("Error occurred while parse_xml_file", ex)
            return (False, None, None)


    def save_json(self, data, src_xml_url):
        """
        Method to save json parsed data to s3

        """
        s3_json_bucket = self.config.get("BUCKET_PREFIX_JSON", "")
        s3_bucket_name = self.config.get("BUCKET_NAME", "")
        filename = get_json_filename(src_xml_url, s3_json_bucket)

        try:
            # Save result in json format
            self.s3.put_object(Bucket=s3_bucket_name,
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
