
import boto3
import json


dynamodb = boto3.resource('dynamodb', region_name='us-east-2')


def load_from_dynamodb(nct_id):
    table = dynamodb.Table('study_summary')
    response = table.get_item(
        Key={'nct_id': nct_id}
    )
    # print(response)
    return response['Item']


def load_criteria_summary_by_nct_ids(nct_ids):
    """
    Load criteria summary from dynamodb by nct_id
    :param nct_ids:
    :return: criteria summary
    """
    all_criteriaSummary = []
    for nct_id in nct_ids:
        all_criteriaSummary.append(json.loads(load_from_dynamodb(nct_id)['summary']))
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
    for criteria_name in ['InclusionCriteria', 'ExclusionCriteria']:
        criteria_value = criterias_dict[criteria_name]
        criteriaChildsText = []
        criteriaChildsCategory = []
        criteriaChilds = []

        for i in criteria_value:
            for c in i:
                childs = i[c]
                for child in childs:
                    child_item = {'Category': child['Category'], 'Text': child['Text']}
                    # For process category on ui
                    child_item = update_category(child_item)
                    print(child_item)
                    criteriaChilds.append(child_item)
                    criteriaChildsCategory.append(child_item.get('Category'))
                    criteriaChildsText.append(child_item.get('Text'))
        criteriaChildsCategorySet = set(criteriaChildsCategory)
        result_items = []
        for c in criteriaChildsCategorySet:
            result_item_child_text = []
            result_item_child = []
            for child in criteriaChilds:
                if child.get('Category') == c:
                    result_item_child_text.append(child['Text'])
                # result_item_child_text.append(child['Text'])
            for ite in set(result_item_child_text):
                result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                          'Frequency': result_item_child_text.count(ite) / total})
            result_item = {c: result_item_child}
            result_items.append(result_item)
        allCriteriaResult.append({criteria_name: result_items})

    allCriteriaResult.append({'total': total})
    print('Done')
    print(allCriteriaResult)
    return allCriteriaResult


def handler(nct_ids):
    if nct_ids:
        data = process_frequency(load_criteria_summary_by_nct_ids(nct_ids), len(nct_ids))
        return {
            'statusCode': 200,
            'body': json.dumps(data)
        }
    else:
        return {
            'statusCode': 500,
            'body': json.dumps("Empty nct_ids.")
        }
