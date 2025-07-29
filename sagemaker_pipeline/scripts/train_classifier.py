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


logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ------------- CONFIG -----------------
TRAIN_DIR = "/opt/ml/input/data/train"
MODEL_DIR = "/opt/ml/model"
OUTPUT_DIR = "/opt/ml/output"

INPUT_PATH = os.path.join(TRAIN_DIR, "preprocessed_features.csv")

EMBED_DIM = 64

SELECTED_FEATURES = ["amount_scaled", "day_of_month", "is_weekend", "hour_sin", "hour_cos",
                     "dow_sin", "dow_cos", "tranx_type_atm_withdrawal", "tranx_type_qrcode_payment",
                     "tranx_type_transfer_out", "channel_MOBILE", "channel_WEB"]
# -------- PROCESSING FUNCTIONS --------
def parse_args():
    parser = argparse.ArgumentParser()

    # Các hparams tùy chỉnh
    parser.add_argument("--epochs",         type=int,   default=30)
    parser.add_argument("--emb-batch-size", type=int,   default=25)

    parser.add_argument("--training-batch-size", type=int, default=512)
    parser.add_argument("--hidden-units",        type=int, default=128)

    parser.add_argument("--feature-group-name",  type=str, default="user-embeddings")

    parser.add_argument("--bucket", type=str, default="smart-jarvis-sagemaker")
    parser.add_argument("--model_dir", type=str,
                        default=os.environ.get("SM_MODEL_DIR", "/opt/ml/model"))
    return parser.parse_args()


