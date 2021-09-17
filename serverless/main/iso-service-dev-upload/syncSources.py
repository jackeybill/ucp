import json
import boto3
import os
from urllib.parse import unquote_plus

s3 = boto3.client('s3')

def s3_body_copy(source_bucket, source_key, target_bucket, target_key):
    """
    S3 body copy
    """
    copy_source = {'Bucket':source_bucket, 'Key':source_key}
    print("Copying %s from bucket %s to bucket %s ; %s ..." % (source_key, source_bucket, target_bucket, target_key))
    s3.copy_object(Bucket=target_bucket, Key=target_key, CopySource=copy_source)   
    
def get_target_key(source_bucket, source_key):
    """
    Get target key and call sync
    """
    if source_key[-3:] == 'pdf':
        target_key = str(source_key).replace('reg-intel-data-source', 'PDF FIles')
        s3_body_copy(source_bucket, source_key, target_key)
    elif source_key[-4:] == 'html':
        target_key = str(source_key).replace('reg-intel-data-source/html', 'HTML FIles')
        s3_body_copy(source_bucket, source_key, target_key)


def load_source():
    """
    List source key
    """
    source_bucket = 'reg-intel-bucket'
    response = s3.list_objects(
        Bucket=source_bucket,
        Prefix='reg-intel-data-source'
    )
    contents = response['Contents']
    for c in contents:
        get_target_key(source_bucket, c['Key'])


def lambda_handler(event, context):
    #load_source()
    s3_data = event['Records'][0]['s3']
    bucketName = s3_data['bucket']['name']
    objectName = unquote_plus(s3_data['object']['key'], encoding='utf-8')
    path_strs = objectName.split('/')
    path_strs[1]='RawDocuments'
    new_object_name = '/'.join(path_strs)
    s3_body_copy(bucketName, objectName, bucketName, new_object_name)

    return {
        'statusCode': 200,
        'body': json.dumps('Sync S3 Success!')
    }
