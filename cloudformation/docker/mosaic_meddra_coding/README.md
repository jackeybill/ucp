# Mosaic MedDRA Coding

#### Automated MedDRA Coding of Adverse Events using deep learning

### Build docker image
In repo root:  
`sh ./tasks/build_image.sh`


### Run docker container locally at port 8080
In repo root:  
`sh ./tasks/run_api.sh`  

Run `docker ps` to verify the container is up and running


### Unit testing
In repo root:  
`sh ./tasks/test_flask.sh` 


### Integration testing
In repo root:  
`sh ./tasks/test_api.sh`  


### Stop docker container
`docker stop mosaic_autocoding_api`
