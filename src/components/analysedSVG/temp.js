export const testEntities=[
  {
    "Id": 3,
    "BeginOffset": 326,
    "EndOffset": 331,
    "Score": 0.3583131730556488,
    "Text": "Lilly",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "NAME",
    "Traits": []
  },
  {
    "Id": 4,
    "BeginOffset": 355,
    "EndOffset": 357,
    "Score": 0.34009435772895813,
    "Text": "11",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "AGE",
    "Traits": []
  },
  {
    "Id": 7,
    "BeginOffset": 387,
    "EndOffset": 401,
    "Score": 0.562332034111023,
    "Text": "clinical trial",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 8,
    "BeginOffset": 415,
    "EndOffset": 438,
    "Score": 0.66328364610672,
    "Text": "investigational product",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 9,
    "BeginOffset": 604,
    "EndOffset": 618,
    "Score": 0.6432334184646606,
    "Text": "clinical trial",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 10,
    "BeginOffset": 632,
    "EndOffset": 655,
    "Score": 0.7551898956298828,
    "Text": "investigational product",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 11,
    "BeginOffset": 673,
    "EndOffset": 696,
    "Score": 0.6028308868408203,
    "Text": "investigational product",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 0,
    "BeginOffset": 879,
    "EndOffset": 888,
    "Score": 0.7907707691192627,
    "Text": "LY3202626",
    "Category": "MEDICATION",
    "Type": "GENERIC_NAME",
    "Traits": []
  },
  {
    "Id": 5,
    "BeginOffset": 879,
    "EndOffset": 888,
    "Score": 0.9783535599708557,
    "Text": "LY3202626",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "ID",
    "Traits": []
  },
  {
    "Id": 12,
    "BeginOffset": 923,
    "EndOffset": 946,
    "Score": 0.47791463136672974,
    "Text": "investigational product",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 1,
    "BeginOffset": 977,
    "EndOffset": 986,
    "Score": 0.76891028881073,
    "Text": "LY3202626",
    "Category": "MEDICATION",
    "Type": "GENERIC_NAME",
    "Traits": [
      {
        "Name": "NEGATION",
        "Score": 0.4494909346103668
      }
    ]
  },
  {
    "Id": 6,
    "BeginOffset": 977,
    "EndOffset": 986,
    "Score": 0.6301426887512207,
    "Text": "LY3202626",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "ID",
    "Traits": []
  },
  {
    "Id": 2,
    "BeginOffset": 1070,
    "EndOffset": 1075,
    "Score": 0.9099319577217102,
    "Text": "atopy",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.8037339448928833
      }
    ]
  },
  {
    "Id": 23,
    "BeginOffset": 1090,
    "EndOffset": 1101,
    "Score": 0.5332875847816467,
    "Text": "abnormality",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": []
  },
  {
    "Id": 31,
    "BeginOffset": 1117,
    "EndOffset": 1120,
    "Score": 0.8571329116821289,
    "Text": "ECG",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 33,
    "BeginOffset": 1249,
    "EndOffset": 1263,
    "Score": 0.9644913077354431,
    "Text": "blood pressure",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_VALUE",
        "Score": 0.8811056613922119,
        "RelationshipScore": 0.9999817609786987,
        "RelationshipType": "TEST_VALUE",
        "Id": 32,
        "BeginOffset": 1240,
        "EndOffset": 1248,
        "Text": "abnormal",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 18,
    "BeginOffset": 1439,
    "EndOffset": 1453,
    "Score": 0.5644207000732422,
    "Text": "cardiovascular",
    "Category": "ANATOMY",
    "Type": "SYSTEM_ORGAN_SITE",
    "Traits": []
  },
  {
    "Id": 19,
    "BeginOffset": 1455,
    "EndOffset": 1466,
    "Score": 0.5585644245147705,
    "Text": "respiratory",
    "Category": "ANATOMY",
    "Type": "SYSTEM_ORGAN_SITE",
    "Traits": []
  },
  {
    "Id": 20,
    "BeginOffset": 1477,
    "EndOffset": 1482,
    "Score": 0.3478463888168335,
    "Text": "renal",
    "Category": "ANATOMY",
    "Type": "SYSTEM_ORGAN_SITE",
    "Traits": []
  },
  {
    "Id": 24,
    "BeginOffset": 1531,
    "EndOffset": 1553,
    "Score": 0.9153039455413818,
    "Text": "neurological disorders",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.8166521191596985
      }
    ],
    "Attributes": [
      {
        "Type": "SYSTEM_ORGAN_SITE",
        "Score": 0.5644207000732422,
        "RelationshipScore": 0.9241923093795776,
        "RelationshipType": "SYSTEM_ORGAN_SITE",
        "Id": 18,
        "BeginOffset": 1439,
        "EndOffset": 1453,
        "Text": "cardiovascular",
        "Category": "ANATOMY",
        "Traits": []
      },
      {
        "Type": "SYSTEM_ORGAN_SITE",
        "Score": 0.5585644245147705,
        "RelationshipScore": 0.7253106236457825,
        "RelationshipType": "SYSTEM_ORGAN_SITE",
        "Id": 19,
        "BeginOffset": 1455,
        "EndOffset": 1466,
        "Text": "respiratory",
        "Category": "ANATOMY",
        "Traits": []
      },
      {
        "Type": "SYSTEM_ORGAN_SITE",
        "Score": 0.3478463888168335,
        "RelationshipScore": 0.8757190108299255,
        "RelationshipType": "SYSTEM_ORGAN_SITE",
        "Id": 20,
        "BeginOffset": 1477,
        "EndOffset": 1482,
        "Text": "renal",
        "Category": "ANATOMY",
        "Traits": []
      }
    ]
  },
  {
    "Id": 22,
    "BeginOffset": 1715,
    "EndOffset": 1725,
    "Score": 0.4485631287097931,
    "Text": "interferin",
    "Category": "MEDICATION",
    "Type": "GENERIC_NAME",
    "Traits": []
  },
  {
    "Id": 25,
    "BeginOffset": 1784,
    "EndOffset": 1791,
    "Score": 0.9816792011260986,
    "Text": "seizure",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.9449197053909302
      }
    ]
  },
  {
    "Id": 26,
    "BeginOffset": 1813,
    "EndOffset": 1828,
    "Score": 0.7075014114379883,
    "Text": "febrile seizure",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.92104572057724
      }
    ]
  },
  {
    "Id": 21,
    "BeginOffset": 1854,
    "EndOffset": 1858,
    "Score": 0.9826953411102295,
    "Text": "head",
    "Category": "ANATOMY",
    "Type": "SYSTEM_ORGAN_SITE",
    "Traits": []
  },
  {
    "Id": 27,
    "BeginOffset": 1854,
    "EndOffset": 1865,
    "Score": 0.9487823843955994,
    "Text": "head trauma",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.8416416049003601
      }
    ],
    "SubChild": [
      {
        "Id": 21,
        "BeginOffset": 1854,
        "EndOffset": 1858,
        "Score": 0.9826953411102295,
        "Text": "head",
        "Category": "ANATOMY",
        "Type": "SYSTEM_ORGAN_SITE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 28,
    "BeginOffset": 1871,
    "EndOffset": 1892,
    "Score": 0.9719761610031128,
    "Text": "loss of consciousness",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "SYMPTOM",
        "Score": 0.6465933322906494
      }
    ]
  },
  {
    "Id": 35,
    "BeginOffset": 1904,
    "EndOffset": 1916,
    "Score": 0.9996315240859985,
    "Text": "last 5 years",
    "Category": "TIME_EXPRESSION",
    "Type": "TIME_TO_DX_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "DX_NAME",
        "Score": 0.9719761610031128,
        "RelationshipScore": 0.6674113273620605,
        "RelationshipType": "OVERLAP",
        "Id": 28,
        "BeginOffset": 1871,
        "EndOffset": 1892,
        "Text": "loss of consciousness",
        "Category": "MEDICAL_CONDITION",
        "Traits": [
          {
            "Name": "SYMPTOM",
            "Score": 0.6465933322906494
          }
        ]
      }
    ]
  },
  {
    "Id": 30,
    "BeginOffset": 1945,
    "EndOffset": 1966,
    "Score": 0.9233601689338684,
    "Text": "psychiatric disorders",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.9389215707778931
      }
    ]
  },
  {
    "Id": 38,
    "BeginOffset": 2031,
    "EndOffset": 2059,
    "Score": 0.9769525527954102,
    "Text": "human immunodeficiency virus",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.9351274967193604
      }
    ]
  },
  {
    "Id": 48,
    "BeginOffset": 2061,
    "EndOffset": 2064,
    "Score": 0.3264770805835724,
    "Text": "HIV",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 39,
    "BeginOffset": 2061,
    "EndOffset": 2064,
    "Score": 0.9568933248519897,
    "Text": "HIV",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.9440787434577942
      }
    ]
  },
  {
    "Id": 40,
    "BeginOffset": 2066,
    "EndOffset": 2075,
    "Score": 0.9795499444007874,
    "Text": "infection",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.9081709384918213
      }
    ]
  },
  {
    "Id": 41,
    "BeginOffset": 2083,
    "EndOffset": 2112,
    "Score": 0.7050514221191406,
    "Text": "positive human HIV antibodies",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.8902257680892944
      }
    ],
    "SubChild": [
      {
        "Id": 50,
        "BeginOffset": 2092,
        "EndOffset": 2112,
        "Score": 0.5060785412788391,
        "Text": "human HIV antibodies",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Type": "TEST_NAME",
        "Traits": [],
        "Attributes": [
          {
            "Type": "TEST_VALUE",
            "Score": 0.3316344916820526,
            "RelationshipScore": 0.9999954700469971,
            "RelationshipType": "TEST_VALUE",
            "Id": 49,
            "BeginOffset": 2066,
            "EndOffset": 2091,
            "Text": "infection and/or positive",
            "Category": "TEST_TREATMENT_PROCEDURE",
            "Traits": []
          }
        ]
      }
    ]
  },
  {
    "Id": 42,
    "BeginOffset": 2136,
    "EndOffset": 2147,
    "Score": 0.9812785387039185,
    "Text": "hepatitis B",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.9287773370742798
      }
    ]
  },
  {
    "Id": 43,
    "BeginOffset": 2164,
    "EndOffset": 2175,
    "Score": 0.9209349751472473,
    "Text": "hepatitis B",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.8706163763999939
      }
    ]
  },
  {
    "Id": 52,
    "BeginOffset": 2164,
    "EndOffset": 2191,
    "Score": 0.9037209153175354,
    "Text": "hepatitis B surface antigen",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_VALUE",
        "Score": 0.35095158219337463,
        "RelationshipScore": 0.9999988079071045,
        "RelationshipType": "TEST_VALUE",
        "Id": 51,
        "BeginOffset": 2124,
        "EndOffset": 2163,
        "Text": "evidence of hepatitis B and/or positive",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ],
    "SubChild": [
      {
        "Id": 43,
        "BeginOffset": 2164,
        "EndOffset": 2175,
        "Score": 0.9209349751472473,
        "Text": "hepatitis B",
        "Category": "MEDICAL_CONDITION",
        "Type": "DX_NAME",
        "Traits": [
          {
            "Name": "DIAGNOSIS",
            "Score": 0.8706163763999939
          }
        ]
      }
    ]
  },
  {
    "Id": 44,
    "BeginOffset": 2255,
    "EndOffset": 2264,
    "Score": 0.6112360954284668,
    "Text": "pregnancy",
    "Category": "MEDICAL_CONDITION",
    "Type": "DX_NAME",
    "Traits": [
      {
        "Name": "DIAGNOSIS",
        "Score": 0.596932590007782
      }
    ]
  },
  {
    "Id": 54,
    "BeginOffset": 2255,
    "EndOffset": 2269,
    "Score": 0.9982172846794128,
    "Text": "pregnancy test",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_VALUE",
        "Score": 0.9822630286216736,
        "RelationshipScore": 0.9999878406524658,
        "RelationshipType": "TEST_VALUE",
        "Id": 53,
        "BeginOffset": 2246,
        "EndOffset": 2254,
        "Text": "positive",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ],
    "SubChild": [
      {
        "Id": 44,
        "BeginOffset": 2255,
        "EndOffset": 2264,
        "Score": 0.6112360954284668,
        "Text": "pregnancy",
        "Category": "MEDICAL_CONDITION",
        "Type": "DX_NAME",
        "Traits": [
          {
            "Name": "DIAGNOSIS",
            "Score": 0.596932590007782
          }
        ]
      }
    ]
  },
  {
    "Id": 55,
    "BeginOffset": 2344,
    "EndOffset": 2362,
    "Score": 0.7160627841949463,
    "Text": "herbal medications",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TREATMENT_NAME",
    "Traits": []
  },
  {
    "Id": 36,
    "BeginOffset": 2344,
    "EndOffset": 2362,
    "Score": 0.5299677848815918,
    "Text": "herbal medications",
    "Category": "MEDICATION",
    "Type": "GENERIC_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "DURATION",
        "Score": 0.3559902608394623,
        "RelationshipScore": 0.9999997615814209,
        "RelationshipType": "DURATION",
        "Id": 37,
        "BeginOffset": 2370,
        "EndOffset": 2376,
        "Text": "7 days",
        "Category": "MEDICATION",
        "Traits": []
      }
    ]
  },
  {
    "Id": 58,
    "BeginOffset": 2370,
    "EndOffset": 2376,
    "Score": 0.3095918893814087,
    "Text": "7 days",
    "Category": "TIME_EXPRESSION",
    "Type": "TIME_TO_TREATMENT_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TREATMENT_NAME",
        "Score": 0.7160627841949463,
        "RelationshipScore": 0.7487868070602417,
        "RelationshipType": "OVERLAP",
        "Id": 55,
        "BeginOffset": 2344,
        "EndOffset": 2362,
        "Text": "herbal medications",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 58,
    "BeginOffset": 2370,
    "EndOffset": 2376,
    "Score": 0.3095918893814087,
    "Text": "7 days",
    "Category": "TIME_EXPRESSION",
    "Type": "TIME_TO_MEDICATION_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "GENERIC_NAME",
        "Score": 0.5299677848815918,
        "RelationshipScore": 0.7487868070602417,
        "RelationshipType": "OVERLAP",
        "Id": 36,
        "BeginOffset": 2344,
        "EndOffset": 2362,
        "Text": "herbal medications",
        "Category": "MEDICATION",
        "Traits": []
      }
    ]
  },
  {
    "Id": 56,
    "BeginOffset": 2477,
    "EndOffset": 2491,
    "Score": 0.3343527615070343,
    "Text": "blood donation",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 62,
    "BeginOffset": 2503,
    "EndOffset": 2513,
    "Score": 0.9473875761032104,
    "Text": "last month",
    "Category": "TIME_EXPRESSION",
    "Type": "TIME_TO_TEST_NAME",
    "Traits": [],
    "Attributes": [
      {
        "Type": "TEST_NAME",
        "Score": 0.3343527615070343,
        "RelationshipScore": 0.9457772374153137,
        "RelationshipType": "OVERLAP",
        "Id": 56,
        "BeginOffset": 2477,
        "EndOffset": 2491,
        "Text": "blood donation",
        "Category": "TEST_TREATMENT_PROCEDURE",
        "Traits": []
      }
    ]
  },
  {
    "Id": 57,
    "BeginOffset": 2521,
    "EndOffset": 2530,
    "Score": 0.33437609672546387,
    "Text": "screening",
    "Category": "TEST_TREATMENT_PROCEDURE",
    "Type": "TEST_NAME",
    "Traits": []
  },
  {
    "Id": 45,
    "BeginOffset": 2622,
    "EndOffset": 2624,
    "Score": 0.18800987303256989,
    "Text": "65",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "AGE",
    "Traits": []
  },
  {
    "Id": 46,
    "BeginOffset": 2691,
    "EndOffset": 2693,
    "Score": 0.2513914406299591,
    "Text": "65",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "AGE",
    "Traits": []
  },
  {
    "Id": 47,
    "BeginOffset": 2817,
    "EndOffset": 2820,
    "Score": 0.21715255081653595,
    "Text": "CRU",
    "Category": "PROTECTED_HEALTH_INFORMATION",
    "Type": "ADDRESS",
    "Traits": []
  }
]
