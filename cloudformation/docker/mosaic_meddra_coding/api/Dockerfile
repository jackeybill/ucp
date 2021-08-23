FROM ubuntu:18.04
RUN apt-get -y update && apt-get install -y --no-install-recommends \
         wget \
         python3.6 \
         python3-distutils \
         python3-apt \
         nginx
RUN wget --no-check-certificate https://bootstrap.pypa.io/get-pip.py && python3 get-pip.py

COPY ./requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

COPY ./app /app
COPY case_dataset.py /usr/local/bin
COPY classifier.py /usr/local/bin
COPY config.py /usr/local/bin
COPY autocoding_utils.py /usr/local/bin
COPY nginx.conf /usr/local/bin
COPY predictor.py /usr/local/bin
COPY wsgi.py /usr/local/bin


COPY serve /usr/local/bin
COPY train /usr/local/bin

RUN chmod +x /usr/local/bin/serve
RUN chmod +x /usr/local/bin/train