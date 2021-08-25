import json
import xlrd
import pandas
import numpy as np


# datalist=[]



class ReadPA():

    def __init__(self,paexfile,reffield):

        self.paexfile=paexfile
        self.reffield=reffield
        

    def GetFileVal(self):
        return self.FindKey(self.paexfile)


    def FindKey(self,pavalue):
        datalist=[]


        refkeys=self.reffield
        
        for refk in refkeys:
            dd=refk['Data Definition']
            alternatename=refk['Alternate name']
            tablename=refk['Reference Table']
            field=refk["Field Type"]
            default=refk['Default']
            unique=refk['Unique']
            # confidencescore=refk['Confidence %']
            # validationval=refk['Validation']
            # duplicate=refk['Duplication Check(True/False)']
            
            if str(alternatename)!='nan':
                altname = alternatename.split(",")
                for kv in pavalue:
                    key=kv.get('name')
                    for altn in altname:
                        # print(altn)
                        altn=altn.lower()
                        padata={}
                        key=key.lower()
                        # print(altn)
                        # print(key)
                        if str(altn) in key:
                            value=kv.get('value')
                            # print(value)
                            
                            # function to check cofidence score
                            # confidencescore=ConfidenceCheck(self)
                            # function to validate value
                            # validationval=ValidationCheck(self)
                            # function to check duplicate
                            # duplicate=DuplicationChecl(self )
                            
                            
                            d1={dd:value,'default':default,'Unique':unique,'tablename':tablename,'field':field,'confidencescore':kv.get('confidence')}
                            padata.update(d1)
                            # print(padata)
                            # print(padata)
                            datalist.append(padata)

                        
        return datalist
        
    def ValidationCheck(self):
        
        return self
        
    def DuplicationCheck(self):
        
        return self
        
    def ConfidenceCheck(self):
        
        return self
                    

           
        
            
                
    def main(self):

        datalist=self.GetFileVal()
        
        return datalist