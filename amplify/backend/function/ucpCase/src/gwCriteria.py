from lambdaUtils import invokeLambdaFunction
import json

def handler(event, context):
    print('event:', event)
    return invokeLambdaFunction('arn:aws:lambda:us-west-2:608494368293:function:hia-aa-upload', json.dumps(event))