#!/bin/bash
set -e

# Build image
docker buildx build \
  --platform linux/amd64 \
  -f docker/Dockerfile \
  -t $IMAGE_NAME:$IMAGE_TAG \
  .



# Tag image
docker tag $IMAGE_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:$IMAGE_TAG

# Login ECR
aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | \
docker login --username AWS --password-stdin $ECR_REPO

# Push image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:$IMAGE_TAG