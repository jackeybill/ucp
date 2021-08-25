
import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import time
from datetime import datetime
import decimal
import requests
from requests_aws4auth import AWS4Auth
import logging
import os

boto3.set_stream_logger('boto3', logging.INFO)
prefixName = os.environ['SERVICE']+'-'+os.environ['STAGE']
bucketName = os.environ['BUCKET_NAME']
ES_ENDPOINT = os.environ['ES_ENDPOINT']


class SaveDataUtils():

    def copyData(self, url, table):
        db = boto3.resource('dynamodb')
        table = db.Table(table)
        response = table.scan()
        data = response['Items']

        while 'LastEvaluatedKey' in response:
            response = table.scan(
                ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response['Items'])
        print("Result for scan the DynamoDB for checkExists: {}".format(len(data)))
        for item in data:
            self.save_to_es(self, item)

    def updateData(self, url, table):
        db = boto3.resource('dynamodb')
        table = db.Table(table)
        response = table.scan()
        data = response['Items']

        while 'LastEvaluatedKey' in response:
            response = table.scan(
                ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response['Items'])
        print("Result for scan the DynamoDB for checkExists: {}".format(len(data)))
        for item in data:
            if 'download_url' in item:
                print(item['url'])
                table.update_item(
                    ExpressionAttributeValues={
                        ':path': self.getFileS3Name(self, item['download_url'])
                    },
                    UpdateExpression='SET s3_path = :path',
                    Key={
                        'url': item['url']
                    },
                    TableName='fda'
                )
            # break
            #self.save_to_es(self, item)

    def noExists(self, url, tableName='scrapyData', key='url'):
        db = boto3.resource('dynamodb')
        table = db.Table(prefixName+'-'+tableName)
        response = table.query(
            KeyConditionExpression=Key(key).eq(url),
            ProjectionExpression='create_time'
        )
        print("Result for scan the DynamoDB for checkExists: {}".format(response))

        if response['Count'] == 0:
            return True
        return False

    def save_data(self, item, tableName='scrapyData', key='url'):
        tableName = prefixName+'-'+tableName
        self.save_to_db(self, item, tableName, key)
        self.save_to_es(self, item, tableName, key)

    def save_to_db(self, item, tableName=prefixName+'-scrapyData', key='url'):
        """
        Save article data into DB(scrapyData, webarticles)
        params:
            item: article data -> {'url':'', 'title':'','description':'','author':'','postDatetime':'','content':'','createtime':''}
        """
        db = boto3.resource('dynamodb')
        table = db.Table(tableName)

        record = table.get_item(
            Key={
                key: item[key]
            }
        )
        if record != None:
            pass

        print('save item: {}'.format(item))
        table.put_item(
            Item=item
        )
        print('Saved item: {}'.format(json.dumps(item)))

    def save_to_es(self, item, index='articleidx', type='articletype'):
        service = 'es'
        credentials = boto3.Session().get_credentials()
        region = boto3.Session().region_name
        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key,
                           region, service, session_token=credentials.token)

        #account = boto3.client('sts').get_caller_identity().get('Account')
        # es config ()
        host = ES_ENDPOINT
        index = prefixName+'-'+index
        #type = 'articletype'
        url = host + '/' + index + '/' + type

        headers = {"Content-Type": "application/json"}
        r = requests.post(url, auth=awsauth, json=item, headers=headers)
        print("get response:{}".format(r))

    def saveFile(self, res, url, s3BucketName=bucketName):
        documentName = self.getFileName(self, url)

        s3_client = boto3.client('s3')
        response = s3_client.put_object(
            Bucket=s3BucketName, Key=documentName, Body=res)
        status_code = response['ResponseMetadata']['HTTPStatusCode']
        return status_code

    def getFileName(self, url):
        return prefixName+"/fda/scrapy/"+url.split('/')[-2]+".pdf"

    # s3://lly-aads-lens-nlp-dev-pwc/RegulatoryIntelligence/fda/scrapy/100002.pdf
    def getFileS3Name(self, url, s3BucketName=bucketName):
        return "s3://"+s3BucketName+"/" + self.getFileName(self, url)
