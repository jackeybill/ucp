import json
import xlrd,openpyxl
import pandas
import numpy as np

ref=[]
refdata=[]
field = {}




class ReadRef():

    def __init__(self,file):

        self.file=file

    


    def GetFileVal(self):


        df = pandas.read_csv(self.file)      



        return df

    # def GetParentVal(self,df):

    #     val=df['Data Definition'].replace(np.nan,'empty')
    #     # print(val)

    #     for parent in val:
    #         if parent!='empty':
    #             parentval=parent
    #             return parentval

        
    def GetFieldName(self,df):
        refdata=[]
        for col in df.columns:
            val=df[col].replace(np.nan,'empty')
            l = len(val)
            

        for i in range(0,l):
            # print(df[col].values[i])
            # ref=[]
            field={}
            for col in df.columns:
                # print(col)
                
                child=df[col].values[i]
                # print(child)
                if child!='empty':
                    childval=child
                    
                    d1 = {col:childval}
                    # print(d1)
                    field.update(d1)
                # print(field)
                # ref.append(field)
                
                # print(ref)
            refdata.append(field)
            # print(refdata)
            

        return refdata
                
                    
                    
                    



    def main(self):

        #print("ooo"+self.file)
        df = self.GetFileVal()
        # parentval = self.GetParentVal(df)
        fieldname=self.GetFieldName(df)

        return fieldname
        





    