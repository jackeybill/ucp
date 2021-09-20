import json
import boto3
import requests
from requests_aws4auth import AWS4Auth

def lambda_handler(event, context):
    print('===============lambda_handler===============')
    #print('event: {}'.format(event))
    #data = json.loads(body_data)['Records'][0]
    #print(data)

    # S3 client 
    s3 = boto3.client('s3')
    
    # Elasticsearch config
    region = 'us-east-2'
    service = 'es'
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
    host = 'https://search-nlp-es-5wanb4pg34re6bstmpflsjwc3i.us-east-2.es.amazonaws.com'
    index = 'reg_intel_dev_sp21'
    url = host + '/' + index + '/' + '_doc' + '/'
    print('url: {}'.format(url))
    headers = { "Content-Type": "application/json" }
    #type = 'jsontype'
    #content = {"content": jsonContent}

    count = 0
    for record in event['Records']:
        print('---------------- NEW RECORD -------------')
        print('record: {}'.format(record))
        print('eventID: ', record['eventID'])

        # Get the primary key for use as the Elasticsearch ID
        id = record['dynamodb']['Keys']['id']['S']
        print('id: {}'.format(id))
        print('')
        
        # Process Record
        if record['eventName'] == 'REMOVE':       # If REMOVE is needed in future
            print(record['eventName'])
            #r = requests.delete(url + id, auth=awsauth)

        elif record['eventName'] == 'INSERT' or record['eventName'] == 'MODIFY':
            print(record['eventName'])
            if 's3_enrich_out' in record['dynamodb']['NewImage']:   # proceed only if s3_enrich_out is populated
                # print('s3_enrich_out: ', record['dynamodb']['NewImage']['s3_enrich_out'])
                # print('len of s3_enrich_out: ', len(record['dynamodb']['NewImage']['s3_enrich_out']))
                
                # Get s3 document that contains enrich_in and enrich_out
                # s3 url: "s3://lly-reg-intel-raw-zone-dev/reg-intel-service-dev/comprehend-output/Adcetris (brentuximab vedotin)/125388Orig1s000MedR.pdf.txt.json"
                # bucket = "lly-reg-intel-raw-zone-dev"
                # key = "reg-intel-service-dev/comprehend-output/Adcetris (brentuximab vedotin)/125388Orig1s000MedR.pdf.txt.json"
                s3_enrich_in = record['dynamodb']['NewImage']['s3_enrich_in']['S']
                s3_enrich_out = record['dynamodb']['NewImage']['s3_enrich_out']['S']
                bucket = record['dynamodb']['NewImage']['bucket_name']['S']        
                print('bucket: {}'.format(bucket))
                print('key_enrich_in: {}'.format(s3_enrich_in))
                print('key_enrich_out: {}'.format(s3_enrich_out))
                
                # ENRICH IN
                # Fetch docs from s3
                response = s3.get_object(Bucket=bucket, Key=s3_enrich_in)
                #print('response s3: {}'.format(response))
                enrich_in_file = response['Body'].read().decode('utf-8')
                #print('type of enrich_in_file:', type(enrich_in_file))
                #print('enrich_in_file:', enrich_in_file)
                try:
                    enrich_in_json = json.loads(enrich_in_file)      # check if file is json
                    #print('type of enrich_in_json:', type(enrich_in_json))
                    #print('enrich_in_json:', enrich_in_json)
                    enrich_in_arr = []                              # file is json
                    enrich_in_arr.append(enrich_in_json)
                    #print('Length of enrich_in_arr: {}'.format(len(enrich_in_arr)))
                    #print('Type of enrich_in_arr: {}'.format(type(enrich_in_arr)))
                    #print('enrich_in_arr: {}'.format(enrich_in_arr))
                    enrich_in_txt = ""
                except ValueError as e:
                    enrich_in_txt = enrich_in_file                  # file is text
                    enrich_in_arr = [{}]
                
                # ENRICH OUT
                response = s3.get_object(Bucket=bucket, Key=s3_enrich_out)
                enrich_out_file = response['Body'].read().decode('utf-8')
                try:
                    enrich_out_json = json.loads(enrich_out_file)   # check if file is json
                    enrich_out_arr = []                             # file is json
                    enrich_out_arr.append(enrich_out_json)
                    #print('enrich_out_arr: ', enrich_out_arr)
                    enrich_out_txt = ""
                except ValueError as e:
                    enrich_out_txt = enrich_out_file                # file is text
                    enrich_out_arr = [{}]

                # Format date for Elasticsearch
                last_update = record['dynamodb']['NewImage']['last_update']['S'].split()[0].replace("/", "-", 2)
                print("last_update:", last_update)
                print('')
                
                print('eventName: {}'.format(record['eventName']))
                document = {
                  "id": id,
                  "format": record['dynamodb']['NewImage']['format']['S'],
                  "name": record['dynamodb']['NewImage']['name']['S'],
                  "title": record['dynamodb']['NewImage']['title']['S'],
                  "drug_name": record['dynamodb']['NewImage']['drug_name']['S'],
                  "body_text": enrich_in_txt,
                  "body_nested": enrich_in_arr, 
                  "meta_text": enrich_out_txt,
                  "meta_nested": enrich_out_arr,
                  "source": record['dynamodb']['NewImage']['source']['S'],
                  #"pos_neg_study": record['dynamodb']['NewImage']['pos_neg_study']['S'],
                  "s3_raw": 's3://' + bucket + '/' + record['dynamodb']['NewImage']['s3_raw']['S'],
                  "last_update": last_update
                }
                # print('document: {}'.format(document))
                r = requests.put(url + id, auth=awsauth, json=document, headers=headers)
                print("Response from Elasticsearch: {}".format(r))
        count += 1
    return str(count) + ' records processed.'