# -*- coding: utf-8 -*-
import json
import boto3
from urllib.parse import unquote_plus

from AwsUtils import AwsUtils

def getNewFileName(objectName, subfix, prefix):
    """
    Get new file name for wirte comprehendmedical result to S3
    params:
        objectName: result save on S3
        subfix: subfix for save file
        prefix: prefix for save file
    """
    PATH_SPLIT = '/'
    path_strs = objectName.split(PATH_SPLIT)
    # Check file should in folder
    if len(path_strs) > 1:
        path_strs[1] = prefix
        path_strs[-1] += "."+subfix
        new_object_name = PATH_SPLIT.join(path_strs)
        #out_object_name = new_object_name[:-3] + subfix
        return new_object_name
    return None

def splitContent(content):
    """
    Split content by limit for comprehendmedical
    params:
        content: content need split
    """
    # Max limit for comprehendmedical
    limit = 8000
    istart = 0
    result_content = []
    while istart < len(content):
        #print(content[istart:istart+limit])
        result_content.append(content[istart:istart+limit])
        istart += limit
    return result_content

def segment_content(bucket, key):
    """
    Segment content call comprehendmedical
    params:
        bucket: txt's bucket
        key: txt's key
    """
    # For test
    # BUCKET = 'covid-nlp'
    # KEY = 'covid-nlp-service-dev/TextractOutput/txt/Clinical Pharmacology Protocol.docx_0901870c8033813c.txt'
    client = boto3.client('s3')
    result = client.get_object(Bucket=bucket, Key=key)
    
    # Read the object as lines
    lines = result['Body'].read().decode('utf-8')
    if key.endswith('.html'):
        awsUtils:AwsUtils = AwsUtils()
        lines = awsUtils.clean_html(lines)

    entities_result = []
    icd10_result = []
    rx_result = []
    comprehendmedical = boto3.client('comprehendmedical')
    for c in splitContent(lines):
        resultEntitiy = comprehendmedical.detect_entities_v2(Text=c)
        entities_result.append(resultEntitiy)

        icd10Entitiy = comprehendmedical.infer_icd10_cm(Text=c)
        icd10_result.append(icd10Entitiy)

        rxEntitiy = comprehendmedical.infer_rx_norm(Text=c)
        rx_result.append(rxEntitiy)

    # Get ComprehendMedical as json file
    out_object_json_name = getNewFileName(key, 'json','comprehend-output')
    response = client.put_object(Bucket=bucket, Key=out_object_json_name, 
        Body=json.dumps({'annotatedOutput':entities_result,'InferRxNorm':rx_result,'InferICD10CM':icd10_result}))
    return out_object_json_name