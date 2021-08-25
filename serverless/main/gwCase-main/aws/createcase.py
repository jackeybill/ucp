import json
import xlrd


class CreateCase():
    
    def __init__(self,datalist,cases,reffield):
        
        self.datalist=datalist
        self.cases=cases
        self.reffield=reffield
        
    def CreateJson(self):
        
        # print(self.reffield)
        
        # print(self.datalist)
        # print(self.cases)
        jsonkeylist=[]
        uioutput={}
        casecount=len(self.cases) 
        for ref in self.reffield:
            d1={}
            d2={}
            if ref['Unique']=='Yes':
                key=ref['Data Definition']
                value=ref['Default']+str(casecount)
                d1={key:value}
                d2={"DB":ref['Reference Table']}
                uioutput.update(d1)
                jsonkeylist.append(key)
            else: 
                key=ref['Data Definition']
                value=ref['Default']
                d1={key:value}
                uioutput.update(d1)
                jsonkeylist.append(key)
                
            
            
        # print("uiiiiiiiiiiiiiii",uioutput)  
        
        # print(jsonkeylist)
        # jsonkeylist=["Case ID","Member's Name","Provider Name","Provider ID","Member Name","DOB","Member ID","Submitted By","Submitted On","Submission Channel","Status"]
        raw=self.datalist
        # print("raaaw",raw)
        # uioutput={"CaseID":"001", "Member's Name":"John Doe","Provider Name":"N/A", "Provider ID":"1001"+str(casecount), "Member ID":"2002"+str(casecount),"Submitted By":"N/A","Submission Channel":"Fax","Status":"Case Built"}
        # (data["CaseID"], datetime.today(), data["Member's Name"],data["Provider ID"],data["Member ID"])
        for key in jsonkeylist:
            # print(key)
            for x in raw:
                # conscore=''
                # conscore=x.get('confidencescore')
                # if conscore>=int(90):
                if key in x.keys():
                    value=x.get(str(key))
                    d1={key:value}
                    uioutput.update(d1)
        print("uioutput=", uioutput)
        return uioutput
        
    def main(self):

        response=self.CreateJson()
        
        return response
        