import json

PADDING_FACTOR = 1
LEFT_OFFSET_KEY = 'LeftOffset'
SAME_LINE_DIFFER = 0.0100


def calculate_number_of_chars_to_just(block, factor):
    right_offset = block['Geometry']['BoundingBox']['Left'] + block['Geometry']['BoundingBox']['Width']
    return round(right_offset * 100) * factor


def calculate_number_of_chars_to_just_following(block_ahead, block, factor):
    right_offset = block['Geometry']['BoundingBox']['Left'] + block['Geometry']['BoundingBox']['Width']
    block_ahead_right_offset = block_ahead['Geometry']['BoundingBox']['Left'] + block_ahead['Geometry']['BoundingBox'][
        'Width']
    offset = right_offset - block_ahead_right_offset
    return round(offset * 100) * factor


def is_same_line(y1, y2):
    return abs(y1 - y2) < SAME_LINE_DIFFER


def baseline_top(block):
    return block['Geometry']['BoundingBox']['Top'] + block['Geometry']['BoundingBox']['Height'] / 2


def paged_as_lines(response):
    txt = dict()

    for resultPage in response:
        for block in resultPage["Blocks"]:
            page = str(block['Page'])
            if hasattr(txt, page) is False:
                txt.setdefault(page, dict())

            if block["BlockType"] == "LINE":
                txt[page].setdefault(block['Id'], [block])

    return txt


def handle_same_line_issue(paged_text):
    txt = dict()
    for k, v in paged_text.items():
        txt[k] = _handle_same_line_issue(v)

    return txt


def _handle_same_line_issue(flat_blocks):
    result = []

    skip_list = []

    for block_list_id, block_list_value in flat_blocks.items():
        top = baseline_top(block_list_value[0]),
        if block_list_id not in skip_list:
            block_list_value[0].setdefault(
                LEFT_OFFSET_KEY,
                calculate_number_of_chars_to_just(block_list_value[0], PADDING_FACTOR)
            )
            result += [block_list_value]
            skip_list += [block_list_id]

            for sample_id, sample_value in flat_blocks.items():
                sample_top = baseline_top(sample_value[0]),
                if sample_id not in skip_list:
                    if is_same_line(top[0], sample_top[0]):
                        sample_value[0].setdefault(
                            LEFT_OFFSET_KEY,
                            calculate_number_of_chars_to_just_following(block_list_value[0], sample_value[0],
                                                                        PADDING_FACTOR)
                        )
                        result[len(result) - 1] += [sample_value[0]]
                        skip_list += [sample_id]

    return result


def generate_file_content(same_lined_text):
    file_content = ''
    #current_page = 0
    for page_number, lines_blocks in same_lined_text.items():
        #print("page_number:", page_number)
        #print("lines_blocks:", lines_blocks)
        for lines in lines_blocks:
            for line in lines:
                file_content += line['Text'].rjust(line[LEFT_OFFSET_KEY])
            file_content += '\n'
        #if(current_page != page_number):
        #    current_page = page_number
        #    file_content += '\f'
        file_content += '\f'

    return file_content


def generate_file_content_from_s3(s3_object):
    my_response = s3_object['Body'].read().decode()
    
    return convertToTxt(json.loads(my_response))

def convertToTxt(jsonResponse):
    paged_text = paged_as_lines(jsonResponse)
    
    same_lined_text = handle_same_line_issue(paged_text)

    # print(generate_text.generate_file_content(same_lined_text))
    fileContent = generate_file_content(same_lined_text)

    # print(fileContent)
    return fileContent

# =================  Test Below =================. lambda_function.lambda_handler。 generate_text.test

