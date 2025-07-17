import os, json, argparse, logging, tarfile
import boto3
import numpy as np
import pandas as pd
from io import BytesIO
from datetime import datetime, timezone
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.layers import (Input, Masking, GRU, Dense,
                                     RepeatVector, TimeDistributed)
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau


logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

TRAIN_DIR = "/opt/ml/input/data/train"
MODEL_DIR = "/opt/ml/model"
OUTPUT_DIR = "/opt/ml/output"
INPUT_PATH= os.path.join(TRAIN_DIR, "preprocessed_features.csv")

def parse_args():
    parser = argparse.ArgumentParser()

    # Các hparams tùy chỉnh
    parser.add_argument("--max-seq-len",   type=int,   default=50)
    parser.add_argument("--latent-dim",    type=int,   default=64)
    parser.add_argument("--gru-units",     type=int,   default=128)
    parser.add_argument("--batch-size",    type=int,   default=128)
    parser.add_argument("--epochs",        type=int,   default=60)
    parser.add_argument("--test-split",    type=float, default=0.2)
    parser.add_argument("--rng-seed",      type=int,   default=42)
    parser.add_argument("--model_dir",     type=str,   default="/opt/ml/model")
    parser.add_argument("--bucket",        type=str,   default="smart-jarvis-sagemaker")
    return parser.parse_args()


def get_user_sequences(input_path, args):
    """Return padded_seq, user_ids, scaler"""
    df = pd.read_csv(input_path)

    # Preprocess text embedding
    df["embedding_list"] = df["sentence_embedding"].apply(json.loads)
    embedding_df = pd.DataFrame(df["embedding_list"].tolist())
    df = pd.concat([df, embedding_df], axis=1)
    df.drop(columns=["sentence_embedding", "embedding_list", "text_joined"], inplace=True)
    df.columns = df.columns.astype(str)

    # Group by user_id
    df = df.sort_values(["user_id", "txn_time"])
    drop_cols = {"transaction_id", "txn_time", "user_id",
                 "msg_content", "to_account_name", "merchant",
                 "category_label", "tranx_type", "channel", "location",
                 "is_manual_override", "created_at", "updated_at"}
    feature_cols = [c for c in df.columns if c not in drop_cols]

    scaler = StandardScaler()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])

    seqs = [
        group[feature_cols].to_numpy()[-args.max_seq_len:]
        for _, group in df.groupby("user_id", sort=False)
    ]
    user_ids = df["user_id"].drop_duplicates().tolist()
    seqs = pad_sequences(seqs, maxlen=args.max_seq_len,
                         dtype="float32", padding="pre", value=0.0)
    return seqs, user_ids, scaler, len(feature_cols)


def build_autoencoder(seq_len, feat_dim, args):
    inputs = Input(shape=(seq_len, feat_dim))
    x = Masking(mask_value=0.0)(inputs)
    x = GRU(args.gru_units, return_sequences=False)(x)
    latent = Dense(args.latent_dim, name="user_emb")(x)

    x = RepeatVector(seq_len)(latent)
    x = GRU(args.gru_units, return_sequences=True)(x)
    outputs = TimeDistributed(Dense(feat_dim))(x)

    autoenc  = Model(inputs, outputs, name="AE")
    encoder  = Model(inputs, latent,  name="Encoder")
    autoenc.compile(optimizer="adam", loss="mse")
    return autoenc, encoder

def train_autoencoder(model, X_train, X_val, args):
    cbs = [EarlyStopping(patience=8, restore_best_weights=True),
           ReduceLROnPlateau(patience=4, factor=0.5)]
    hist = model.fit(X_train, X_train,
                     validation_data=(X_val, X_val),
                     epochs=args.epochs, batch_size=args.batch_size,
                     callbacks=cbs, verbose=2)
    return hist


if __name__ == '__main__':
    # Parse arguments
    args = parse_args()

    # Preprocess input
    padded, user_ids, scaler, feat_dim = get_user_sequences(INPUT_PATH, args)
    num_users = padded.shape[0]
    split_idx = int(num_users * (1 - args.test_split))
    X_train, X_val = padded[:split_idx], padded[split_idx:]
    logger.info(f"Preprocessed input data - {padded.shape}")

    # Train model
    autoenc, encoder = build_autoencoder(args.max_seq_len, feat_dim, args)
    logger.info("🚀 Training AutoEncoder …")
    train_autoencoder(autoenc, X_train, X_val, args)

    # Save artifacts
    autoenc.save(os.path.join(MODEL_DIR, "autoencoder"))
    encoder.save(os.path.join(MODEL_DIR, "encoder"))
    with open(os.path.join(MODEL_DIR, "scaler.json"), "w") as f:
        json.dump({"mean": scaler.mean_.tolist(),
                   "scale": scaler.scale_.tolist()}, f)
    logger.info(f"✅ Saved model artifacts to {MODEL_DIR}")

    # Save embeddings
    embeddings = encoder.predict(padded)
    df_emb = pd.DataFrame(embeddings)
    df_emb.insert(0, "user_id", user_ids)
    emb_path = os.path.join(OUTPUT_DIR, "user_embeddings.csv")
    df_emb.to_csv(emb_path, index=False)

    # Upload to S3
    bucket = args.bucket
    key    = f"features/user_embeddings.csv"
    s3 = boto3.client("s3")
    s3.upload_file(emb_path, bucket, key)
    logger.info(f"✅ Uploaded embeddings {df_emb.shape} to s3://{bucket}/{key}")

    # Upload metadata
    metadata = {
        "n_rows": int(df_emb.shape[0]),
        "n_cols": int(df_emb.shape[1]),
        "columns": list(df_emb.columns),
        "dtypes": {col: str(dtype) for col, dtype in df_emb.dtypes.items()},
    }
    meta_key = "features/user_embeddings.metadata.json"
    buffer = BytesIO(json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8"))
    s3.upload_fileobj(buffer, bucket, meta_key)