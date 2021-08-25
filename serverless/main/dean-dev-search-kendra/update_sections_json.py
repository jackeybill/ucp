import json
import base64
import boto3
import os
from datetime import datetime
from AwsUtils import AwsUtils

awsUtils:AwsUtils = AwsUtils()
DEFAULT_PAGE_SIZE = 25
bucketName = 'iso-data-zone'
s3_url_base = 'https://iso-data-zone.s3.us-east-2.amazonaws.com/'
s3_client = boto3.client('s3')


def update_section(updateKey, updateValue, doc_json):
    if updateKey:
        if len(doc_json[updateKey]) == 0:
            d = {}
            d['content'] = updateValue
            d['comprehendMedical'] = awsUtils.detectComprehendMedical(updateValue)
            doc_json[updateKey] = [d]
        else:
            for v in doc_json[updateKey]:
                v['content'] = updateValue
                v['comprehendMedical'] = awsUtils.detectComprehendMedical(updateValue)


def update_txt(path, updateData):
    key = path
    print(updateData)
    doc_body = s3_client.get_object(Bucket=bucketName, Key=key)['Body'].read().decode('utf-8')

    data_json = json.loads(doc_body)
    for k, value in data_json.items():
        doc_json = value
        if 'inclusionCriteria' in updateData:
            print('inclusionCriteria exits.')
            inclusionCriteria = updateData['inclusionCriteria']
            print('get data:' + inclusionCriteria)
            if inclusionCriteria:
                if len(doc_json['inclusionCriteria']) == 0:
                    d = {}
                    d['content'] = inclusionCriteria
                    d['comprehendMedical'] = awsUtils.detectComprehendMedical(inclusionCriteria)
                    doc_json['inclusionCriteria'] = [d]
                else:
                    for v in doc_json['inclusionCriteria']:
                        v['content'] = inclusionCriteria
                        v['comprehendMedical'] = awsUtils.detectComprehendMedical(inclusionCriteria)
            print(doc_json)
        
        if 'exclusionCriteria' in updateData:
            exclusionCriteria = updateData['exclusionCriteria']
            if exclusionCriteria:
                results = []
                if len(doc_json['exclusionCriteria']) == 0:
                    d = {}
                    d['content'] = exclusionCriteria
                    d['comprehendMedical'] = awsUtils.detectComprehendMedical(exclusionCriteria)
                    doc_json['inclusionCriteria'] = [d]
                else:
                    for v in doc_json['exclusionCriteria']:
                        v['content'] = exclusionCriteria
                        v['comprehendMedical'] = awsUtils.detectComprehendMedical(exclusionCriteria)
        
        if 'eventSchedule' in updateData:
            eventSchedule = updateData['eventSchedule']
            if eventSchedule:
                results = []
                if len(doc_json['eventSchedule']) == 0:
                    d = {}
                    d['content'] = eventSchedule
                    d['comprehendMedical'] = awsUtils.detectComprehendMedical(eventSchedule)
                    doc_json['inclusionCriteria'] = [d]
                else:
                    for v in doc_json['eventSchedule']:
                        v['content'] = eventSchedule
                        v['comprehendMedical'] = awsUtils.detectComprehendMedical(eventSchedule)
        
        data_json[k] = doc_json
        print(data_json)
        print(key)
        response = s3_client.put_object(Bucket=bucketName, Key=key, Body=json.dumps(data_json))
        result = data_json
        return {
            'statusCode': json.dumps(result),
            'body': "success"
        }