import re
import json
import boto3
import time

bullets_patterns = {'pfizer' : [ r'\n\d{1,3}\.\s' , r'\n\D\.\s' ] ,
                   'eli_lilly': [ r'\n[\[]+[\d{1,3}]+[\]]' , r'\n[\[]+[\d{1,3}]+[a-z]+[\]]' ]
                   }

spl_chars = '();' #'(),.;'

searchst = 'TABLE OF CONTENTS'
searchend = 'REFERENCES\n'

### Textract ###
def startJob(s3BucketName, objectName):
    response = None
    client = boto3.client('textract')
    response = client.start_document_analysis(
    DocumentLocation={
     'S3Object': {
     'Bucket': s3BucketName,
     'Name': objectName
     }}, FeatureTypes=['TABLES'])
    return response["JobId"]

def isJobComplete(jobId):
    time.sleep(15)
    client = boto3.client('textract')
    response = client.get_document_analysis(JobId=jobId)
    status = response["JobStatus"]
    while(status == "IN_PROGRESS"):
        time.sleep(5)
        response = client.get_document_analysis(JobId=jobId)
        status = response["JobStatus"]
    return status

def getJobResults(jobId):
    pages = []
    client = boto3.client('textract')
    response = client.get_document_analysis(JobId=jobId)
    pages.append(response)
    nextToken = None
    if('NextToken' in response):
        nextToken = response['NextToken']
    while(nextToken):
        response = client.get_document_analysis(JobId=jobId, NextToken=nextToken)
        pages.append(response)
        nextToken = None
        if('NextToken' in response):
            nextToken = response['NextToken']
    return pages

### TOC ###
def parseTOC(text,verbose=False):
    result = []
    find_index_toc = [m.start() for m in re.finditer(searchst, text, re.IGNORECASE)]
    find_index_ref = [m.start() for m in re.finditer(searchend, text, re.IGNORECASE)]  
    if find_index_toc and find_index_ref:
        toc_text = text[find_index_toc[0]:find_index_ref[0]+10]    
        parsetoc = re.compile(r'\n\d.*[\na-zA-Z/\-, ]+\n')
        toc_lst = parsetoc.findall(toc_text)
        _text = text[find_index_ref[0]+10:len(text)]
        for toc in toc_lst:
            try:
                toc_rgx = toc.replace('(',r'[(\[]').replace(')',r'[)\[]')
                toc_rgx = toc_rgx.replace('\n',r'\s')
                match = [m.start() for m in re.finditer(toc_rgx, _text)]
                index,name = toc.strip().replace('\n',' ').split(' ',1)
                if len(match)>0:
                    result.append([index,name,match])
            except:
                match = None       
        return result,_text
    return None,None


def selectSponsorbullet(text):
    bullets_lst = []
    for sponsor in bullets_patterns:
        bullet_p1,bullet_p2 = bullets_patterns[sponsor]
        s1 = re.sub(bullet_p1,"$$$", text)
        s2 = re.sub(bullet_p2,"###", s1)
        bullets = s2.split("$$$")
        bullets_lst.append([len(bullets),bullets,bullet_p1,bullet_p2])
    bullets_lst = sorted(bullets_lst, key=lambda x:x[0],reverse=True)
    return bullets_lst[0][1],bullets_lst[0][2],bullets_lst[0][3]

def bulletsToJson(text,pretty=False,dictionary=False):
    #s1 = re.sub(bullet_p1,"$$$", text)
    #s2 = re.sub(bullet_p2,"###", s1)
    #bullets = s2.split("$$$") 
    bullets,bullet_p1,bullet_p2 = selectSponsorbullet(text)
    bulletData = {}
    for bullet in bullets:
        bulletNumber = bullets.index(bullet)
        bullet = bullet.strip().replace('\n',' ')
        if bulletNumber==0:
            bulletData["desc"] = re.sub(r'[1-9].*\w Criteria', '', bullet).strip() #bullet
        elif '###' in bullet:
            bulletData[bulletNumber]={}
            subbullets = bullet.split('###')
            for sb in subbullets:
                sbNumber = subbullets.index(sb)
                if sbNumber==0:
                    sbNumber = "desc"
                bulletData[bulletNumber][sbNumber]= sb
        else:
            bulletData[bulletNumber]=bullet            
    if dictionary:
        return(bulletData,bullet_p1,bullet_p2)
    elif pretty:
        return(json.dumps(bulletData,indent=2),bullet_p1,bullet_p2)
    else:
        return(json.dumps(bulletData),bullet_p1,bullet_p2)

def getindexes(toc,name,partial=False):
    result = []
    if toc!=None:
        for t in toc:
            if t[1].lower()==name.lower():
                result.append(t[0])
    return result
    
