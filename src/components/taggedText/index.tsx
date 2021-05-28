import React from 'react'
import './index.scss'

const dummyText = "8.1.1. Inclusion Criteria\nSubjects are eligible for enrollment in the study only if they meet all of the following criteria:\n[1] Are overtly healthy males, as determined by medical history, physical\nexamination, clinical laboratory tests, and ECGs.\n[1a] Males will be sterile (including vasectomy) or if the subject is not sterile and\nis sexually active, he will agree to use from Check-in until 3 months after\nstudy exit/discharge, 1 of the following approved double barrier methods of\ncontraception: a male condom with spermicide, a sterile sexual partner and\nuse of spermicide, use by female sexual partner of an intrauterine device\nwith spermicide, a female condom with spermicide, contraceptive sponge\nwith spermicide, a diaphragm with spermicide, a cervical cap with\nspermicide; or oral, implantable, transdermal, intravaginal, or injectable\ncontraceptives and use of spermicide.\n[2] Are 18 to 65 years old, inclusive, at the time of screening\n[3] Have a body mass index (BMI) of 18.5 to 32.0 kg/m2, inclusive, at screening.\n[4] Have clinical laboratory test results within normal reference range for the\npopulation or investigator site, or results with acceptable deviations that are\njudged to be not clinically significant by the investigator.\n[5]\nHave venous access sufficient to allow for blood sampling as per the protocol.\n[6]\nAre reliable and willing to make themselves available for the duration of the\nstudy and are willing to follow study procedures.\n[7] Have given written informed consent approved by Lilly and the institutional\nreview board (IRB) governing the site.\nLY2623091\nI7T-MC-RMAA Protocol\nPage 18\n8.1.2. Exclusion Criteria\nSubjects will be excluded from study enrollment if they meet any of the following criteria:\n[8] Are investigator site personnel directly affiliated with this study and their\nimmediate families. Immediate family is defined as a spouse, parent, child, or\nsibling, whether biological or legally adopted.\n[9] Are Lilly or Covance employees.\n[10] Are currently enrolled in a clinical trial involving an investigational product or\noff-label use of a drug or device, or are concurrently enrolled in any other type\nof medical research judged not to be scientifically or medically compatible\nwith this study."
const dummyEntities = [
  {
    "Id": 0,
    "BeginOffset": 141,
    "EndOffset": 154,
    "Score": 0.4489944875240326,
    "Text": "healthy males",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "SIGN",
        "Score": 0.5647932887077332
      },
      {
        "Name": "DIAGNOSIS",
        "Score": 0.5107514262199402
      }
    ]
  },
  {
    "Id": 5,
    "BeginOffset": 199,
    "EndOffset": 210,
    "Score": 0.2968866527080536,
    "Text": "examination",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 6,
    "BeginOffset": 212,
    "EndOffset": 237,
    "Score": 0.7506123781204224,
    "Text": "clinical laboratory tests",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 7,
    "BeginOffset": 243,
    "EndOffset": 247,
    "Score": 0.9598242044448853,
    "Text": "ECGs",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 8,
    "BeginOffset": 287,
    "EndOffset": 296,
    "Score": 0.9913841485977173,
    "Text": "vasectomy",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "PROCEDURE_NAME",
    "Traits": []
  },
  {
    "Id": 1,
    "BeginOffset": 338,
    "EndOffset": 353,
    "Score": 0.7204596400260925,
    "Text": "sexually active",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "SYMPTOM",
        "Score": 0.4142681062221527
      }
    ]
  },
  {
    "Id": 9,
    "BeginOffset": 487,
    "EndOffset": 500,
    "Score": 0.8199645280838013,
    "Text": "contraception",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 10,
    "BeginOffset": 686,
    "EndOffset": 706,
    "Score": 0.4229394197463989,
    "Text": "contraceptive sponge",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 11,
    "BeginOffset": 848,
    "EndOffset": 862,
    "Score": 0.4095187783241272,
    "Text": "contraceptives",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 2,
    "BeginOffset": 894,
    "EndOffset": 896,
    "Score": 0.2516288161277771,
    "Text": "18",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "AGE",
    "Traits": []
  },
  {
    "Id": 3,
    "BeginOffset": 900,
    "EndOffset": 902,
    "Score": 0.3278176486492157,
    "Text": "65",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "AGE",
    "Traits": []
  },
  {
    "Id": 16,
    "BeginOffset": 961,
    "EndOffset": 976,
    "Score": 0.9644201993942261,
    "Text": "body mass index",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_VALUE",
        "Score": 0.5083527565002441,
        "RelationshipScore": 0.9984446167945862,
        "RelationshipType": "TEST_VALUE",
        "Id": 18,
        "BeginOffset": 986,
        "EndOffset": 998,
        "Text": "18.5 to 32.0",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      },
      {
        "Type": "TEST_UNIT",
        "Score": 0.9857895970344543,
        "RelationshipScore": 0.997794508934021,
        "RelationshipType": "TEST_UNIT",
        "Id": 19,
        "BeginOffset": 999,
        "EndOffset": 1004,
        "Text": "kg/m2",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 17,
    "BeginOffset": 978,
    "EndOffset": 981,
    "Score": 0.9738854169845581,
    "Text": "BMI",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_VALUE",
        "Score": 0.5083527565002441,
        "RelationshipScore": 0.9993265867233276,
        "RelationshipType": "TEST_VALUE",
        "Id": 18,
        "BeginOffset": 986,
        "EndOffset": 998,
        "Text": "18.5 to 32.0",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      },
      {
        "Type": "TEST_UNIT",
        "Score": 0.9857895970344543,
        "RelationshipScore": 0.9925140738487244,
        "RelationshipType": "TEST_UNIT",
        "Id": 19,
        "BeginOffset": 999,
        "EndOffset": 1004,
        "Text": "kg/m2",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 20,
    "BeginOffset": 1040,
    "EndOffset": 1064,
    "Score": 0.3640648424625397,
    "Text": "clinical laboratory test",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_VALUE",
        "Score": 0.3907651901245117,
        "RelationshipScore": 0.9999030828475952,
        "RelationshipType": "TEST_VALUE",
        "Id": 21,
        "BeginOffset": 1073,
        "EndOffset": 1086,
        "Text": "within normal",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 22,
    "BeginOffset": 1299,
    "EndOffset": 1313,
    "Score": 0.8183777928352356,
    "Text": "blood sampling",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 13,
    "BeginOffset": 1519,
    "EndOffset": 1524,
    "Score": 0.8761274218559265,
    "Text": "Lilly",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "NAME",
    "Traits": []
  },
  {
    "Id": 14,
    "BeginOffset": 1586,
    "EndOffset": 1595,
    "Score": 0.9101353287696838,
    "Text": "LY2623091",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "ID",
    "Traits": []
  },
  {
    "Id": 15,
    "BeginOffset": 1600,
    "EndOffset": 1616,
    "Score": 0.11643999814987183,
    "Text": "MC-RMAA Protocol",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "ADDRESS",
    "Traits": []
  },
  {
    "Id": 28,
    "BeginOffset": 1997,
    "EndOffset": 2006,
    "Score": 0.9998555183410645,
    "Text": "currently",
    "Category": "TIME_EXPRESSION",
    "Type": "TIME_TO_TREATMENT_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TREATMENT_NAME",
        "Score": 0.5843812823295593,
        "RelationshipScore": 0.6680071353912354,
        "RelationshipType": "OVERLAP",
        "Id": 23,
        "BeginOffset": 2021,
        "EndOffset": 2035,
        "Text": "clinical trial",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  }
]

