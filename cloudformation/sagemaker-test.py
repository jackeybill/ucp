import json
import boto3

runtime = boto3.client('runtime.sagemaker')

text = ['Cancer']
n_ranks = 1
payload = json.dumps({'text': text, 'n_ranks': n_ranks})
ENDPOINT_NAME = 'Endpoint-pSU40n7BX2Py'  # 'Endpoint-pSU40n7BX2Py' #'mosaic-meddra-coding'
ENDPOINT_NAME2 = 'mosaic-meddra-coding'

response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                   ContentType='application/json',
                                   Body=payload)
result = json.loads(response['Body'].read().decode())

response2 = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME2,
                                    ContentType='application/json',
                                    Body=payload)
result2 = json.loads(response2['Body'].read().decode())
print(result)
print(result2)
print(result == result2)