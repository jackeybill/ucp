import json
import boto3
import time
from trp import Document
import postgresql
from main import CaseBuild
from gwCases import insertData,listCases


s3Client = boto3.client('s3')
sesClient = boto3.client('ses')
textractClient = boto3.client('textract')

def putObject(bucketName, fullPath, content):
    s3Client.put_object(Bucket=bucketName,ACL="public-read", Key=fullPath, Body=content)
    
def isFileInS3(bucketName, prefix):
    res = s3Client.list_objects_v2(Bucket=bucketName, Prefix=prefix, MaxKeys=1)
    return 'Contents' in res

def s3Copy(source_bucket, source_key, target_bucket, target_key):
    """
    S3 body copy
    """
    copy_source = {'Bucket':source_bucket, 'Key':source_key}
    print("Copying %s from bucket %s to bucket %s ; %s ..." % (source_key, source_bucket, target_bucket, target_key))
    s3Client.copy_object(Bucket=target_bucket, Key=target_key, CopySource=copy_source)

def sendMail(fileName):
    subject = None
    body = None
    if fileName.startswith('Patient 1'):
        subject = 'PA Request #: A234'
        body = 'Name: John Doe <p><p> We would like to inform you that your request for claim A1234 has been approved. <p> Thank you very much.'
    elif fileName.startswith('Patient 2'):
        subject = 'PA Request #: A123'
        body = 'Name: Bill Jefferson <p><p> We received the information on claim ‘A5612’ for the bloated Stomach for member Bill Jefferson. We wanted to let you know we rejected the claim for incomplete information provided. We would require the member to send additional information via fax. <p>Please reach out for any questions.'
    else:
        subject = 'PA Request #: A3456'
        body = 'Name:Juan Reyes <p><p> Due to the bad quality of the file submitted, we would ask you to resubmit the PA request file for Juan Reyes for claim ‘A63855’. Please resubmit the file asap for further review. <p> We appreciate your cooperation. '

    response = sesClient.send_email(
        Destination={
            'ToAddresses': [
                'jackey.xue@pwc.com',
                'qiaoqin.zhang@pwc.com',
                'jana.wolf@pwc.com'
            ],
        },
        Message={
            'Body': {
                'Html': {
                    'Charset': 'UTF-8',
                    'Data': body,
                },
            },
            'Subject': {
                'Charset': 'UTF-8',
                'Data': subject,
            },
        },
        Source='jackey.xue@pwc.com'
    )
    #print(response)
    return response
    
def startJob(s3BucketName, objectName):
    response = textractClient.start_document_analysis(
        DocumentLocation={
            'S3Object': {
                'Bucket': s3BucketName,
                'Name': objectName
            }
        },
        FeatureTypes=['FORMS'],
        # NotificationChannel={
        #     'SNSTopicArn': 'string',
        #     'RoleArn': 'string'
        # },
        OutputConfig={
            'S3Bucket': s3BucketName,
            'S3Prefix': 'hiapadev/output/textract'
        }
    )

    return response["JobId"]

def isJobComplete(jobId):
    time.sleep(5)

    response = textractClient.get_document_analysis(JobId=jobId)
    status = response["JobStatus"]
    print("Job status: {}".format(status))

    while(status == "IN_PROGRESS"):
        time.sleep(5)
        response = textractClient.get_document_analysis(JobId=jobId)
        status = response["JobStatus"]
        print("Job status: {}".format(status))

    return status
    
def getJobResults(jobId):

    pages = []

    time.sleep(5)

    response = textractClient.get_document_analysis(JobId=jobId)
    #print('response:', response)
    #pages.append(response['Blocks'])
    #print("Resultset page recieved: {}".format(len(pages)))
    nextToken = None
    if('NextToken' in response):
        nextToken = response['NextToken']

    while(nextToken):
        time.sleep(5)

        resp = textractClient.get_document_analysis(JobId=jobId, NextToken=nextToken)
        #print('resp:', resp)
        response['Blocks'].extend(resp['Blocks'])
        #print("Resultset page recieved: {}".format(len(pages)))
        nextToken = None
        if('NextToken' in resp):
            nextToken = resp['NextToken']
    #print('response ok:', response)
    return response
    
def formatStr(str):
    return str.strip().replace(':', '')
    
def getFormKeyValue(response):
    doc = Document(response)
    kvs = []
    for page in doc.pages:
        # Print fields
        #print("Fields:")
        for field in page.form.fields:
            #print("Key: {}, Value: {}".format(field.key, field.value))
            #kvs[str(field.key)] = str(field.value)
            if hasattr(field.value, 'confidence'):
                kvs.append({'name':formatStr(str(field.key)),'value':formatStr(str(field.value)),'confidence':field.value.confidence})
    return kvs
    