const convertTextIntoHtmlString = (txt: string | undefined, ettys: Array<{}> | undefined) => {
  let result: any = txt || dummyText
  const entities: any = ettys || dummyEntities
  const idDict = new Map<String, String>()
  const beginDict = new Map<String, number>()
  var lastBegin = 0
  for (let i=entities.length-1; i>=0; i--) {
    const entty = entities[i]
    const end = entty.EndOffset
    const begin = entty.BeginOffset
    if (lastBegin==0) {
      lastBegin = begin
    }
    if (!idDict.get(entty.Category)) {
      idDict.set(entty.Category, entty.color)
    }
    //remove duplicate BeginOffset
    // console.log(begin,' ', end, ' ', lastBegin);
    if(!beginDict.has(begin) && lastBegin>end){
      beginDict.set(begin, end)
      lastBegin = begin
      result = result.slice(0, end) + ` <b>${entty.Category}</b></span>` + result.slice(end)
      result = result.slice(0, begin) + `<span class="chunk id_${idDict.get(entty.Category)}"}>` + result.slice(begin)
    }
  }
  console.log('beginDict :>> ', beginDict);
  // styled text
  const newLineIndex=result.indexOf('Exclusion Criteria')
  if(newLineIndex>-1){
    //result=result.slice(0,newLineIndex) + '<hr/>' + result.slice(newLineIndex)
  }
  result=result.replace(/(  - )/gi,`<br/>&nbsp;&nbsp; - &nbsp;&nbsp;` )
  // result = result.replace(/\\r\\n\\r\\n/gi, '<br/>')

  // console.log('result :>> ', result);
  return {__html: result};
}

const TextComponentWithTags = (props: any) => {
  return (
    <div className="tagged-text-container">
      <div dangerouslySetInnerHTML={convertTextIntoHtmlString(props.text, props.entities)}></div>
    </div>
  )
}

export default TextComponentWithTags