#!/usr/bin/env python
import json



import xml.etree.ElementTree as ET 
from lxml import etree, objectify

import pprint
import pdb
from datetime import date
import string

from collections import namedtuple
import traceback


Summary = namedtuple('Summary', 'spl_set_id product_type title manufacturer revisionDate')
GeneralSection = namedtuple('GeneralSection', 'brand_name route product_ndc substance_name generic_name inactive_ingredients dosage_form consumed_in marketing_date marketing_category')
DescriptionSection = namedtuple("DescriptionSection",'description inactive_ingredient_description')

class DrugLabel(object):
    def __init__(self,xmlstr):
        p = etree.XMLParser(remove_blank_text=True, huge_tree=True)
        self.tree = ET.ElementTree(ET.fromstring(xmlstr, parser=p))
        self.tree_et = etree.ElementTree(etree.fromstring(xmlstr, parser=p))
    
        self.root = self.tree.getroot()
        #self.xml_ns = {None: 'urn:hl7-org:v3'}
        
        self.strip_newline_tab = lambda x: x.strip("\n\t ") if x!=None else ""
        
        ## adding regular expression name space for case insensitive matching
        self.ns = {"re": "http://exslt.org/regular-expressions"}
        
        self.get_title = lambda x: self.__convert_text_title_case(self.strip_newline_tab((x.xpath("./title")[0]).text))
        
    def process(self):
        # extract 
        # code, systemName and displayName
        response = {}
        try:
             
            summary =  self.extract_summary()
            response["splId"] = summary.spl_set_id
            response["productType"] = summary.product_type
            response["title"] = summary.title
            response["manufacturer"] = summary.manufacturer
            response["revisionDate"] = summary.revisionDate
            
            
            ## Sections
            # 1. General section
            general_section= self.extract_general_section()
            # 
            response["brandName"] = general_section.brand_name
            response["productNdc"] = general_section.product_ndc
            response["routeOfAdministration"] = general_section.route
            response["substanceName"]= general_section.substance_name
            response["genericName"] = general_section.generic_name
            response["inactiveIngredients"] = general_section.inactive_ingredients
            response["dosageForm"] = general_section.dosage_form
            response["consumedIn"] = general_section.consumed_in
            response["marketingDate"] = general_section.marketing_date
            response["marketingCategory"] = general_section.marketing_category

            # 2. all section
            response["sections"] = self.extract_text_sections()

            
        except Exception:
            tb = traceback.format_exc()
            
            
        return response
 
    def extract_summary(self):
        """
        method to extract high level summary of the document
        -- spl id
        -- product type
        -- title
        -- manufacturer
        -- start date
        """

        ## Id
        label_id = self.tree.find("./id")
        id = label_id.attrib['root'] if label_id is not None and "root" in label_id.attrib else ""
        
        ## label type, system name
        code = self.tree.find("./code")
        check_if_attrib_exists = lambda x, key: x[key] if key in x else ''

        label_type = check_if_attrib_exists(code.attrib,"displayName")
        #system_name = check_if_attrib_exists(code.attrib,"code")
        
        ## title
        title_text = self.tree_et.xpath("./title//text()")
        title = (" ".join([self.strip_newline_tab(t) for t in title_text]) if len(title_text)>0 else "")
        
        ## manufacturer
        manufacturer = self.tree.find("./author//representedOrganization/name")
        if manufacturer!=None and manufacturer.text!=None:
            manufacturer = self.strip_newline_tab(manufacturer.text)
        else:
            manufacturer = ""

        ## effectivetime
        revisionDate = self.tree_et.xpath("./effectiveTime/@value")
        revisionDate = self.__normalize_date(revisionDate)
        
        return Summary(id,label_type,title, manufacturer,revisionDate)
        
    def extract_general_section(self):
        """
        method to extract information from general section
        Always first section
        - drugname
        - ndc code
        - list of active ingredients
        - list of inactive ingredients
        - generic name
        - dosage form
        - consumed as
        brand_name route product_ndc substance_name generic_name inactive_ingredients dosage_form consumed_in
        """
        
        general_section = self.tree_et.xpath("./component//component")
        if len(general_section)==0:
            return GeneralSection("","","","", "", "", "")

        general_section = general_section[0]
        # extract - manufactured medicine, ndc code, drug name, activeingredient, inactive, generic name
        brand_name = general_section.xpath(".//manufacturedProduct//name")
        brand_name = self.strip_newline_tab(brand_name[0].text) if len(brand_name)>0 else ""
        
        route = general_section.xpath(".//manufacturedProduct//formCode/@code")
        route = self.strip_newline_tab(route[0]) if len(route)>0 else ""
        

        product_ndc = general_section.xpath(".//manufacturedProduct//code/@code")
        product_ndc = self.strip_newline_tab(product_ndc[0]) if len(product_ndc)>0 else ""
        

        generic_name = general_section.xpath(".//asEntityWithGeneric//genericMedicine/name")
        generic_name = self.strip_newline_tab(generic_name[0].text) if len(generic_name) > 0 else ""

        # active ingredients
        substance_name = sorted([self.strip_newline_tab(a.text) for a in general_section.xpath(".//activeMoiety/activeMoiety/name")]) 
        substance_name = ", ".join(set(substance_name))
        
        ## inactive ingredients
        inactive_ingredients = sorted([self.strip_newline_tab(inactive.text) for inactive in general_section.xpath(".//inactiveIngredient/inactiveIngredientSubstance/name")])
        
        if len(inactive_ingredients)==0:
            inactive_ingredients = ""
        else:
            #pdb.set_trace()
            inactive_ingredients = ",".join(set(inactive_ingredients))
            

        ## dosage form
        dosage_form = general_section.xpath(".//manufacturedProduct//formCode/@displayName")
        dosage_form = dosage_form[0] if len(dosage_form) > 0 else ""
        
        # consumed in
        consumed_in =  general_section.xpath(".//consumedIn/substanceAdministration/routeCode/@displayName")
        consumed_in = consumed_in[0] if len(consumed_in) > 0 else ""

        #revision date
        marketing_date = general_section.xpath(".//marketingAct/effectiveTime/low/@value")
        marketing_date = self.__normalize_date(marketing_date)

        #marketing_category 
        marketing_category = general_section.xpath(".//subjectOf/approval/code/@displayName")
        marketing_category = self.strip_newline_tab(marketing_category[0]) if len(marketing_category)>0 else ""

        gsection = GeneralSection(brand_name,route,product_ndc,substance_name,generic_name, inactive_ingredients, dosage_form, consumed_in,marketing_date, marketing_category)

        
      
        return gsection

    def extract_text_sections(self):

        ## get all sections
        query = "./component/structuredBody/component/section"
        sections = self.tree_et.xpath(query)
        if len(sections)==1:
            return ""

        # excluding general section
        sections = sections[1:]
        response = {}
        for index, sec in enumerate(sections):
            sec_name = self.__convert_text_title_case(self.strip_newline_tab(sec.xpath(".//@displayName")[0])) if len(sec.xpath(".//@displayName"))>0 and sec.xpath(".//@displayName")!=None else f"section{index}"

            ## check if section has components
            component_sections = self.__check_section_has_components(sec)
            has_components = len(component_sections)>0
            
            ## title, description
            d = {}
            try:
                if has_components:
                    ## remove this granularity and combine text
                    d = self.__recursively_get_text(sec)
                    items = []
                    for k, v in self.__flatten_dict(d).items():
                        if k ==None:
                            k =""
                        if v==None:
                            v=""

                        text = ":".join([k, v])
                        items.append(text)

                    response[sec_name] = items
                    
                else:
                    content = self.__extract_inner_text_from_section(sec)
                    response[sec_name] = content
            except Exception:
                tb = traceback.format_exc()
                
        
        return response

    #### Private methods - helpers
    def __get_component_section(self, section_name):
        query = "./component/structuredBody/component/section[re:test(./code/@displayName, '^{0}$', 'i')]".format(section_name)
        section = self.tree_et.xpath(query,namespaces=self.ns)
        return section


    def __check_section_has_components(self, section_xml):
        components = section_xml.xpath("./component/section")
        return components

    
    def __convert_text_title_case(self, text):
        text = "".join([x.lower() if index==0 else x.title() for index, x in enumerate(text.split(" ")) ])
        text = text.translate(str.maketrans('', '', string.punctuation)) if text!=None else ""
        return text

    def __extract_inner_text_from_section(self,section):
        content = ""
        content = section.xpath("./text//descendant-or-self::*/text()")
        
        if len(content)>0:
            content = " ".join(self.strip_newline_tab(x) for x in content).encode("ascii","ignore")
            content = content.decode("utf-8") 
        else:
            content = ""
        
        return content

    def __normalize_date(self,datestr):
        result = ""
        
        if datestr!=None and len(datestr)>0:
            datestr = datestr[0]
            year, month, day = int(datestr[0:4]), int(datestr[4:6]), int(datestr[6:])
            result = date(year, month,day).strftime("%b %d, %Y")
        else:
            result = ""

        return result

    def __recursively_get_text(self,sec):
        response = {}
        component_sections = self.__check_section_has_components(sec)
        for compsec in component_sections:
            has_components =self.__check_section_has_components(compsec)
            title = compsec.xpath("./title")
            
            if len(title) > 0:
                title = title[0].text or ""
            
            if has_components:
                content = self.__extract_inner_text_from_section(compsec)
                response[title] = "".join(content) if content is not None else ""
                innertext = self.__recursively_get_text(compsec)
                if innertext!=None:
                    response[title+"."  + ""] = innertext
            else:
                content = self.__extract_inner_text_from_section(compsec)
                response[title] = "".join(content) if content is not None else ""
        return response
    
    ## stack overflow
    def __flatten_dict(self,d):
        
        def expand(key, value):
            if isinstance(value, dict):
                if key==None:
                    key = ""
                return [ (key + "." + k, v) for k, v in self.__flatten_dict(value).items() if k is not None and v is not None ]
            else:
                if value!=None:
                    return [ (key, value) ]

        items = [ item for k, v in d.items() for item in expand(k, v) ]
        
        return dict(items)
