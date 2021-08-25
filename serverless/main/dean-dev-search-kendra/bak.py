import json
import boto3
import datetime

client = boto3.client('kendra')

def query(indexId, queryText, attributeFilter, pageSize, pageNumber):
    response = client.query(
        IndexId='27b7c6f1-0f94-4aba-9e81-3946cdf91c08',
        QueryText='which drugs works',
        AttributeFilter=attributeFilter
        # AttributeFilter={
        #     'AndAllFilters': [
        #         {'... recursive ...'},
        #     ],
        #     'OrAllFilters': [
        #         {'... recursive ...'},
        #     ],
        #     'NotFilter': {'... recursive ...'},
        #     'EqualsTo': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     },
        #     'ContainsAll': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     },
        #     'ContainsAny': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     },
        #     'GreaterThan': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     },
        #     'GreaterThanOrEquals': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     },
        #     'LessThan': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     },
        #     'LessThanOrEquals': {
        #         'Key': 'string',
        #         'Value': {
        #             'StringValue': 'string',
        #             'StringListValue': [
        #                 'string',
        #             ],
        #             'LongValue': 123,
        #             'DateValue': datetime(2015, 1, 1)
        #         }
        #     }
        # },
        # Facets=[
        #     {
        #         'DocumentAttributeKey': 'string'
        #     },
        # ],
        # RequestedDocumentAttributes=[
        #     'string',
        # ],
        # QueryResultTypeFilter='DOCUMENT'|'QUESTION_ANSWER'|'ANSWER',
        # QueryResultTypeFilter='DOCUMENT',
        # PageNumber=1,
        # PageSize=100
    )
    return response
    

def query(indexId, queryText, pageSize, pageNumber):
    response = client.query(
        IndexId='27b7c6f1-0f94-4aba-9e81-3946cdf91c08',
        QueryText='which drugs works',
        # Facets=[
        #     {
        #         'DocumentAttributeKey': 'string'
        #     },
        # ],
        # RequestedDocumentAttributes=[
        #     'string',
        # ],
        # QueryResultTypeFilter='DOCUMENT'|'QUESTION_ANSWER'|'ANSWER',
        # QueryResultTypeFilter='DOCUMENT',
        # PageNumber=1,
        # PageSize=100
    )
    return response



