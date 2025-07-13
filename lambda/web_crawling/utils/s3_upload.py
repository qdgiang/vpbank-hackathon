import os
import logging
import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "ap-southeast-2"))

def upload_text(bucket: str, key: str, text: str, content_type: str = "text/plain; charset=utf-8") -> None:
    try:
        logger.info(f"Uploading to s3://{bucket}/{key}")
        _s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=text.encode("utf-8"),
            ContentType=content_type
        )
        logger.info("Upload succeeded.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"Failed to upload s3://{bucket}/{key}: {e}")
        raise
