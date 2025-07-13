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
        instance_type='ml.m5.xlarge',
        instance_count=1,
        sagemaker_session=sagemaker_session
    )

    # Submit job
    INPUT_LOCAL_DIR = "/opt/ml/processing/input/raw-data/"
    OUTPUT_LOCAL_DIR = "/opt/ml/processing/output/"
    INPUT_S3_URI = "s3://test-vpb-hackathon/raw/"
    OUTPUT_S3_URI ="s3://test-vpb-hackathon/preprocessed/"

    processor.run(
        code='etl_job/data_preprocess.py',
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
            "--users_file", "synthetic_users.csv"
        ]
    )

    logger.info("Job submitted ✔  Theo dõi CloudWatch Logs để xem tiến trình.")

if __name__ == '__main__':
    main()