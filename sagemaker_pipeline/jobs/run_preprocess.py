import os
import sys
import logging
from sagemaker.processing import ScriptProcessor, ProcessingInput, ProcessingOutput
from sagemaker import get_execution_role, Session
import boto3

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Config AWS
AWS_PROFILE = os.getenv("AWS_PROFILE")
AWS_REGION = os.getenv("AWS_REGION")
SAGEMAKER_ROLE = os.getenv("SAGEMAKER_ROLE")
IMAGE_URI = os.getenv("IMAGE_URI")
SAGEMAKER_INSTANCE = os.getenv("SAGEMAKER_JOB_INSTANCE")

INPUT_LOCAL_DIR = "/opt/ml/processing/input/raw-data/"
OUTPUT_LOCAL_DIR = "/opt/ml/processing/output/"
S3_BUCKET = os.getenv("S3_BUCKET")
INPUT_S3_URI = f"s3://{S3_BUCKET}/{os.getenv('S3_RAW_KEY')}"
OUTPUT_S3_URI = f"s3://{S3_BUCKET}/{os.getenv('S3_FEATURES_KEY')}"

def main():
    # Create session
    boto_session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
    sagemaker_session = Session(boto_session=boto_session)

    # Create processor
    processor = ScriptProcessor(
        image_uri=IMAGE_URI,
        command=["python3"],
        role=SAGEMAKER_ROLE,
        instance_type=SAGEMAKER_INSTANCE,
        instance_count=1,
        base_job_name="data-preprocess",
        sagemaker_session=sagemaker_session
    )

    # Submit job
    processor.run(
        code='scripts/data_preprocess.py',
        inputs=[
            ProcessingInput(
                source=INPUT_S3_URI,
                destination=INPUT_LOCAL_DIR,
                input_name="raw-data"
            )
        ],
        outputs=[
            ProcessingOutput(
                source=OUTPUT_LOCAL_DIR,
                destination=OUTPUT_S3_URI,
                output_name="clean-data"
            )
        ],
        arguments=[
            "--trans_file", "synthetic_transactions.csv",
            "--embed_endpoint_name", os.getenv("EMBEDDER_ENDPOINT_NAME")
        ]
    )

    logger.info("Job submitted ✔  Theo dõi CloudWatch Logs để xem tiến trình.")

if __name__ == '__main__':
    main()