import requests
from requests.exceptions import HTTPError
import json

url = 'https://clinicaltrials.gov/api/query/full_studies?min_rnk=1&max_rnk=&fmt=json&expr='

def getResponseNCT(NCTNumber):
    try:
        response = requests.get(url+NCTNumber)
        response.raise_for_status()
        jsonResponse = response.json()
        return jsonResponse
    except HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')
        return {'error':'HTTP','details':http_err}
    except Exception as err:
        print(f'Other error occurred: {err}')
        return {'error':'other','details':err}
    
def processResponse(response,criteria=False):
    fullStudy           = response['FullStudiesResponse']['FullStudies']
    protocolSection     = fullStudy[0]['Study']['ProtocolSection']
    NCTId               = protocolSection['IdentificationModule']['NCTId']
    OrgStudyIdInfo      = protocolSection['IdentificationModule']['OrgStudyIdInfo']['OrgStudyId']
    OfficialTitle       = protocolSection['IdentificationModule']['OfficialTitle']
    BriefSummary        = protocolSection['DescriptionModule']['BriefSummary']
    EligibilityCriteria = protocolSection['EligibilityModule']['EligibilityCriteria']
    output= {}
    output['protocolID'] = OrgStudyIdInfo
    output['title'] = OfficialTitle
    output['summary'] = BriefSummary
    if EligibilityCriteria:
        if 'Inclusion Criteria:' in EligibilityCriteria and 'Exclusion Criteria:' in EligibilityCriteria:
            _EligibilityCriteria = EligibilityCriteria.replace('Inclusion Criteria:','$$$$').replace('Exclusion Criteria:','$$$$')
            _,IC,EC = _EligibilityCriteria.split('$$$$')
            output['inclusion_criteria'] = IC.strip()
            output['exclusion_criteria'] = EC.strip() 
    return output

def fetchNCTDetails(NCTNumber):
    response = getResponseNCT(NCTNumber)
    output = processResponse(response)
    return(output)

##### Test Case #####
NCTNumber = 'NCT04867785'
print(f'### {NCTNumber} ###')
output = fetchNCTDetails(NCTNumber)
print(json.dumps(output))
# print('ProtocolID:',output['protocolID'])
# print('Title:',output['title'])
# print('Summary:',output['summary'])
# print('Inclusion_criteria:','\n'+output['inclusion_criteria'])
# print('Exclusion_criteria:','\n'+output['exclusion_criteria'])