def test(event, context):
    response = [
        {
            "DocumentMetadata": {
                "Pages": 54
            },
            "JobStatus": "SUCCEEDED",
            "NextToken": "RkvyPGIZi59Sj7STzMnqAS80fZZsBkCzPeufSlpbs790yNqkAaAH6RY6S387G6qAzRRFC/ucFvYcSQ7UMupwPlFXbXLqocfWxKFOctzz90SHYrNkBQ==",
            "Blocks": [
                {
                    "BlockType": "PAGE",
                    "Geometry": {
                        "BoundingBox": {
                            "Width": 1.0,
                            "Height": 1.0,
                            "Left": 0.0,
                            "Top": 0.0
                        },
                        "Polygon": [
                            {
                                "X": 1.5849614334573464e-16,
                                "Y": 0.0
                            },
                            {
                                "X": 1.0,
                                "Y": 9.462437987838284e-17
                            },
                            {
                                "X": 1.0,
                                "Y": 1.0
                            },
                            {
                                "X": 0.0,
                                "Y": 1.0
                            }
                        ]
                    },
                    "Id": "dd299e4f-53e1-4631-883d-769d65a67f76",
                    "Relationships": [
                        {
                            "Type": "CHILD",
                            "Ids": [
                                "05014a86-1160-446f-88c8-7da1d910101c",
                                "9d7a2465-643a-4bde-9549-6073918f036b",
                                "314cfd02-16d8-4dd7-906b-35f404a51352",
                                "34c19232-3a9e-423a-8a2a-5daea644f1bd",
                                "c2e16c4e-561d-48ad-9f92-e31cbc54cda1",
                                "a6da9f2d-8d12-4526-bfbd-ace1c032e79b",
                                "724ee43e-368b-4cb1-b362-8e218b587c94",
                                "629e7765-22a3-4a21-8a8d-7e6e07c900e1",
                                "9cbbbb88-d5cc-40ee-88c4-d2f122b78ef9",
                                "229d84cf-7682-47c2-8b7e-c6e98634efaf",
                                "6bf89042-4176-47fb-a198-e1c082c87a78",
                                "01d6ac2c-a3f4-45d9-bfbe-c38c5d3917f7",
                                "2204c33b-3e8b-4229-9e9f-0ea779f3cb4f",
                                "b2d712cd-bedb-4a4c-a22e-e3dbac3b4ef5",
                                "c8dfb358-4183-4cf6-a221-c0c05794146c",
                                "a10f1b6e-23c1-4b09-a870-9e91afa5db19",
                                "2367ed8e-6410-4794-9d44-542825359e71",
                                "1bf8cde4-e58b-4101-9ff9-df870f8185bf",
                                "398b3dac-1252-4125-b1fe-d278785da170",
                                "4dd78b13-879d-4b10-8f9b-baec64512361",
                                "ec526da7-7427-4249-a05d-c829a6b52d5f",
                                "f6eacbe1-fe40-41c0-8f71-224bf77702ae",
                                "d7d80b03-8f9a-4b85-90c1-b3da30a43d03",
                                "00c0c2bc-11cb-4bb5-9da0-003b327817df"
                            ]
                        }
                    ],
                    "Page": 1
                },
                {
                    "BlockType": "LINE",
                    "Confidence": 97.61774444580078,
                    "Text": "I3O-EW-JSBD(b) Protocol",
                    "Geometry": {
                        "BoundingBox": {
                            "Width": 0.23914653062820435,
                            "Height": 0.01689569093286991,
                            "Left": 0.11805436760187149,
                            "Top": 0.04597098380327225
                        },
                        "Polygon": [
                            {
                                "X": 0.11805436760187149,
                                "Y": 0.04597098380327225
                            },
                            {
                                "X": 0.35720089077949524,
                                "Y": 0.04597098380327225
                            },
                            {
                                "X": 0.35720089077949524,
                                "Y": 0.06286667287349701
                            },
                            {
                                "X": 0.11805436760187149,
                                "Y": 0.06286667287349701
                            }
                        ]
                    },
                    "Id": "05014a86-1160-446f-88c8-7da1d910101c",
                    "Relationships": [
                        {
                            "Type": "CHILD",
                            "Ids": [
                                "1e6ab766-b554-42a9-a608-36a23f8bc328",
                                "2fa3bc5a-bdd7-4735-b32d-bf8f9cef3f19"
                            ]
                        }
                    ],
                    "Page": 1
                },
                {
                    "BlockType": "LINE",
                    "Confidence": 98.9129638671875,
                    "Text": "Page 1",
                    "Geometry": {
                        "BoundingBox": {
                            "Width": 0.06275509297847748,
                            "Height": 0.017116175964474678,
                            "Left": 0.8191983103752136,
                            "Top": 0.04582575336098671
                        },
                        "Polygon": [
                            {
                                "X": 0.8191983103752136,
                                "Y": 0.04582575336098671
                            },
                            {
                                "X": 0.8819534182548523,
                                "Y": 0.04582575336098671
                            },
                            {
                                "X": 0.8819534182548523,
                                "Y": 0.06294193118810654
                            },
                            {
                                "X": 0.8191983103752136,
                                "Y": 0.06294193118810654
                            }
                        ]
                    },
                    "Id": "9d7a2465-643a-4bde-9549-6073918f036b",
                    "Relationships": [
                        {
                            "Type": "CHILD",
                            "Ids": [
                                "bd3eada7-aea2-4821-a01e-e5528b741722",
                                "6a5daf52-31dc-4f11-a099-94f6011823c5"
                            ]
                        }
                    ],
                    "Page": 1
                },
                {
                    "BlockType": "PAGE",
                    "Page": 2
                },
                {
                    "BlockType": "LINE",
                    "Confidence": 98.30290985107422,
                    "Text": "1. Protocol I3O-EW-JSBD(b)",
                    "Geometry": {
                        "BoundingBox": {
                            "Width": 0.34812864661216736,
                            "Height": 0.02189050242304802,
                            "Left": 0.32690420746803284,
                            "Top": 0.08986818790435791
                        },
                        "Polygon": [
                            {
                                "X": 0.32690420746803284,
                                "Y": 0.08986818790435791
                            },
                            {
                                "X": 0.6750328540802002,
                                "Y": 0.08986818790435791
                            },
                            {
                                "X": 0.6750328540802002,
                                "Y": 0.11175868660211563
                            },
                            {
                                "X": 0.32690420746803284,
                                "Y": 0.11175868660211563
                            }
                        ]
                    },
                    "Id": "314cfd02-16d8-4dd7-906b-35f404a51352",
                    "Relationships": [
                        {
                            "Type": "CHILD",
                            "Ids": [
                                "dc8dcd6e-eaa2-4f3f-8174-43dd1166b363",
                                "29442fdf-ebda-4058-91de-bd4a32726899",
                                "38f84d1c-161d-410d-b663-bdf3da9e8ab9"
                            ]
                        }
                    ],
                    "Page": 2
                }
            ],
            "DetectDocumentTextModelVersion": "1.0",
            "ResponseMetadata": {
                "RequestId": "ccf51e7c-85a8-4dcf-b23f-39e80181c654",
                "HTTPStatusCode": 200,
                "HTTPHeaders": {
                    "date": "Thu, 09 Jan 2020 08:44:11 GMT",
                    "content-type": "application/x-amz-json-1.1",
                    "content-length": "4610",
                    "connection": "keep-alive",
                    "x-amzn-requestid": "ccf51e7c-85a8-4dcf-b23f-39e80181c654"
                },
                "RetryAttempts": 0
            }
        }
    ]

    # pprint.pprint(paged_as_lines(response))
    paged_text = paged_as_lines(response)

    # pprint.pprint(handle_same_line_issue(paged_text))
    same_lined_text = handle_same_line_issue(paged_text)

    # print(generate_file_content(same_lined_text))
    fileContent = generate_file_content(same_lined_text)
    print(fileContent)

    print('------  TEST // done  --------')
