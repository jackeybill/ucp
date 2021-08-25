import json
import boto3


dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = 'studies'


def list(params):
    print('params=', params)
    t = dynamodb.Table(table)

    r = t.scan()
    results = []

    if len(params)>0:
        for item in r['Items']:
            if item['nct_id'] in params:
                if 'study_phase' in item and item['study_phase'] != 'N/A':
                # if 'funder_type'in item and item['funder_type'] == 'Industry' and item['study_phase'] != 'N/A':
                    results.append(item)
    else:
        for item in r['Items']:
            if 'study_phase' in item and item['study_phase'] != 'N/A':
            # if 'funder_type'in item and item['funder_type'] == 'Industry' and item['study_phase'] != 'N/A':
                results.append(item)

    return {
            'statusCode': 200,
            'body': json.dumps(results)
        }
        
def listIndication():
    t = dynamodb.Table(table)

    r = t.scan()
    #print(r['Items'])
    result = []
    for item in r['Items']:
        print(item)
        # ind = item['indication']
        if 'indication' in item and item['indication'] not in result:
            result.append(item['indication'])
    # remove the key 'Diabetes Mellitus Type 2'
    result.remove('Diabetes Mellitus Type 2')
    #numbers = [1,7,3,2,5,6,2,3,4,1,5]
    # {}.fromkeys(list).keys()
    #print('result=', {}.fromkeys(result).keys())
    #new_result = {}.fromkeys(result).keys()
    #new_numbers.sort(key=numbers.index)
    #print(new_numbers)
    # return r['Items']

    return {
            'statusCode': 200,
            'body': json.dumps(result)
        }


def list_nct_id():
    t = dynamodb.Table(table)

    r = t.scan()
    results = []
    for item in r['Items']:
        results.append(item['nct_id'])
    print(results)
    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }