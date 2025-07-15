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
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import confusion_matrix, classification_report


logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# -------------- CONFIG -----------------
INPUT_STRUCT_PATH = 'test/data/structured_features.csv'
INPUT_TEXT_PATH = 'test/data/text_features.csv'
EMBED_DIM = 64
BATCH_SIZE = 25

FG_NAME = 'user-embeddings'
MODEL_DIR = 'test/data'
fs_runtime = boto3.client(
        "sagemaker-featurestore-runtime",
        region_name='ap-southeast-2'
)

TRAINING_BATCH_SIZE = 512
EPOCHS = 10 # 30
HIDDEN_UNITS = 128

# --------- PROCESSING FUNCTIONS --------
def fetch_all_embeddings(unique_ids, max_workers=8):
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
            "FeatureGroupName": FG_NAME,
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
            for chunk in chunker(unique_ids, BATCH_SIZE)
        }

        for i, fut in enumerate(as_completed(futures), 1):
            uid_to_emb.update(fut.result())
            if i % 100 == 0 or i == len(futures):
                logger.info(f"  • Done {i}/{len(futures)} batches "
                            f"({i * BATCH_SIZE}/{total} users)")

    logger.info("✅ All embeddings fetched.")
    return uid_to_emb


def preprocess_data():
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
    # Read struct_df & filter transactions
    df = pd.read_csv(INPUT_STRUCT_PATH)
    df = df[df['tranx_type'].isin({'transfer_out', 'qrcode_payment', 'atm_withdrawal'})]
    cols_to_drop = ['tranx_type', 'txn_time', 'tranx_type_bill_payment', 'tranx_type_cashback',
                    'tranx_type_loan_repayment','tranx_type_mobile_topup','tranx_type_opensaving',
                    'tranx_type_stock','tranx_type_transfer_in']
    df = df.drop(cols_to_drop, axis=1)

    # Merge with text_emb
    text_df = pd.read_csv(INPUT_TEXT_PATH)
    text_df = text_df.drop(['user_id', 'tranx_type', 'category_label'], axis=1)
    df = df.merge(text_df, how='inner', on='transaction_id')

    # Merge with user_emb
    unique_uids = df["user_id"].unique()
    uid_to_vec = fetch_all_embeddings(unique_uids)
    user_embeddings = np.vstack(df["user_id"].map(uid_to_vec).to_list())
    #user_embeddings = np.vstack(df["user_id"].apply(fetch_user_emb).to_list())

    # Get X and y
    X = np.hstack([
        df.drop(columns=["transaction_id", "category_label", "user_id"]).values,
        user_embeddings
    ])
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
    model.save(os.path.join(MODEL_DIR, "tf_model"))

    eval_dict = {
        "val_accuracy": float(history.history["val_accuracy"][-1]),
        "val_loss": float(history.history["val_loss"][-1]),
        **test_metrics,
    }
    with open(os.path.join(MODEL_DIR, "tf_model/evaluation.json"), "w") as f:
        json.dump(eval_dict, f, indent=2)

    logger.info(f"✅ Model and metrics saved to {MODEL_DIR}")


if __name__ == '__main__':
    # Prepare data
    X, y, num_classes = preprocess_data()

    le = LabelEncoder()
    y = le.fit_transform(y)
    logger.info('✅ Label Encoder:')
    for index, label in enumerate(le.classes_):
        logger.info(f'Index: {index}, Label: {label}')

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
                      hidden_units=HIDDEN_UNITS)

    history = train_model(model,
                          X_train, y_train,
                          X_val, y_val,
                          epochs=EPOCHS,
                          batch_size=TRAINING_BATCH_SIZE)

    # Evaluate and save model output
    test_metrics = evaluate_model(model, X_test, y_test)
    save_artifacts(model, history, test_metrics)
