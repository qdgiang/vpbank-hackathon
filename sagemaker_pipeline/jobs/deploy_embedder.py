# create_endpoint.py
"""
Tạo endpoint sentence‑transformers/paraphrase‑MiniLM‑L6‑v2
Chọn kiểu realtime (ml.m5.large) hoặc serverless.
"""
import os
import sagemaker
import boto3
import logging
from sagemaker.huggingface import HuggingFaceModel
from sagemaker.serverless import ServerlessInferenceConfig

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# --------- THAM SỐ CẦN SỬA -------------
ROLE_ARN = os.getenv("SAGEMAKER_ROLE")
REGION   = os.getenv("AWS_REGION")
ENDPOINT_NAME = "sentence-embed-endpoint-v1"
USE_SERVERLESS = True                    # True = serverless, False = realtime

# ---------------------------------------
boto_session = boto3.Session(
    profile_name=os.getenv("AWS_PROFILE"),
    region_name=os.getenv("AWS_REGION")
)
sagemaker_session = sagemaker.Session(boto_session=boto_session)
logger.info('Created SageMaker Session')
hf_model = HuggingFaceModel(
    env={
        "HF_MODEL_ID":    "sentence-transformers/paraphrase-MiniLM-L6-v2",
        "HF_TASK":        "feature-extraction"
    },
    role=ROLE_ARN,
    sagemaker_session=sagemaker_session,
    transformers_version="4.26",
    pytorch_version="1.13",
    py_version="py39"
)

if USE_SERVERLESS:
    serverless_cfg = ServerlessInferenceConfig(
        memory_size_in_mb=2048,   # 2 GB, 4 GB, 8 GB…
        max_concurrency=5
    )
    predictor = hf_model.deploy(
        serverless_inference_config=serverless_cfg,
        endpoint_name=ENDPOINT_NAME
    )
else:
    predictor = hf_model.deploy(
        initial_instance_count=1,
        instance_type="ml.m5.large",   # có thể đổi sang ml.t3.medium để tiết kiệm
        endpoint_name=ENDPOINT_NAME
    )

print(f"✅ Đã tạo endpoint: {ENDPOINT_NAME}")
print("Gọi thử: python test_endpoint.py")
