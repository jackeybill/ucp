"""Tests for Autocoding Model API."""

import unittest
import json
import torch

from os.path import abspath, join, dirname

import sys
sys.path.insert(0, abspath(join(dirname(abspath(__file__)),'../../app')))


from main import app, model, model_utils, encoder, predict, get_llts, create_hierarchy, DataIterator


class MyTestCase(unittest.TestCase):

    def setUp(self):
        app.testing = True
        self.app = app.test_client()
        self.data = ['headache', 'knee pain', 'nausea']
        self.actual_lens = list(map(lambda x: len(x), self.data))



    def test_home(self):
        r = self.app.get('/')
        self.assertEqual(r.status_code, 200)


    
    def test_prediction_api(self):
        r = self.app.post('/autocoding/predict/v2')
        self.assertEqual(r.status_code, 200)



    def test_model(self):
        '''
        Checks if the dimensionality of the softmax output matches the # of distinct labels
        '''
        self.assertEqual(model.last_dense_layer.weight.size()[0], model_utils['label_encoder'].vocab_size)



    def test_model_utils(self):
        '''
        Checks if the model_utils contain all the required attributes
        '''
        keys = model_utils.keys()

        self.assertIn('text_encoder', keys, 'Cannot find "text_encoder" in "model_utils"')
        self.assertIn('label_encoder', keys, 'Cannot find "label_encoder" in "model_utils"')
        self.assertIn('mapping_dict', keys, 'Cannot find "mapping_dict" in "model_utils"')



    def test_DataIterator(self):
        '''
        Checks functionality of the DataIterator
        '''
        iterator = DataIterator(self.data, 512)
        batch = iterator.next_batch()
        self.assertEqual(batch, self.data)



    def test_text_encoder(self):
        '''
        Checks if the encoded input from text_encoder is of expected size
        '''
        seqs, lens = model_utils['text_encoder'].batch_encode(self.data)
        self.assertEqual(seqs.size(), (len(self.data), max(self.actual_lens)), 'Expected encoded sequence of size ({},{}) but got ({},{})'.format(len(self.data), max(self.actual_lens), seqs.size()[0], seqs.size()[1]))
        self.assertEqual(lens.tolist(), self.actual_lens, '"lens" from text_encoder do not match actual sequence lengths')



    def test_label_encoder(self):
        '''
        Checks if the decoded labels from label_encoder are of expected size
        '''
        inp = torch.tensor([245,3423])
        llts = model_utils['label_encoder'].batch_decode(inp)

        self.assertIsInstance(llts, list, 'Expected an object of type "list" but got {}'.format(type(llts)))
        self.assertEqual(len(llts), inp.size()[0], 'Size of inputs does not match the size of output')



    def test_mapping_dict(self):
        '''
        Checks if the mapping_dict has required attributes
        '''
        keys = model_utils['mapping_dict'].keys()

        self.assertIn('Event Preferred Term', keys, 'Mapping dict does not contain "Event Preferred Term" attribute')
        self.assertIn('Event High Level Term', keys, 'Mapping dict does not contain "Event High Level Term" attribute')
        self.assertIn('Event High Level Group Term', keys, 'Mapping dict does not contain "Event High Level Group Term" attribute')
        self.assertIn('Event Body System', keys, 'Mapping dict does not contain "Event Body System" attribute')  



    def test_get_llts(self):
        '''
        Tests the functionality of get_LLTs and checks if the output size is as expected
        '''

        seqs, lens = model_utils['text_encoder'].batch_encode(self.data)
        n_ranks = 2
        LLTs = get_llts(model, seqs, model_utils['label_encoder'], n_ranks = n_ranks)

        self.assertIsInstance(LLTs, list, 'Expected an object of type "list" but got {}'.format(type(LLTs)))
        self.assertEqual(len(LLTs), seqs.size()[0], 'Expected output of size {} but got {}'.format(seqs.size()[0], len(LLTs)))
        self.assertEqual(len(LLTs[0]), n_ranks, 'Expected get_LLTs to give {} ranks but got {}'.format(n_ranks, len(LLTs[0])))



    def test_create_hierarchy(self):
        '''
        Tests the functionality of create_hierarchy and checks if the output has the required attributes
        '''

        LLTs = [['Headache', 'Headache NOS'],
                ['Knee pain', 'Pain in knee'],
                ['Nausea', 'Nausea aggravated']]

        results = create_hierarchy(self.data, LLTs, model_utils['mapping_dict'])

        self.assertEqual(len(results), len(self.data), 'Expected "results" to be of length {} but got {}'.format(len(self.data), len(results)))
        self.assertIn('as_reported', results[0], 'Items in "results" do not have an attribute "as_reported"')
        self.assertIn('preds', results[0], 'Items in "results" do not have an attribute "preds"')

        self.assertEqual(len(results[0]['preds']), len(LLTs[0]), 'Expected each item in "preds" to have length {} but got {}'.format(len(LLTs[0]), len(results[0]['preds'])))

        pred_keys = results[0]['preds'][0].keys()

        self.assertIn('rank', pred_keys, 'Missing attribute "rank"')
        self.assertIn('LLT', pred_keys, 'Missing attribute "LLT"')
        self.assertIn('PT', pred_keys, 'Missing attribute "PT"')
        self.assertIn('HLT', pred_keys, 'Missing attribute "HLT"')
        self.assertIn('HLGT', pred_keys, 'Missing attribute "HLGT"')
        self.assertIn('BS', pred_keys, 'Missing attribute "BS"')



    def test_predict(self):
        '''
        Tests the functionality of predict
        '''

        iterator = DataIterator(self.data, 512)

        results = predict(model, iterator, encoder, model_utils['label_encoder'], model_utils['mapping_dict'], n_ranks = 2)

        self.assertEqual(len(results['results']), len(self.data), 'Expected an output of length {} but got {}'.format(len(self.data), len(results['results'])))



    def test_get_results(self):
        '''
        Check if a request posted to the app gives the results as expected
        '''

        inp = {'text': self.data,
               'n_ranks': 3}

        headers = {'Content-type': 'application/json'}

        r = self.app.post('/autocoding/predict/v2', data = json.dumps(inp), headers = headers)

        self.assertEqual(r.status_code, 200)
        self.assertIn('results', r.get_json(), 'Output does not contain an attribute "results"')
        self.assertEqual(len(r.get_json()['results']), len(inp['text']))


if __name__ == '__main__':
    unittest.main()