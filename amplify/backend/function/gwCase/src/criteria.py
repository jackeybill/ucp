import json
import base64
import boto3
import os
import pymongo
import sys
from bson import ObjectId
from bson.json_util import dumps,RELAXED_JSON_OPTIONS
import datetime
import random
import string
#from load_data import load_data

class JSONEncoder(json.JSONEncoder):
    """处理ObjectId & datetime类型无法转为json"""
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime.datetime):
            return datetime.datetime.strftime(o, '%Y-%m-%d %H:%M:%S')
        return json.JSONEncoder.default(self, o)

clientMongo = pymongo.MongoClient('mongodb://jackeyDocumentDB:DocumentDB1234@docdbjackey.cluster-cmheu9nqyuxl.us-west-2.docdb.amazonaws.com:27017/?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false')
##Specify the database to be used
db = clientMongo.criteria
##Specify the collection to be used
col = db.study

def testMongoDB(item):
    ##Insert a single document
    #col.insert_one({'nct_id': 'NCT00000123', 'study_type': 'Interventional', 'trial_title': 'The Berkeley Orthokeratology Study', 'study_phase': 'Phase 3', 'prediatric_study': 'Yes', 'indication': 'Astigmatism', 'description': 'The Berkeley Orthokeratology Study', 'therapeutic_Area': 'National Eye Institute (NEI)', 'trial_alias': None, 'molecule_name': None})
    obj = col.insert_one(item)
    print(obj.inserted_id)
    ##Find the document that was previously written
    #x = col.find_one({'hello':'Amazon DocumentDB'})
    # db.foo.find({"$or": [{"a": {"$gt": 2}}, {"b": {"$lt": 2}}]})
    # db.orders.find( { a: 1, b: 1 } } )
    # db.example.find({"Inventory": {"OnHand": 47,"MinOnHand": 50 } } ).pretty()
    # db.example.find({ "Inventory.OnHand": { $lt: 50 } } )
    # db.adminCommand({currentOp: 1, $all: 1});
    #print( db.adminCommand({currentOp: 1, $all: 1}) )
    # db.collection.find().hint("indexName")
    # db.rides.createIndex( {"fare.totalAmount": 1}, {background: true} )
    mylist = [
    { "name": "Taobao", "alexa": "100", "url": "https://www.taobao.com" },
    { "name": "QQ", "alexa": "101", "url": "https://www.qq.com" },
    { "name": "Facebook", "alexa": "10", "url": "https://www.facebook.com" },
    { "name": "Github", "alexa": "109", "url": "https://www.github.com" }
    ]
    # https://blog.csdn.net/qq_33961117/article/details/90668555
    x = mycol.insert_many(mylist)
    
    # InsertManyResult 对象 ：输出插入的所有文档对应的 _id 值
    print(x.inserted_ids)

    # 读取 name 字段中第一个字母为 "R" 的数据
    # 正则表达式修饰符条件为 {"$regex": "正则规则"}
    myquery = { "name": { "$regex": "^R" } }
    mydoc = mycol.find(myquery).limit(3).sort("alexa", -1)

    # 建立 user_id 索引，并且确保它的唯一性
    mydb.profiles.create_index([('user_id', pymongo.ASCENDING)], unique=True)
    # 对已有索引排序
    print(sorted(list(mydb.profiles.index_information())))

    myquery = { "name": "Taobao" }
    mycol.delete_one(myquery)

    # 删除所有 name 字段中以 F 开头的文档:
    myquery = { "name": {"$regex": "^F"} }
    
    x = mycol.delete_many(myquery)
    
    print(x.deleted_count, "个文档已删除")

    #删除指定集合
    mycol.drop()
    
    #db.profiles.findAndModify({
    #    query: { name: "Matt", status: "active"},
    #    update: { $inc: { score: 10 } }
    #})

    #x = col.find_one( {} )
    
    ##Print the result to the screen
    print(x)

    # 添加文档
    mydoc = {"name": "hello mongo", "age": "18"}
    mycol.insert_one(mydoc)
    print(conn.list_database_names())
    # ['local', 'mymongo', 'test']
    print(mydb.list_collection_names())
    # ['mycollection']

    
    ##Close the connection
    client.close()
    
    return

    # Get params from event
    body = base64.b64decode(event['name'])
    bucket = event['bucket']
    file = event['file']
    key = event['path']
    # Get filename from file
    path, filename = os.path.split(file)
    # Saving file content into S3
    response = s3_client.put_object(Bucket=bucket, Key=key + filename, Body=body)
    print('upload file done...')
    # Return response
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }

def getRadomStr():
    ran_str1 = ''.join(random.sample(string.ascii_letters + string.digits, 3))
    ran_str2 = ''.join(random.sample(string.ascii_letters + string.digits, 2))
    ran_str3 = ''.join(random.sample(string.ascii_letters + string.digits, 4))
    ran_str = ran_str1 + '-' + ran_str2 + '-' + ran_str3
    return ran_str.upper()

def getRadomNum():
    return srt(random.randint(1, 10)) + '%'
    
def mockItem(item):
    # Trial Alias 9 character alias, format is 3-2-4. Mix of numbers and letters. E.g., H9X-BG-CLI5
    trialAlias = item['trial_alias']
    if len(trialAlias) != 11:
        item['trial_alias'] = getRadomStr()
    
    if 'Therapeutic Area Average' in item:
        #Protocol Amendment Rate: 0 - 10%
        item['Therapeutic Area Average']['protocol_amendment_rate'] = getRadomNum()
        #Screen Failure Rate: 0 - 10%
        item['Therapeutic Area Average']['screen_failure_rate'] = getRadomNum()

def change_type(byte):    
    if isinstance(byte,bytes):
        return str(byte,encoding="utf-8")  
    return json.JSONEncoder.default(byte)

def listStudies(item):
    results = []
    x = col.find( {} )
    for ret in x:
        if('status' not in ret):
            ret['status'] = "Completed"
        results.append(json.loads(JSONEncoder().encode(ret)))
    #print('results=', results)
    return results

def addStudy(item):
    # Completed
    item['status'] = 'In Progress'
    item['createDate'] = str(datetime.date.today())
    return col.insert_one(item)
def updateStudy(item):
    id = ObjectId(item['_id'])
    del item['_id']
    item['updateDate'] = str(datetime.date.today())
    return col.update_one({"_id": id},{"$set":item})

def getStudy(id):
    return json.loads(JSONEncoder().encode(col.find_one({'_id':ObjectId(id)})))

def delStudy(id):
    return col.delete_one({'_id':ObjectId(id)})
    
def lambda_handler(event, context):
    print('process the data:', event)
    # json.dumps json.dumps和json.loads操作
    #ret = delStudy('609d15809f210314dda15a37')
    #print('ret=', ret.tostring())
    #return
    if 'method' in event:
        methodName = event['method']
        if methodName == 'listStudies':
            return listStudies(event['body'])
        if methodName == 'addStudy':
            # bs = dumps(dream,json_options=RELAXED_JSON_OPTIONS)
            #return json.loads(dumps(addStudy(json.loads(json.dumps(event['body']))),json_options=RELAXED_JSON_OPTIONS))
            data = addStudy(json.loads(json.dumps(event['body'])))
            # json.dumps(str(response_data))
            return str(data.inserted_id)
        if methodName == 'updateStudy':
            #return dumps(JSONEncoder().encode(updateStudy(event['body'])))
            updateStudy(event['body'])
        if methodName == 'delStudy':
            delStudy(event['body']['id'])
        if methodName == 'getStudy':
            return getStudy(event['body']['id'])
    return None