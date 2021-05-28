import json
from aws import readref,validatekeys,createcase

files =r'./assets/Data.xlsx'

# Please give the location of the extracted JSON FILE here
paexfiles=[r'/home/ec2-user/environment/main/assets/keyValues1.json']

class CaseBuild:

    def __init__(self, file, paexfile, caseid):
        self.caseid=caseid
        self.file= file
        self.paexfile=paexfile

    def RtrvRefFile(self):

        #Run Function to retrive Reference File from s3

        return self

    def RtrvPAFile(self):

        #Run Function to retrive PA File from s3

        return self

    def ReadRefKeys(self):
        reffield=[]
        # print(self.file)
        #Extract data definition keys from Reference File
        a=readref.ReadRef(self.file)
        reffield=a.main()
        
        return reffield

  

    def ValidateKeys(self,reffield):

        #check if Reference File Keys present in PA extracted data
        #and update confidence score, validation check, duplicate value check 
        #in Ref filedef
        datalist=[]
        c=validatekeys.ReadPA(self.paexfile,reffield)
        datalist=c.main() 
        # print(initial)

        return datalist

    def UpdateDBCase(self):
        
        
        # Update case values in DB

        return '200'


    def CreateCaseFile(self,datalist,cases,reffield):
        
        # print(datalist)
        d=createcase.CreateCase(datalist,cases,reffield)
        print(cases)
        response=d.main()
        
        

        #Create Case File 

        return response