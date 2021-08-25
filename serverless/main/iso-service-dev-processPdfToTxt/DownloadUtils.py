import boto3
import json
import os
import requests


class DownloadUtils():
    """
    Download url save to S3
    """
    s3 = boto3.client('s3')

    def download(self, type, url, bucket, key):
        print("Download url:{}".format(url))
        res = requests.get(url)
        path, filename = os.path.split(url)
        key = key + filename
        if type =='pdf':
            #print("save to bucket {}, key:{}, content: {}".format(bucket, key, res.content))
            self.s3.put_object(Bucket=bucket, Key=key, Body=res.content)
        elif type=='html':
            #print("save to bucket {}, key:{}, content: {}".format(bucket, key, res.content))
            self.s3.put_object(Bucket=bucket, Key=key+'.html', Body=res.content)
        else:
            print("Error: can't find the type of url {}".format(url))

