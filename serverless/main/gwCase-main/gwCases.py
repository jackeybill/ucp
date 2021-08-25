import postgresql
from datetime import datetime,time
from main import CaseBuild
import boto3
import json

s3Client = boto3.resource('s3')

rds = postgresql.open('pq://postgresql:12345678@postgresqljackey.crjez4zyb6vd.us-east-2.rds.amazonaws.com:5432/Prior-Auth')
data={}
datalist=[]
tables=['CASE_Master','DIAG_CODE','PVDR_Master','Patient']

def insertData(data,reffield,url):
    casecount=len(listCases(filters="CaseID"))
    CaseID=casecount+1001
    dbupdate=[]
    for ref in reffield:
        keyname = ref['Data Definition']
        keys=data.keys()
        if keyname in keys:
            value=data.get(keyname)
            # print(value)
            columns = ref['Reference Table']
            # print(columns)
            columns=str(columns)
            
            if str(columns)!='nan':
                columns=columns.split(',') 
                for col in columns:
                    d1={}
                    # print(col)
                    col=col.split('-')
                    tablename=col[0]
                    fieldname=col[1]
                    ftype=col[2]
                    d1= {tablename : { 'field': fieldname, "type": ftype, 'value':value}}
                    dbupdate.append(d1)
            
    field=""
    value=""
    # print(dbupdate)
    for table in tables:
        field=""
        value=""
        sql=""
        for db in dbupdate:
            if table in db.keys():
                # print(table)
                dbcols=db.get(table)
                field=field+'"'+dbcols.get('field')+'"'+','
                if dbcols.get('type')=='string':
                    value=value+"'{"+dbcols.get('value')+"}'"+','
                elif dbcols.get('type')=='date':
                    date=dbcols.get('value')
                    date=datetime.today()
                    value=value+date+','
                    # print(date)
                else:
                    value=value+dbcols.get('value')+','
        
        
        field=field[:-1]
        value=value[:-1]
        # print(field)
        if table=='CASE_Master':
            field='"CASE_ID","CASE_FILE_URL",'+field
            value=str(CaseID)+",'{"+str(url)+"}',"+value
            sql='INSERT INTO private."'+table+'"('+field+') VALUES('+value+')'
            print(sql)
            result = rds.execute(sql)
        else:
            field='"CASE_ID",'+field
            value=str(CaseID)+','+value
            sql='INSERT INTO private."'+table+'"('+field+') VALUES('+value+')'
            print(sql)
            result = rds.execute(sql)
    dbupdate.clear()
    return CaseID

    
