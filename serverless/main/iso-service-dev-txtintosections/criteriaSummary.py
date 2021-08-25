# Copyright 2017-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file
# except in compliance with the License. A copy of the License is located at
#
#     http://aws.amazon.com/apache2.0/
#
# or in the "license" file accompanying this file. This file is distributed on an "AS IS"
# BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under the License.
import boto3
import json
import csv
import re
#import ctti.loadCTTIData
#import postgresql

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
#rds = postgresql.open('pq://mi608:'+urllib.parse.unquote_plus('Training@123')+'@aact-db.ctti-clinicaltrials.org:5432/aact')

def removeSpecialChars(key):
    key = re.sub('[^A-Za-z0-9]+', '', key)
    return key.lower()


soaDic = {}
with open('./StandardizedActivitiesMapping.csv', mode='r') as infile:
    reader = csv.reader(infile)
    soaDic = {removeSpecialChars(rows[0]):rows[1] for rows in reader}


def standardize(raw):
    print('Raw :' + raw)
    if(removeSpecialChars(raw) in soaDic):
        print('Standardize :' + soaDic[removeSpecialChars(raw)])
        return soaDic[removeSpecialChars(raw)]
    else:
        return raw.title()
        
        
def checkSameWord(sKey, tKey):
    if removeSpecialChars(sKey) == removeSpecialChars(tKey):
        return True
    else:
        return False
        

def getLists():
    table = dynamodb.Table('studies')
    response = table.scan()
    items = response['Items']

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])
    print(len(items))
    for item in items:
        if 'sponsor' not in item:
            print(item)
            #print(loadCTTIData.load_country(item['nct_id']))
            break
    
def load_from_dynamodb(nct_id):
    table = dynamodb.Table('study_summary')
    response = table.get_item(
        Key={'nct_id': nct_id}
    )
    # print(response)
    if 'Item' in response:
        return response['Item']
    return None


def load_criteria_summary_by_nct_ids(nct_ids):
    """
    Load criteria summary from dynamodb by nct_id
    :param nct_ids:
    :return: criteria summary
    """
    all_criteriaSummary = []
    for nct_id in nct_ids:
        summary = load_from_dynamodb(nct_id)
        if summary != None:
            all_criteriaSummary.append(json.loads(summary['summary']))
    return all_criteriaSummary
    
    
def update_category(source):
    mapping_data = [{'MEDICAL_CONDITION': 'Medical Condition'},
                    {'TEST_NAME': 'Lab/Test'},
                    {'TEST_TREATMENT_PROCEDURE': 'Lab/Test'},
                    {'TREATMENT_NAME': 'Intervention'},
                    {'MEDICATION': 'Intervention'},
                    {'PROCEDURE_NAME': 'Intervention'},
                    {'PROTECTED_HEALTH_INFORMATION': 'Demographics'}]
    for item in mapping_data:
        if item.get(str(source['Category']).upper()) is not None:
            # print(item.get(str(source['Category']).upper()))
            source['Category'] = item.get(str(source['Category']).upper())
            print(source)
            return source
    return source
    

def process_age(entity):
    """
    Prcoess Age to string
    """
    import re
    
    if entity['Type'] == 'AGE':
        if len(entity['Text']) > 0 and len(re.findall('\d+', entity['Text'])) > 0:
#             print(entity['Text'])
            x = str(entity['Text'])
#             print(x)
            entity['Value'] = int(''.join(ele for ele in x if ele.isdigit()))
            if entity['Value'] > 100:
                entity['Value'] = 100
        else:
            entity['Value'] = 0
        entity['Text'] = 'AGE'
        return entity
    return entity



def process_bmi(entity, bmi_value_range, bmi_list):
    """ va
    Process BMI for value,get min and max value
    """
    import re
    print(entity)
    
    if entity['Text'] == 'BMI':
        if 'values' in entity and len(entity['values']) > 0:
            for item in entity['values']:
                if 'TEST_VALUE' in item:
#                     print(3)
                    datas = []
                    if '-' in item['TEST_VALUE']:
                        datas = item['TEST_VALUE'].split('-')
                    elif 'to' in item['TEST_VALUE']:
                        datas = item['TEST_VALUE'].split('to')
                    elif '&' in item['TEST_VALUE']:
                        datas = item['TEST_VALUE'].split('to')
