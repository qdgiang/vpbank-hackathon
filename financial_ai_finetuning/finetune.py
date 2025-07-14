import os
import uuid
import time
import boto3
from botocore.exceptions import ClientError
import logging
import warnings
warnings.filterwarnings("ignore")
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[logging.StreamHandler(), logging.FileHandler("./logs/finetune.log", mode='a', encoding='utf-8')])
logger = logging.getLogger(__name__)

REGION = os.getenv("AWS_REGION", "us-west-2")
BASE_MODEL_IDENTIFIER = os.getenv("BASE_MODEL_IDENTIFIER", "")
ROLE_ARN = os.getenv("ROLE_ARN", "")
S3_TRAINING_URI = os.getenv("S3_TRAINING_URI", "")
S3_OUTPUT_URI = os.getenv("S3_OUTPUT_URI", "")

# Generate unique names
job_name = f"finetune-job-coaching"
custom_model_name = f"finetune-jar-coach"

# Hyperparameters
hyperparams = {
    "epochCount": "8",
    "batchSize": "1",
    "learningRate": "0.0001"
}

# Initialize Bedrock client
bedrock = boto3.client("bedrock", region_name=REGION)

def create_job():
    try:
        response = bedrock.create_model_customization_job(
            jobName=job_name,                            
            customModelName=custom_model_name,      
            roleArn=ROLE_ARN,                            
            baseModelIdentifier=BASE_MODEL_IDENTIFIER,    
            customizationType="FINE_TUNING",             
            hyperParameters=hyperparams,                 
            trainingDataConfig={"s3Uri": S3_TRAINING_URI},  
            outputDataConfig={"s3Uri": S3_OUTPUT_URI}  
        )
        logger.info(f"Submitted fine-tuning job: {response['jobArn']}")
        return response["jobArn"]
    except ClientError as e:
        logger.info(f"Error creating customization job: {e}")
        raise

def wait_for_completion(job_arn, interval=60):
    logger.info("Waiting for job to complete…")
    while True:
        resp = bedrock.get_model_customization_job(jobIdentifier=job_arn)
        status = resp["status"]
        logger.info(f"Status: {status}")
        if status in ("COMPLETED", "FAILED"):
            return resp
        time.sleep(interval)

if __name__ == "__main__":
    arn = create_job()
    result = wait_for_completion(arn)
    if result["status"] == "COMPLETED":
        logger.info(f"Fine-tuning successful! Custom model ARN: {result['customModelArn']}")
    else:
        logger.info(f"Fine-tuning failed: {result.get('failureMessage')}")
