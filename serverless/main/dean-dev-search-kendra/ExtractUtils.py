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

boto3.set_stream_logger('boto3', logging.INFO)

class ExtractUtils():
    protocolData = []
    
    def posTableOfContents(self, data) -> int:
        # REFERENCES | TABLE OF CONTENTS | LIST OF ABBREVIATIONS
        return re.search(r"\b REFERENCES\b", data, re.I).start()
        
    def get_inclusion_scope(self, data) -> str:
        """
        Inclusion start end posion
        """
        # Lilly
        # 4.1GENERAL INCLUSION CRITERIA (ALL CONDITIONS)
        # 4.4        GENERAL EXCLUSION CRITERIA (ALL CONDITIONS)
        start = re.search(r"[\d|\.|\s]+\bInclusion Criteria\b", data, re.I).start()
        end = re.search(r"[\d|\.|\s]+\bExclusion Criteria\b", data[start:], re.I).start()
        #print(data)
        #start = re.search(r"\b4.1GENERAL INCLUSION CRITERIA\b", data, re.I).start()
        #end = re.search(r"\s+\bCONDITION SPECIFIC INCLUSION CRITERIA\b", data[start:], re.I).start()
        
        #start = re.search(r"\s+\b7.1. Inclusion Criteria\b", data, re.I).start()
        #end = re.search(r"\s+\b7.2. Fxclusion Criteria\b", data[start:], re.I).start()
        content = data[int(start): int(start+end)]
        return content

    def get_exclusion_scope(self, data) -> str:
        """
        Exclusion start end posion
        """
        # Lilly
        # 4.4        GENERAL EXCLUSION CRITERIA (ALL CONDITIONS)
        # 5.   STUDY PROCEDURES AT EACH VISIT
        start = re.search(r"[\d|\.|\s]+\bExclusion Criteria\b", data, re.I).start()
        end = re.search(r"[\d|\.|\s]+\bLifestyle Restrictions\b", data[start:], re.I).start()
        
        #start = re.search(r"\s+\b4.4\b\s+\bGENERAL EXCLUSION CRITERIA\b", data, re.I).start()
        #end = re.search(r"\s+\b5.   STUDY PROCEDURES AT EACH VISIT\b", data[start:], re.I).start()
        
        #start = re.search(r"\s+\b7.2. Fxclusion Criteria\b", data, re.I).start()
        #end = re.search(r"\s+\b7.3. Discontinuation\b", data[start:], re.I).start()
        content = data[int(start): int(start+end)]
        return content
        
    def getEventsSchedule(self, data) -> str:
        """
        Exclusion start end posion
        """
        # Lilly
        # 4.4        GENERAL EXCLUSION CRITERIA (ALL CONDITIONS)
        # 5.   STUDY PROCEDURES AT EACH VISIT
        start = re.search(r"\bEvents Schedule\b", data, re.I).start()
        end = re.search(r"\bStudy Materials\b", data[start:], re.I).start()
        
        #start = re.search(r"\s+\bTIME AND EVENTS SCHEDULE\b", data, re.I).start()
        #end = re.search(r"\s+\bPROTOCOL SYNOPSIS\b", data[start:], re.I).start()
        
        #start = re.search(r"\s+\b10.3.1. Adverse Events\b", data, re.I).start()
        #end = re.search(r"\s+\b10.3.2. Other Safety Measures\b", data[start:], re.I).start()
        
        content = data[int(start): int(start+end)]
        return content
        
    
    def copyPaperId(self, url) -> None:
        db = boto3.resource('dynamodb')
        table = db.Table('ri-service-dev-ord')
        response = table.scan(ProjectionExpression='paper_id')
        #print(response)
        #return 
        data = response['Items']
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'],ProjectionExpression='paper_id')
            data.extend(response['Items'])
            print("Result extend: {}".format(len(data)))
            #break
        #print("Result for scan the DynamoDB for checkExists: {}".format(len(data)))
        print(data)
        #for item in data:
        #    self.save_to_es(self, item)
 
    def copyData(self, url):
        db = boto3.resource('dynamodb')
        table = db.Table('scrapyData')
        response = table.scan()
        data = response['Items']
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response['Items'])
        print("Result for scan the DynamoDB for checkExists: {}".format(len(data)))
        for item in data:
            self.save_to_es(self, item)
            
    def md5_hash(self, str_val):
        if isinstance(str_val, str):
            str_encoded = str_val.encode()
            hashed_str = hashlib.md5(str_encoded)
            hash = hashed_str.hexdigest()
            return hash
        else:
            raise TypeError('MD5 Hash can only apply on strings')
    
    def copyDataToJsonFile(self, tableName):
        # scrapyData, ri-service-dev-ord. 
        s3_client = boto3.client('s3')
        db = boto3.resource('dynamodb')
        table = db.Table('scrapyData')
        response = table.scan()
        data = response['Items']
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response['Items'])
        #print("Result for scan the DynamoDB for checkExists: {}".format(len(data)))
        for item in data:
            documentName = 'Regulatory Intelligence Articles/'+self.md5_hash(item['url'])+'.json'
            res = json.dumps(item)
            response = s3_client.put_object(Bucket='lly-aads-lens-nlp-dev-pwc', Key=documentName, Body=res)
            #break
    
    def updateData(self, url):
        db = boto3.resource('dynamodb')
        table = db.Table('fda')
        response = table.scan()
        data = response['Items']
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response['Items'])
        print("Result for scan the DynamoDB for checkExists: {}".format(len(data)))
        for item in data:
            if 'download_url' in item:
                print(item['url'])
                table.update_item(
                    ExpressionAttributeValues={
                        ':path': self.getFileS3Name(self,item['download_url'])
                    },
                    UpdateExpression='SET s3_path = :path',
                    Key={
                        'url': item['url']
                    },
                    TableName = 'fda'
                )
            #break
            #self.save_to_es(self, item)

    def noExist(self, data):
        if len(self.protocolData) == 0:
            with open('tmp.json') as json_data:
                self.protocolData = json.load(json_data)
                #print(len(d))
        return {"paper_id": data} in self.protocolData

    def noExists(self, url, tableName='scrapyData', key='url'):
        db = boto3.resource('dynamodb')
        table = db.Table(tableName)
        response = table.query(
            KeyConditionExpression=Key(key).eq(url),
            ProjectionExpression='create_time'
        )
        print("Result for scan the DynamoDB for checkExists: {}".format(response))
        
        if response['Count'] == 0:
            return True
        return False
        
    def save_data(self, item, tableName='scrapyData', key='url'):
        self.save_to_db(self, item, tableName, key)
        self.save_to_es(self, item, tableName, key)
    
    def save_to_db(self, item, tableName='scrapyData', key='url'):
        """
        Save article data into DB(scrapyData, webarticles)
        params:
            item: article data -> {'url':'', 'title':'','description':'','author':'','postDatetime':'','content':'','createtime':''}
        """
        db = boto3.resource('dynamodb')
        table = db.Table(tableName)
        
        record = table.get_item(
            Key = {
                'url': item['url']
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
        region = 'us-east-2'
        service = 'es'
        credentials = boto3.Session().get_credentials()
        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
        
        # es config ()
        host = 'https://search-nlp-es-ncrqt5hmt23o7snb36vmktwgty.us-east-2.es.amazonaws.com'
        #index = 'articleidx'
        #type = 'articletype' 
        url = host + '/' + index + '/' + type
        
        headers = { "Content-Type": "application/json" }
        r = requests.post(url, auth=awsauth, json=item, headers=headers)
        print("get response:{}".format(r))
        
    def saveFile(self, res, url, s3BucketName='lly-aads-lens-nlp-dev-pwc'):
        documentName = self.getFileName(self,url)
        
        s3_client = boto3.client('s3')
        response = s3_client.put_object(Bucket=s3BucketName, Key=documentName, Body=res)
        status_code = response['ResponseMetadata']['HTTPStatusCode']
        return status_code
        
    def getFileName(self, url):
        return "RegulatoryIntelligence/fda/scrapy/"+url.split('/')[-2]+".pdf"
    
    # s3://lly-aads-lens-nlp-dev-pwc/RegulatoryIntelligence/fda/scrapy/100002.pdf
    def getFileS3Name(self, url, s3BucketName='lly-aads-lens-nlp-dev-pwc'):
        return "s3://"+s3BucketName+"/" + self.getFileName(self,url)
        
    def extraDictList(self, info):
        if type(info) == dict:
            re_info: dict = {}
            for key, value in info.items():
                if type(value) == dict or type(value) == list:
                    re = self.extraDictList(value)
                    if len(re) != 0:
                        re_info[key] = re
                elif type(value) == str and value not in ["", " ", "null"] and len(str(value)) > 0:
                    re_info[key] = value
            return re_info
        elif type(info) == list:
            re_info: list = []
            for value in info:
                if type(value) == dict or type(value) == list:
                    re = self.extraDictList(value)
                    if len(re) != 0:
                        re_info.append(re)
                elif type(value) == str and value not in ["", " ", "null"] and len(str(value)) > 0:
                    re_info.append(value)
                else:
                    print(value)
                    print(type(value))
                    print("errorList")
            return re_info
        else:
            print(info)
            print("errorExtra")

    def noExistTmp1(item):
        db = boto3.resource('dynamodb')
        # table = db.Table('scrapyData')
        table = db.Table('ri-service-dev-ord')
        
        response = table.query(
                KeyConditionExpression=Key('paper_id').eq(item['paper_id']),
                ProjectionExpression='paper_id'
            )
        #print("Result for scan the DynamoDB for checkExists: {}".format(response))
        
        if response['Count'] == 0:
            return 0
        return 1

    def noExist1(item):
        if saveData.noExist(saveData, item['paper_id']):
            return 1
        if noExistTmp(item) == 1:
            return 1
        return 0
        
    def getItemStartEnd(self, raw, keyWord):
            itemBegin = None
            itemEnd = None
            tableOfContents, startBody, endBody = self.getTableOfContents(raw)
            bodyContent = raw[endBody:]
            #print('tableOfContents=', tableOfContents)
            if tableOfContents is not None:
                paten = r"[0-9.]+\s*"+keyWord
                #print('paten=',paten)
                pos = re.search(paten,tableOfContents,re.I)
                print(pos)
                if pos is not None:
                    start = pos.start()
                    #print(start)
                    end = re.search(keyWord,tableOfContents[start:],re.I).end()
                    itemBegin = tableOfContents[start:start+end]
                    print('itemBegin=',itemBegin)
                    start = re.search(r"\d",itemBegin,re.I).start()
                    itemBegin = itemBegin[start:].strip()
                    posBegin = self.getContentPos(itemBegin, bodyContent)
                    if posBegin:
                        levelNum = self.getSameLevelNum(itemBegin, True)
                        posStart = re.search(str(levelNum),tableOfContents,re.I)
                        if posStart is None:
                            levelNum = self.getSameLevelNum(itemBegin, False)
                            start = re.search(str(newNum),tableOfContents,re.I).start()
                        else:
                            start = posStart.start()
                        end = re.search(r"\n",tableOfContents[start+10:],re.I).start()
                        itemEnd = tableOfContents[start:start+end].strip()
                        posEnd = self.getContentPos(itemEnd, bodyContent)
                        if posEnd:
                            return bodyContent[posBegin:posEnd]
            return None
            
    def getContentPos(self, raw, content):
        raw = re.sub(r"[\t\n\r\f\v]", '', raw)
        pos = re.search(r"[a-zA-Z]", raw, re.I)
        print('pos=',pos)
        if pos:
            firstPart = raw[0:pos.start()].strip()
            secondPart = raw[pos.start():].strip()
            print('firstPart=',firstPart)
            print('secondPart=',secondPart)
            paten = firstPart + r"([\s.]*)"+ secondPart
            pos = re.search(paten, content, re.I)
            print('pos1=',pos)
            if pos:
                return pos.start()
        return None

    def getSameLevelNum(self, itemBegin, sameLevel=True):
        print('getSameLevelNum.itemBegin=', itemBegin)
        ite = itemBegin.split(' ')
        iNum = ite[0].split('.')
        if type(iNum[-1]) != int:
            del iNum[-1]
        if not sameLevel:
            del iNum[-1]
        iNum[-1] = str(int(iNum[-1])+1)
        newNum = '.'.join(iNum)
        print('getSameLevelNum.newNum=', newNum)
        return newNum

    def getTableOfContents(self, raw):
        pos = re.search(r"TABLE OF CONTENTS", raw, re.I)
        print(pos)
        if pos is not None:
            start = pos.start()+150
            end = re.search(r"(REFERENCES|APPENDIX|LIST OF ABBREVIATIONS|GLOSSARY OF TERMS)", raw[start:], re.I).start()
            print(end)
            return raw[start:start+end], start, start+end
        return None, None, None
    
    def getContentBody(self, raw):
        body, start, end = self.getTableOfContents(raw)
        return raw[end:]
