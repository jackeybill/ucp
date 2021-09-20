import json
import boto3
import os
from urllib.parse import unquote_plus

s3 = boto3.client('s3')
s3_resource = boto3.resource('s3')



def lambda_handler(event, context):
    for record in event['Records']:
        bucket_to_copy = record['s3']['bucket']['name']
        files = unquote_plus(record['s3']['object']['key'])

        new_bucket_name = 'lly-reg-intel-kendra-index-r1-dev'
        
        opy_source = {'Bucket': bucket_to_copy, 'Key': files}
        nfiles = files.replace(prefix, 'raw-kendra-documents/fda-labels')
        print("copy: {}, target:{}, key:{}".format(copy_source, new_bucket_name, nfiles))
        s3_resource.meta.client.copy(copy_source, new_bucket_name, nfiles)
    
    
#     bucket_to_copy='lly-reg-intel-raw-zone-dev'
#     prefix='reg-intel-service-dev/comprehend-input/fda-labels'
#     for key in s3.list_objects(Bucket=bucket_to_copy, Prefix=prefix)['Contents']:
#         files = key['Key']
#         copy_source = {'Bucket': bucket_to_copy, 'Key': files}
#         nfiles = files.replace(prefix, 'raw-kendra-documents/fda-labels')
#         print("copy: {}, target:{}, key:{}".format(copy_source, new_bucket_name, nfiles))
#         s3_resource.meta.client.copy(copy_source, new_bucket_name, nfiles)
    return {
        'statusCode': 200,
        'body': json.dumps('Sync S3 Success!')
    }