def listCases(filters):
    # getConfScore(CaseID=1008)
    datalist=[]
    datalist2=[]
    datalist3=[]
    CASEIDS=[]
    sql11='SELECT "CASE_ID" FROM private."CASE_Master"'
    result11=rds.prepare(sql11)
    for rows11 in result11:
        CASEIDS.append(rows11[0])
    sql='SELECT column_name,table_name FROM INFORMATION_SCHEMA.COLUMNS'
    result= rds.prepare(sql)
    # print("RESSSSULT",result)
    
    for rows in result:
        # print(rows)
        if rows[1] in tables:
            print(rows[1])
            sql10='SELECT "CASE_ID","' + rows[0] +'" FROM private."'+rows[1]+'"'
            # print(sql10)
            result10=rds.prepare(sql10)
            for rows10 in result10:
                d1 = {'CASE_ID':rows10[0], 'key':rows[0], 'value':rows10[1]}
                datalist3.append(d1)
    # print(datalist3)
    # print(CASEIDS)
    datalist4=[]
    for CASEID in CASEIDS:
        d1={'CASE_ID': CASEID}
        for data in datalist3:
            # print(data)
            if CASEID==data['CASE_ID']:
               d1.update({data['key']:data['value']})
               
        datalist4.append(d1)
               
               
    print(datalist4)

        
    sql2= 'SELECT * FROM private."CASE_Master" ORDER BY "CASE_ID" DESC;'
    # print(table)
    result2= rds.prepare(sql2)

    for rows in result2:
        data2={}
        CASE_ID=rows[0]
        CASE_DATE_SUBMITTED=datetime.today().strftime('%Y-%m-%d')
        CASE_MBR_FNAME=rows[5][0]
        # print(CASE_MBR_FNAME[0])
        prov_id=rows[26].replace("{","")
        prov_id=prov_id.replace("}","")
        CASE_PROVIDER_ID=prov_id
        CASE_PAT_ID=rows[8][0]
        CASE_STAGE=rows[3][0]
        FILE_URL=rows[7][0]
        SPEC=rows[21].replace("{","")
        SPEC=SPEC.replace("}","")
        CASE_SPEC=SPEC
        CASE_DX=rows[22][0]
        ICD=rows[23].replace("{","")
        ICD=ICD.replace("}","")
        CASE_ICD=ICD
        # CASE_CPT_CODE=rows[25][0]
        # CASE_CPT_DESC=rows[26][0]
        data2.update({
                    "CASE ID":str(CASE_ID), 
                    "SUBMISSION DATE":str(CASE_DATE_SUBMITTED),
                    "MEMBER NAME":str(CASE_MBR_FNAME),
                    "PROVIDER ID":str(CASE_PROVIDER_ID),
                    "MEMBER ID":str(CASE_PAT_ID),
                    "STATUS":CASE_STAGE,
                    "SUBMISSION BY":"Pratik",
                    "SUBMISSION CHANNEL":"Fax",
                    "CASE SPECIALITY": CASE_SPEC,
                    "CASE DX": CASE_DX,
                    "CASE ICD":CASE_ICD,
                    # "CASE_CPT_CODE":CASE_CPT_CODE,
                    # "CASE_CPT_DESC":CASE_CPT_DESC,
                    "FILE": FILE_URL
                    # "File": bucketName + documentName
                    })
        # print(data2)
        # datalist2.append(data2)
        sql3= 'SELECT * FROM private."PVDR_Master" WHERE "CASE_ID"='+str(CASE_ID)+''
        result3= rds.prepare(sql3)
        # print(result3)
        for rows2 in result3:
            Provider_Name=rows2[1][0]
            Provider_Addrs=rows2[2][0]
            # Pvdr_Addrs=' '
            # for i in range(0,len(Provider_Addrs)):
            #     Pvdr_Addrs=Pvdr_Addrs+Provider_Addrs[i]
                # print(Pvdr_Addrs)
            data2.update({
                        "PROVIDER": Provider_Name,
                        "PROVIDER ADDRESS":str(Provider_Addrs)
                        })
        # datalist2.append(data2)
        sql4= 'SELECT * FROM private."Plan_Master" WHERE "CASE_ID"='+str(CASE_ID)+''
        result4= rds.prepare(sql4)
        print(sql4)
        for rows3 in result4:
            # print(rows3[15])
            Plan_ID=rows3[15]
            data2.update({
                        "PLAN ID": Plan_ID
                        })
        # datalist2.append(data2)
        sql5= 'SELECT * FROM private."DIAG_CODE" WHERE "CASE_ID"='+str(CASE_ID)+''
        result5= rds.prepare(sql5)
        print(result5)
        for rows4 in result5:
            DIAG_ID=rows4[0]
            DIAG_DESC=rows4[2][0]
            data2.update({
                        "DIAG ID": DIAG_ID,
                        "DIAG_DESC":DIAG_DESC
                        })
        sql6= 'SELECT * FROM private."Patient" WHERE "CASE_ID"='+str(CASE_ID)+''
        result6= rds.prepare(sql6)
        print(result6)
        for rows5 in result6:
            # print(rows5[14])
            Patient_lang=rows5[14][0]
            # print(Patient_lang)
            # Patient_lang=rows5[14].replace("{","")
            # Patient_lang=Patient_lang.replace("}","")
            data2.update({
                        "PATIENT LANGUAGE": Patient_lang
                        })
        datalist2.append(data2)
            
    print("CASES",datalist2)
    # getCase(1)
    return datalist2
    
