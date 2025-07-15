import json
import os
import boto3
import logging
from datetime import datetime
import time

# Set timezone
os.environ["TZ"] = "Asia/Ho_Chi_Minh"
time.tzset()

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[
                        logging.StreamHandler()
                    ])
logger = logging.getLogger(__name__)

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=os.environ.get("AWS_REGION", "ap-southeast-2"))
sagemaker_client = boto3.client('sagemaker', region_name=os.environ.get("AWS_REGION", "ap-southeast-2"))

def handler(event, context):
    """
    Lambda function handler for phuong_test
    Demonstrates S3 and SageMaker interactions
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Example S3 operation - list buckets
        s3_response = s3_client.list_buckets()
        bucket_count = len(s3_response['Buckets'])
        logger.info(f"Found {bucket_count} S3 buckets")
        
        # Example SageMaker operation - list endpoints
        sagemaker_response = sagemaker_client.list_endpoints()
        endpoint_count = len(sagemaker_response['Endpoints'])
        logger.info(f"Found {endpoint_count} SageMaker endpoints")
        
        # Prepare response
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'phuong_test lambda executed successfully',
                'timestamp': datetime.now().isoformat(),
                's3_buckets_count': bucket_count,
                'sagemaker_endpoints_count': endpoint_count,
                'event': event
            })
        }
        
        logger.info("Function executed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Error in lambda function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Lambda function failed',
                'timestamp': datetime.now().isoformat()
            })
        }
