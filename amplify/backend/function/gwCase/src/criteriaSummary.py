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


dynamodb = boto3.resource('dynamodb')


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
                    criteriaChilds.append(child_item)
                    criteriaChildsCategory.append(child['Category'])
                    criteriaChildsText.append(child['Text'])
        criteriaChildsCategorySet = set(criteriaChildsCategory)
        result_items = []
        for c in criteriaChildsCategorySet:
            result_item_child_text = []
            result_item_child = []
            for child in criteriaChilds:
                result_item_child_text.append(child['Text'])
            for ite in set(result_item_child_text):
                result_item_child.append({'Text': ite, 'Count': result_item_child_text.count(ite),
                                          'Frequency': result_item_child_text.count(ite) / total})
            result_item = {c: result_item_child}
            result_items.append(result_item)
        allCriteriaResult.append({criteria_name: result_items})

    allCriteriaResult.append({'total': total})
    print('Done')
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
