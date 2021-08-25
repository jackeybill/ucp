import json
import boto3
import os

client = boto3.client('comprehend')

job_id = 'dean-dev-gettopic-kendra'+ range(100)

data_role = os.environ['ROLE_ARN']

def startJobs():
    # reg-intel-bucket/test/output
    bucket = os.environ['TOPIC_MODELLING_BUCKET_NAME']
    input_s3 = 's3://' + bucket + '/raw-kendra-documents'
    output_s3 = 's3://' + bucket + '/raw-kendra-documents/topicmodelling/output'
    print("process input {}, output: {}, job_id:{}".format(input_s3, output_s3, job_id))
    response = client.start_topics_detection_job(
         InputDataConfig={
             'S3Uri': input_s3,
             # 'InputFormat': 'ONE_DOC_PER_FILE'|'ONE_DOC_PER_LINE'
             'InputFormat': 'ONE_DOC_PER_FILE'
         },
         OutputDataConfig={
             'S3Uri': output_s3
         },
         DataAccessRoleArn=data_role,
         JobName=job_id,
         NumberOfTopics=10
    )
    print(response)

def lambda_handler(event, context):
    startJobs()
    listJobs()
    
    return {
        'statusCode': 200,
        'body': json.dumps('Submit asyn job!')
    }
    
def listJobs():
    # Check result
    response = client.list_topics_detection_jobs(
        Filter={
            'JobName': job_id
        },
        MaxResults=10
    )
    
    print(response)
