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
from jose import jwk, jwt
from jose.utils import base64url_decode

# region = 'us-east-2'
# userpool_id = 'us-east-2_KuxM9V9lJ'
# app_client_id = '51pc4k892qk335qe5kiu5pe63b'

client = boto3.client('cognito-idp')

region = 'us-east-1'
userpool_id = 'us-east-1_uRl1panEW'
app_client_id = '1f44ions86c83n3i728bbv786p'

keys_url = 'https://cognito-idp.{}.amazonaws.com/{}/.well-known/jwks.json'.format(region, userpool_id)
# https://cognito-idp.us-east-2.amazonaws.com/us-east-2_KuxM9V9lJ/.well-known/jwks.json
# instead of re-downloading the public keys every time
# we download them only on cold start
# https://aws.amazon.com/blogs/compute/container-reuse-in-lambda/
with urllib.request.urlopen(keys_url) as f:
  response = f.read()
keys = json.loads(response.decode('utf-8'))['keys']

def checkJWT(token):
    
    #print('Event:{}'.format(event))
    #token = event['token']
    #return token
    # get the kid from the headers prior to verification
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    # search for the kid in the downloaded public keys
    key_index = -1
    for i in range(len(keys)):
        if kid == keys[i]['kid']:
            key_index = i
            break
    if key_index == -1:
        print('Public key not found in jwks.json')
        # return False
        return ''
    # construct the public key
    public_key = jwk.construct(keys[key_index])
    # get the last two sections of the token,
    # message and signature (encoded in base64)
    message, encoded_signature = str(token).rsplit('.', 1)
    # decode the signature
    decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
    # verify the signature
    if not public_key.verify(message.encode("utf8"), decoded_signature):
        print('Signature verification failed')
        # return False
        return ''
    print('Signature successfully verified')
    # since we passed the verification, we can now safely
    # use the unverified claims
    claims = jwt.get_unverified_claims(token)
    print(claims)
    # additionally we can verify the token expiration
    if time.time() > claims['exp']:
        print('Token is expired')
        # return False
        return ''
    # and the Audience  (use claims['client_id'] if verifying an access token)
    if claims['aud'] != app_client_id:
        print('Token was not issued for this audience')
        # return False
        return ''
    # now we can use the claims
    
    # return claims
    if claims:
        # return True
        return claims['email']
    else:
        return ''
        
def login(username, password):
    '''
    Login logic with username and password
    '''
    print(f'Login with {username} and {password}')
    result={'statusCode': 200, 'body': ''}
    try:
        response = client.initiate_auth(
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            },
            ClientId=app_client_id
        )
        result['body'] = response
        print(response)
    except Exception as inst:
        error = {
            "error": str(inst)
        }
        error = 'Incorrect username or password'
        result={'statusCode': 400, 'body': error}
    
    print(f'Login Result: {result}')
    return result