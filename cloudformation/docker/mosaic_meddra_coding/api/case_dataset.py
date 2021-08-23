import collections
import json

import torch

from torch.utils.data import Dataset
from torchnlp.encoders.text import CharacterEncoder
from torchnlp.encoders import LabelEncoder


class CasesDataset(Dataset):
    '''
    A custom dataset object that encodes a tokenized text and its labels according to 
    the corresponding encoders 
    '''
    def __init__(self, json_data, text_encoder=None, label_encoder=None,
                 padding_length=128, mode='train'):
        '''
        Initialization

        Arguments:
        json: Json file containing the data. 
            Structure of json file:
            e.g: As Reported Terms: ['knee pain', 'severe headache']
                 Labels : ['Knee pain', 'Headache']
                 json: {'data' : [{'text': 'knee pain', 'label': 'Knee Pain'}, 
                                  {'text': 'severe headache', 'label':'Headache'}]
                        }
            Labels-required only when mode = 'train'
        text_encoder: encoder object that encodes tokens to their unique integer ids
        label_encoder: encoder object that encodes labels to their unique integer ids
        padding_length: length of padded tensor
        vocab: external vocabulary used to intialize the text encoder. If vocab = 
        None, it would be generated based on tokens from the datasets provided
        mode: 'train' or 'inference': in case of mode == 'inference', the dataset 
        object skips the labels
        '''
        

        # Save data to the object
        self.data = json_data
        assert 'data' in self.data

        self.mode = mode
        self.padding_length = padding_length


        # Define text encoder
        if text_encoder:
            self._text_encoder = text_encoder
            self._vocab = self.text_encoder.vocab
        else:
            self._text_encoder = CharacterEncoder([sample['text'] for sample in self.data['data']])

        self._vocab_size = self._text_encoder.vocab_size

        
        # Define label encoder
        if self.mode == 'train':            
            if label_encoder:
                self._label_encoder = label_encoder
            else:
                self._label_encoder = LabelEncoder([sample['label'] for sample in self.data['data']])       
            
            self._label_size = self._label_encoder.vocab_size
        else:
            self._label_encoder = None
            self._label_size = None
        
    
    def __len__(self):
        '''
        Size of dataset
        '''
        return len(self.data['data'])
    
    def __getitem__(self, idx):
        '''
        Extract item corresponding to idx'th index in data
        '''
        item = self.data['data'][idx]        

        if self.mode == 'train':
            return self._text_encoder.encode(item['text']), self._label_encoder.encode(item['label']).view(-1)
        else:
            return self._text_encoder.encode(item['text'])
    
    def split(self, x):
        '''
        Splits the text into tokens 
        '''
        return x.split()
    
    @property
    def vocab_size(self):
        '''
        Returns size of vocabulary obtained from data/text_encoder or specified vocabulary 
        '''
        return self._vocab_size

    @property
    def label_size(self):
        '''
        Returns unique count of labels obtained from label encoder
        '''
        return self._label_size

    @property
    def text_encoder(self):
        '''
        Returns the text encoder object
        '''
        return self._text_encoder

    @property
    def label_encoder(self):
        '''
        Returns the label encoder object
        '''
        return self._label_encoder

    @property
    def vocab(self):
        '''
        Returns vocabulary
        '''
        return self._text_encoder.vocab   
        
    
    def collate_fn(self, batch, padding=True):
        """
        Collate function needs to be passed to the pytorch dataloader
        Returns:
        input_seqs: padded sequence tensor for the batch 
        labels: tensor containing labels for the batch
        """
        if self.mode == 'train':
            input_seqs, labels = zip(*batch)
            labels = torch.cat(labels)
        else:
            input_seqs = batch
        
        if isinstance(input_seqs, collections.Sequence):
            
            if padding:
                input_seqs = self.stack_pad_tensors(input_seqs, padding_length=self.padding_length)
            
            if self.mode == 'train':
                return input_seqs, labels
            else:
                return input_seqs
        else:
            return batch


    def stack_pad_tensors(self, batch, padding_index=0, padding_length=128, dim=0):
        """ Pad a :class:`list` of ``tensors`` (``batch``) with ``padding_index``.

        Args:
            batch (:class:`list` of :class:`torch.Tensor`): Batch of tensors to pad.
            padding_index (int, optional): Index to pad tensors with.
            padding_length: length of padded tensor
            dim (int, optional): Dimension on to which to concatenate the batch of tensors.

        Returns
            torch.Tensor, torch.Tensor: Padded tensors 
        """

        max_len = padding_length
        padded = [self.pad_tensor(tensor, max_len, padding_index) for tensor in batch]

        padded = torch.stack(padded, dim=dim).contiguous()

        return padded


    def pad_tensor(self, tensor, length, padding_index=0):            
        """ Pad a ``tensor`` to ``length`` with ``padding_index``.

        Args:
            tensor (torch.Tensor [n, ...]): Tensor to pad.
            length (int): Pad the ``tensor`` up to ``length``.
            padding_index (int, optional): Index to pad tensor with.

        Returns
            (torch.Tensor [length, ...]) Padded Tensor.
        """
        n_padding = length - tensor.shape[0]

        if n_padding == 0:
            return tensor
        elif n_padding < 0:
            return tensor[:n_padding]
        else:          
            if (n_padding % 2) == 0:
                pre_padding = tensor.new(n_padding//2, *tensor.shape[1:]).fill_(padding_index)
                post_padding = pre_padding
            else:
                n_pre_pads = n_padding//2
                pre_padding = tensor.new(n_pre_pads, *tensor.shape[1:]).fill_(padding_index)
                post_padding = tensor.new(n_padding - n_pre_pads, *tensor.shape[1:]).fill_(padding_index)

            return torch.cat((pre_padding, tensor, post_padding), dim=0)


    @classmethod
    def fromJsonFile(cls, json_file, text_encoder=None, label_encoder=None, padding_length=128, mode='train'):
        '''
        Read data from json file
        
        Arguments:
        json_file: string specifying location to json_file
        '''
        with open(json_file, 'r') as f:
            json_data = json.load(f)

        return cls(json_data, text_encoder, label_encoder, padding_length, mode)
    