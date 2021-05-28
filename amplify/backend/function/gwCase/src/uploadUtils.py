import io
import os
import boto3
import base64

s3_client = boto3.client('s3')
bucketName = 'hia-pa'

def uploadFile(event):
    print('upload file start...')
    body = base64.b64decode(event['name'])
    # file = urlparse(event['file']).path
    bucket = bucketName
    if "bucket" in event:
        bucket = event['bucket']
    file = event['file']
    key = event['path']
    #print(file)
    print(bucket)
    #return

    path, filename = os.path.split(file)
    
    # iso-data-zone/iso-service-dev/RawDocuments
    response = s3_client.put_object(Bucket=bucket, Key=key + filename, Body=body)
    return response