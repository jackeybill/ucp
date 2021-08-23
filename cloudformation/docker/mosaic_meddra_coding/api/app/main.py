import time
from pathlib import Path

from flask import request, jsonify, Flask

import torch
import torch.nn.functional as F

import joblib

from classifier import TextEncoder
from autocoding_utils import load_model, DataIterator, pre_process_text


DIR_NAME = Path(__file__).parents[0].resolve() / 'model'


MODEL_FILE_NAME = 'cnn.pt'
MODEL_UTILS_FILE = 'cnn_model_utils.pkl'
PARAMS_FILE = 'params.json'


VERSION = '/v2'
API_PATH = '/autocoding/predict'


start = time.monotonic()

model = load_model(DIR_NAME / MODEL_FILE_NAME, DIR_NAME / PARAMS_FILE)
model.eval()

# Load models_utils : Dictionary with keys: text_encoder, label_encoder, mapping_dict
model_utils = joblib.load(DIR_NAME / MODEL_UTILS_FILE)

encoder = TextEncoder(model_utils['text_encoder'])

print('App Loaded in {:.2f} seconds'.format(time.monotonic() - start))


app = Flask(__name__)


@app.route('/')
def hello():
    return "<h1 style='color:blue'>Auto Coding API</h1>"


@app.route(API_PATH + VERSION, methods=['POST'])
def get_results():
    '''
    Reads the data from requests, checks for some edge cases and finally passes it 
    to the model for inference
    '''

    reqs = request.get_json()

    results = {}

    if reqs:
        data = reqs['text']
        n_ranks = reqs['n_ranks']

        if len(data) == 0:
            results = 'Input data has empty "text" attribute. Please provide a valid input'
        elif '' in data:
            results = '"text" attribute in input data must not contain empty string'
        elif n_ranks == 0:
            results = 'Input data must have n_ranks >= 1'
        else:
            iterator = DataIterator(data, 512)
            
            results = predict(model, iterator, encoder, model_utils['label_encoder'],
                              model_utils['mapping_dict'], n_ranks)

    return jsonify(results)


def predict(model, iterator, text_encoder, label_encoder, mapping_dict, n_ranks=3):
    '''
    Encodes the input from requests and produces inference from the model
    
    Arguments:
    model: model classifier object
    iterator: iterator to generate batches
    text_encoder: text encoder object to encode input text to padded sequence tensor
    label_encoder: label_encoder object to decode LLTs from their encoded form
    mapping_dict: a dictionary that maps LLTs to higher levels in MedDRA hierarchy
    n_ranks: no. of ranks to predict
    
    Returns:
    results: final results json format
    '''

    results = []
    
    for itr in range(iterator.batch_count):
        
        batch = iterator.next_batch()
        
        #TODO : Explore pipeline
        cleaned_batch = list(map(pre_process_text, batch))
        
        seqs = text_encoder.batch_encode(cleaned_batch)

        llt_list = get_llts(model, seqs, label_encoder, n_ranks)
        
        batch_results = create_hierarchy(batch, llt_list, mapping_dict)
        
        results.extend(batch_results)

    return {'results': results}


def get_llts(model, seqs, label_encoder, n_ranks):
    '''
    Performs the forward pass on the input data and decodes LLTs based on softmax output
    
    Arguments:
    model: classifier model object
    seqs: padded sequences
    label_encoder: label_encoder object to decode LLTs from their encoded form
    n_ranks: no. of ranks to predict
    
    Returns:
    labels: list of LLT ranks for input data
    '''
    
    output = model.forward(seqs)  
    output = F.softmax(output, dim=1)

    _, idx = torch.sort(output, dim=1, descending=True)

    idx = idx[:, 0:n_ranks]
    
    labels = list(map(label_encoder.batch_decode, idx))
    
    return labels


def create_hierarchy(data, llt_list, mapping_dict):
    '''
    Obtains higher levels from the MedDRA hierarchy using LLTs predicted using the model. 
    It further creates json consisting of inputs and corresponding predictions:
    
    Arguments:
    data: input_data
    LLT_list: a list of LLT predictions from model
    mapping_dict: a dictionary that maps LLTs to higher levels in MedDRA hierarchy
    
    Returns:
    Final results in following json format:
                {[{'as_reported': xxxx,
                   'preds':[{'rank' : 1, 'LLT': xx, 'PT': yy, 'HLT': zz, 'HLGT': aa, 'BS': bb},
                            {'rank' : 1, 'LLT': xx, 'PT': yy, 'HLT': zz, 'HLGT': aa, 'BS': bb},
                            {'rank' : 1, 'LLT': xx, 'PT': yy, 'HLT': zz, 'HLGT': aa, 'BS': bb}]},
                  {},
                  {}.
                  ...]}
    '''

    results = []
    for idx, value in enumerate(data):

        preds = []

        if isinstance(llt_list[0], str):
            n_ranks = 1
        else:
            n_ranks = len(llt_list[0])

        for rank in range(n_ranks):

            pred_rank_dict = {}
            
            current_llt = llt_list[idx][rank]

            pred_rank_dict['rank'] = rank + 1
            pred_rank_dict['LLT'] = current_llt
            pred_rank_dict['PT'] = mapping_dict['Event Preferred Term'][current_llt]
            pred_rank_dict['HLT'] = mapping_dict['Event High Level Term'][current_llt]
            pred_rank_dict['HLGT'] = mapping_dict['Event High Level Group Term'][current_llt]
            pred_rank_dict['BS'] = mapping_dict['Event Body System'][current_llt]

            preds.append(pred_rank_dict)

        results.append({'as_reported' : value, 'preds' : preds})

    return results

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=False)
    