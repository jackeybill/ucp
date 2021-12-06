aws-vault exec main -- sam package --template-file .\codepipeline.yaml --output-template-file package.yaml --s3-bucket ucp-dev-for-testing-bucket5-1gtwhhhnxe8of

aws-vault exec main -- sam deploy --template-file package.yaml --stack-name dhair2-demo-pipeline --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset --region us-east-2