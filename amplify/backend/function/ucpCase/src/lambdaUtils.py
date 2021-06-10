# Copyright 2017-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file
# except in compliance with the License. A copy of the License is located at
#
#     http://aws.amazon.com/apache2.0/
#
# or in the "license" file accompanying this file. This file is distributed on an "AS IS"
# BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under the License.
import boto3
import json
import time
import urllib.request

# region = 'us-east-2'

clientLambda = boto3.client('lambda')
def invokeLambdaFunction(functionName, payload):
    # arn:aws:lambda:us-west-2:608494368293:function:hia-aa-upload
    response = clientLambda.invoke(
        #FunctionName='hia-aa-upload',
        FunctionName=functionName,
        #Payload='{"test":"test"}',
        Payload=payload,
        #Qualifier='1',
    )
    return response