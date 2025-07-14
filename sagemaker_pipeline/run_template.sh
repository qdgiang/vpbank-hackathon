#!/bin/bash

# AWS config
export AWS_PROFILE=
export AWS_REGION=
export AWS_DEFAULT_REGION=
export AWS_ACCOUNT_ID=

# Docker/ECR settings
export IMAGE_NAME=
export IMAGE_TAG=
export ECR_REPO=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
export IMAGE_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}

# SageMaker
export SAGEMAKER_ROLE=

# Login AWS SSO
aws sso login --profile $AWS_PROFILE

# Build Docker & push image to ECR <only the first time>
chmod +x docker/*.sh
./docker/push_image.sh

python3 run_preprocess.py