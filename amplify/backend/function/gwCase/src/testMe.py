import json

import gwCases
import awsUtils

def main():
    print( gwCases.getCase("C1001"))
    return
    # create Case/hia-pa/amplify/backend/function/gwCase/src/assets/keyValues.json
    file='/home/ec2-user/environment/hia-pa/amplify/backend/function/gwCase/src/assets/keyValues.json' #./assets/keyValues.json
    keyValue= open(file)
    pavalue=json.load(keyValue)
    casefile = {'CaseID': '005', "Member's Name": 'John Doe', 'Date of Service': '04/01/2021', 'Provider ID': '98999', 'DOB': '06/03/1996', 'Member ID': '39721'}
    # gwCases.insertData(casefile)
    caselist=gwCases.listCases()
    # List Cases
    return casefile

main()