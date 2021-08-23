#!/bin/bash
cd ./api/app
s2i build . centos/python-36-centos7 mosaic_autocoding_pytorch:1.0