#                     ≥ 20 & ≤ 30
                    print(datas)
                    if len(datas) == 0:
                        data = re.findall('\d+', item['TEST_VALUE'])
                        bmi_values =''.join(ele for ele in item['TEST_VALUE'] if ele.isdigit())
                        middle = 2
                        if int(bmi_values[:middle]) > 60:
                            middle = 1
                        if len(str(bmi_values)) >=3:
                            if int(bmi_values[:middle]) > 60:
                                middle = middle - 1
                                bmi_list.append(float(bmi_values[:middle]))
                            else:
                                bmi_list.append(float(bmi_values[:middle]))
                            
                            if len(str(bmi_values[middle+1:]).strip()) > 0:
                                bmi_list.append(float(bmi_values[middle+1:])) 
                            # bmi_list.append(float(bmi_values[middle+1:]))
                        else:
                            if len(str(bmi_values).strip()) > 0:
                                bmi_list.append(float(bmi_values))
                            
                    else:
                        for d in datas:
                            dd = ''.join(ele for ele in d if ele.isdigit())
                            middle = 2
                            if int(dd[:middle]) > 60:
                                middle = 1
                            if len(str(dd)) >= 3:
                                if int(dd[:middle]) > 60:
                                    middle = middle - 1
                                    bmi_list.append(float(dd[:middle]))
#                                    bmi_list.append(float(dd[:middle]))
                                else:
                                    bmi_list.append(float(dd[:middle]))
                                try:
                                    bmi_list.append(float(dd[middle+1:]))
                                except:
                                    print(dd)
                            else:
                                bmi_list.append(float(dd))
                    print(bmi_list)
        else:
            entity['Value'] = 0
            
        
        
        return entity, bmi_value_range, bmi_list
    return entity, bmi_value_range, bmi_list


# Body mass index
# HbA1c
# ECOG
def process_avg_value(entity, text, value_range):
    import re
    print(entity)
    
    if entity['Text'] == text:
        if 'value' in entity and len(entity['value']) > 0 and len(re.findall('\d+', entity['value'])) > 0:
            print(entity['value'])
#             values = str(entity['value']).strip().split(' ')
#             x = values[len(values) - 1]
            
            data = re.findall('\d+', entity['value'])
            print(data)
            
            x = entity['value']
#             print(x)
#             entity['Value'] = int(''.join(ele for ele in x if ele.isdigit()))
            value_max = max(re.findall('\d+', entity['value']))
            values = []
            for i in value_max:
                i = int(''.join(ele for ele in i if ele.isdigit()))
                if i <= 100:
                    values.append(i)
            if len(values) > 0:
                entity['Value'] = max(values)
            else:
                entity['Value'] = 0
                
                
            if re.match('>', x):
                if value_range[1] == 0:
                    value_range[1] = entity['Value']
                if entity['Value'] > value_range[1]:
                    value_range[1] = entity['Value']
            elif re.match('<', x):
                if value_range[0] == -1:
                    value_range[0]=entity['Value']
                elif entity['Value'] < bmi_value_range[0]:
                    value_range[0]=entity['Value']
            
        else:
            entity['Value'] = 0
        return entity, value_range
    return entity, value_range


def convert_time_unit(conv_str):
    print('convert time:', conv_str)
    res = re.findall('daily', conv_str)
    if len(res) >0:
        return 365
    res = re.findall('months', conv_str)
    if len(res) >0:
        return 30
    res = re.findall('weeks', conv_str)
    if len(res) >0:
        return 7
    res = re.findall('days', conv_str)
    if len(res) >0:
        return 7
    return 0
    

def process_duration(entity, duration_list):
    """ va
    Process dosage for value, get min and max value
    """
    print('process_duration...')
    print(entity)
    if 'Type' in entity and entity['Type'].upper() == 'GENERIC_NAME':
        if 'values' in entity and len(entity['values']) > 0:
            for item in entity['values']:
                if 'TEST_VALUE' in item:
                    time_convert = convert_time_unit(item['TEST_VALUE'])
                    value =''.join(ele for ele in item['TEST_VALUE'] if ele.isdigit())
                    if len(value) > 0:
                        if time_convert and time_convert > 0:
                            duration_list.append(float(value) * float(time_convert))
                        else:
                            duration_list.append(float(value))
        else:
            entity['Value'] = 0
    print('get duration list:', duration_list)
    return entity, duration_list


