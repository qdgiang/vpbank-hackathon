# deploy_model.py
import os
import sys
import logging
import sagemaker
import boto3
from sagemaker.tensorflow import TensorFlowModel
from sagemaker.serializers import JSONSerializer
from sagemaker.deserializers import JSONDeserializer
from sagemaker.serverless import ServerlessInferenceConfig

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Config AWS
AWS_PROFILE = os.getenv("AWS_PROFILE")
AWS_REGION = os.getenv("AWS_REGION")
SAGEMAKER_ROLE = os.getenv("SAGEMAKER_ROLE")
IMAGE_URI = os.getenv("IMAGE_URI")
SAGEMAKER_INSTANCE = os.getenv("SAGEMAKER_JOB_INSTANCE")
S3_MODEL_PATH = os.getenv("S3_MODEL_PATH")
SAGEMAKER_ENDPOINT_NAME = os.getenv("SAGEMAKER_ENDPOINT_NAME")

def main():
    # Create session
    boto_session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
    sagemaker_session = sagemaker.Session(boto_session=boto_session)
    logger.info('✅ Created session')

    # Get model from S3
    model = TensorFlowModel(
        model_data=S3_MODEL_PATH,
        role=SAGEMAKER_ROLE,
        framework_version="2.14",
        sagemaker_session=sagemaker_session,
        entry_point='inference.py',
        source_dir='scripts'
    )
    logger.info('✅ Loaded model & inference')

    # Config Serverless Endpoint
    serverless_cfg = ServerlessInferenceConfig(
        memory_size_in_mb=2048,
        max_concurrency=5
    )
    predictor = model.deploy(
        endpoint_name=SAGEMAKER_ENDPOINT_NAME,
        serverless_inference_config = serverless_cfg,
        serializer=JSONSerializer(),
        deserializer=JSONDeserializer()
    )
    logger.info("✓ Serverless endpoint deployed: %s", predictor.endpoint_name)

if __name__ == '__main__':
    main()
