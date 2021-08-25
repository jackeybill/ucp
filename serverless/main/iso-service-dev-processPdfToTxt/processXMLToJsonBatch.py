#!/usr/bin/env python

import boto3
from botocore.exceptions import ClientError

import json
import time
import os
import logging
import urllib.parse
import traceback

from utils import load_osenv, initialize_logger, remove_prefixes,get_json_filename
from drug_label import DrugLabel
# from db_model import DbModel
from ExtractUtils import ExtractUtils

## Initialize logging
logger =  logging.getLogger()
initialize_logger()

# Read configuration
config =  load_osenv()

# Initialize AWS services
s3 = boto3.client('s3')
extractUtils:ExtractUtils = ExtractUtils()

def toISODate(str):
    try:
        # revisionDate = "Jun 08, 2011"
        tm = time.strptime(str, '%b %d, %Y')
        strTime = time.strftime("%Y-%m-%dT%H:%M:%SZ", tm) 
        print(strTime)
        return strTime
    except Exception as ex:
        print(ex)
        return ''
    
def lambda_handler(event, context):
    """
    """
    print("Event: {}".format(event))
    sqs_url = os.environ['SQSURL']
    for record in event['Records']:
        print("record:{}".format(record))
        bucket='lly-reg-intel-raw-zone-dev'
        prefix='reg-intel-service-dev/reg-intel-data-source/fda-labels/XML'
        payload=record["body"]
        print("payload: {}".format(payload))
        
        paginator = s3.get_paginator('list_objects')
        page_iterator = paginator.paginate(Bucket=bucket, Prefix=prefix, PaginationConfig={'PageSize': 300})
            
        if payload == 'start':
            sqs_client = boto3.client('sqs')
            total = 0
            for item in page_iterator:
                total += 1

            # total = len(page_iterator)
            print('total=', total)
            #return
        
            pages = []
            for i in range(total):
                pages.append(i)
            step = 1
            for i in range(0, len(pages), step):
                    # page_data = pages[i:i+step]
                    page_data = {
                        'page_start': i,
                        'page_end': i+step
                    }
                    print("Send body:{}".format(json.dumps(page_data)))
                    response = sqs_client.send_message(
                        QueueUrl=sqs_url,
                        MessageBody=json.dumps(page_data)
                    )
                    print(response)
                    #break
        elif json.loads(payload)['page_start'] >= 0:
            page_info = json.loads(payload)
            print(page_info)
            page_start = page_info['page_start']
            page_end = page_info['page_end']
            
            # response = parse_xml_file(bucket, prefix+'/12ea06ba-cf81-4622-8811-a4b2706dec07.xml')
            # print(response)
            # return
            total = 0
            print("page start:{}".format(page_start))
            index = 0
            for page in page_iterator:
                #print(index)
                # print(len(page['Contents']))
                if index < page_start or index > page_end:
                    index +=1
                    continue
                
                index +=1
                for item in page['Contents']:
                    if item['Key'][-3:] == 'xml':
                        total +=1
                        key = item['Key']
                        response = parse_xml_file(bucket, key)
                        if not response[0]:
                            print('Error on processing xml:{}'.format(key))
                            # return {
                            #     'statusCode': 500,
                            #     'body': json.dumps("error occurred while processing xml on {}".format(key))
                                
                            # }
                            continue
                            
                        # save json to s3 bucket
                        json_response = response[1]
                        xml_source_url = response[2]
                        
                        # Save Sections
                        if not 'sections' in json_response:
                            print('[ERROR] xml_source_url=', xml_source_url,';json_response:', json_response)
                            continue
                        
                        #continue
                    
                        s3_response = save_json(json_response['sections'], xml_source_url)
                        # Delete Sections
                        del json_response['sections']
                        # Save metadata 
                        #s3_response = save_json(json_response, 'fda-labels-metadata/'+xml_source_url.replace('.xml', '.metadata.xml'))
                        filename = s3_response[1]
                        #print('new json_response=', json_response)
                        json_response['article_source'] = 'Dailymed'
                        json_response['drug_name'] = json_response['genericName']
                        json_response['substanceName'] = json_response['substanceName'][:2000]
                        # json_response['_document_title'] = json_response['title']
                        # Format ISO Date
                        json_response['revisionDate'] = toISODate(json_response['revisionDate'])
                        json_response['marketingDate'] = toISODate(json_response['marketingDate'])
                        item = {}
                        item['ContentType'] = 'PLAIN_TEXT'
                        item['Title'] = json_response['title'][:1000]
                        del json_response['title']
                        del json_response['genericName']
                        
                        item['Attributes'] = json_response
                        
                        # to new-test-metadata folder
                        s3.put_object(Bucket='lly-reg-intel-kendra-index-r1-dev', 
                            Key='new-test-metadata/'+filename+'.metadata.json', 
                            Body=json.dumps(extractUtils.extraDictList(item)))
                        
                        if not s3_response[0]:
                            print("Error on saving s3: {}".format(key))
                            # return {
                            #     'statusCode': 500,
                            #     'body': json.dumps("error occurred while saving to s3")
                            # }
                    #break
                #break
        
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
        #logging.info(f"XML file is read: {len(xml_string)}")
        
        source_url = key 
        
        clean_xml_string = remove_prefixes(xml_string)
        dl = DrugLabel(clean_xml_string)
        json_response = dl.process()
        
        #logging.info(f"XML file was successfully parsed")
        
        return (True, json_response, source_url)
        
    except Exception as ex:
        tb = traceback.format_exc()
        print(tb)
        return (False, None, None)
    
    
def save_json(data,src_xml_url):
    """
    Method to save json parsed data to s3
    
    """
    s3_json_bucket = config.get("BUCKET_PREFIX_JSON","")
    s3_bucket_name =  config.get("BUCKET_NAME","")
    filename = get_json_filename(src_xml_url,s3_json_bucket)
    
    try:
        #s3.put_object(Bucket=s3_bucket_name, Key=filename, Body=json.dumps(data))   
        #logging.info(f" Successfully saved the data to s3 bucket")
        return (True, filename)
    
    except ClientError as e:
        
        logging.error("Error occurred while saving to s3",e)
        return (False, None)