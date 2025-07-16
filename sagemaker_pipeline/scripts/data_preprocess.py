import os
import sys
import argparse
import boto3
import pandas as pd
import numpy as np
import logging
import re
import json
import joblib
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from modules.text_embedder import FastTextEmbedder

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ----- CONFIG -----------
SELECTED_COLS = ['transaction_id', 'user_id', 'amount', 'txn_time', 'msg_content',
               'merchant', 'to_account_name', 'tranx_type', 'category_label',
               'channel', 'location']
FILTERED_COLS = ['tranx_type', 'category_label']
SELECTED_CATEGORIES = ['NEC', 'FFA', 'PLAY', 'EDU', 'GIVE']
SELECTED_TRANX_TYPES = ['transfer_out', 'qrcode_payment', 'atm_withdrawal']
ID_COLS = ['transaction_id', 'user_id']
STRUCTURED_COLS = ['amount', 'txn_time', 'tranx_type', 'channel', 'location']
TEXT_COLS = ['msg_content', 'merchant', 'to_account_name']
LABEL = 'category_label'

# ---------- HELPER FUNCTIONS --------
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
    raw = json.loads(resp["Body"].read())
    vectors = [np.mean(item[0], axis=0).tolist() for item in raw]
    return vectors


def write_basic_metadata(df: pd.DataFrame, json_path: str):
    metadata = {
        "num_rows": df.shape[0],
        "num_columns": df.shape[1],
        "columns": [
            {"name": col, "dtype": str(df[col].dtype)}
            for col in df.columns
        ]
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

# ----- PROCESSING DATA FUNCTIONS -----
def get_structured_features(features, args):
    # Handle amount
    features['amount_log'] = np.log1p(features['amount'])
    scaler = StandardScaler()
    features['amount_scaled'] = scaler.fit_transform(features[['amount_log']])

    # Handle txn_time
    features['txn_time'] = pd.to_datetime(features['txn_time'])
    features['hour'] = features['txn_time'].dt.hour
    features['day_of_month'] = features['txn_time'].dt.day
    features['dayofweek'] = features['txn_time'].dt.dayofweek
    features['is_weekend'] = features['dayofweek'].isin([5, 6]).astype(int)
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    features['dow_sin'] = np.sin(2 * np.pi * features['dayofweek'] / 7)
    features['dow_cos'] = np.cos(2 * np.pi * features['dayofweek'] / 7)

    # Handle categorical features: tranx_type, channel, location
    ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    oh_cols = ['tranx_type', 'channel']
    X_cat = ohe.fit_transform(features[oh_cols])
    ohe_feature_names = ohe.get_feature_names_out(oh_cols)
    df_cat_encoded = pd.DataFrame(X_cat, columns=ohe_feature_names, index=features.index)
    features = pd.concat([features, df_cat_encoded], axis=1)

    le = LabelEncoder()
    features['location_idx'] = le.fit_transform(features['location'])

    # Save preprocessors
    preprocessors_dir = os.path.join(args.output_dir, "preprocessors")
    os.makedirs(preprocessors_dir, exist_ok=True)
    if scaler:
        joblib.dump(scaler, os.path.join(preprocessors_dir, "scaler.pkl"))
    if ohe:
        joblib.dump(ohe, os.path.join(preprocessors_dir, "ohe.pkl"))
    if le:
        joblib.dump(le, os.path.join(preprocessors_dir, "le.pkl"))

    # Get final features dataframe
    logger.info(f' ✔ Feature engineering: structured features - {features.shape}')
    return features

def get_text_embedding(df, embed_endpoint_name, batch_size: int = 64):
    """
    :param df:
    :return:
    """
    df["text_joined"] = (
        df[TEXT_COLS]
        .fillna("")
        .agg(" ".join, axis=1)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )
    all_embeddings: list[list[float]] = []
    n = len(df)
    for batch_idx, start in enumerate(range(0, n, batch_size), 1):
        end = min(start + batch_size, n)
        logger.info("🟢 Batch %d– embedding rows [%d:%d)", batch_idx, start, end)
        chunk = df["text_joined"].iloc[start:end].tolist()
        embeddings = embed_batch(chunk, embed_endpoint_name)
        all_embeddings.extend(embeddings)

    df["sentence_embedding"] = [json.dumps(vec) for vec in all_embeddings]

    logger.info(f' ✔ Feature engineering: text embedding features - {df.shape}')
    return df

# ------ MAIN ---------
def main():
    # Read data
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir",  default="/opt/ml/processing/input/raw-data/")
    parser.add_argument("--output_dir", default="/opt/ml/processing/output/")
    parser.add_argument("--trans_file", default="synthetic_transactions.csv")
    parser.add_argument("--embed_endpoint_name", default="sentence-embed-endpoint-v1")
    args = parser.parse_args()

    src_path = os.path.join(args.input_dir, args.trans_file)
    trans_df = pd.read_csv(src_path)
    logger.info(f' ✔ Loaded transactions - {trans_df.shape}')


    # Get structured_df and save to file
    df = get_structured_features(trans_df, args)
    df = get_text_embedding(df, args.embed_endpoint_name)

    dst_path = os.path.join(args.output_dir, "preprocessed_features.csv")
    df.to_csv(dst_path, index=False)

    dst_path = os.path.join(args.output_dir, "features_metadata.json")
    write_basic_metadata(df, dst_path)

    logger.info(' ✔ Data processing is DONE')

if __name__ == "__main__":
    main()
