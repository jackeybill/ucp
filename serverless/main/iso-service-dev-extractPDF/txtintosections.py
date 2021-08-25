import section_filter as section_filter
import boto3
import json
import urllib.parse
import re
import os

from ExtractUtils import ExtractUtils
from AwsUtils import AwsUtils

def saveToJson(bucketName, bucketKey, inclusionContent, exclusion, eventsSchedule):
    fileName = getFileName(bucketKey)
    items = []
    awsUtils:AwsUtils = AwsUtils()

    if inclusionContent:
        items.append(getItemInfo('inc-0', fileName, 'inclusionCriteria', 'Inclusion Criteria', inclusionContent, awsUtils.detectComprehendMedical(inclusionContent)))
    if exclusion:
        items.append(getItemInfo('exc-0', fileName, 'exclusionCriteria', 'Exclusion Criteria', exclusion, awsUtils.detectComprehendMedical(exclusion)))
    if eventsSchedule:
        items.append(getItemInfo('evt-0', fileName, 'eventsSchedule', 'Events Schedule', eventsSchedule, awsUtils.detectComprehendMedical(eventsSchedule)))

    return items

def getFileName(documentName):
    base, filename = os.path.split(documentName)
    bucket_key = os.path.splitext(filename)[0]
    return bucket_key

def getItemInfo(id, filename, objectiveType, title, content, comprehendMedical):
    incItem = {}
    incItem['title'] = title
    incItem['content'] = content
    incItem['comprehendMedical'] = comprehendMedical
    incItem['objectiveType'] = objectiveType
    incItem['id'] = id
    incItem['Filename'] = filename
    incItem['level'] = '1'
    incItem['level_number'] = '1.1'
    return incItem

def parseTxt(bucketName, bucketKey, fileContent):
    util:ExtractUtils = ExtractUtils()
    inclusion_body = util.getItemStartEnd(fileContent, 'Inclusion Criteria')
    exclusion_body = util.getItemStartEnd(fileContent, 'Exclusion Criteria')
    events_body = util.getItemStartEnd(fileContent, 'Events')
    
    return saveToJson(bucketName, bucketKey, inclusion_body, exclusion_body, events_body)

def getPathInfo(event):
    # Started job with bucket: lly-aads-lens-nlp-dev-pwc, and file name: TextractOutput/txt/RawDocuments/I5B-MC-JGDJ (d).pdf.txt
    #return 'lly-aads-lens-nlp-dev-pwc','TextractOutput/txt/RawDocuments/I3Y-MC-JPBK(e).pdf.txt'
    #sqsBody = event['Records'][0]['body']
    #payload = json.loads(sqsBody)
    payload = event['Records'][0]['s3']

    s3BucketName = payload['bucket']['name']
    documentName = urllib.parse.unquote_plus(payload['object']['key'], encoding='utf-8')

    print("Started job with bucket: {}, and file name: {}".format(s3BucketName, documentName))
    return s3BucketName, documentName

def lambda_handler(event, context):
    print("event: {}".format(event))
    bucketName, bucketKey = getPathInfo(event)
    if not bucketKey.endswith('.txt'):
        return

    s3 = boto3.client('s3')
    response = s3.get_object(Bucket=bucketName, Key=bucketKey)
    txt = response['Body'].read().decode('utf-8')
    data = parseTxt(bucketName, bucketKey, txt)

    print("Input json:", data)
    d = dict()
    extractUtils:ExtractUtils = ExtractUtils()
    d[extractUtils.md5_hash(bucketKey)] = data
    protocol = section_filter.run(d)
    print(protocol)
    protocol['filepath'] = bucketKey
    # save to S3
    prefixName = os.environ['SERVICE']+'-'+os.environ['STAGE']
    response = s3.put_object(Bucket=bucketName, Key=prefixName+'/input/data/'+getFileName(bucketKey)+'.json', Body=json.dumps(protocol))
    return {'message': 'ok'}
