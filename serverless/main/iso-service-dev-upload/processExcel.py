#!/usr/bin/env python3

import boto3
import json
import time
import os
import logging
from botocore.exceptions import ClientError
from urllib.parse import unquote_plus
import traceback

## import utilities:
from ExcelUtils import ExcelUtils

logger = logging.getLogger()

excelUtils:ExcelUtils = ExcelUtils()

def process(bucket, key, configuration):
    
    try:
        excelUtils.generate_metadata(bucket, key)
        
    except Exception as ex:
        logging.error(traceback.format_exc())
        raise Exception("Exception has occurred was processing xml" + ex.message)