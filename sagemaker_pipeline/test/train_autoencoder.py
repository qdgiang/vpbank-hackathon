import os, json
import boto3
import numpy as np
import pandas as pd
import logging
from io import BytesIO
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.layers import (Input, Masking, GRU, Dense,
                                     RepeatVector, TimeDistributed)
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# TEST: Read data from local
INPUT_FEATURES_PATH = 'test/data/structured_features.csv'
INPUT_TEXT_PATH = 'test/data/text_features.csv'

# ------ AUTOENCODER CONFIG ----------
MAX_SEQ_LEN  = 50    # số giao dịch gần nhất / user
LATENT_DIM   = 64
GRU_UNITS    = 128
BATCH_SIZE   = 128
EPOCHS       = 10 # 60, 100
TEST_SPLIT   = 0.2
RNG_SEED     = 42

# ------ PROCESSING FUNCTIONS ---------
def get_user_sequences():
    """
    Read features from files
    :return:
    - seqs: List of 2D Numpy arrays (list of users' transaction-matrices) - shape: (num_users, MAX_SEQ_LEN, feature_dim)
    - user_ids: List of user_ids
    - num_users, seq_len, feat_dim: int
    """
    # Read data and merge
    structured_features = pd.read_csv(INPUT_FEATURES_PATH)
    text_features = pd.read_csv(INPUT_TEXT_PATH)
    logger.info(f'✅ Loaded: structured_features {structured_features.shape}; text_features {text_features.shape}')

    structured_features = structured_features.drop(['category_label', 'tranx_type'], axis=1)
    text_features = text_features.drop(['category_label', 'tranx_type', 'user_id'], axis=1)

    merged_df = structured_features.merge(text_features, how='inner', on='transaction_id')
    merged_df = merged_df.sort_values(["user_id", "txn_time"])

    # Build sequence per user
    drop_cols = {"transaction_id", "txn_time", "user_id"}
    feature_cols = [c for c in merged_df.columns if c not in drop_cols]
    scaler = StandardScaler()
    merged_df[feature_cols] = scaler.fit_transform(merged_df[feature_cols])

    # TEST
    merged_df = merged_df.sample(frac=0.2)

    seqs = (merged_df.groupby("user_id")[feature_cols]
            .apply(lambda x: x.to_numpy()[-MAX_SEQ_LEN:])
            .tolist())
    user_ids = merged_df["user_id"].drop_duplicates().tolist()
    seqs = pad_sequences(
        seqs, maxlen=MAX_SEQ_LEN, dtype="float32", padding="pre", value=0.0
    )
    num_users, seq_len, feat_dim = seqs.shape
    return seqs, user_ids, num_users, seq_len, feat_dim, scaler


def build_autoencoder(seq_len: int, feat_dim: int,
                      gru_units: int = GRU_UNITS,
                      latent_dim: int = LATENT_DIM):
    """Return (autoencoder_model, encoder_model)."""
    # Encoder
    inputs = Input(shape=(seq_len, feat_dim))
    x = Masking(mask_value=0.0)(inputs)
    x = GRU(gru_units, return_sequences=False)(x)
    latent = Dense(latent_dim, name="user_emb")(x)

    # Decoder
    x = RepeatVector(seq_len)(latent)
    x = GRU(gru_units, return_sequences=True)(x)
    outputs = TimeDistributed(Dense(feat_dim))(x)

    autoenc = Model(inputs, outputs, name="AE")
    encoder = Model(inputs, latent, name="Encoder")
    autoenc.compile(optimizer="adam", loss="mse")
    return autoenc, encoder



def train_autoencoder(model: Model,
                      X_train: np.ndarray,
                      X_val: np.ndarray,
                      batch_size: int = BATCH_SIZE,
                      epochs: int = EPOCHS):
    """Fit AE and return history."""
    cbs = [
        EarlyStopping(patience=8, restore_best_weights=True),
        ReduceLROnPlateau(patience=4, factor=0.5)
    ]
    history = model.fit(
        X_train, X_train,
        validation_data=(X_val, X_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=cbs,
        verbose=2
    )
    return history


def save_artifacts(autoenc: Model,
                   encoder: Model,
                   scaler: StandardScaler,
                   out_dir: str = "models"):
    """Save models and scaler."""
    os.makedirs(out_dir, exist_ok=True)
    autoenc.save(os.path.join(out_dir, "user_seq_autoencoder.h5"))
    encoder.save(os.path.join(out_dir, "user_seq_encoder.h5"))
    with open(os.path.join(out_dir, "scaler.json"), "w") as f:
        json.dump({"mean": scaler.mean_.tolist(),
                   "scale": scaler.scale_.tolist()}, f)
    logger.info(f"✅ Saved models & scaler to: {out_dir}/")


def main():
    # Get input
    padded, user_ids, num_users, seq_len, feat_dim, scaler = get_user_sequences()

    # Split train/valid
    split_idx = int(num_users * (1 - TEST_SPLIT))
    X_train, X_val = padded[:split_idx], padded[split_idx:]

    # Create and train model
    autoenc, encoder = build_autoencoder(MAX_SEQ_LEN, feat_dim)
    autoenc.summary()
    logger.info("🚀 Training …")
    train_autoencoder(autoenc, X_train, X_val)

    # Save results
    save_artifacts(autoenc, encoder, scaler)

    # Save embeddings
    user_embeddings = encoder.predict(padded)
    embedding_df = pd.DataFrame(user_embeddings)
    embedding_df.insert(0, "user_id", user_ids)
    embedding_df.to_csv("user_embeddings.csv", index=False)


if __name__ == '__main__':
    main()