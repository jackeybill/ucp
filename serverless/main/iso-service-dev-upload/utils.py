#!/usr/bin/env python

import os
import logging
import boto3
from botocore.exceptions import ClientError
import json

import xml.etree.ElementTree as ET 
from lxml import etree, objectify

from custom_log_formatter import CustomLogFormatter

def load_osenv():
    """
    Method to load environment variables
    
    return: os environment parameters
    """
    config = {}
    for key in os.environ.keys():
        config[key] = os.getenv(key, "")
    
    return config


def initialize_logger():
    """
    Configure logging utils
    
    """
    logger = logging.getLogger()
    
    logger.setLevel('INFO')

    formatter = CustomLogFormatter(
        '[%(levelname)s]\t%(asctime)s.%(msecs)dZ\t%(levelno)s\t%(message)s\n',
        '%Y-%m-%dT%H:%M:%S'
    )
    
    
    # Replace the default LambdaLoggerHandler formatter
    logger.handlers[0].setFormatter(formatter)
    return 


def remove_prefixes(xmlstring):
    """
    Remove xml prefixes
    
    :param xmlstring: xml string
    
    :return xmlstring after cleaning tags 
    """
    p = etree.XMLParser(remove_blank_text=True, huge_tree=True)
    tree = etree.ElementTree(etree.fromstring(xmlstring, parser=p))
    

    root = tree.getroot()
    for elem in root.getiterator():
        if not hasattr(elem.tag, 'find'): 
            continue  # (1)   
        i = elem.tag.find('}')
        if i >= 0:
            elem.tag = elem.tag[i+1:]
    objectify.deannotate(root, cleanup_namespaces=True)

    xml_str = etree.tostring(tree,encoding='UTF-8', method='xml')
    return xml_str
    

        
def save_json(data,bucket_name,src_path,dest_path):
    """
    Method to save json parsed data to s3
    
    """
    S3_CLIENT = boto3.client('s3')

    filename, _ = os.path.splitext(os.path.basename(src_path))
    new_filename = os.path.join(dest_path , filename + ".json")
    
    
    try:
        # Save result in json format
        S3_CLIENT.put_object(Bucket=bucket_name, Key=new_filename, Body=json.dumps(data))   
        logging.info(f" Successfully saved the data to s3 bucket: " + new_filename)
        return (new_filename,filename+".json")
    
    except ClientError as e:
        logging.error("Error occurred while saving to s3",e)
        raise Exception("Error occurred while saving json")
