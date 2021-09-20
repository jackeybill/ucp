import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import time
from datetime import datetime
import decimal
import logging
import re
import hashlib
import os
from ExtractUtils import ExtractUtils

boto3.set_stream_logger('boto3', logging.INFO)

class MetaUtils():
    s3 = boto3.client('s3')
    extractUtils:ExtractUtils = ExtractUtils()
  
    def toISODate(self, str):
        try:
            # revisionDate = "Jun 08, 2011"
            tm = time.strptime(str, '%b %d, %Y')
            strTime = time.strftime("%Y-%m-%dT%H:%M:%SZ", tm) 
            print(strTime)
            return strTime
        except Exception as e:
            print(e)
            return ''
        

    def createMetadata(self, bucket, key):
        item = {}
        item_attributes = {}
        # Get attributes
        #item_attributes['_source_uri'] = sheet.cell_value(j, i).strip()
        #item_attributes['article_source'] = urlparse(sheet.cell_value(j, i).strip()).netloc
        prefixPath, fileName = os.path.split(key)
        path = prefixPath.split('/')
        item_attributes['_category'] = 'FDA'
        item_attributes['drug_name'] = path[-1]
        #item_attributes['_created_at'] = self.convertISODate(str(rep['LastModified']))
        #item_attributes['_last_updated_at'] = self.convertISODate(str(rep['LastModified']))
        item['Title'] = fileName
        if key[-3:].lower() == 'pdf':
            item['ContentType'] = 'PDF'
        else:
            item['ContentType'] = 'HTML'
        item['Attributes'] = item_attributes
        return item

    def createMetadataByXml(self, bucket, key, json_response, filename):
        # Delete Sections
        #rep = s3Client.get_object(Bucket=bucket, Key=key)
        #json_response = json.loads(rep['Body'].read().decode('utf-8'))
        #del json_response['sections']
        # Save metadata 
        #s3_response = save_json(json_response, 'fda-labels-metadata/'+xml_source_url.replace('.xml', '.metadata.xml'))
        #filename = s3_response[1]
        #print('new json_response=', json_response)
        json_response['article_source'] = 'Dailymed'
        json_response['drug_name'] = json_response['genericName']
        json_response['substanceName'] = json_response['substanceName'][:2000]
        # json_response['_document_title'] = json_response['title']
        # Format ISO Date
        json_response['revisionDate'] = self.toISODate(json_response['revisionDate'])
        json_response['marketingDate'] = self.toISODate(json_response['marketingDate'])
        item = {}
        item['ContentType'] = 'PLAIN_TEXT'
        item['Title'] = json_response['title'][:1000]
        del json_response['title']
        del json_response['genericName']
        del json_response['sectionText']
        item['Attributes'] = json_response
        return item
    
    def saveMetadata(self, bucket, key, meta):
        # Key for metadata file on s3  rfi-metadata
        keyName = 'raw-kendra-documents/meta/'+key+'.metadata.json'
        print("Meta bucket:{}, key: {}".format(bucket, keyName))
        # Save Metadata into S3
        return self.s3.put_object(Bucket=bucket, Key=keyName,
                    Body=json.dumps(self.extractUtils.extraDictList(meta)))
        print(meta)