import os
import sys
import argparse
import boto3
import fasttext
import pandas as pd
import numpy as np
import logging
import re
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from modules.text_embedder import FastTextEmbedder

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ----- CONFIG FASTTEXT MODEL -----
def walk_dir(path):
    try:
        for root, dirs, files in os.walk(path):
            print(f"\n📁 {root}")
            for f in files:
                print(f"    - {f}")
    except Exception as e:
        print(f"❌ Failed to walk {path}: {e}")

def get_model_path(s3_uri: str, local_dir: str = "/app/models") -> str:
    """
    Download a FastText .bin model from S3 and return the local file path.
    """
    bucket, key = s3_uri.replace("s3://", "").split("/", 1)
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join(local_dir, os.path.basename(key))
    boto3.client("s3").download_file(bucket, key, local_path)
    return local_path

# ----- CONFIG -----------
MODEL_S3_URI = "s3://test-vpb-hackathon/models/cc.vi.300.bin"
SELECTED_COLS = ['transaction_id', 'user_id', 'amount', 'txn_time', 'msg_content',
               'merchant', 'to_account_name', 'tranx_type', 'category_label',
               'channel', 'location']
SELECTED_CATEGORIES = ['NEC', 'FFA', 'PLAY', 'EDU', 'GIVE']
SELECTED_TRANX_TYPES = ['transfer_out', 'qrcode_payment', 'atm_withdrawal']
ID_COLS = ['transaction_id', 'user_id']
STRUCTURED_COLS = ['amount', 'txn_time', 'tranx_type', 'channel', 'location']
TEXT_COLS = ['msg_content', 'merchant', 'to_account_name']
LABEL = 'category_label'

# ----- PROCESSING DATA FUNCTIONS -----
def filtered_transactions(df):
    df = df[SELECTED_COLS]
    df = df[df['category_label'].isin(SELECTED_CATEGORIES)]
    df = df[df['tranx_type'].isin(SELECTED_TRANX_TYPES)].copy()
    logger.info(f' ✔ Filtered transactions - {df.shape}')
    return df


def get_structured_features(df):
    features = df[ID_COLS + STRUCTURED_COLS].copy()

    # Handle amount
    features['amount_log'] = np.log1p(features['amount'])
    scaler = StandardScaler()
    features['amount_scaled'] = scaler.fit_transform(features[['amount_log']])
    amount_features = ['amount_scaled']

    # Handle txn_time
    features['txn_time'] = pd.to_datetime(df['txn_time'])
    features['hour'] = features['txn_time'].dt.hour
    features['dayofweek'] = features['txn_time'].dt.dayofweek
    features['is_weekend'] = features['dayofweek'].isin([5, 6]).astype(int)
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    features['dow_sin'] = np.sin(2 * np.pi * features['dayofweek'] / 7)
    features['dow_cos'] = np.cos(2 * np.pi * features['dayofweek'] / 7)
    time_features = ['hour_sin', 'hour_cos', 'dow_sin', 'dow_cos', 'is_weekend']

    # Handle categorical features: tranx_type, channel, location
    ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    oh_cols = ['tranx_type', 'channel']
    X_cat = ohe.fit_transform(features[oh_cols])
    ohe_feature_names = ohe.get_feature_names_out(oh_cols)
    df_cat_encoded = pd.DataFrame(X_cat, columns=ohe_feature_names, index=df.index)
    features = pd.concat([features, df_cat_encoded], axis=1)
    oh_features = list(ohe_feature_names)

    le = LabelEncoder()
    features['location_idx'] = le.fit_transform(features['location'])
    lb_features = ['location_idx']

    # Get final features dataframe
    selected_features = amount_features + time_features + oh_features + lb_features
    features = features[ID_COLS + selected_features].copy()
    logger.info(f' ✔ Feature engineering: structured features - {features.shape}')
    return features

def get_text_embedding(df):
    """
    :param df:
    :return:
    """
    model_path = get_model_path(MODEL_S3_URI)
    embedder = FastTextEmbedder(model_path)
    emb_df = embedder.embed_dataframe(df, text_cols=TEXT_COLS)
    logger.info(f' ✔ Feature engineering: text embedding features - {emb_df.shape}')
    return emb_df

# ------ MAIN ---------
def main():
    # Check container
    #print("\n🌿 PYTHONPATH:", os.environ.get("PYTHONPATH", "Not Set"))
    #print("\n📂 Tree of /opt/program")
    #walk_dir("/opt")

    # Read data
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir",  default="/opt/ml/processing/input/raw-data/")
    parser.add_argument("--output_dir", default="/opt/ml/processing/output/")
    parser.add_argument("--trans_file", default="synthetic_transactions.csv")
    parser.add_argument("--users_file", default="synthetic_users.csv")
    args = parser.parse_args()

    src_path = os.path.join(args.input_dir, args.trans_file)
    trans_df = pd.read_csv(src_path)
    logger.info(f' ✔ Loaded transactions - {trans_df.shape}')

    src_path = os.path.join(args.input_dir, args.users_file)
    users_df = pd.read_csv(src_path)
    logger.info(f' ✔ Loaded users - {users_df.shape}')

    # Process data
    trans_df = filtered_transactions(trans_df)

    # Get structured_df and save to file
    structured_df = get_structured_features(trans_df)
    dst_path = os.path.join(args.output_dir, "structured_features.csv")
    structured_df.to_csv(dst_path, index=False)

    # Get text_emb_df and save to file
    text_df = get_text_embedding(trans_df)
    dst_path = os.path.join(args.output_dir, "text_features.csv")
    text_df.to_csv(dst_path, index=False)

if __name__ == "__main__":
    main()
