import sys
import os
import pandas as pd
import numpy as np
import json
import boto3
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
import joblib

BUCKET = os.getenv('S3_BUCKET')
AWS_PROFILE = os.getenv('AWS_PROFILE')
AWS_REGION = os.getenv('AWS_REGION')

def save_amt_standard_scaler(df, output_path):
    df['amount_log'] = np.log1p(df['amount'])
    scaler = StandardScaler()
    joblib.dump(scaler, output_path)

def save_label2id(output_path):
    label2id = {
        'NEC': 0,
        'FFA': 1,
        'PLAY': 2,
        'EDU': 3,
        'GIVE': 4,
        'LTSS': 5
    }
    with open(output_path, 'w') as f:
        json.dump(label2id, f)

def save_onehot_encoder(df, output_path):
    ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    oh_cols = ['tranx_type', 'channel']
    X_cat = ohe.fit_transform(df[oh_cols])
    joblib.dump(ohe, output_path)

def save_location_label_encoder(df, output_path):
    le = LabelEncoder()
    df['location_idx'] = le.fit_transform(df['location'])
    joblib.dump(le, output_path)

def upload_to_s3(s3_client, local_path, bucket_name, s3_key):
    s3_client.upload_file(local_path, bucket_name, s3_key)
    print(f"✅ Uploaded {local_path} to s3://{bucket_name}/{s3_key}")

if __name__ == '__main__':
    # Read data
    df_raw = pd.read_csv('test/data/synthetic_transactions.csv')
    df_struct = pd.read_csv('test/data/structured_features.csv')

    print(df_raw.shape)
    print(df_struct.shape)

    # Get artefacts
    save_amt_standard_scaler(df=df_raw, output_path='artefacts/amount_scaler.pkl')
    save_label2id(output_path='artefacts/label2id.json')
    save_onehot_encoder(df=df_raw, output_path='artefacts/onehot_encoder.pkl')
    save_location_label_encoder(df=df_raw, output_path='artefacts/location_encoder.pkl')

    # Upload to S3
    bucket_name = BUCKET
    artefact_dir = "artefacts"

    # Danh sách các file artefact cần upload
    boto_session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
    s3 = boto3.client("s3")
    artefact_files = [
        "amount_scaler.pkl",
        "label2id.json",
        "onehot_encoder.pkl",
        "location_encoder.pkl"
    ]

    for filename in artefact_files:
        local_path = f"artefacts/{filename}"
        s3_key = f"artefacts/{filename}"
        upload_to_s3(s3, local_path, bucket_name, s3_key)