def process_dosage(entity, dos_value_range, dos_list):
    """ va
    Process dosage for value, get min and max value
    """
#     print('process_dosage...')
#     print(entity)
    if 'Type' in entity and entity['Type'].upper() == 'GENERIC_NAME':
        if 'values' in entity and len(entity['values']) > 0:
            for item in entity['values']:
                if 'TEST_VALUE' in item:
                    value =''.join(ele for ele in item['TEST_VALUE'] if ele.isdigit())
                    if len(value) > 0:
                        dos_list.append(float(value))
        else:
            entity['Value'] = 0
#     print('get dosage list:', dos_list)
    return entity, dos_value_range, dos_list


def process_frequency(data, total):
    """
    Process certeria frequency
    :param data:
    :param total:
    :return:
    """

    inclusionCriterias = []
    exclusionCriterias = []

    for i in data:
        for j in i:
            if 'InclusionCriteria' in j:
                inclusionCriterias.append(j['InclusionCriteria'])
            if 'ExclusionCriteria' in j:
                exclusionCriterias.append(j['ExclusionCriteria'])

    criterias_dict = {'InclusionCriteria': inclusionCriterias, 'ExclusionCriteria': exclusionCriterias}
    allCriteriaResult = []
    apiCriteriaResult = []
    for criteria_name in ['InclusionCriteria', 'ExclusionCriteria']:
        criteria_value = criterias_dict[criteria_name]
        criteriaChildsText = []
        criteriaChildsCategory = []
        criteriaChilds = []

        age_list = []
        bmi_list = []
        ecog_list = []
        hba1c_list = []
        body_list = []
        dos_list = []
        duration_list = []
        bmi_value_range = [-1, 0]
        bmi_unit = ''
        ecog_value_range = [-1, 0]
        hba1c_value_range = [-1, 0]
        body_value_range = [-1, 0]
        dos_value_range = [-1, 0]
        for i in criteria_value:
            for c in i:
                childs = i[c]
                for child in childs:
                    
                    if child['Type'] == 'AGE':
                        child = process_age(child)
                        age_list.append(child['Value'])
                        
                    if child['Type'] == 'GENERIC_NAME':
                        if checkSameWord(child['Text'], 'Metformin'):
                            child, dos_value_range, dos_list = process_dosage(child, dos_value_range, dos_list)
                    
                    if checkSameWord(child['Text'], 'insulin'):                        
                        child, duration_list = process_duration(child, duration_list)
                        
                    if child['Text'] == 'BMI':
                        child, bmi_value_range, bmi_list = process_bmi(child, bmi_value_range, bmi_list)
                        
                    if child['Text'] == 'ECOG':
                        child, ecog_value_range = process_avg_value(child, 'ECOG', ecog_value_range)
                        ecog_list.append(child['Value'])
                        
                    if child['Text'] == 'HbA1c':
                        child, hba1c_value_range = process_avg_value(child, 'HbA1c', hba1c_value_range)
                        hba1c_list.append(child['Value'])
                        
                    if child['Text'] == 'Body mass index':
                        child, body_value_range = process_avg_value(child, 'Body mass index', body_value_range)
                        body_list.append(child['Value'])
                        
                                               
                    child_item = {'Category': child['Category'], 'Text': child['Text']}
                        
                    # For process category on ui
                    child_item = update_category(child_item)
#                     print(child_item)
                    criteriaChilds.append(child_item)
                    criteriaChildsCategory.append(child_item.get('Category'))
                    criteriaChildsText.append(child_item.get('Text'))
        criteriaChildsCategorySet = set(criteriaChildsCategory)
        result_items = []
        base_num = 1
        for c in criteriaChildsCategorySet:
            result_item_child_text = []
            result_item_child = []
            for child in criteriaChilds:
                if child.get('Category') == c:
                    if child['Text'].upper() != 'AGE':
                        result_item_child_text.append(standardize(child['Text']))
                    else:
                        result_item_child_text.append(child['Text'])
