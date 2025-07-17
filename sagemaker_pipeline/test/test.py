import sys
import os
import argparse
import json
import boto3
import pandas as pd
import numpy as np
import joblib
import logging
import itertools, math
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping
from concurrent.futures import ThreadPoolExecutor, as_completed
from sagemaker.feature_store.feature_group import FeatureGroup
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report


EMBED_DIM = 64
fs_runtime = boto3.client(
    "sagemaker-featurestore-runtime",
    region_name='ap-southeast-2'
)

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

# texts = ["Tôi thích học sâu","Một cái chuỗi để test"]
# vectors = embed_batch(texts, "sentence-embed-endpoint-v1")
# print(len(vectors))         # 2
# print(len(vectors[0]))     # (384,)

def batch_fetch_embeddings(user_ids):
    """
    Fetch embeddings for a list (<=25) of user_ids via batch_get_record.
    Returns {user_id: np.ndarray}.
    """
    records = {
        "FeatureGroupName": "user-embeddings",
        "RecordIdentifiersValueAsString": user_ids,
        "FeatureNames": ["embedding"]
    }

    resp = fs_runtime.batch_get_record(Identifiers=[records])
    result = {}

    for uid, rec in zip(user_ids, resp["Records"]):
        if rec["Record"]:
            raw = rec["Record"][0]["ValueAsString"]
            raw = raw.strip("[]")
            vec = np.fromstring(raw, sep=",", dtype=np.float32)
            if vec.size != EMBED_DIM:
                logger.warning(f"Bad length ({vec.size}) for user {uid}")
                vec = np.zeros(EMBED_DIM, dtype=np.float32)
        else:
            vec = np.zeros(EMBED_DIM, dtype=np.float32)
        result[uid] = vec
    return result

df = pd.read_csv("s3://smart-jarvis-sagemaker/features/preprocessed_features.csv")
df = df[df["user_id"].notna()]
df = df[df['tranx_type'].isin({'transfer_out', 'qrcode_payment', 'atm_withdrawal'})]
cols_to_drop = ['msg_content', 'merchant', 'to_account_name', 'channel', 'location',
                'is_manual_override', 'created_at', 'updated_at', 'amount_log', 'hour','dayofweek',
                'tranx_type', 'txn_time', 'tranx_type_bill_payment', 'tranx_type_cashback',
                'tranx_type_loan_repayment','tranx_type_mobile_topup','tranx_type_opensaving',
                'tranx_type_stock','tranx_type_transfer_in', 'text_joined']
df = df.drop(cols_to_drop, axis=1)

# Handle text embedding
df["embedding_list"] = df["sentence_embedding"].apply(json.loads)
embedding_df = pd.DataFrame(df["embedding_list"].tolist())
df = pd.concat([df, embedding_df], axis=1)
df.drop(columns=["sentence_embedding", "embedding_list"], inplace=True)

# Merge with user_emb
unique_uids = df["user_id"].unique()
print(len(unique_uids))
unique_uids = (
    pd.Series(unique_uids)                # chấp nhận cả list, np.ndarray
      .dropna()                        # loại float('nan')
      .astype(str)                     # ép về chuỗi
      .loc[lambda s: s.str.lower() != "nan"]  # loại chuỗi 'nan'
      .tolist()                        # chuyển thành list
)
print(len(unique_uids))
uid_to_vec = batch_fetch_embeddings(unique_uids)
for uid, vec in uid_to_vec.items():
    if len(vec) != 64: print(f"{uid} - {len(vec)}")

