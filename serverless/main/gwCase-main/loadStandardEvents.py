import csv
import json


# Function to convert a CSV to JSON
def make_json(csvFilePath):
    # create a dictionary
    data = {}
    categorys = []

    # Open a csv reader called DictReader
    with open(csvFilePath, encoding='utf-8') as csvf:
        csvReader = csv.DictReader(csvf)

        # Convert each row into a dictionary
        # and add it to data
        for rows in csvReader:
            key = rows['Categories'].strip()
            rows['selected'] = 'false'
            if key not in categorys:
                categorys.append(key)
                data[key] = [rows]
            else:
                data[key].append(rows)

    # Open a json writer, and use the json.dumps()
    # function to dump data
    result = json.dumps(data, indent=4)
    print(result)
    return result


def loadStandardEvents():
    return make_json('Standard_Events_Dictionary.csv')