#!/usr/bin/env python3
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

import json
import time
import datetime
import os
import logging
import urllib.parse
import traceback
import pprint 
import uuid

import psycopg2

class rdsUtils(object):
    conn = psycopg2.connect(
            host="aact-db.ctti-clinicaltrials.org",
            database="aact",
            user="mi608",
            password=urllib.parse.unquote_plus('Training@123'))
            
    """
    class contains methods performing db actions
    """
    def getValuefromDB(self, sql):
        #print(sql)
        cur = self.conn.cursor()
        cur.execute(sql)
        rows = cur.fetchmany(1)
        if len(rows) > 0 and len(rows[0]) > 0:
            #print('rows:', rows)
            #self.logger.info('rows:', rows)
            return rows[0][0] 
        cur.close()
        return ''
    
    def getRowfromDB(self, sql):
        #print(sql)
        cur = self.conn.cursor()
        cur.execute(sql)
        rows = cur.fetchmany(1)
        if len(rows) > 0 and len(rows[0]) > 0:
            #print('rows:', rows)
            #self.logger.info('rows:', rows)
            return rows
        cur.close()
        return None
    
    def getCriteria(self, nct_id):
        #nct_id = 'NCT00613574' 
        sql = "select s.criteria from Eligibilities s where s.nct_id = '%s' limit 1;" % nct_id
        criteria = self.getValuefromDB(sql)
        if "Exclusion Criteria" in criteria:
            dev_index = criteria.index("Exclusion Criteria")
            inclusionCriteria = criteria[:dev_index]
            exclusionCriteria = criteria[dev_index:]
            #print('inclusionCriteria: ', inclusionCriteria)
            #print('exclusionCriteria: ', exclusionCriteria)
            return inclusionCriteria, exclusionCriteria
        #print('criteria:', criteria)
        return None, None

    # private method - make id
    def __make_id(self):
        id = uuid.uuid4()
        return str(id)
        