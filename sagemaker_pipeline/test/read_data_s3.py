import boto3
import pandas as pd
from io import StringIO

bucket_name = "test-vpb-hackathon"
key = "preprocessed/structured_features.csv"

s3 = boto3.client("s3")
response = s3.get_object(Bucket=bucket_name, Key=key)

# Đọc nội dung vào Pandas DataFrame
csv_content = response["Body"].read().decode("utf-8")
df = pd.read_csv(StringIO(csv_content))

# In một phần nội dung DataFrame
print(df.head())