def getFormKeyValueTmp(blocks):
    # get key and value maps
    key_map = {}
    value_map = {}
    block_map = {}
    for block in blocks:
        block_id = block['Id']
        block_map[block_id] = block
        if block['BlockType'] == "KEY_VALUE_SET":
            if 'KEY' in block['EntityTypes']:
                key_map[block_id] = block
            else:
                value_map[block_id] = block
    
    kvs = {}
    for block_id, key_block in key_map.items():
        value_block = find_value_block(key_block, value_map)
        key = get_text(key_block, block_map)
        val = get_text(value_block, block_map)
        kvs[key] = val
    return kvs

def extractFormNow():
    # process using image bytes

    #response = client.analyze_document(Document={'Bytes': bytes_test}, FeatureTypes=['FORMS'])
    response = textractClient.analyze_document(
        Document={
          'S3Object': 
            {"Bucket": "iso-data-zone",
             "Name": "prior-authorization-service-dev/RawDocuments/Patient 1_PA _ Medical Form_final.pdf"
            }}, 
            FeatureTypes=['FORMS'])
    #s3://iso-data-zone/prior-authorization-service-dev/RawDocuments/Patient 1_PA _ Medical Form_final.pdf
    # Get the text blocks
    blocks=response['Blocks']
    
    return getFormKeyValue(blocks)