def getCase(caseID):
    response={}
    datalist=listCases(filters="CASEID")
    # print(datalist)
    for data in datalist:
        if data['CASE ID']==str(caseID):
            response={
                    "info": {
                            "Case_ID": data['CASE ID'],
                            "name": data['MEMBER NAME'],
                            "sex": "Female",
                            "birth": "10/28/1971",
                            "age": 50,
                            "eligibility": "TBD",
                            "MEMBER ID": data['MEMBER ID'],
                            "language": data['PATIENT LANGUAGE']
                        },
                    "entities":[
                        {"Provider":
                            [{   "name": "DIAGNOSIS_TYPE",
                                "label": "Provider Name",
                                "value": data['PROVIDER'],
                                "oldValue": data['PROVIDER'],
                                "confidence": getConfScore(caseID,data['PROVIDER']),
                                "type": "String",
                                "mandatory": True,
                                "selection": [{"key":"value"}],
                                "order": 1
                            },
                            {   "name": "DIAGNOSIS_NAME",
                                "label": "Provider ID",
                                "value": data['PROVIDER ID'],
                                "oldValue": data['PROVIDER ID'],
                                "confidence": 98,
                                "type": "String",
                                "mandatory": True,
                                "selection": [{"ALL":"all"}],
                                "order": 2
                            }]
                        },
                        {"Service Information":
                            [{   "name": "Servicing Provider",
                                "label": "Servicing Provider",
                                "value": data['PROVIDER'],
                                "oldValue": data['PROVIDER'],
                                "confidence": getConfScore(caseID,data['PROVIDER']),
                                "type": "Date",
                                "mandatory": False,
                                "order": 1
                            },
                            {   "name": "Servicing Provider Address",
                                "label": "Servicing Provider Address",
                                "value": data['PROVIDER ADDRESS'],
                                "oldValue": data['PROVIDER ADDRESS'],
                                "confidence": getConfScore(caseID,data['PROVIDER ADDRESS']),
                                "type": "Date",
                                "mandatory": False,
                                "order": 1
                            },
                            {   "name": "NPI/Tax ID",
                                "label": "NPI/Tax ID",
                                "value": data['PROVIDER ID'],
                                "oldValue": data['PROVIDER ID'],
                                "confidence": getConfScore(caseID,data['PROVIDER ID']),
                                "type": "Date",
                                "mandatory": False,
                                "order": 1
                            },
                            {   "name": "Specialty",
                                "label": "Specialty",
                                "value": data['CASE SPECIALITY'],
                                "oldValue": data['CASE SPECIALITY'],
                                "confidence": getConfScore(caseID,data['CASE SPECIALITY']),
                                "type": "Date",
                                "mandatory": False,
                                "order": 1
                            }
                            
                            ]
                        },
                        {"Service Requested":
                            [{   "name": "ICD-10 code",
                                "label": "ICD-10 code(",
                                "value": data['CASE ICD'],
                                "oldValue": data['CASE ICD'],
                                "confidence": getConfScore(caseID,data['CASE ICD']),
                                "type": "Date",
                                "mandatory": False,
                                "order": 1
                            },
                            {   "name": "Disease Description",
                                "label": "Disease Description",
                                "value": data['CASE DX'],
                                "oldValue": data['CASE DX'],
                                "confidence": getConfScore(caseID,data['CASE DX']),
                                "type": "Date",
                                "mandatory": False,
                                "order": 1
                            }
                            
                            ]
                            }
                            
                            
                    ]
                }
                
    
    return response

def getConfScore(CaseID,value):
    print(CaseID)
    
    file= 'prior-authorization-service-dev/output/json/'+str(CaseID)+'.json'
    jsonlist=[]
    obj = s3Client.Object('hiapadev', file )
    body = obj.get()['Body'].read()
    body=body.decode("utf-8")
    # print(body)
    json_content = json.loads(body)
    # print(json_content)
    for field in json_content:
        fieldname=field['value']
        fieldname=fieldname.replace(" ","")
        fieldname=fieldname.lower()
        value=str(value)
        value=value.replace(" ","")
        value=value.lower()
        print(value)
        print(fieldname)
        if value in fieldname:
            confidence=field['confidence']
            # print(confidence)
            return confidence
   
    