def fetch_all_embeddings(unique_ids, max_workers=8, args=None):
    """
    Fetch embeddings for all unique_ids using ThreadPoolExecutor.
    Returns dict {user_id: vector}.
    """
    total = len(unique_ids)
    logger.info(f"📦 Fetching embeddings for {total:,} unique users...")
    uid_to_emb = {}

    def chunker(iterable, size):
        """Yield chunks (tuples) of length <= size."""
        it = iter(iterable)
        while True:
            chunk = tuple(itertools.islice(it, size))
            if not chunk:
                break
            yield chunk

    def batch_fetch_embeddings(user_ids):
        """
        Fetch embeddings for a list (<=25) of user_ids via batch_get_record.
        Returns {user_id: np.ndarray}.
        """
        records = {
            "FeatureGroupName": args.feature_group_name,
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

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {
            ex.submit(batch_fetch_embeddings, chunk): chunk
            for chunk in chunker(unique_ids, args.emb_batch_size)
        }

        for i, fut in enumerate(as_completed(futures), 1):
            uid_to_emb.update(fut.result())
            if i % 100 == 0 or i == len(futures):
                logger.info(f"  • Done {i}/{len(futures)} batches "
                            f"({i * args.emb_batch_size}/{total} users)")

    logger.info("✅ All embeddings fetched.")
    return uid_to_emb


def preprocess_data(args):
    """
    Assemble the full training set by merging structured features, text‑field
    embeddings, and user‑level embeddings.

    :return:
    X : np.ndarray
        Feature matrix of shape ``(n_samples, n_features)`` and dtype ``float32``.
    y : np.ndarray
        Target vector of shape ``(n_samples,)`` and dtype ``int`` (class indices).
    num_classes : int
        The count of unique values in ``y`` (needed for a soft‑max output layer).
    """
    # Read struct_df & filter transactions & preprocess features
    df = pd.read_csv(INPUT_PATH)
    df = df[df["user_id"].notna()]
    df = df[df["user_id"].str.lower() != 'nan']
    df = df[df['tranx_type'].isin({'transfer_out', 'qrcode_payment', 'atm_withdrawal'})]

    df['day_of_month'] = df['day_of_month'] / 31
    df = df[SELECTED_FEATURES + ["transaction_id", "category_label", "user_id", "sentence_embedding"]]

    # Handle text embedding
    df["embedding_list"] = df["sentence_embedding"].apply(json.loads)
    embedding_df = pd.DataFrame(
        df["embedding_list"].tolist(),
        columns=[f"text_emb_{i}" for i in range(len(df["embedding_list"].iloc[0]))]
    )
    df = pd.concat([df, embedding_df], axis=1)
    df.drop(columns=["sentence_embedding", "embedding_list"], inplace=True)

    # Validate user_id
    unique_ids = df["user_id"].unique()
    unique_ids = (
        pd.Series(unique_ids)  # chấp nhận cả list, np.ndarray
        .dropna()  # loại float('nan')
        .astype(str)  # ép về chuỗi
        .loc[lambda s: s.str.lower() != "nan"]  # loại chuỗi 'nan'
        .tolist()  # chuyển thành list
    )
    df = df[df['user_id'].isin(unique_ids)]

    # Merge with user_emb
    uid_to_vec = fetch_all_embeddings(unique_ids, max_workers=8, args=args)
    user_embeddings = np.vstack(df["user_id"].map(uid_to_vec).to_list())

    # Get X and y
    X_columns = df.drop(columns=["transaction_id", "category_label", "user_id"]).columns.tolist()
    with open(os.path.join(OUTPUT_DIR, "cols_model.json"), "w") as f:
        json.dump(X_columns, f)
    bucket = args.bucket
    key = f"classifier_output/{os.environ['TRAINING_JOB_NAME']}/output/metadata/cols_model.json"
    s3 = boto3.client("s3")
    s3.upload_file(os.path.join(OUTPUT_DIR, "cols_model.json"), bucket, key)
    logger.info(f"✅ Uploaded list of columns to s3://{bucket}/{key}")

    X = np.hstack([
        df.drop(columns=["transaction_id", "category_label", "user_id"]).values,
        user_embeddings
    ])
    X = X.astype(np.float32)
    X[~np.isfinite(X)] = 0  # loại bỏ cả NaN, inf, -inf

    y = df["category_label"].to_numpy()
    num_classes = len(np.unique(y))
    logger.info(f"✅ Preprocessed data X - {X.shape}, y - {y.shape} ")
    return X, y, num_classes


def build_mlp(input_dim: int,
              num_classes: int,
              hidden_units: int = 256) -> tf.keras.Model:
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_dim,)),
        tf.keras.layers.Dense(hidden_units, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(num_classes, activation="softmax")
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    logger.info("✅ MLP model compiled successfully.")
    return model


def train_model(model: tf.keras.Model,
                X_train: np.ndarray,
                y_train: np.ndarray,
                X_val: np.ndarray,
                y_val: np.ndarray,
                epochs: int = 30,
                batch_size: int = 512) -> tf.keras.callbacks.History:
    callbacks = [
        EarlyStopping(monitor="val_loss",
                      patience=5,
                      restore_best_weights=True)
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=2,
    )
    return history


def evaluate_model(model: tf.keras.Model,
                   X_test: np.ndarray,
                   y_test: np.ndarray) -> dict:
    """
    Run inference on the test set and return a dict with key metrics.
    """
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    y_pred = model.predict(X_test).argmax(axis=1)

    metrics = {
        "test_accuracy": float(test_acc),
        "test_loss": float(test_loss),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(
            y_test, y_pred, output_dict=True),
    }
    logger.info(f"✅ Test Accuracy = {test_acc:.4f}, Loss = {test_loss:.4f}")
    return metrics


def save_artifacts(model: tf.keras.Model,
                   history: tf.keras.callbacks.History,
                   test_metrics: dict) -> None:
    """
    Persist the TensorFlow SavedModel and evaluation.json side‑by‑side.
    """
    # Save model in container
    model.save(os.path.join(MODEL_DIR, "tf_model"))
    logger.info(f"✅ Model and metrics saved to {MODEL_DIR}")

    # Save metrics in container
    eval_dict = {
        "val_accuracy": float(history.history["val_accuracy"][-1]),
        "val_loss": float(history.history["val_loss"][-1]),
        **test_metrics,
    }
    with open(os.path.join(OUTPUT_DIR, "evaluation.json"), "w") as f:
        json.dump(eval_dict, f, indent=2)
    logger.info(f"✅ Metrics saved to {OUTPUT_DIR}")

    # Upload metrics to S3
    bucket = args.bucket
    key = f"classifier_output/{os.environ['TRAINING_JOB_NAME']}/output/metadata/evaluation.json"
    s3 = boto3.client("s3")
    s3.upload_file(os.path.join(OUTPUT_DIR, "evaluation.json"), bucket, key)
    logger.info(f"✅ Uploaded metrics to s3://{bucket}/{key}")

if __name__ == '__main__':
    # Parse arguments
    args = parse_args()
    # Prepare data
    global fs_runtime
    fs_runtime = boto3.client(
        "sagemaker-featurestore-runtime",
        region_name='ap-southeast-2'
    )
    X,y, num_classes = preprocess_data(args)

    label2id = {
        'NEC': 0,
        'FFA': 1,
        'PLAY': 2,
        'EDU': 3,
        'GIVE': 4,
        'LTSS': 5
    }
    y = np.vectorize(label2id.get)(y)

    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )
    logger.info(f"Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")

    # Build and train model MLP+Softmax
    model = build_mlp(input_dim=X_train.shape[1],
                      num_classes=num_classes,
                      hidden_units=args.hidden_units)

    history = train_model(model,
                          X_train, y_train,
                          X_val, y_val,
                          epochs=args.epochs,
                          batch_size=args.training_batch_size)

    # Evaluate & Save output
    test_metrics = evaluate_model(model, X_test, y_test)
    save_artifacts(model, history, test_metrics)

