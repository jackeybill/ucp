import json
import argparse
import re
import copy
from pprint import pprint


rules = [{
            'objectiveType' : 'primaryOutcome' ,
            'patterns' : ['primary', 'objective']
        },
        {
            'objectiveType' : 'secondaryOutcome',
            'patterns' : ['second', 'objective']
        },
        {
            'objectiveType' : 'otherOutcome',
            'patterns' : ['objective']
        },
        {
            'objectiveType' : 'exploratoryOutcome',
            'patterns' : ['objective', 'explore']
        },
        {
            'objectiveType' : 'inclusionCriteria',
            'patterns' : ['inclusion', 'criteria']
        },
        {
            'objectiveType' : 'exclusionCriteria',
            'patterns' : ['exclusion', 'criteria']
        }
    ]


obj_id = {
        'primaryOutcome': {'label':'pri', 'count':0},
        'secondaryOutcome': {'label':'sec', 'count':0},
        'otherOutcome': {'label':'oth', 'count':0},
        'exploratoryOutcome': {'label':'exp', 'count':0},
        'inclusionCriteria': {'label':'inc', 'count':0},
        'exclusionCriteria': {'label':'exc', 'count':0}
    }


def all_elements_exist(string, lst):
    for element in lst:
        if not re.search(element, string, re.IGNORECASE):
            return False
    return True


def find_group(section):
    for rule in rules:
        if all_elements_exist(section['title'], rule['patterns']):
            return rule['objectiveType']
    return None


def identify_type(sections):
    """
    Description: identify the section type using the 'title' field and return all sections with valid types.
    Parameters
    ----------
        sections: list dict objects with 
        'Filename', 'level', 'level_number', 'title', 'content'

    Return
    ----------
        keep_sections: list of dict objects with 
        'Filename', 'level', 'level_number', 'title', 'content' 'objectiveType'
    """
    if sections is None: return list()
    if type(sections) is not list:  sections = [sections]


    keep_sections = list()
    for section in sections:
        otype = find_group(section)
        if otype is not None: 
            section['objectiveType'] = otype
            keep_sections.append(section)
    return keep_sections


def append_id(sections):
    id = copy.deepcopy(obj_id)
    for section in sections:
        objectiveType = section['objectiveType']
        o_id = id[objectiveType]

        section['id'] = o_id['label'] + "-" + str(o_id['count'])
        id[objectiveType]['count'] += 1
    
    return sections
        

def pop(sections, keys):
    for section in sections:
        for key in keys:
            section.pop(key,None)
            section.pop(key,None)
    return(sections)
    

def collect_group(sections, objectiveType):
    group = list()
    for section in sections:
        if section['objectiveType'] == objectiveType:
            group.append(section)
    return group
        

def group(sections):
    section_groups = dict()
    for objectiveType in obj_id.keys():
        section_groups[objectiveType] = collect_group(sections, objectiveType)
    return section_groups


def add_fields(sections, objectiveType, fields):
    for section in sections:
        if section['objectiveType'] in objectiveType:
            section.update(fields)
    return sections


def rename_fields(sections, objectiveType, name_list):
    new_sections = list()
    for section in sections:
        if section['objectiveType'] in objectiveType:
            for name in name_list:
                old_key = list(name.keys())[0]
                new_key = name[old_key]
                section[new_key] = section.pop(old_key)

    return sections

def remove_by_field(sections, field, removal):
    fkey = list(removal.keys())[0]
    for i, obj in enumerate(sections[field]):
        if fkey in sections[field][i]:
            if sections[field][i][fkey] == removal[fkey]:
                del sections[field][i]

    return sections

def run(protocol_list):
    
    objectiveTypes =  ['primaryOutcome', 'secondaryOutcome', 'otherOutcome', 'exploratoryOutcome']
    filtered_protocols = dict()
    for file_hash in protocol_list:
        protocol = protocol_list[file_hash]
        
        if protocol == dict(): 
            filtered_protocols[file_hash] = dict()
            continue
        
        f_sections = identify_type(protocol)
        f_sections = append_id(f_sections)
        f_sections = pop(f_sections, ['level_number', 'level', 'Filename'])
        f_sections = add_fields(f_sections, objectiveTypes, {'detection':'free_text', 'endpoint':''})
        f_sections = rename_fields(f_sections, objectiveTypes, [{'title': 'sectionName'}, {'content':'objective'}])
        f_sections = group(f_sections)
        f_sections = remove_by_field(f_sections, "otherOutcome", {"sectionName": "Objectives and Endpoints"})
        filtered_protocols[file_hash] = f_sections
    return filtered_protocols