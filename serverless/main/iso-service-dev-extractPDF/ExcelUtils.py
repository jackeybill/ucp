import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import time
from datetime import datetime
import decimal
#import requests
#from requests_aws4auth import AWS4Auth
import logging
import re
import hashlib
import os
import xlrd
from urllib.parse import urlparse
from DownloadUtils import  DownloadUtils

boto3.set_stream_logger('boto3', logging.INFO)

class ExcelUtils():
    s3 = boto3.client('s3')
    
    def convertISODate(self, str):
        return str[:10]+'T'+str[11:19]+'Z'

    def generate_metadata(self, bucket, key):
        """
        Read excel and generate metadata
        params:
            bucket: protocol file bucket
            key: protocol file key
        """
        print("read excel data from bucket:{}, key:{}".format(bucket, key))
        downloadUtils:DownloadUtils = DownloadUtils()
        # protocol excel file on s3
        r = self.s3.get_object(
            Bucket=bucket, Key=key)
        # Read excel data
        data = r['Body'].read()
        wb = xlrd.open_workbook(file_contents=data)
        sheet = wb.sheet_by_index(0)

        # Get excel each data row
        for j in range(1, sheet.nrows):
            # Get excel each data column
            for i in range(1, sheet.ncols):
                if sheet.cell_value(j, i):
                    #print( sheet.cell_value(j, i) )
                    item = {}
                    item_attributes = {}
                    # Get attributes
                    item_attributes['_category'] = 'FDA'
                    item_attributes['_view_count'] = 1
                    item_attributes['_source_uri'] = sheet.cell_value(
                        j, i).strip()
                    item_attributes['drug_name'] = sheet.cell_value(j, 0).strip()
                    item['Title'] = os.path.split(
                        sheet.cell_value(j, i).strip())[1]
                    item_attributes['article_source'] = urlparse(
                        sheet.cell_value(j, i).strip()).netloc
                    if str(sheet.cell_value(j, i).strip()[-3:]).lower() == 'pdf':
                        #item_attributes['type'] = 'pdf'
                        item['ContentType'] = 'PDF'
                        item['Title'] = item['Title'][:-3]+'pdf'
                        
                        downloadUtils.download('pdf', sheet.cell_value(j, i).strip(), bucket,'reg-intel-service-dev/reg-intel-data-source/rfi-documents/'+ sheet.cell_value(j, 0)+'/')

                        downloadUtils.download('pdf', sheet.cell_value(j, i).strip(), bucket,'RawDocuments/'+ sheet.cell_value(j, 0)+'/')
                    else:
                        #item_attributes['type'] = 'html'
                        item['ContentType'] = 'HTML'
                        
                        downloadUtils.download('html', sheet.cell_value(j, i).strip(),bucket, 'reg-intel-service-dev/reg-intel-data-source/rfi-documents/'+ sheet.cell_value(j, 0)+'/')

                    try:
                        # Get file info on s3
                        prefixFile = 'reg-intel-service-dev/reg-intel-data-source/rfi-documents/' + sheet.cell_value(j, 0)+'/'+item['Title']
                        if item['ContentType'] == 'HTML':
                            prefixFile += '.html'
                        #print('prefixFile=', prefixFile)
                        print("Read bucket:{}, key:{}".format(bucket, prefixFile))
                        rep = self.s3.get_object(Bucket=bucket, Key=prefixFile)
                        #print("Read res:{}".format(rep))
                        # datetime.datetime.now().strftime("%Y-%m-%dT%H:%M%SZ")
                        item_attributes['_created_at'] = self.convertISODate(str(rep['LastModified']))
                        item_attributes['_last_updated_at'] = self.convertISODate(str(rep['LastModified']))
                        item['Attributes'] = item_attributes
                        # Key for metadata file on s3  rfi-metadata
                        prefixKey = 'reg-intel-service-dev/meta/rfi-documents/'+sheet.cell_value(j, 0)+'/'+item['Title']
                        keyName =  prefixKey +'.metadata.json'
                        if item['ContentType'] == 'HTML':
                            keyName = prefixKey + '.html.metadata.json'
                        #print("Save matedata to bucket:{}, key:{}, body:{}".format(bucket, keyName, json.dumps(item)))
                        # Save Metadata into S3
                        self.s3.put_object(Bucket=bucket, Key=keyName,
                                    Body=json.dumps(item))
                        # print(item)
                    except Exception as e:
                        print(e)
                        print("File {} not download on s3.".format(
                            item['Title']))
            #break