import time
import pickle
import re
import json
import numpy as np

import torch

from classifier import CNNClassifier


class Params():
    """Class that loads hyperparameters from a json file.

    Example:
    ```
    params = Params(json_path)
    print(params.learning_rate)
    params.learning_rate = 0.5  # change the value of learning_rate in params
    ```
    """

    def __init__(self, json_path):
        with open(json_path) as f:
            params = json.load(f)
            self.__dict__.update(params)

    def save(self, json_path):
        with open(json_path, 'w') as f:
            json.dump(self.__dict__, f, indent=4)

    def update(self, json_path):
        """Loads parameters from json file"""
        with open(json_path) as f:
            params = json.load(f)
            self.__dict__.update(params)

    def get(self, **args):
        return self.__dict__.get(**args)

    @staticmethod
    def __print_dict__(_dict, carryon=0):
        for k in _dict.keys():
            carryon_tabs = carryon * 4 * ' '
            if isinstance(_dict[k], dict):
                print(f"{carryon_tabs}{k}:")
                Params.__print_dict__(_dict[k], carryon + 1)
            else:
                print(f"{carryon_tabs}{k}: {_dict[k]}")

    def summary(self):
        Params.__print_dict__(self.__dict__)

    @property
    def dict(self):
        """Gives dict-like access to Params instance by `params.dict['learning_rate']"""
        return self.__dict__



class DataIterator(object):
    '''
    Creates an iterator for passing data in batches during inference, especially 
    when large number of requests are posted
    
    Arguments:
    data : data to create batches from
    batch_size: integer specifying size of each batch
    '''
    def __init__(self, data, batch_size):
        self.data = data
        self.batch_size = batch_size
        self.iter = self.make_random_iter()
        
    def next_batch(self):
        '''
        Returns next batch
        '''
        try:
            idxs = self.iter.__next__()
        except StopIteration:
            self.iter = self.make_random_iter()
            idxs = self.iter.__next__()
        x = [self.data[i] for i in idxs]
        return x

    def make_random_iter(self):
        '''
        Returns an iterator for batches
        '''
        splits = np.arange(self.batch_size, len(self.data)+self.batch_size, self.batch_size)
        self.batch_count = len(splits)
        it = np.split(range(len(self.data)), splits)[:-1]
        return iter(it)



def pre_process_text(text):
    '''
    Performs pre-processing required for text before feeding to model. The 
    following cases are handled in the pre-processing steps
    1) Removal of non-alphanumeric characters
    2) Removal of extra spaces
    3) Conversion of text to lower case
    
    Arguments:
    text: text to be pre-processed
    
    Returns:
    Cleaned text after performing the aforementioned 3 steps
    '''
    
    clean_text = ' '.join(re.sub('[^a-zA-Z0-9]', ' ', text).strip().lower().split())
    
    return clean_text


    
def load_model(model_file_name, params_file):
    '''
    Initializes a model object and loads trained weights from given file name

    Arguments:
    model_file_name: string specifying the location of trained model weights
    params_file: string specifying location to yaml file containing 
    hyperparameters required to initialize the model object

    Returns
    classifier: model object with trained model weights loaded
    '''

    state_dict = torch.load(model_file_name, map_location=torch.device('cpu'))

    params = Params(params_file).dict

    classifier = create_model(params)

    classifier.load_state_dict(state_dict)

    return classifier



def create_model(params):
    '''
    Creates a model objects using the hyperparameters from the dictionay 'params'

    Arguments:
    params: a dictionary containing the hyperparameters required to create the model object

    Returns:
    model: model object
    '''

    emb_size = params['emb_size']
    n_filters = params['n_filters']
    kernel_sizes = params['kernel_sizes']
    dense_layer_sizes = params['dense_layer_sizes']
    dropout_prob = params['dropout_prob']
    num_classes = params['num_classes']


    model = CNNClassifier(emb_size=emb_size,
                          n_filters=n_filters,
                          kernel_sizes=kernel_sizes,
                          dense_layer_sizes=dense_layer_sizes,
                          num_classes=num_classes,
                          dropout_prob=dropout_prob)

    return model