def extractForm(s3BucketName, documentName, fileName):
    # Document ; s3://iso-data-zone/prior-authorization-service-dev/RawDocuments/Patient 1_Medical Eligibilty File.pdf
    #s3BucketName = "iso-data-zone"
    #documentName = "prior-authorization-service-dev/RawDocuments/Patient 1_Medical Eligibilty File.pdf"
    jobId = startJob(s3BucketName, documentName)
    print("Started job with id: {}".format(jobId))
    if(isJobComplete(jobId)):
        blocks = getJobResults(jobId)
    
    #print(response)
    formKeyValue = getFormKeyValue(blocks)
    print(formKeyValue)
    # formKeyValue=[{'name': 'Specialty', 'value': 'Cardiology', 'confidence': 99.5}, {'name': 'Request date', 'value': '01/27/2021', 'confidence': 99.5}, {'name': 'Gender', 'value': 'M F', 'confidence': 99.5}, {'name': 'ZIP Code', 'value': '94123', 'confidence': 98.5}, {'name': 'CPT/HCPC description', 'value': 'cardiac event monitoring', 'confidence': 98.5}, {'name': 'Phone', 'value': '932-483-9292', 'confidence': 98.5}, {'name': 'State', 'value': 'CA', 'confidence': 98.0}, {'name': 'ICD-10 code(s)', 'value': 'D50-D89', 'confidence': 98.0}, {'name': 'NPI/Tax ID', 'value': '821-55-2819', 'confidence': 98.0}, {'name': 'Facility name', 'value': 'Dr. Jane Gills', 'confidence': 97.5}, {'name': 'Effective date', 'value': '01/01/2021', 'confidence': 97.5}, {'name': 'NPI/Tax ID', 'value': '821-55-2819', 'confidence': 97.5}, {'name': 'Phone', 'value': '839-222-1849', 'confidence': 97.0}, {'name': 'City', 'value': 'San Francisco', 'confidence': 97.0}, {'name': 'Phone', 'value': '839-222-1849', 'confidence': 96.5}, {'name': 'Referred to (servicing provider)', 'value': 'Dr. Jane Gills', 'confidence': 96.5}, {'name': 'Dx description', 'value': 'Diseases of the blood', 'confidence': 96.0}, {'name': "Servicing provider's full address", 'value': '1723 Scott St, San Francisco, CA 94123', 'confidence': 95.5}, {'name': 'DOB', 'value': '09/17/81', 'confidence': 94.5}, {'name': "Member's plan ID number", 'value': 'A2783', 'confidence': 94.5}, {'name': 'FAX', 'value': '+1 832-111-3829', 'confidence': 94.5}, {'name': 'FAX', 'value': '+1 1 827-322-1456', 'confidence': 94.0}, {'name': "Member's Name", 'value': 'Juan Reyes', 'confidence': 92.0}, {'name': 'FAX', 'value': '+1 832-111-3829', 'confidence': 91.5}, {'name': 'Street address', 'value': '18 watch way', 'confidence': 88.0}, {'name': 'Phone', 'value': '125-829-9382', 'confidence': 86.5}, {'name': 'Initial consult', 'value': 'SELECTED', 'confidence': 86.0}, {'name': 'FAX', 'value': '(323) 889-5403', 'confidence': 82.0}, {'name': 'FAX', 'value': '(323)889-6506', 'confidence': 71.5}, {'name': 'Accident?', 'value': 'Yes No', 'confidence': 69.5}, {'name': 'IPA responsibility?', 'value': 'Check box, if yes', 'confidence': 59.500003814697266}, {'name': 'Dr.', 'value': 'James Nye', 'confidence': 53.500003814697266}, {'name': 'Language spoken', 'value': 'Spanish', 'confidence': 50.5}, {'name': 'CPT/HCPC code', 'value': '(s) 93270', 'confidence': 46.0}, {'name': 'Retroactive Request', 'value': 'SELECTED', 'confidence': 42.5}, {'name': "Member's name", 'value': 'Juan Reyes', 'confidence': 99.5}, {'name': "Member's plan ID number", 'value': 'A2783', 'confidence': 98.5}, {'name': "Member's date of birth (DOB)", 'value': '09/17/81', 'confidence': 95.5}, {'name': 'If you selected "other,"', 'value': 'please explain', 'confidence': 60.5}, {'name': 'Wheelchair', 'value': 'SELECTED', 'confidence': 60.000003814697266}, {'name': 'NMT', 'value': 'Sedan/Tax', 'confidence': 58.0}, {'name': 'Cane', 'value': 'Other', 'confidence': 46.5}, {'name': 'Select the type of transportation required', 'value': 'NEMT', 'confidence': 41.0}, {'name': 'NEMT', 'value': 'Wheelchair', 'confidence': 33.5}, {'name': 'End date', 'value': '12/27/21', 'confidence': 99.5}, {'name': 'Effective date', 'value': '01/27/21', 'confidence': 99.0}, {'name': 'FAX number for urgent requests', 'value': '(323) 889-5403', 'confidence': 98.5}, {'name': 'FAX number for standard requests', 'value': '(323) 889-6506', 'confidence': 97.0}, {'name': 'Contact phone number', 'value': '839-222-1849', 'confidence': 93.0}, {'name': "Staff/Physician's name (typed or printed)", 'value': 'Dr. Jane Gills', 'confidence': 92.0}, {'name': 'Date', 'value': '01/27/21', 'confidence': 91.5}, {'name': 'Title', 'value': 'Cardiology Physician', 'confidence': 90.0}, {'name': 'FAX number', 'value': '+1 847-822-8271', 'confidence': 87.5}, {'name': 'M. I.', 'value': 'A', 'confidence': 88.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 87.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 85.5}, {'name': 'First', 'value': 'Juan', 'confidence': 84.5}, {'name': 'F', 'value': 'NOT_SELECTED', 'confidence': 84.5}, {'name': 'Birthdate', 'value': '09/17/81', 'confidence': 77.5}, {'name': 'Date', 'value': '01/27/21', 'confidence': 76.5}, {'name': 'Physician initials', 'value': 'JN', 'confidence': 75.0}, {'name': 'How did you hear about this clinic?', 'value': 'Physician Referral', 'confidence': 71.5}, {'name': 'M', 'value': 'SELECTED', 'confidence': 68.0}, {'name': 'Please list the names of other practitioners you have seen for this problem', 'value': 'Dr. Bill Tymes', 'confidence': 59.500003814697266}, {'name': 'Last', 'value': 'Reyes', 'confidence': 40.5}, {'name': 'Describe briefly your present symptoms', 'value': 'Heart palpitations', 'confidence': 33.5}, {'name': 'disabled', 'value': 'NOT_SELECTED', 'confidence': 100.0}, {'name': 'No', 'value': 'SELECTED', 'confidence': 99.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Divorced', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Angina', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Psoriasis', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Pneumonia', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Emphysema', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Asthma', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'retired', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Kidney stones', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'HIV/AIDS', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Colitis', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Cataracts', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Hepatitis', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Separated', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Widowed', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Leukemia', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Heart murmur', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Goiter', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Married', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Hypothyroidism', 'value': 'NOT_SELECTED', 'confidence': 96.5}, {'name': 'Tuberculosis', 'value': 'NOT_SELECTED', 'confidence': 96.5}, {'name': 'Kidney disease', 'value': 'NOT_SELECTED', 'confidence': 96.5}, {'name': 'Rheumatic fever', 'value': 'NOT_SELECTED', 'confidence': 96.0}, {'name': 'Some college', 'value': 'NOT_SELECTED', 'confidence': 95.5}, {'name': 'Jaundice', 'value': 'NOT_SELECTED', 'confidence': 95.0}, {'name': 'Diabetes', 'value': 'NOT_SELECTED', 'confidence': 95.0}, {'name': 'Anemia', 'value': 'SELECTED', 'confidence': 94.5}, {'name': "Crohn's disease", 'value': 'NOT_SELECTED', 'confidence': 94.0}, {'name': 'sick leave?', 'value': 'NOT_SELECTED', 'confidence': 94.0}, {'name': 'High cholesterol', 'value': 'NOT_SELECTED', 'confidence': 94.0}, {'name': 'High school', 'value': 'NOT_SELECTED', 'confidence': 92.0}, {'name': 'College graduate', 'value': 'NOT_SELECTED', 'confidence': 91.0}, {'name': 'Advanced degree', 'value': 'SELECTED', 'confidence': 90.5}, {'name': 'High blood pressure', 'value': 'NOT_SELECTED', 'confidence': 90.0}, {'name': 'Yes', 'value': 'SELECTED', 'confidence': 90.0}, {'name': 'Epilepsy (seizures)', 'value': 'NOT_SELECTED', 'confidence': 89.5}, {'name': 'Pulmonary embolism', 'value': 'NOT_SELECTED', 'confidence': 87.5}, {'name': 'Physician initials', 'value': 'JN', 'confidence': 87.5}, {'name': 'Stomach or peptic ulcer', 'value': 'NOT_SELECTED', 'confidence': 86.5}, {'name': 'Stroke', 'value': 'SELECTED', 'confidence': 86.0}, {'name': 'Never married', 'value': 'SELECTED', 'confidence': 84.5}, {'name': 'Partnered/significant other', 'value': 'NOT_SELECTED', 'confidence': 81.5}, {'name': 'Heart problems', 'value': 'NOT_SELECTED', 'confidence': 80.5}, {'name': 'Hours/week', 'value': '50', 'confidence': 78.5}, {'name': 'Religion', 'value': 'N/A', 'confidence': 35.5}, {'name': 'Excessive worries', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Hair loss', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Nausea', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Shortness of breath', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Redness', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Numbness', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Blood in stools', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Anemia', 'value': 'NOT_SELECTED', 'confidence': 99.5}, {'name': 'Redness', 'value': 'NOT_SELECTED', 'confidence': 99.0}, {'name': 'Muscle weakness', 'value': 'NOT_SELECTED', 'confidence': 99.0}, {'name': 'Hoarseness', 'value': 'NOT_SELECTED', 'confidence': 99.0}, {'name': 'Clots', 'value': 'SELECTED', 'confidence': 99.0}, {'name': 'Double or blurred vision', 'value': 'NOT_SELECTED', 'confidence': 99.0}, {'name': 'Frequent sore throats', 'value': 'NOT_SELECTED', 'confidence': 99.0}, {'name': 'Frequent crying', 'value': 'NOT_SELECTED', 'confidence': 99.0}, {'name': 'Irregular periods', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Hallucinations', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Sensitivity', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Headaches', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Heartburn', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Racing thoughts', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Ringing in ears', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Rapid speech', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Loss of vision', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Persistent diarrhea', 'value': 'NOT_SELECTED', 'confidence': 98.5}, {'name': 'Yellow jaundice', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Poor concentration', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Chest pain', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Mood swings', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Memory loss', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Paranoia', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Food cravings', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Loss of hearing', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Difficulty in swallowing', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Stress', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Stomach pain', 'value': 'NOT_SELECTED', 'confidence': 98.0}, {'name': 'Swollen legs or feet', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Irritability', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Poor appetite', 'value': 'NOT_SELECTED', 'confidence': 97.5}, {'name': 'Increasing constipation', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Joint pain', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Difficulty falling asleep', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Rash', 'value': 'SELECTED', 'confidence': 97.0}, {'name': 'Anxiety', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Abnormal Pap smear', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Pain', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Difficulties with sexual arousal', 'value': 'NOT_SELECTED', 'confidence': 97.0}, {'name': 'Palpitations', 'value': 'SELECTED', 'confidence': 96.5}, {'name': 'Guilty thoughts', 'value': 'NOT_SELECTED', 'confidence': 96.5}, {'name': 'Difficulty staying asleep', 'value': 'NOT_SELECTED', 'confidence': 96.5}, {'name': 'Weakness', 'value': 'SELECTED', 'confidence': 96.5}, {'name': 'Blood in urine', 'value': 'NOT_SELECTED', 'confidence': 96.5}, {'name': 'Fever', 'value': 'NOT_SELECTED', 'confidence': 96.0}, {'name': 'Numbness or tingling', 'value': 'NOT_SELECTED', 'confidence': 96.0}, {'name': 'Dizziness', 'value': 'SELECTED', 'confidence': 96.0}, {'name': 'Risky behavior', 'value': 'NOT_SELECTED', 'confidence': 96.0}, {'name': 'PMS', 'value': 'NOT_SELECTED', 'confidence': 95.5}, {'name': 'Black stools', 'value': 'NOT_SELECTED', 'confidence': 95.5}, {'name': 'Bleeding between periods', 'value': 'NOT_SELECTED', 'confidence': 95.5}, {'name': 'Fatigue', 'value': 'NOT_SELECTED', 'confidence': 95.0}, {'name': 'Depression', 'value': 'NOT_SELECTED', 'confidence': 95.0}, {'name': 'Pain in jaw', 'value': 'NOT_SELECTED', 'confidence': 94.5}, {'name': 'Joint swelling', 'value': 'NOT_SELECTED', 'confidence': 94.5}, {'name': 'Fainting', 'value': 'NOT_SELECTED', 'confidence': 94.5}, {'name': 'Color changes of hands or feet', 'value': 'NOT_SELECTED', 'confidence': 94.0}, {'name': 'Thoughts of suicide / attempts', 'value': 'NOT_SELECTED', 'confidence': 93.5}, {'name': 'Vomiting', 'value': 'NOT_SELECTED', 'confidence': 93.0}, {'name': 'Frequent or painful urination', 'value': 'NOT_SELECTED', 'confidence': 92.5}, {'name': 'Nodules/bumps', 'value': 'NOT_SELECTED', 'confidence': 92.5}, {'name': 'Fainting or loss of consciousness', 'value': 'NOT_SELECTED', 'confidence': 92.0}, {'name': 'Night sweats', 'value': 'NOT_SELECTED', 'confidence': 90.5}, {'name': 'Dryness', 'value': 'NOT_SELECTED', 'confidence': 89.5}, {'name': 'Cough', 'value': 'SELECTED', 'confidence': 87.0}, {'name': 'Physician initials', 'value': 'JN', 'confidence': 86.5}, {'name': 'Recent weight gain; how much', 'value': 'NOT_SELECTED', 'confidence': 71.0}, {'name': 'Recent weight loss how much', 'value': 'NOT_SELECTED', 'confidence': 61.0}, {'name': 'Do you have regular periods?', 'value': 'Y/ N', 'confidence': 57.0}, {'name': 'Pregnancies', 'value': '#', 'confidence': 50.0}, {'name': 'Have you reached menopause?', 'value': 'Y / N', 'confidence': 48.0}, {'name': 'Yes', 'value': 'SELECTED', 'confidence': 96.0}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 95.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 95.0}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 95.0}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 94.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 94.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 94.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 93.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 93.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 93.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 92.0}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 91.5}, {'name': 'Physician initials', 'value': 'JN', 'confidence': 91.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 90.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 89.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 88.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 88.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 88.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 87.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 86.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 86.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 85.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 85.5}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 84.5}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 82.0}, {'name': 'Yes', 'value': 'NOT_SELECTED', 'confidence': 79.0}, {'name': 'No', 'value': 'NOT_SELECTED', 'confidence': 71.0}, {'name': 'CANNABIS', 'value': 'Marijuana, hashish, hash oil', 'confidence': 69.0}, {'name': 'STIMULANTS', 'value': 'Cocaine, crack', 'confidence': 54.5}, {'name': 'BENZODIAZEPINESITRANQUILIZERS', 'value': 'Valium, Librium, Halcion, Xanax, Diazepam, "Roofies"', 'confidence': 52.499996185302734}]

    reffield=[]
    cases=listCases(filters="aa")
    #insert data into table
    b=CaseBuild(caseid="C1001",file=r'./assets/Data.csv',paexfile=formKeyValue)
    reffield=b.ReadRefKeys()
    datalist=b.ValidateKeys(reffield)
    casefile=b.CreateCaseFile(datalist,cases,reffield)
    print(casefile)
    url=''
    url='https://'+s3BucketName+'.s3.amazonaws.com/'+documentName
    url = url.replace(" ","+")
    print(url)
    CaseID=insertData(casefile,reffield,url)
        
    putObject(s3BucketName, "prior-authorization-service-dev/output/json/"+str(CaseID)+".json", json.dumps(formKeyValue))
    
    return formKeyValue
    
