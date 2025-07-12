from __future__ import annotations

"""text_embedder.py

Utility class for Vietnamese text normalisation & embedding with FastText.
Designed to be imported across preprocessing pipelines, training jobs,
or ad‑hoc notebooks.

Example
-------
>>> from modules.text_embedder import FastTextEmbedder
>>> embedder = FastTextEmbedder(model_path="/app/models/cc.vi.300.bin")
>>> vec = embedder.embed_sentence("Chuyển khoản cho Nguyen Van A")
>>> mat = embedder.embed_dataframe(df, text_cols=["msg_content", "merchant", "to_account_name"])

The resulting matrix has shape (len(df), embedder.dim) and dtype float32.
"""

from pathlib import Path
import re
import os
from typing import List, Sequence

import fasttext
import numpy as np
import pandas as pd
from unidecode import unidecode

import warnings
warnings.filterwarnings("ignore", message="`load_model` does not return WordVectorModel")


__all__ = ["FastTextEmbedder"]


class FastTextEmbedder:
    """A thin wrapper around Facebook FastText for Vietnamese text embedding."""

    _NORMALISE_RE = re.compile(r"[^a-z0-9\s]")

    def __init__(self, model_path: str | os.PathLike, lowercase: bool = True, remove_accents: bool = True) -> None:
        self.model_path = Path(model_path)
        self.lowercase = lowercase
        self.remove_accents = remove_accents

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"FastText model not found at {self.model_path}. "
                "Mount or download the Vietnamese pre‑trained bin first."
            )

        self._model = fasttext.load_model(str(self.model_path))
        self.dim: int = self._model.get_dimension()

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------
    def embed_sentence(self, text: str | None) -> np.ndarray:
        """Return 1‑D np.ndarray (float32) of length `self.dim` for a sentence.

        * Normalises text (see :py:meth:`_normalise`).
        * Splits on whitespace (FastText handles OOV via sub‑words).
        * Returns zeros when no valid tokens.
        """
        if not text:
            # All zeros for empty / NaN input
            return np.zeros(self.dim, dtype=np.float32)

        norm = self._normalise(text)
        if not norm:
            return np.zeros(self.dim, dtype=np.float32)

        return self._model.get_sentence_vector(norm).astype(np.float32)

    def embed_dataframe(self, df: pd.DataFrame, *, text_cols: Sequence[str]) -> np.ndarray:
        """Embed each row after concatenating *text_cols*.

        Parameters
        ----------
        df : pd.DataFrame
            DataFrame containing text columns.
        text_cols : list[str]
            Column names to concatenate with a space.

        Returns
        -------
        np.ndarray
            Matrix of shape (len(df), self.dim) with dtype float32.
        """
        concat_series = (
            df[text_cols]  # 1️⃣ Lấy đúng các cột chứa văn bản
            .fillna("")  # 2️⃣ Thay NaN bằng chuỗi rỗng để tránh lỗi khi ghép
            .agg(" ".join, axis=1)  # 3️⃣ Ghép giá trị trên *một hàng* thành 1 chuỗi, ngăn cách bằng dấu cách
            .astype(str)  # 4️⃣ Đảm bảo kiểu dữ liệu là string (đề phòng cột số)
        )

        embeddings = concat_series.apply(self.embed_sentence)
        matrix = np.vstack(embeddings.values)
        transaction_ids = df.loc[concat_series.index, "transaction_id"].reset_index(drop=True)
        emb_df = pd.DataFrame(matrix)
        emb_df.insert(0, "transaction_id", transaction_ids)
        return emb_df

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------
    def _normalise(self, text: str) -> str:
        """Lower‑case, strip accents (optional) & remove non‑alphanumerics."""
        if self.lowercase:
            text = text.lower()
        if self.remove_accents:
            text = unidecode(text)
        text = self._NORMALISE_RE.sub(" ", text)
        return re.sub(r"\s+", " ", text).strip()
