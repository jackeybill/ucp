#!/bin/bash
cd ./api/app/
pipenv run gunicorn --bind 0.0.0.0:8080 main:app