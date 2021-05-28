pip3 install --trusted-host pypi.org py-postgresql pypdf2 xlrd pandas openpyxl numpy

S3Event:
Resources:
  priorauthorizationservicedevingestion:
    Type: 'AWS::Serverless::Function'
    Properties:
      Handler: lambda_function.lambda_handler
      Runtime: python3.7
      CodeUri: .
      Description: ''
      MemorySize: 128
      Timeout: 600
      Role: 'arn:aws:iam::608494368293:role/iso-service-dev-us-east-2-lambdaRole'
      Events:
        BucketEvent1:
          Type: S3
          Properties:
            Bucket:
              Ref: Bucket1
            Events:
              - 's3:ObjectCreated:*'
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: prior-authorization-service-dev/RawDocuments/
                  - Name: suffix
                    Value: .pdf
      Layers:
        - 'arn:aws:lambda:us-east-2:608494368293:layer:pypdf2:10'
  Bucket1:
    Type: 'AWS::S3::Bucket'

## upload files
```
POST: https://uoz8c451m1.execute-api.us-west-2.amazonaws.com/dev/cases
body:
{
    "name": "27d57613-1a6f-482b-bfeb-80ce1f07bb09",
    "file": "test.pdf",
    "path": "hiapaDev/RawDocuments/",
    "bucket": "hiapa"
}
```

## Login
POST: https://uoz8c451m1.execute-api.us-west-2.amazonaws.com/dev/cases
body:
{
  "method": "login",
  "body": {
    "username": "wang.dean@pwc.com",
    "password": "passwrod",
    "role": "Registered Nurse"
  }
}
```







