from collections import OrderedDict

import torch
import torch.nn as nn


class ConvLayer(nn.Module):
    '''
    Applies a 1D convolution with 'same' padding over an input signal composed of several input planes.

    Arguments:
    in_channels : no. of input channels
    out_channels : no. of output channels
    kernel_size : size of convolving kernel

    Shape:
    input: (batch, in_channels, width)
    output: (batch, out_channels, width) 
    '''
    def __init__(self, in_channels, out_channels, kernel_size):

        super(ConvLayer, self).__init__()

        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = kernel_size
        self.padding = self.get_padding()

        self.conv = nn.Conv1d(self.in_channels, self.out_channels, self.kernel_size, padding=self.padding)

        self.relu = nn.ReLU()

    def forward(self, x):
        # Carries forward propogation through the 1D Convolution followed by global maxpooling and relu activation
        output = self.conv(x)
        output, _ = output.max(dim=-1)
        output = self.relu(output)

        return output

    def get_padding(self, dilation=1):
        '''
        Calculates the amount of implicit zero-paddings needed for 'same' padding.
        '''
        padding = (dilation*(self.kernel_size - 1))//2
        
        return padding


class LinearLayer(nn.Sequential):
    '''
    Carries a sequential operation of applying linear transformation to the incoming data followed by relu activation and dropout

    Arguments: 
    in_dim : no. of input dimensions
    out_dim : no. of output dimension
    p : dropout probability
    '''

    def __init__(self, in_dim, out_dim, p=0.25):

        super(LinearLayer, self).__init__()

        self.in_dim = in_dim
        self.out_dim = out_dim
        self.dropout_prob = p
        
        self.add_module('linear', nn.Linear(self.in_dim, self.out_dim, bias=True))
        self.add_module('activation', nn.ReLU())
        self.add_module('dropout', nn.Dropout(p=self.dropout_prob))

    def forward(self, x): 

        # Carries forward propogation through the sequential module
        output = super().forward(x)

        return output


class CNNClassifier(nn.Module):
    '''
    Creates a classifier object consisting of :
    1) Embeddings Layer
    2) Wide network of 1D Convolutions
    3) Fully Connected Layers

    Arguments:
    emb_size: a tuple to initialize embedding layer : vocab_size X embedding_dimension
    n_filters: list consisting of number of filters for each convolution
    kernel_sizes: list consisting of convolving kernel sizes for each convolution
    dense_layer_sizes: list containing sizes(number of neurons) of the dense layers. Also used to determine the number of dense layers in the architecture
    num_classes: total number of end classes
    dropout_prob: dropout probability, Default: 0.25
    '''
    def __init__(self, emb_size, n_filters, kernel_sizes, dense_layer_sizes, num_classes, dropout_prob=0.25):

        super(CNNClassifier, self).__init__()

        self.vocab = emb_size[0]
        self.emb_dim = emb_size[1]
        self.n_filters = n_filters
        self.kernel_sizes = kernel_sizes
        self.dense_layer_sizes = dense_layer_sizes
        self.dropout_prob = dropout_prob
        self.num_classes = num_classes

        
        assert len(self.n_filters) == len(self.kernel_sizes), 'Unequal lengths of "n_filters" and "kernel_sizes"'


        self.embedding = nn.Embedding(self.vocab, self.emb_dim)

        
        self.conv_layers = nn.ModuleList()

        for idx, value in enumerate(self.n_filters):
            self.conv_layers.append(ConvLayer(self.emb_dim, value, self.kernel_sizes[idx]))


        self.dense_sizes = []
        for idx, _ in enumerate(dense_layer_sizes):
            self.dense_sizes.append({'dense_input_' + str(idx) : sum(self.n_filters) if idx == 0 else dense_layer_sizes[idx-1],
                                     'dense_output_' + str(idx) : dense_layer_sizes[idx]})


        dense_layers = []
        for idx, value in enumerate(self.dense_sizes):
            dense_layers.append(('fc' + str(idx), LinearLayer(value['dense_input_' + str(idx)], value['dense_output_' + str(idx)], p=self.dropout_prob)))

        self.dense_layers = nn.Sequential(OrderedDict(dense_layers))


        self.last_dense_layer = nn.Linear(self.dense_sizes[-1]['dense_output_' + str(len(self.dense_sizes)-1)], self.num_classes, bias=True)

        self.dropout = nn.Dropout(p=self.dropout_prob)

        self.relu = nn.ReLU()

    def forward(self, x):

        output = self.embedding(x)
        output = output.transpose(1, 2)

        output = torch.cat([layer(output) for layer in self.conv_layers], dim=-1)
        output = self.dropout(output)

        output = self.dense_layers(output)

        output = self.last_dense_layer(output)

        return output

    
class TextEncoder():
    '''
    Encodes text to a padded tensor. Used during inference.

    Arguments:
    text_encoder : encoder object that encodes text to a tensor of integer ids
    padding_index : padding_index (int, optional): Index to pad tensors with
    padding_length: length of padded tensor
    '''
    def __init__(self, text_encoder, padding_index=0, padding_length=128):
        
        self._encoder = text_encoder
        self.padding_index = padding_index
        self.padding_length = padding_length
        

    def _encode(self, text):
        '''
        Encodes a single text to a tensor of integer ids

        Arguments:
        text : text to be encoded
        '''
        return self._encoder.encode(text)
    

    def batch_encode(self, batch):  
        '''
        Encodes batch of texts to padded tensors

        Arguments:
        batch : batch of texts
        '''      
        return self.stack_pad_tensors(list(map(self._encode, batch)), self.padding_index, self.padding_length)        
    

    def stack_pad_tensors(self, batch, padding_index=0, padding_length=128, dim=0):
        """ Pad a :class:`list` of ``tensors`` (``batch``) with ``padding_index``.

        Args:
            batch (:class:`list` of :class:`torch.Tensor`): Batch of tensors to pad.
            padding_index (int, optional): Index to pad tensors with.
            dim (int, optional): Dimension on to which to concatenate the batch of tensors.

        Returns
            torch.Tensor, torch.Tensor: Padded tensors and original lengths of tensors.
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
    