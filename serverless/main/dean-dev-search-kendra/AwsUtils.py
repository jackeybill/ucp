import json
import re
import time
import decimal
import logging
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
#ClientError

boto3.set_stream_logger('boto3', logging.INFO)

class AwsUtils():
    s3Client = boto3.client('s3')

    def s3_body_copy(self, source_bucket, source_key, target_bucket, target_key):
        """
        S3 body copy
        """
        copy_source = {'Bucket':source_bucket, 'Key':source_key}
        print("Copying %s from bucket %s to bucket %s ; %s ..." % (source_key, source_bucket, target_bucket, target_key))
        self.s3Client.copy_object(Bucket=target_bucket, Key=target_key, CopySource=copy_source)

    def clean_html(self, html_content):
        """
        Clean html content's CDATA Script style html tags comment
        params:
            html_content: html content
        return:
            clear html content
        """
        re_cdata = re.compile('//<!\[CDATA\[[^>]*//\]\]>', re.I)  # CDATA
        re_script = re.compile('<\s*script[^>]*>[^<]*<\s*/\s*script\s*>', re.I)  # Script
        re_style = re.compile('<\s*style[^>]*>[^<]*<\s*/\s*style\s*>', re.I)  # style
        re_br = re.compile('<br\s*?/?>')
        re_h = re.compile('</?\w+[^>]*>')
        re_comment = re.compile('<!--[^>]*-->')
        s = re.search('</head>(.*?)</body>', html_content, re.S).group(1) #remove head
        s = re_cdata.sub('', s)  # remove CDATA
        s = re_script.sub('', s)  # remove SCRIPT
        s = re_style.sub('', s)  # remove style
        # s = re_br.sub('\n', s)  #
        s = re_h.sub('', s)  # remove HTML
        s = re_comment.sub('', s)  # remove comment
        blank_line = re.compile('\n+')
        s = blank_line.sub('\n', s)
        return s

    def detectComprehendMedical(self, text):
        # return None
        # text = 'cerealx 84 mg daily'
        
        # return None
        # text = 'cerealx 84 mg daily'
        # result = dict
        comprehendmedical = boto3.client('comprehendmedical')
        entity = comprehendmedical.detect_entities_v2(Text= text)
        cd10Entitiy = comprehendmedical.infer_icd10_cm(Text=text)
        rxEntitiy = comprehendmedical.infer_rx_norm(Text=text)
        # result['Entities'] = entity
        # result['ICD-10-CM'] = cd10Entitiy
        # result['RxNorm'] = rxEntitiy
        #result = comprehendmedical.detect_phi(Text=text)
        #print('result', result)
        #entities = result['Entities'];
        #for entity in entities:
        #    print('Entity', entity)
        result = {
            'Entities': entity,
            'ICD-10-CM': cd10Entitiy,
            'RxNorm': rxEntitiy
        }
        return result

    def splitContent(self, content):
        """
        Split content by limit for comprehendmedical
        params:
            content: content need split
        """
        # Max limit for comprehendmedical
        limit = 8000
        istart = 0
        result_content = []
        while istart < len(content):
            #print(content[istart:istart+limit])
            result_content.append(content[istart:istart+limit])
            istart += limit
        return result_content

    def mergeInputTxtWithComprehend(self):
        # s3://lly-reg-intel-raw-zone-dev/reg-intel-service-dev/comprehend-input/Adcetris (brentuximab vedotin)/125388Orig1s000MedR.pdf.txt
        PATH_SPLIT = '/'
        client = boto3.client('s3')
        srcBucket = 'lly-reg-intel-raw-zone-dev'
        srcFiles = self.listFilesInBucket(srcBucket, 'reg-intel-service-dev/comprehend-output/', '.json')
        comprehendmedical = boto3.client('comprehendmedical')
        for srcFile in srcFiles:
            resultJson = client.get_object(Bucket=srcBucket, Key=srcFile)
            jsonItem = json.loads(resultJson['Body'].read().decode('utf-8'))
            
            path_strs = srcFile.split(PATH_SPLIT)
            path_strs[1] = 'comprehend-input'
            new_object_name = PATH_SPLIT.join(path_strs)
            path_strs[1] = 'annotatedOutput'
            out_object_json_name = PATH_SPLIT.join(path_strs)
            txtFile = new_object_name[:-5]
            print('txtFile=', txtFile)
            resultTxt = client.get_object(Bucket=srcBucket, Key=txtFile)
            txt = resultTxt['Body'].read().decode('utf-8')
            if txtFile.endswith('.html'):
                txt = self.clean_html(txt)
            
            icd10_result = []
            rx_result = []
            for c in self.splitContent(txt):
                icd10Entitiy = comprehendmedical.infer_icd10_cm(Text=c)
                icd10_result.append(icd10Entitiy)

                rxEntitiy = comprehendmedical.infer_rx_norm(Text=c)
                rx_result.append(rxEntitiy)
            jsonItem['InferICD10CM'] = icd10_result
            jsonItem['InferRxNorm'] = rx_result
            results = jsonItem
            #print('results=', results)
            response = client.put_object(Bucket=srcBucket, Key=out_object_json_name, 
                Body=json.dumps(results))
            #print(response)
            #break
    
    def listFilesInBucket(self, bucketName='lly-aads-lens-nlp-dev-pwc', keyPrefix='TextractOutput/txt/RawDocuments/', subfix='.txt'):
        s3 = boto3.client('s3')
        partial_list = s3.list_objects_v2(
                Bucket=bucketName, 
                Prefix=keyPrefix)
        obj_list = partial_list['Contents']
        results = []
        for obj in obj_list:
            #print(obj['Key'])
            if obj['Key'].endswith(subfix):
                results.append(obj['Key'])
        return results
        #while partial_list['IsTruncated']:
        #    next_token = partial_list['NextContinuationToken']
        #    partial_list = s3.list_objects_v2(
        #        Bucket=s3_bucket, 
        #        Prefix=s3_prefix, 
        #        ContinuationToken=next_token)
        #    obj_list.extend(partial_list['Contents'])

    def sendRedoQueue(self,bucketName, objectName):
        sqs_client = boto3.client('sqs')
        response = sqs_client.send_message(
                QueueUrl='https://sqs.us-east-2.amazonaws.com/608494368293/ri-service-dev-extractRedoQueue',
                MessageBody=json.dumps({'bucket':{'name':bucketName},'object':{'key':objectName}}),
                DelaySeconds=60
            )

    def syncMissingPDF(self):
        items = ['reg-intel-service-dev/RawDocuments/Perjeta (Pertuzumab)/perjeta-epar-product-information_en.pdf', 
            'reg-intel-service-dev/RawDocuments/Tarceva (erlotinib)/tarceva-epar-product-information_en.pdf', 
            'reg-intel-service-dev/RawDocuments/Tarceva (erlotinib)/tarceva-h-c-618-ii-0002-epar-assessment-report-variation_en.pdf', 
            'reg-intel-service-dev/RawDocuments/Zykadia (ceritinib)/zykadia-epar-public-assessment-report_en.pdf']
        snsTopic = os.environ['TEXTRACT_NOTIFICATION_ARN']
        snsRole = os.environ['ROLE_ARN']
        
        for item in items:
            jobId = startAsyncJob('lly-reg-intel-raw-zone-dev', item, snsTopic, snsRole)
        return

    def listDiff(self):
        awsUtils:AwsUtils = AwsUtils()
        files = awsUtils.listDiffFiles('lly-reg-intel-raw-zone-dev', 'reg-intel-service-dev/RawDocuments', 'lly-reg-intel-raw-zone-dev','reg-intel-service-dev/comprehend-input')
        iCount = 0
        for newFile in files:
            #segment_content('lly-reg-intel-raw-zone-dev', newFile)
            iCount += 1
            if iCount>10:
                break

    def listDiffFiles(self, srcBucket, srckey, targetBucket, targetkey):
        srcFiles = self.listFilesInBucket(srcBucket, srckey, '.pdf')
        targetFiles = self.listFilesInBucket(targetBucket, targetkey, '.txt')
        print(srcFiles)
        print(targetFiles)
        targetFilesName = ','.join(targetFiles)
        
        newFiles = []
        for srcFile in srcFiles:
            path, bucketKey = os.path.split(srcFile)
            #print(bucketKey)
            filename = os.path.splitext(bucketKey)[0]
            #print(filename)
            #print(targetFilesName.index(filename))
            if targetFilesName.find(filename) <0:
                newFiles.append(srcFile)
        print('-'*80)    
        print(newFiles)
        print('newFiles.cnt=', len(newFiles))
        return newFiles

    def testException(self):
        self.sendRedoQueue('bucket','key')
        try:
            # do something
            #raise ClientError("This is an argument")
            
            pass
    
        except ClientError as e:
            # handle ValueError exception
            print(e)
            pass
    
        except (TypeError, ZeroDivisionError):
            # handle multiple exceptions
            # TypeError and ZeroDivisionError
            pass
    
        except:
            # handle all other exceptions
            print('me')
            pass
    
    def createDataSource(self, name, indexId):
        kendraClient = boto3.client('kendra', region_name='us-east-1')
        response = kendraClient.create_data_source(
            Name=name,
            IndexId=indexId,
            Type='S3',
            Configuration={
                'S3Configuration': {
                    'BucketName': 'iso-data-ingestion-bucket',
                    'InclusionPrefixes': [
                        'index-kendra-documents/',
                    ],
                    'DocumentsMetadataConfiguration': {
                        'S3Prefix': 'index-kendra-metadata/'
                    }
                }
            },
            #Schedule='string',
            RoleArn='arn:aws:iam::608494368293:role/reg-intel-service-dev-us-east-2-lambdaRole'
            )
        return response
    
    def createIndex(self, indexName, desc):
        kendraClient = boto3.client('kendra', region_name='us-east-1')
        response = kendraClient.create_index(
            Name=indexName,
            Edition='DEVELOPER_EDITION',
            RoleArn='arn:aws:iam::608494368293:role/reg-intel-service-dev-us-east-2-lambdaRole',
            Description=desc
            )
        return response
        
    def tuneIndex(self, indexId):
        # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/kendra.html#kendra.Client.update_index
        kendraClient = boto3.client('kendra', region_name='us-east-1')
        response = kendraClient.update_index(
            Id=indexId,
            #Name='string',
            #RoleArn='string',
            #Description='string',
            DocumentMetadataConfigurationUpdates=[
                {
                    'Name': 'source_website_url',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Drug_Name',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Accelerated_Assessment',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Condition_Indication',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Exceptional_Circumstances',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Article_Source',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Conditional_Approval',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Authorization_Status',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Publish_Date',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Effective_Time',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Marketing_Category',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Substance_Name',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Common_Name',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Ingredients',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Document_Number',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Revision_Date',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Marketing_Date',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Therapeutic_Area',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Medication_Form',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Route_of_Administration',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Manufacturer',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Product_Identifier',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Product_Type',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Set_ID',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'File_Type',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                }
            ]
        )
        return response
        
        
    def tuneFaersIndex(self, indexId):
        # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/kendra.html#kendra.Client.update_index
        kendraClient = boto3.client('kendra', region_name='us-east-1')
        response = kendraClient.update_index(
            Id=indexId,
            #Name='string',
            #RoleArn='string',
            #Description='string',
            DocumentMetadataConfigurationUpdates=[
                {
                    'Name': 'source_website_url',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'safety_report_version',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'safety_report_id',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'primary_source_country',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'occur_country',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'Article_Source',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'transmission_dateformat',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'report_type',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'transmission_date',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'receive_date',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'receipt_date',
                    'Type': 'DATE_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'serious',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'receive_dateformat',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'receipt_dateformat',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'fulfill_expedite_criteria',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'company_number',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'duplicate',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'duplicate_source',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'duplicate_number',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'reporter_country',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'qualification',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'sender_type',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'sender_organization',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'receiver_type',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'receiver_organization',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'patient_onset_age',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'patient_onset_age_unit',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'patient_sex',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'reaction_MedDRA_version_pt',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'reaction_MedDRA_pt',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                },
                {
                    'Name': 'reaction_outcome',
                    'Type': 'STRING_VALUE',
                    'Search': {
                        'Facetable': True,
                        'Searchable': True,
                        'Displayable': True
                    }
                }
            ]
        )
        return response
    
