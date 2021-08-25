#!/usr/bin/env python3


import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

import json
import time
import datetime
import os
import logging
import urllib.parse
import traceback
import pprint 

import uuid


class DbUtils(object):
    """
    class contains methods performing db actions
    """
    def __init__(self, tableName, dynamoDb_resource, dynamoDb_client, logger):
        self.dynamoDb_resource = dynamoDb_resource
        self.dynamoDb_client = dynamoDb_resource
        self.logger = logger
        self.tableName = tableName
    
    def insert_record(self,item):
        """
        insert record into dynamodb table
        """
        self.logger.info(item)
        
        table = self.dynamoDb_client.Table(self.tableName)
        self.logger.info(f"Insert record into dynamodb: {item['s3_raw']}")
        
        create_time = datetime.datetime.now().isoformat()
        self.logger.info(create_time)
        
        s3_raw = item.get("s3_raw")
        id = self.__make_id()
        
        documentId = item.get("documentId","")
        splId = item.get("splId","")
        
        data = {
            'id': id,
            'name':item["name"],
            'drug_name':item["drug_name"] if item["drug_name"]!="" else s3_raw,
            'title':item["title"] if item["title"]!="" else item["name"],
            'source':item["source"] if item["source"]!="" else s3_raw,
            'source_url': item["source_url"] if item["source_url"]!="" else s3_raw,
            'bucket_name': item['bucket_name'],
            's3_raw':s3_raw,
            'format':item.get("format"),
            'create':create_time,
            'last_update':create_time
            
        }
        
        ## fda labels
        if documentId != "":
            data['document_id'] = documentId
            
        if splId!="":
            data['spl_id'] = splId
        
        table.put_item(Item = data)
        self.logger.info(f"Successfully inserted record in dynamodb")
    
    def update_record(self, filename, s3_enrich_in, s3_enrich_out):
        """
        method to update dynamodb with s3_enrich_in, s3_enrich_out
        
        """
        table = self.dynamoDb_client.Table(self.tableName)
            
        # Get exit item
        response = table.scan(FilterExpression=Attr('name').eq(filename))
            
        item = response['Items'][0]
        self.logger.info("found item from db: {}".format(item))
        
        last_update = datetime.datetime.now().isoformat()
        # Update item in db
        response = table.update_item(
            Key={
                'id': str(item['id']),
                'last_update':item['last_update']
            },
            UpdateExpression="set  s3_enrich_in =:s3_enrich_in, s3_enrich_out= :s3_enrich_out",
            ExpressionAttributeValues={
                ':s3_enrich_in': s3_enrich_in,
                ':s3_enrich_out': s3_enrich_out
            } )
        
        self.logger.info("Finished update record {}".format(json.dumps(response)))
    
    # private method - make id
    def __make_id(self):
        id = uuid.uuid4()
        return str(id)
        