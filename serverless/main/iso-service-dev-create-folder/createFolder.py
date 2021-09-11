import json
import urllib
from datetime import date
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bucket_name = 'ucp-filebucket-dev'

def lambda_handler(event, context):
    s3_client = boto3.client('s3')
    directory_name="ucp-filebucket-dev/RawDocuments"
    s3_client.put_object(Bucket=bucket_name, Key=(directory_name+'/'))  
    logger.info("Folder created")

import boto3
import cfnresponse
    def handler(event, context):
        # Init ...
        the_event = event['RequestType']
        print("The event is: ", str(the_event))
        response_data = {}
        s_3 = boto3.client('s3')
        # Retrieve parameters
        the_bucket = event['ResourceProperties']['the_bucket']
        dirs_to_create = event['ResourceProperties']['dirs_to_create']
        try:
            if the_event in ('Create', 'Update'):
                print("Requested folders: ", str(dirs_to_create))
                for dir_name in dirs_to_create:
                    print("Creating: ", str(dir_name))
                    s_3.put_object(Bucket=the_bucket,
                                    Key=(dir_name+ '/'))
            elif the_event == 'Delete':
                print("Deleting S3 content...")
                b_operator = boto3.resource('s3')
                b_operator.Bucket(str(the_bucket)).objects.all().delete()
            # Everything OK... send the signal back
            print("Operation successful!")
            cfnresponse.send(event,context,cfnresponse.SUCCESS,response_data)
        except Exception as e:
            print("Operation failed...")
            print(str(e))
            response_data['Data'] = str(e)
            cfnresponse.send(event,context,cfnresponse.FAILED,response_data)