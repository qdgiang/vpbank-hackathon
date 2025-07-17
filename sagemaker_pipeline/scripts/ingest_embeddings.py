import argparse, json, os, pandas as pd, boto3
import logging
from datetime import datetime, timezone
from sagemaker.feature_store.feature_group import FeatureGroup
from sagemaker import Session

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def jsonify_vector(row):
    # Nếu Feature Store của bạn CHƯA hỗ trợ FRACTIONAL_VECTOR
    return json.dumps(row.values.tolist())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--emb-file",      required=True)
    parser.add_argument("--feature-group", default="user-embeddings")
    parser.add_argument("--region",        default=os.getenv("AWS_REGION", "ap-southeast-2"))
    parser.add_argument("--wait",          default="false")
    parser.add_argument("--max-workers",   type=int, default=4)
    args = parser.parse_args()

    # Create SageMaker session
    boto_session = boto3.Session(
        region_name='ap-southeast-2'
    )
    sagemaker_session = Session(boto_session=boto_session)

    # Read embeddings from file
    df = (pd.read_csv(args.emb_file)
          if args.emb_file.endswith(".csv")
          else pd.read_parquet(args.emb_file))

    # Convert dimensions into 1 embedding column
    vec_cols = [c for c in df.columns if c != "user_id"]
    if vec_cols:
        df["embedding"] = df[vec_cols].apply(jsonify_vector, axis=1)
        df = df[["user_id", "embedding"]]

    # Add event_time
    df["event_time"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Batch put record
    fg = FeatureGroup(name=args.feature_group, sagemaker_session=sagemaker_session)
    fg.ingest(data_frame=df,
              max_workers=args.max_workers,
              wait=args.wait.lower() == "true")

    logger.info(f"✅ Ingested {len(df)} rows into FeatureGroup {args.feature_group}")

if __name__ == "__main__":
    main()
