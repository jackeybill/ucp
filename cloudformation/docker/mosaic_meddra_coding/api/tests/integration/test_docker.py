"""Tests for Auto Coding Model API."""

import sys
import argparse
import unittest
import json

import requests


def post(data, uri='localhost', port=8080, method='autocoding/predict', version='v2'):
    
    headers = {'Content-type': 'application/json'}

    if not data:
        return 'Empty json. Please provide a valid input'

    assert ('text' in data.keys()) & ('n_ranks' in data.keys()), 'Missing one or more attributes from "data"'

    endpoint = 'http://{}:{}/{}/{}'.format(uri, port, method, version)
    
    r = requests.post(endpoint, data=json.dumps(data), headers=headers)

    if r.ok:
        if r.json():
            results = r.json()
            return results
        else:
            return('Empty return. Autocoding model could not recognize the as reported terms')
    else:
        return 'Status code: {}'.format(r.status_code)



class TestIntegrations(unittest.TestCase):
    """Need to run docker container before test"""

    def test_index(self, uri='localhost', port=8080):

        endpoint = 'http://{}:{}'.format(uri, port)
        r = requests.get(endpoint)

        self.assertTrue(r.ok)
        self.assertEqual(r.text, "<h1 style='color:blue'>Auto Coding API</h1>")



    def test_empty_input(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text' : [],
                'n_ranks' : 2}

        json_response = post(data, uri, port, method, version)

        self.assertEqual(json_response, 'Input data has empty "text" attribute. Please provide a valid input')



    def test_empty_string(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['', 'knee pain'],
                'n_ranks': 1}

        json_response = post(data, uri, port, method, version)

        self.assertEqual(json_response, '"text" attribute in input data must not contain empty string')



    def test_zero_ranks(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['knee pain'],
                'n_ranks': 0}

        json_response = post(data, uri, port, method, version)

        self.assertEqual(json_response, 'Input data must have n_ranks >= 1')



    def test_one_rank(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['knee pain'],
                'n_ranks': 1}

        json_response = post(data, uri, port, method, version)

        self.assertIn('results', json_response)
        self.assertEqual(len(json_response['results']), len(data['text']))
        self.assertIn('preds', json_response['results'][0])
        self.assertEqual(len(json_response['results'][0]['preds']), data['n_ranks'])



    def test_multiple_ranks(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['knee pain'],
                'n_ranks': 3}

        json_response = post(data, uri, port, method, version)

        self.assertIn('results', json_response)
        self.assertEqual(len(json_response['results']), len(data['text']))
        self.assertIn('preds', json_response['results'][0])
        self.assertEqual(len(json_response['results'][0]['preds']), data['n_ranks'])



    def test_batch_pred_one_rank(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['knee pain', 'headache', 'she suffered from high fever'],
                'n_ranks': 1}

        json_response = post(data, uri, port, method, version)

        self.assertIn('results', json_response)
        self.assertEqual(len(json_response['results']), len(data['text']))
        self.assertIn('preds', json_response['results'][0])
        self.assertEqual(len(json_response['results'][0]['preds']), data['n_ranks'])



    def test_batch_pred_multiple_ranks(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['knee pain', 'headache', 'she suffered from high fever'],
                'n_ranks': 3}

        json_response = post(data, uri, port, method, version)

        self.assertIn('results', json_response)
        self.assertEqual(len(json_response['results']), len(data['text']))
        self.assertIn('preds', json_response['results'][0])
        self.assertEqual(len(json_response['results'][0]['preds']), data['n_ranks'])



    def test_large_batch(self, uri = 'localhost', port = 8080, method = 'autocoding/predict', version = 'v2'):

        data = {'text': ['knee pain', 'headache', 'she suffered from high fever'],
            'n_ranks': 3}
    
        texts = []
        for i in range(1000):
            texts.extend(data['text'])

        data['text'] = texts

        json_response = post(data, uri, port, method, version)

        self.assertIn('results', json_response)
        self.assertEqual(len(json_response['results']), len(data['text']))
        self.assertIn('preds', json_response['results'][0])
        self.assertEqual(len(json_response['results'][0]['preds']), data['n_ranks'])



if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--uri', default='localhost')
    parser.add_argument('--port', default=8080)
    parser.add_argument('--method', default='autocoding/predict')
    parser.add_argument('--version', default='v2')
    parser.add_argument('unittest_args', nargs='*')

    args = parser.parse_args()

    sys.argv[1:] = args.unittest_args
    unittest.main()

if __name__ == '__main__':
    plac.call(unittest.main)