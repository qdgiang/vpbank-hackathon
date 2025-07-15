import os
import logging
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv
load_dotenv()

BUCKET = os.getenv("BUCKET", "vpb-bedrock-finetune")
PREFIX = os.getenv("PREFIX", "vpbank-hackathon/jar_coaching_dataset")
LOCAL_PATH = os.getenv("LOCAL_PATH", "jar_coaching_dataset_convo.jsonl")
REGION = os.getenv("AWS_REGION", "us-west-2")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[logging.StreamHandler()])
logger = logging.getLogger(__name__)

_s3 = boto3.client("s3", region_name=REGION)

def ensure_bucket_exists(bucket: str, region: str = None) -> None:
    try:
        _s3.head_bucket(Bucket=bucket)
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            logger.info(f"Bucket {bucket} does not exist. Creating it.")
            _s3.create_bucket(Bucket=bucket, CreateBucketConfiguration={'LocationConstraint': region})
        else:
            logger.error(f"Error checking bucket {bucket}: {e}")
            raise

def upload_file(bucket: str, key: str, file_path: str, content_type: str = None) -> None:
    # ensure_bucket_exists(bucket, region)
    try:
        logger.info(f"Uploading {file_path} to s3://{bucket}/{key}")
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        _s3.upload_file(
            Filename=file_path,
            Bucket=bucket,
            Key=key,
            ExtraArgs=extra_args
        )
        logger.info("Upload succeeded.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"Failed to upload s3://{bucket}/{key}: {e}")
        raise

if __name__ == "__main__":
    try:
        upload_file(
            bucket=BUCKET,
            key=f"{PREFIX}/{LOCAL_PATH}",
            file_path=LOCAL_PATH,
            content_type="application/json"
        )
    except Exception as e:
        logger.error(f"An error occurred during upload: {e}")