#                 result_item_child_text.append(child['Text'])
            for ite in set(result_item_child_text):
                standard_value = standardize(ite)
                if ite.upper()=='AGE':
                # if ite=='AGE':
                    if len(age_list) == 0:
                        continue
                    age_mean = sum(age_list)/len(age_list)
                    result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999,
                                              'Value': age_mean })
                elif ite.upper()=='BMI':
                    print(bmi_list)
                    if len(bmi_list) == 0:
                        continue
                    bmi_mean = sum(bmi_list)/len(bmi_list)
#                         bmi_value = [min(bmi_list), max(bmi_list)]
                    
#                         if bmi_value_range[0] == -1:
#                             bmi_value_range[0] = str(min(bmi_list))
#                         if bmi_value_range[1] == 0:
#                             bmi_value_range[1] = str(max(bmi_list))
                    
#                         bmi_value_range[2] = 'kg/㎡'
                    

                    result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999
                                              ,'Value': [min(bmi_list), str(max(bmi_list)), 'kg/㎡'] })
                # elif ite=='BMI':
                #     bmi_mean = sum(bmi_list)/len(bmi_list)
                #     bmi_value = [min(bmi_list), max(bmi_list)]
                        
                #     if bmi_value_range[0] == -1:
                #         bmi_value_range[0] = str(min(bmi_list))
                #     if bmi_value_range[1] == 0:
                #         bmi_value_range[1] = str(max(bmi_list))

                #     result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                #                               'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999
                #                               ,'Value': [bmi_value_range[0],bmi_value_range[1],'kg/㎡'] })
                    
                elif ite.upper()=='ECOG':
                    if len(ecog_list) == 0:
                        continue
                    ecog_mean = sum(ecog_list)/len(ecog_list)
                    result_item_child.append({'Text': standardize(ite), 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999
                                              ,'Value': ecog_mean })
                elif ite.upper()=='HBA1C':
                    if len(hba1c_list) == 0:
                        continue
                    hba1c_mean = sum(hba1c_list)/len(hba1c_list)
                    result_item_child.append({'Text': standardize(ite), 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999
                                              ,'Value': [str(hba1c_mean),'%'] })
                elif ite.upper()=='BODY MASS INDEX':
                    if len(body_list) == 0:
                        continue
                    body_mean = sum(body_list)/len(body_list)
                    result_item_child.append({'Text': standardize(ite), 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999
                                              ,'Value': str(body_mean) + 'kg/㎡' })
                else:
                    # onle need age for Demographics
                    if c== 'Demographics':
                        continue
                    if ite.strip() == 'Demographics':
                        continue
                            
                    if len(ite.strip()) == 0:
                        continue
                    
                    if checkSameWord(c, 'Intervention'):
#                             print('checkSameWord')
                            if checkSameWord(ite, 'Metformin'):
                                if len(dos_list) == 0:
                                    dos_list = [0, 1000]
                                result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999 
                                                 ,'Value': [min(dos_list), str(max(dos_list)), 'mg']})
                                continue
                        
                    if checkSameWord(ite, 'insulin'):
                        if len(duration_list) == 0:
                            duration_list = [0, 100]
                        result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                      'Frequency': result_item_child_text.count(ite) / total * base_num if (result_item_child_text.count(ite) / total * base_num) < 1 else 0.9999 
                                         ,'Value': [min(duration_list), str(max(duration_list)), 'days']})
                        continue
                
                    # total
                    result_item_child.append({'Text': standardize(ite), 'Count': result_item_child_text.count(ite),
                                              'Frequency': result_item_child_text.count(ite) / total * base_num
                                             ,'Value': ''})
            result_item = {c: result_item_child}
            result_items.append(result_item)
        allCriteriaResult.append({criteria_name: result_items})

    allCriteriaResult.append({'total': total})
#     print(allCriteriaResult)
    return allCriteriaResult


def handler(nct_ids):
    if nct_ids:
        data = process_frequency(load_criteria_summary_by_nct_ids(nct_ids), len(nct_ids))
        print(data)
        return {
            'statusCode': 200,
            'body': json.dumps(data)
        }
    else:
        return {
            'statusCode': 500,
            'body': json.dumps("Empty nct_ids.")
        }
