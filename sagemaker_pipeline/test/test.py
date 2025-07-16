import json
import boto3
import numpy as np

sagemaker_client = boto3.client("sagemaker-runtime",
                                region_name="ap-southeast-2")

def embed_batch(texts: list[str], endpoint_name: str) -> list[list[float]]:
    """
    Nhận list câu, trả về list sentence‑vector (list[float]).
    Ở đây mình average token‑embedding luôn cho gọn.
    """
    payload = json.dumps({"inputs": texts})
    resp = sagemaker_client.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType="application/json",
        Body=payload
    )
    # response: [[[[tok_embs]]], ...] ‑> chọn tầng 0,0 như bạn làm
    raw = json.loads(resp["Body"].read())
    vectors = [np.mean(item[0], axis=0).tolist() for item in raw]
    return vectors # Mean-pool để lấy sentence vector

texts = ["Tôi thích học sâu","Một cái chuỗi để test"]
vectors = embed_batch(texts, "sentence-embed-endpoint-v1")
print(len(vectors))         # 2
print(len(vectors[0]))     # (384,)