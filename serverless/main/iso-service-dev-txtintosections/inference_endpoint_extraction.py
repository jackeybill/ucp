from inference_soa_extraction import findSOAPageLst
from inference_soa_extraction import tablefromNCTdocument
from inference_soa_extraction import checkTableColumnsMatch
from inference_soa_extraction import combineTables
from inference_soa_extraction import array2htmltable

from inference_section_extraction import extractSections
from inference_section_extraction import parseTOC

import re
import json

endpoint_column_lst = {'objective','endpoint'}
pattern_repair_sentence = r'(.+?)(?:\r\n|\n)(.+[.!?]+[\s|$])'
pattern_repair_sentence_multiple = r'([\.]+(([\w\s,-/)/(])*))(?:\r\n|\n)(.+[.!?]+[\s|$])'

sectionNames = ['OBJECTIVES AND ENDPOINTS','STUDY OBJECTIVES AND ENDPOINTS','OBJECTIVES AND SCIENTIFIC AIMS',
                'OBJECTIVES','STUDY OBJECTIVES','TRIAL OBJECTIVES','Objectives of the Study',
                'ENDPOINTS']

def matchObjectiveEndpointTable(table):
    first_row = [r.lower().strip() for r in table[0]]
    oe_match = set() #oe_match = endpoint_column_lst & set(first_row)
    for name in endpoint_column_lst:
        for cell in first_row:
            if name in cell:
                oe_match.add(cell)
    return oe_match

def endpointtablefromResponse(response,tabletype,jsontype=False,pretty=False):
    page_count = response[0]['DocumentMetadata']['Pages']
    tables_count = 0
    output = {}
    pagelist = list(range(page_count))
    SOA_pagelist = sorted(findSOAPageLst(response))
    for page in pagelist:
        pageno = page
        tables = tablefromNCTdocument(response,page,False)
        if len(tables) == 0:
            continue    
        combinetable = [] #combinetable = tables[0]
        for _row in tables[0]:
            row = [re.sub(r'^X.*', 'X', r) for r in _row]
            combinetable.append(row)
        pagefound = [pageno]
        continueSearch = True
        while continueSearch == True and pageno<pagelist[-1]:
            pageno += 1
            #####
            if pageno in SOA_pagelist: #TODO
                break #To consider seperate tables based of findSOAPageLst()
            #####
            tables = tablefromNCTdocument(response,pageno,False)
            for table in tables:
                headerMatch = checkTableColumnsMatch(combinetable,table)
                if headerMatch>0:
                    combinetable = combineTables(combinetable,table,headerMatch)
                    pagefound.append(pageno)
                    if pageno in pagelist:
                        pagelist.remove(pageno)
                else:
                    continueSearch = False
                    break
           
        oe_match = matchObjectiveEndpointTable(combinetable)
        if len(oe_match)>1:
            if tabletype == 'csv':
                outputtable = ''
                for r in combinetable:
                    outputtable += ','.join(r)+'\n'
            elif tabletype == 'html':
                outputtable = array2htmltable(combinetable)
            else:
                outputtable = combinetable     
            output[tables_count] = {'table':outputtable,'pages':pagefound,'columns_matched':list(oe_match),'rows':len(combinetable),'columns':len(combinetable[0])}
            tables_count+=1
        #####################        
    if jsontype and pretty:
        return json.dumps(output,indent=2)
    elif jsontype:
        return json.dumps(output)
    else:
        return output 

# Handle the cases where the fist table is in protocol summary and not in the actual endpoint and objective section
# This adds the section name context to table parsing
def selectTableusingTOC(text,tableOutput,sectionNames):
    if len(tableOutput)>1:
        toc,_ = parseTOC(text)
        endpoints_objective_pages = set()
        if toc:
            for section in toc:
                name = section[1]
                if name in sectionNames:
                    page = int(section[3])
                    endpoints_objective_pages.add(page)
            for table_index in tableOutput:
                if tableOutput[table_index]['pages'][0] in endpoints_objective_pages:
                    return tableOutput[table_index]
    return tableOutput[0]

def nctExtractObjectivesEndpoints(response,text,tabletype):
    #Sometimes textract process "endpoints" as "enppoints"
    text = text.replace('enppoints','endpoints').replace('Enppoints','Endpoints')
    output = {}
    #Check if table present:
    tableOutput = endpointtablefromResponse(response,jsontype=False,pretty=False,tabletype=tabletype)
    if tableOutput:
        output['type'] = 'table'
        output['content'] = selectTableusingTOC(text,tableOutput,sectionNames) #tableOutput[0]
        output['other_tables'] = tableOutput
    #Else extract the text instead:
    else:
        _result = extractSections(text,sectionNames,pretty=True)
        result = json.loads(_result)
        text = ''
        content = {}
        content_index = 0
        found_sections = []
        for s in sectionNames:
            if s in result:
                _result = result[s]
                for r in _result:
                    if 'name' in _result[r]:
                        if _result[r]["name"] not in found_sections:
                            text += f'############ {_result[r]["name"]} ############\n'
                            found_sections.append(_result[r]["name"])
                            rawtext = _result[r]['rawtext']
                            #rawtext = rawtext.replace('\n',' ')
                            if rawtext == '':
                                content[content_index] = {'name':_result[r]["name"],'text':'','type':'heading'}                                
                            else:
                                rawtext = re.sub(pattern_repair_sentence,r'\1 \2', rawtext)
                                rawtext = re.sub(pattern_repair_sentence_multiple,r'\1 \2', rawtext)
                                text += rawtext+'\n\n'
                                content[content_index] = {'name':_result[r]["name"],'text':rawtext,'type':'body'}
                            content_index+=1
        output['type'] = 'text'
        output['found_sections'] = found_sections
        output['content'] = content
    return output

########## Test from local json ##############################
from os.path import join
def loadresponse(filename):
    if filename.endswith('.json'):  
        with open(join(path, filename), "rb") as f:
            print(f'Reading: {filename}')
            response = json.load(f)
            return response
    return None
def loadtextforResponse(response):
    raw = ''
    pre_item = None
    for resultPage in response:
        if resultPage["JobStatus"] == "SUCCEEDED":
            for item in resultPage["Blocks"]:
                if item["BlockType"] == "LINE":
                    top = item['Geometry']['BoundingBox']['Top']
                    if top >= float(0.09) and top <= float(0.9):
                        raw += item["Text"]+'\n'
                    pre_item = item 
    return raw
# path = 'data/processed/textract/document/error/' #
# filename = 'NCT03214380.pdf.json' #NCT04091061 #Lilly-> #NCT02951780
# response = loadresponse(filename)
# text = loadtextforResponse(response)
# tabletype = 'html'
# output = nctExtractObjectivesEndpoints(response,text,tabletype)
# print(output)

# if output['type'] == 'text':
#     print(output[0]['text'])
# elif output['type'] == 'table':
#     print(output[0]['table'])