def getsubsections(toc,index):
    result = []
    if toc!=None:
        for t in toc:
            if t[0].startswith(index):
                result.append(t)
    return result

def processTextforUI(text,bullet_p1,bullet_p2):
    text = text.replace('0 or\n1.','0 or 1.') #Work-around
    if bullet_p1 == r'\n[\[]+[\d{1,3}]+[\]]':
        r1 = re.compile(r"("+bullet_p1+")[\n ]")
        r2 = re.compile(r"("+bullet_p2+")[\n ]")
    else:
        r1 = re.compile(r"("+bullet_p1+")")
        r2 = re.compile(r"("+bullet_p2+")")
    output = r1.sub(r' $$$\1 ', text)
    output = r2.sub(r' ###\1 ', output)
    output = output.replace('\n',' ')
    output = output.replace('$$$ ','\n\t').replace('$$$','\n\t')
    output = output.replace('### ','\n\t\t').replace('$$$','\n\t\t')
    for sc in spl_chars:
        output = output.replace(sc,f' {sc} ')
    return output

def extractsectiontext(toc,t,text):
    result = {}
    result['index'] = t[0]
    result['name'] = t[1]
    t2 = toc[toc.index(t)+1]
    subtext = text[t[2][0]:t2[2][0]]
    subtext = subtext.replace(t[0],'').replace(t[1],'').strip()
    result['json'],bullet_p1,bullet_p2 = bulletsToJson(subtext,dictionary=True)
    result['text'] = processTextforUI(subtext,bullet_p1,bullet_p2)  #subtext
    return result

def extractcompletesection(toc,name,text):
    result = {}
    index = getindexes(toc,name) 
    if len(index)==0:
        result['name'] = 'Not found'
        result['toc'] = toc
        print(f'{name} not found')
        return result    
    subsections = getsubsections(toc,index[0])  
    for subsection in subsections:
        i = subsections.index(subsection)
        result[i] = extractsectiontext(toc,subsection,text)    
    return result

def extractSections(text,sectionNames,jsontype=True,pretty=False):
    toc,text = parseTOC(text) 
    result = {}
    if toc == None:
        print(f'TOC not found')
    else:
        for name in sectionNames:
            result[name] = extractcompletesection(toc,name,text)    
    if jsontype and pretty:
        return json.dumps(result,indent=2)
    elif jsontype:
        return json.dumps(result)
    else:
        return result

def extract_text(s3BucketName,documentPath,filename):
    filename = documentPath+filename
    print(f'Processing -- {filename}')
    jobId = startJob(s3BucketName, filename)
    print("Started textract job with id: {}".format(jobId))
    raw = ''
    if(isJobComplete(jobId)):
        response = getJobResults(jobId)
        for resultPage in response:
            for item in resultPage["Blocks"]:
                if item["BlockType"] == "LINE":
                    top = item['Geometry']['BoundingBox']['Top']
                    if top >= float(0.09) and top <= float(0.9):
                        raw += item["Text"]+'\n'
    return raw

def nctExtractSections(s3BucketName,documentPath,filename,sectionNames,pretty=False):
    text = extract_text(s3BucketName,documentPath,filename)
    result = extractSections(text,sectionNames,pretty)
    return result


### Test Local ###
# from os.path import join
# def loadtext(filename):
#     if filename.endswith('.txt'):  
#         with open(join(path, filename), "rb") as f:
#             print(f'Reading: {filename}')
#             return f.read().decode()
#     return None
# #path = 'study_protocols_Eli_Lilly_and_Company_phase1_textract_HF' #'study_protocols_pfizer_phase1_textract_HF/'
# path = 'study_protocols_pfizer_phase1_textract_HF/'
# filename = 'NCT01307267.txt' #'NCT01307267.txt' 
# sectionNames = ['Inclusion Criteria','Exclusion Criteria']
# text = loadtext(filename)
# result = extractSections(text,sectionNames,pretty=True)
# print(result)


### Inference ###

#s3 
# s3BucketName = "iso-data-zone"                    #"iso-clinicaltrial-studyprotocols"
# documentPath = "iso-service-dev/RawDocuments/"    #"study_protocols_eli_lilly_and_company_phase1/"
# #document and spoonsor
# filename = 'Clinical Pharmacology Protocol 887663.pdf' #'NCT01484431.pdf'
# bullet_p1,bullet_p2 = bullets_patterns['eli_lilly']
# #Inferance call
# sectionNames = ['Inclusion Criteria','Exclusion Criteria']
# print(nctExtractSections(s3BucketName,documentPath,filename,sectionNames))