def save_model(model, file_name):
    '''
    Saves state_dict of the model

    Arguments:
    model: Model object
    file_name:  
    '''
    torch.save(model.state_dict(), file_name)



def calculate_score(model, dataset, criterion, device):
    '''
    Evaluates the model on the validation set

    Arguments: 
    model: A model object
    dataset: Dataset object corresponding to validation data
    criterion: Criterion to calculate validation loss
    device: Specifies the device to be used for storing the tensors and carrying our computations

    Returns:
    output: softmax output
    loss: Loss
    acc: Accuracy
    '''

    loss = 0.0
    acc = 0.0
    total = 0.0
    

    model.eval()

    with torch.set_grad_enabled(False):
        
        for seqs, labels in dataset:

            torch.cuda.empty_cache()

            seqs = seqs.to(device)
            labels = labels.to(device)

            output = model.forward(seqs)

            loss = criterion(output, labels)

            _, predicted_index = torch.max(output, 1)

            # Calculate total loss and accurate predictions till current batch 
            total += len(labels)
            loss += loss.item()
            acc += (predicted_index == labels).sum().item() 

    return loss/total, acc/total



def train_model(model, epochs, trainset, valset, criterion, optimizer, device, file_name):
    '''
    Performs the following tasks
    1) Performs forward propagation, calculates loss and carries out backpropagation
    using the specified criterion and optimizer
    2) Evaluates the model performance on training and validation set
    3) Carries out model checkpointing if the validation accuracy improves in current
    epoch

    Arguments: 
    model: A model object
    epochs: No. of epochs
    trainset: Dataset object corresponding to training data
    valset: Dataset object corresponding to validation data
    criterion: Criterion to calculate the loss 
    optimizer: Optimizer to minimize the loss
    device: Specifies the device to be used for storing the tensors and carrying our
    computations
    file_name: File name to save the model's state_dict into
    
    Returns: 
    model: A model object with trained weights
    '''
    
    #Lists to store Loss and Accuracy:
    train_loss_ = []
    train_acc_ = []
    
    val_loss_ = []
    val_acc_ = []

    start_time = time.monotonic()

    with torch.set_grad_enabled(True):

        best_val_acc = 0

        for epoch in range(epochs):

            model.train()

            train_acc = 0.0
            train_loss = 0.0
            total = 0.0

            for seqs, labels in trainset:

                torch.cuda.empty_cache()

                seqs = seqs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()
                output = model.forward(seqs)
                loss = criterion(output, labels)

                loss.backward()

                optimizer.step()

                _, predicted_index = torch.max(output, 1)

                # Calculate total loss and accurate predictions till current batch
                total += len(labels)
                train_loss += loss.item()
                train_acc += (predicted_index == labels).sum().item()

            # Store logs for training loss and accuracy for current batch
            train_loss_.append(train_loss/total)
            train_acc_.append(train_acc/total)

            # Evaluate performance on validation set and save the corresponding logs
            val_loss, val_acc = calculate_score(model, valset, criterion, device)
            
            val_loss_.append(val_loss.item())
            val_acc_.append(val_acc)

            print('Epoch %3d/%3d : Training Loss : %.5f, Training Accuracy : %.4f, Validation Loss : %.5f, Validation Accuracy : %.4f, Time : %.2f' % (epoch+1, epochs, train_loss/total, train_acc/total, val_loss, val_acc, time.monotonic()-start_time))

            # Save current model weights in current validation accuracy > last best validation accuracy 
            if val_acc >= best_val_acc:
                save_model(model, file_name + str('.pt'))
                best_val_acc = val_acc
                
    logs = {'train_loss': train_loss_, 
            'train_acc': train_acc_,
            'val_loss': val_loss_,
            'val_acc': val_acc_}
    
    # Save the logs file for visualizing learning in future
    with open(file_name + '_logs.pkl', 'wb') as file:
        pickle.dump(logs, file)
            
    return model
