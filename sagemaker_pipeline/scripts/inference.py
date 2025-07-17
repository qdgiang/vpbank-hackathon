# src/inference.py
print(">>> Inference: Start importing")
import sys
import os
import pandas as pd
import numpy as np
import re
import tensorflow as tf
import json
import boto3
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
import joblib
import logging

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
# ------------- CONFIG ------------------------
SELECTED_FEATURES = ["amount", "amount_scaled", "day_of_month", "is_weekend", "hour_sin", "hour_cos", "dow_sin", "dow_cos", "tranx_type_atm_withdrawal", "tranx_type_qrcode_payment", "tranx_type_transfer_out", "channel_MOBILE", "channel_WEB", "location_idx", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383]

FEATURE_GROUP_NAME = "user-embeddings"
EMBED_DIM          = 64
FEATURE_NAME       = "embedding"

sagemaker_client = boto3.client("sagemaker-runtime",
                                region_name="ap-southeast-2")

# ---------- HELPER FUNCTIONS -----------------
_ARTIFACTS = {}

def _download_from_s3(s3_uri, local_path):
    """Tải file từ S3 về local_path."""
    s3 = boto3.client("s3")
    bucket, key = s3_uri.replace("s3://", "").split("/", 1)
    s3.download_file(bucket, key, local_path)

def _load_artifacts():
    global _ARTIFACTS
    if _ARTIFACTS:
        return _ARTIFACTS

    # Mapping S3 path → local file
    artefact_s3_paths = {
        "scaler":     "s3://test-vpb-hackathon/artefacts/amount_scaler.pkl",
        "ohe":        "s3://test-vpb-hackathon/artefacts/onehot_encoder.pkl",
        "loc_enc":    "s3://test-vpb-hackathon/artefacts/location_encoder.pkl",
        "label2id":   "s3://test-vpb-hackathon/artefacts/label2id.json"
    }

    local_dir = "/tmp/artefacts"
    os.makedirs(local_dir, exist_ok=True)

    for name, s3_path in artefact_s3_paths.items():
        local_file = os.path.join(local_dir, os.path.basename(s3_path))
        if not os.path.exists(local_file):  # chỉ tải nếu chưa có
            _download_from_s3(s3_path, local_file)

        if name == "label2id":
            with open(local_file, "r") as f:
                _ARTIFACTS[name] = json.load(f)
        else:
            _ARTIFACTS[name] = joblib.load(local_file)

    return _ARTIFACTS


def _get_struct_features(features, artefacts):
    # Handle amount
    features['amount_log'] = np.log1p(features['amount'])
    features['amount_scaled'] = artefacts['scaler'].fit_transform(features[['amount_log']])

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
    ohe = artefacts['ohe']
    oh_cols = ['tranx_type', 'channel']
    X_cat = ohe.fit_transform(features[oh_cols])
    ohe_feature_names = ohe.get_feature_names_out(oh_cols)
    df_cat_encoded = pd.DataFrame(X_cat, columns=ohe_feature_names, index=df.index)
    features = pd.concat([features, df_cat_encoded], axis=1)

    le = artefacts['loc_enc']
    features['location_idx'] = le.fit_transform(features['location'])
    return features


# -------- INFERENCE FUNCTIONS ----------------
def model_fn(model_dir):
    logger.info(">>> Inside model_fn")
    model_path = os.path.join(model_dir, "1")
    model = tf.keras.models.load_model(model_path)
    return model

def input_fn(request_body, request_content_type):
    """
    :param request_body:
       {
            "user_id": user_id,
            "amount": amount,
            "txn_time": txn_time,
            "msg_content": msg_content,
            "merchant": merchant,
            "to_account_name": to_account_name,
            "location": location,
            "channel": channel,
            "tranx_type": tranx_type,
            "sentence_embedding": sentence_embedding
        }
    """
    logger.info(">>> Inside input_fn")
    if request_content_type != "application/json":
        raise ValueError(f"Unsupported content type {request_content_type}")

    data_dict = json.loads(request_body)

    # Handle sentence embedding
    emb_raw = data_dict.pop("sentence_embedding")
    if isinstance(emb_raw, str):
        vec = np.fromstring(emb_raw, sep=",")
    else:
        vec = np.array(emb_raw)
    assert len(vec) == EMBED_DIM, f"Embedding must have {EMBED_DIM} dimensions"

    # Concat dataframes
    df_structured = pd.DataFrame([data_dict])
    df_structured = _get_struct_features(df_structured)
    emb_df = pd.DataFrame([vec], columns=list(range(EMBED_DIM)))
    df_full = pd.concat([df_structured, emb_df], axis=1)
    df_full = df_full[SELECTED_FEATURES + ['transaction_id', 'user_id']]

    # Get user embeddings
    user_embeddings = np.vstack(
        df_full["user_id"].map(uid_to_vec).to_list()
    )
    X_raw = df.drop(columns=["transaction_id", "user_id"]).values
    X = np.hstack([X_raw, user_embeddings])
    return X


def predict_fn(input_data, model):
    logger.info(">>> Inside predict_fn")
    prediction = model.predict(input_data)
    logger.info(f"Model output: {prediction}")
    return prediction


def output_fn(prediction, response_content_type):
    logger.info(">>> Inside output_fn")
    resp = json.dumps(prediction.tolist())
    logger.info(f"Response: {resp}")
    return resp