def lambda_handler(event, context):
    # TODO implement
    print(event)
    indexId='27b7c6f1-0f94-4aba-9e81-3946cdf91c08'
    queryText = 'which drugs works'
    return event
    attributeFilter={
            'AndAllFilters': [
                {'... recursive ...'},
            ],
            'OrAllFilters': [
                {'... recursive ...'},
            ],
            'NotFilter': {'... recursive ...'},
            'EqualsTo': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            },
            'ContainsAll': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            },
            'ContainsAny': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            },
            'GreaterThan': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            },
            'GreaterThanOrEquals': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            },
            'LessThan': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            },
            'LessThanOrEquals': {
                'Key': 'string',
                'Value': {
                    'StringValue': 'string',
                    'StringListValue': [
                        'string',
                    ],
                    'LongValue': 123,
                    'DateValue': datetime(2015, 1, 1)
                }
            }
        }
    res = None
    # Add attributeFilter if needed
    if attributeFilter:
      res = query(indexId, queryText, attributeFilter, 1, 100)
      print(res)
    else:
      res = query(indexId, queryText, None, 1, 100)
      print(res)
    
    # Mock res body
    res = { 'QueryId': '4eb21536-1334-4705-a2e4-cdb3828be8bb',
                      'ResultItems': [
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-b0a3716e-1d11-4102-b089-8a66dff043e6',
                          'Type': 'ANSWER',
                          'AdditionalAttributes': [
                            {
                              'Key': 'AnswerText',
                              'ValueType': 'TEXT_WITH_HIGHLIGHTS_VALUE',
                              'Value': {
                                'TextWithHighlightsValue': {
                                  'Text': 'Especially tell your doctor if you take: \n\uf0b7 antacids \n\uf0b7 aspirin \n\uf0b7 Nonsteroidal Anti-Inflammatory (NSAID) medicines \n\n\nTell your doctor about all the medicines you take, including prescription and non\xad\nprescription medicines, vitamins and herbal supplements. Certain medicines may affect \nhow Actonel works. \n\n\nKnow the medicines you take. Keep a list of them and show it to your doctor and \npharmacist each time you get a new medicine. \n\n\nHow should I take Actonel? \n\uf0b7\t Take Actonel exactly as your doctor tells you. Your doctor may change your dose \n\n\nof Actonel if needed. \n\uf0b7 Actonel works only if taken on an empty stomach.',
                                  'Highlights': [
                                    {
                                      'BeginOffset': 301,
                                      'EndOffset': 306,
                                      'TopAnswer': False
                                    },
                                    {
                                      'BeginOffset': 587,
                                      'EndOffset': 592,
                                      'TopAnswer': False
                                    }
                                  ]
                                }
                              }
                            }
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
                          'DocumentTitle': {
                            'Text': '020835s045lbl'
                          },
                          'DocumentExcerpt': {
                            'Text': 'Especially tell your doctor if you take: \n\uf0b7 antacids \n\uf0b7 aspirin \n\uf0b7 Nonsteroidal Anti-Inflammatory (NSAID) medicines \n\n\nTell your doctor about all the medicines you take, including prescription and non\xad\nprescription medicines, vitamins and herbal supplements. Certain medicines may affect \nhow Actonel',
                            'Highlights': [
                              {
                                'BeginOffset': 0,
                                'EndOffset': 300,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
                          'DocumentAttributes': [
                            
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-82821dec-0eac-489d-80c3-3af774d01276',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020685_s005ap.pdf',
                          'DocumentTitle': {
                            'Text': '020685_s005ap',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...anti-HIV drugs\nsuch as ZDV (also called AZT), 3TC, ddl., ddC, or\nd4T. CRIXIVAN works differently from these other\nanti-H IVdrugs. Talk with your doctor to see if you\nshould take CRIXIVAN alone or with other\nanti-HIV drugs.\n\n\nCRIXIVAN has been studied in adults. It has not\nbeen studied in children...',
                            'Highlights': [
                              {
                                'BeginOffset': 12,
                                'EndOffset': 17,
                                'TopAnswer': False
                              },
                              {
                                'BeginOffset': 82,
                                'EndOffset': 87,
                                'TopAnswer': False
                              },
                              {
                                'BeginOffset': 219,
                                'EndOffset': 224,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020685_s005ap.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020685_s005ap.pdf'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-4c4fd624-f427-4e58-9c94-7ab69905ac8d',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020449s036PI.pdf',
                          'DocumentTitle': {
                            'Text': '020449s036PI',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...Taxotere works by attacking cancer cells in your body. Different cancer medications attack \ncancer cells in different ways. \nHere’s how Taxotere works: Every cell in your body contains a supporting structure (like a \nskeleton). Damage to this “skeleton” can stop cell growth or reproduction...',
                            'Highlights': [
                              {
                                'BeginOffset': 12,
                                'EndOffset': 17,
                                'TopAnswer': False
                              },
                              {
                                'BeginOffset': 148,
                                'EndOffset': 153,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020449s036PI.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020449s036PI.pdf'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-03be31bf-97a2-4f8c-85b2-9e1354f9c6d2',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf#page=38',
                          'DocumentTitle': {
                            'Text': '020835s048lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...should I take ACTONEL? \n•\t Take ACTONEL exactly as your doctor tells you. Your doctor may change your \n\n\ndose of ACTONEL if needed. \n•\t ACTONEL works only if taken on an empty stomach...',
                            'Highlights': [
                              {
                                'BeginOffset': 147,
                                'EndOffset': 152,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf#page=38',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf#page=38'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-2f8b9416-e51e-41f0-b9f9-13dedb28d1c3',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s047lbl.pdf',
                          'DocumentTitle': {
                            'Text': '020835s047lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...should I take ACTONEL? \n•\t Take ACTONEL exactly as your doctor tells you. Your doctor may change your \n\n\ndose of ACTONEL if needed. \n•\t ACTONEL works only if taken on an empty stomach...',
                            'Highlights': [
                              {
                                'BeginOffset': 147,
                                'EndOffset': 152,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s047lbl.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s047lbl.pdf'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-b0ab6435-bc81-421f-a0cf-43194534face',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf',
                          'DocumentTitle': {
                            'Text': '020835s048lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...should I take ACTONEL? \n•\t Take ACTONEL exactly as your doctor tells you. Your doctor may change your \n\n\ndose of ACTONEL if needed. \n•\t ACTONEL works only if taken on an empty stomach...',
                            'Highlights': [
                              {
                                'BeginOffset': 147,
                                'EndOffset': 152,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-00402c48-a094-41ca-b188-fe4255239e23',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf#page=24',
                          'DocumentTitle': {
                            'Text': '007337s049lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...Prostaglandins cause pain sensations by stimulating muscle \ncontractions and dilating blood vessels throughout the body. In the CNS, aspirin works on the \nhypothalamus heat-regulating center to reduce fever, however, other mechanisms may be involved...',
                            'Highlights': [
                              {
                                'BeginOffset': 144,
                                'EndOffset': 149,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf#page=24',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf#page=24'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-beb6a200-c68a-4661-a94d-3c1c42535ae9',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf',
                          'DocumentTitle': {
                            'Text': '007337s049lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...Prostaglandins cause pain sensations by stimulating muscle \ncontractions and dilating blood vessels throughout the body. In the CNS, aspirin works on the \nhypothalamus heat-regulating center to reduce fever, however, other mechanisms may be involved...',
                            'Highlights': [
                              {
                                'BeginOffset': 144,
                                'EndOffset': 149,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-f205d079-49f4-4874-9d93-12da283a8145',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
                          'DocumentTitle': {
                            'Text': '020835s045lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...How should I take Actonel? \n\uf0b7\t Take Actonel exactly as your doctor tells you. Your doctor may change your dose \n\n\nof Actonel if needed. \n\uf0b7 Actonel works only if taken on an empty stomach...',
                            'Highlights': [
                              {
                                'BeginOffset': 150,
                                'EndOffset': 155,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf'
                              }
                            }
                          ]
                        },
                        {
                          'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-db09897c-b923-4067-b645-07269522bdc0',
                          'Type': 'DOCUMENT',
                          'AdditionalAttributes': [
                            
                          ],
                          'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s045lbl.pdf',
                          'DocumentTitle': {
                            'Text': '007337s045lbl',
                            'Highlights': [
                              
                            ]
                          },
                          'DocumentExcerpt': {
                            'Text': '...centers in the brain stem \nand depresses the cough reflex by direct effect on the center of the medulla. \n\n\nAspirin (acetylsalicylic acid) works by inhibiting the body’s production of prostaglandins, \nincluding prostaglandins involved in inflammation.  Prostaglandins cause pain sensations...',
                            'Highlights': [
                              {
                                'BeginOffset': 142,
                                'EndOffset': 147,
                                'TopAnswer': False
                              }
                            ]
                          },
                          'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s045lbl.pdf',
                          'DocumentAttributes': [
                            {
                              'Key': '_source_uri',
                              'Value': {
                                'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s045lbl.pdf'
                              }
                            }
                          ]
                        }
                      ],
                      'FacetResults': [
                        
                      ],
                      'TotalNumberOfResults': 10222,
                      'ResponseMetadata': {
                        'RequestId': '3051fc75-601b-4e2e-aac6-ac9be89c80b4',
                        'HTTPStatusCode': 200,
                        'HTTPHeaders': {
                          'x-amzn-requestid': '3051fc75-601b-4e2e-aac6-ac9be89c80b4',
                          'content-type': 'application/x-amz-json-1.1',
                          'content-length': '10543',
                          'date': 'Fri, 03 Jul 2020 07:27:03 GMT'
                        },
                        'RetryAttempts': 0
                      }
                    }
    return {
        'statusCode': 200,
        'body': json.dumps(res)
    }
    
    # return     
    # {
    #     'QueryId': 'string',
    #     'ResultItems': [
    #         {
    #             'Id': 'string',
    #             'Type': 'DOCUMENT'|'QUESTION_ANSWER'|'ANSWER',
    #             'AdditionalAttributes': [
    #                 {
    #                     'Key': 'string',
    #                     'ValueType': 'TEXT_WITH_HIGHLIGHTS_VALUE',
    #                     'Value': {
    #                         'TextWithHighlightsValue': {
    #                             'Text': 'string',
    #                             'Highlights': [
    #                                 {
    #                                     'BeginOffset': 123,
    #                                     'EndOffset': 123,
    #                                     'TopAnswer': True|False
    #                                 },
    #                             ]
    #                         }
    #                     }
    #                 },
    #             ],
    #             'DocumentId': 'string',
    #             'DocumentTitle': {
    #                 'Text': 'string',
    #                 'Highlights': [
    #                     {
    #                         'BeginOffset': 123,
    #                         'EndOffset': 123,
    #                         'TopAnswer': True|False
    #                     },
    #                 ]
    #             },
    #             'DocumentExcerpt': {
    #                 'Text': 'string',
    #                 'Highlights': [
    #                     {
    #                         'BeginOffset': 123,
    #                         'EndOffset': 123,
    #                         'TopAnswer': True|False
    #                     },
    #                 ]
    #             },
    #             'DocumentURI': 'string',
    #             'DocumentAttributes': [
    #                 {
    #                     'Key': 'string',
    #                     'Value': {
    #                         'StringValue': 'string',
    #                         'StringListValue': [
    #                             'string',
    #                         ],
    #                         'LongValue': 123,
    #                         'DateValue': datetime(2015, 1, 1)
    #                     }
    #                 },
    #             ]
    #         },
    #     ],
    #     'FacetResults': [
    #         {
    #             'DocumentAttributeKey': 'string',
    #             'DocumentAttributeValueCountPairs': [
    #                 {
    #                     'DocumentAttributeValue': {
    #                         'StringValue': 'string',
    #                         'StringListValue': [
    #                             'string',
    #                         ],
    #                         'LongValue': 123,
    #                         'DateValue': datetime(2015, 1, 1)
    #                     },
    #                     'Count': 123
    #                 },
    #             ]
    #         },
    #     ],
    #     'TotalNumberOfResults': 123
    # }


# {
#   'QueryId': '4eb21536-1334-4705-a2e4-cdb3828be8bb',
#   'ResultItems': [
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-b0a3716e-1d11-4102-b089-8a66dff043e6',
#       'Type': 'ANSWER',
#       'AdditionalAttributes': [
#         {
#           'Key': 'AnswerText',
#           'ValueType': 'TEXT_WITH_HIGHLIGHTS_VALUE',
#           'Value': {
#             'TextWithHighlightsValue': {
#               'Text': 'Especially tell your doctor if you take: \n\uf0b7 antacids \n\uf0b7 aspirin \n\uf0b7 Nonsteroidal Anti-Inflammatory (NSAID) medicines \n\n\nTell your doctor about all the medicines you take, including prescription and non\xad\nprescription medicines, vitamins and herbal supplements. Certain medicines may affect \nhow Actonel works. \n\n\nKnow the medicines you take. Keep a list of them and show it to your doctor and \npharmacist each time you get a new medicine. \n\n\nHow should I take Actonel? \n\uf0b7\t Take Actonel exactly as your doctor tells you. Your doctor may change your dose \n\n\nof Actonel if needed. \n\uf0b7 Actonel works only if taken on an empty stomach.',
#               'Highlights': [
#                 {
#                   'BeginOffset': 301,
#                   'EndOffset': 306,
#                   'TopAnswer': False
#                 },
#                 {
#                   'BeginOffset': 587,
#                   'EndOffset': 592,
#                   'TopAnswer': False
#                 }
#               ]
#             }
#           }
#         }
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
#       'DocumentTitle': {
#         'Text': '020835s045lbl'
#       },
#       'DocumentExcerpt': {
#         'Text': 'Especially tell your doctor if you take: \n\uf0b7 antacids \n\uf0b7 aspirin \n\uf0b7 Nonsteroidal Anti-Inflammatory (NSAID) medicines \n\n\nTell your doctor about all the medicines you take, including prescription and non\xad\nprescription medicines, vitamins and herbal supplements. Certain medicines may affect \nhow Actonel',
#         'Highlights': [
#           {
#             'BeginOffset': 0,
#             'EndOffset': 300,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
#       'DocumentAttributes': [
        
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-82821dec-0eac-489d-80c3-3af774d01276',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020685_s005ap.pdf',
#       'DocumentTitle': {
#         'Text': '020685_s005ap',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...anti-HIV drugs\nsuch as ZDV (also called AZT), 3TC, ddl., ddC, or\nd4T. CRIXIVAN works differently from these other\nanti-H IVdrugs. Talk with your doctor to see if you\nshould take CRIXIVAN alone or with other\nanti-HIV drugs.\n\n\nCRIXIVAN has been studied in adults. It has not\nbeen studied in children...',
#         'Highlights': [
#           {
#             'BeginOffset': 12,
#             'EndOffset': 17,
#             'TopAnswer': False
#           },
#           {
#             'BeginOffset': 82,
#             'EndOffset': 87,
#             'TopAnswer': False
#           },
#           {
#             'BeginOffset': 219,
#             'EndOffset': 224,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020685_s005ap.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020685_s005ap.pdf'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-4c4fd624-f427-4e58-9c94-7ab69905ac8d',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020449s036PI.pdf',
#       'DocumentTitle': {
#         'Text': '020449s036PI',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...Taxotere works by attacking cancer cells in your body. Different cancer medications attack \ncancer cells in different ways. \nHere’s how Taxotere works: Every cell in your body contains a supporting structure (like a \nskeleton). Damage to this “skeleton” can stop cell growth or reproduction...',
#         'Highlights': [
#           {
#             'BeginOffset': 12,
#             'EndOffset': 17,
#             'TopAnswer': False
#           },
#           {
#             'BeginOffset': 148,
#             'EndOffset': 153,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020449s036PI.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020449s036PI.pdf'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-03be31bf-97a2-4f8c-85b2-9e1354f9c6d2',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf#page=38',
#       'DocumentTitle': {
#         'Text': '020835s048lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...should I take ACTONEL? \n•\t Take ACTONEL exactly as your doctor tells you. Your doctor may change your \n\n\ndose of ACTONEL if needed. \n•\t ACTONEL works only if taken on an empty stomach...',
#         'Highlights': [
#           {
#             'BeginOffset': 147,
#             'EndOffset': 152,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf#page=38',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf#page=38'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-2f8b9416-e51e-41f0-b9f9-13dedb28d1c3',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s047lbl.pdf',
#       'DocumentTitle': {
#         'Text': '020835s047lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...should I take ACTONEL? \n•\t Take ACTONEL exactly as your doctor tells you. Your doctor may change your \n\n\ndose of ACTONEL if needed. \n•\t ACTONEL works only if taken on an empty stomach...',
#         'Highlights': [
#           {
#             'BeginOffset': 147,
#             'EndOffset': 152,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s047lbl.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s047lbl.pdf'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-b0ab6435-bc81-421f-a0cf-43194534face',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf',
#       'DocumentTitle': {
#         'Text': '020835s048lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...should I take ACTONEL? \n•\t Take ACTONEL exactly as your doctor tells you. Your doctor may change your \n\n\ndose of ACTONEL if needed. \n•\t ACTONEL works only if taken on an empty stomach...',
#         'Highlights': [
#           {
#             'BeginOffset': 147,
#             'EndOffset': 152,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s048lbl.pdf'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-00402c48-a094-41ca-b188-fe4255239e23',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf#page=24',
#       'DocumentTitle': {
#         'Text': '007337s049lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...Prostaglandins cause pain sensations by stimulating muscle \ncontractions and dilating blood vessels throughout the body. In the CNS, aspirin works on the \nhypothalamus heat-regulating center to reduce fever, however, other mechanisms may be involved...',
#         'Highlights': [
#           {
#             'BeginOffset': 144,
#             'EndOffset': 149,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf#page=24',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf#page=24'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-beb6a200-c68a-4661-a94d-3c1c42535ae9',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf',
#       'DocumentTitle': {
#         'Text': '007337s049lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...Prostaglandins cause pain sensations by stimulating muscle \ncontractions and dilating blood vessels throughout the body. In the CNS, aspirin works on the \nhypothalamus heat-regulating center to reduce fever, however, other mechanisms may be involved...',
#         'Highlights': [
#           {
#             'BeginOffset': 144,
#             'EndOffset': 149,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s049lbl.pdf'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-f205d079-49f4-4874-9d93-12da283a8145',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
#       'DocumentTitle': {
#         'Text': '020835s045lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...How should I take Actonel? \n\uf0b7\t Take Actonel exactly as your doctor tells you. Your doctor may change your dose \n\n\nof Actonel if needed. \n\uf0b7 Actonel works only if taken on an empty stomach...',
#         'Highlights': [
#           {
#             'BeginOffset': 150,
#             'EndOffset': 155,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/020835s045lbl.pdf'
#           }
#         }
#       ]
#     },
#     {
#       'Id': '4eb21536-1334-4705-a2e4-cdb3828be8bb-db09897c-b923-4067-b645-07269522bdc0',
#       'Type': 'DOCUMENT',
#       'AdditionalAttributes': [
        
#       ],
#       'DocumentId': 's3://iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s045lbl.pdf',
#       'DocumentTitle': {
#         'Text': '007337s045lbl',
#         'Highlights': [
          
#         ]
#       },
#       'DocumentExcerpt': {
#         'Text': '...centers in the brain stem \nand depresses the cough reflex by direct effect on the center of the medulla. \n\n\nAspirin (acetylsalicylic acid) works by inhibiting the body’s production of prostaglandins, \nincluding prostaglandins involved in inflammation.  Prostaglandins cause pain sensations...',
#         'Highlights': [
#           {
#             'BeginOffset': 142,
#             'EndOffset': 147,
#             'TopAnswer': False
#           }
#         ]
#       },
#       'DocumentURI': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s045lbl.pdf',
#       'DocumentAttributes': [
#         {
#           'Key': '_source_uri',
#           'Value': {
#             'StringValue': 'https://s3.us-east-1.amazonaws.com/iso-data-ingestion-bucket/Drugs@FDA Data/FDA Drugs PDF Files/007337s045lbl.pdf'
#           }
#         }
#       ]
#     }
#   ],
#   'FacetResults': [
    
#   ],
#   'TotalNumberOfResults': 10222,
#   'ResponseMetadata': {
#     'RequestId': '3051fc75-601b-4e2e-aac6-ac9be89c80b4',
#     'HTTPStatusCode': 200,
#     'HTTPHeaders': {
#       'x-amzn-requestid': '3051fc75-601b-4e2e-aac6-ac9be89c80b4',
#       'content-type': 'application/x-amz-json-1.1',
#       'content-length': '10543',
#       'date': 'Fri, 03 Jul 2020 07:27:03 GMT'
#     },
#     'RetryAttempts': 0
#   }