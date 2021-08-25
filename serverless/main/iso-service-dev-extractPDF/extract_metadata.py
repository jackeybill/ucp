#!/usr/bin/env python3



import boto3
from botocore.exceptions import ClientError

import json
import datetime
import os
import logging
import urllib.parse
import traceback
import pprint 
from urllib.parse import urlparse
import random
import io
import urllib

import time

from PyPDF2 import PdfFileReader

## Helper functions
def get_metadata_pdf(obj, key):
    prefixes = key.split("/")
    
    drug_name = prefixes[-2]
    filename = prefixes[-1]
    
    
    pdf = PdfFileReader(io.BytesIO(obj.get()['Body'].read()))
    info = pdf.getDocumentInfo()
    number_of_pages = pdf.getNumPages()
    
    
    if info!=None:
        source = key
        company = info.get("/Company","")
        if company=="":
            company = info.author
        
        metadata = {
            'name': filename, 
            'drug_name':drug_name,
            'title':" ".join(x for x in [info.title, info.subject] if x!=None),
            'source':company if company!="" else source, 
            'source_url': key,
            's3_raw': key,
            'format': 'pdf'
        }
    
    else:
        metadata = {"name":filename, 
            'drug_name':drug_name, 
            'title':drug_name,
            'source':key, 
            'source_url': key,
            's3_raw': key,
            'format': 'pdf'
            
        }
       
    if metadata['source']==None:
        metadata["source"] = drug_name
    
    return metadata
   
def get_source_from_url(url):
    url = url.lower()
    
    if url.startswith("fda") or url.startswith("ucm") or ("fda" in url):
        source_type = "FDA"
    elif url.startswith("nct"):
        source_type = "Clinical Trails"
    elif url.startswith("druginfo"):
        source_type = "DailyMed"
    elif ("european" in url):
        source_type = "European Medicines Agency"
    else:
        if "news" in url:
            source_type = "news"
        else:
            source_type = "html"

    return source_type