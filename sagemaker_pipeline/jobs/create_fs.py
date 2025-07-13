import sys
import os
import pandas as pd
import numpy as np
import boto3
import sagemaker
from sagemaker.feature_store.feature_group import FeatureGroup
from sagemaker.feature_store.feature_definition import FeatureDefinition, FeatureTypeEnum
from sagemaker.feature_store.inputs import DataCatalogConfig


# ---- 0. AWS session và role ----
AWS_PROFILE = os.getenv("AWS_PROFILE")
AWS_REGION = os.getenv("AWS_REGION")
SAGEMAKER_ROLE = os.getenv("SAGEMAKER_ROLE")

boto_session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
sagemaker_session = sagemaker.Session(boto_session=boto_session)
role_arn = SAGEMAKER_ROLE

# ---- 1. Khai báo Feature Group ----
fg_name = "user-embeddings"
fg = FeatureGroup(name=fg_name, sagemaker_session=sagemaker_session)

offline_uri = f"s3://test-vpb-hackathon/feature-store/{fg_name}"
fg.feature_definitions = [
    FeatureDefinition("user_id", FeatureTypeEnum.STRING),
    FeatureDefinition("embedding", FeatureTypeEnum.STRING),
    FeatureDefinition("event_time", FeatureTypeEnum.STRING)
]
fg.create(
    s3_uri=offline_uri,
    record_identifier_name="user_id",
    event_time_feature_name="event_time",
    role_arn=role_arn,
    enable_online_store=True,
    disable_glue_table_creation=True,
    data_catalog_config=DataCatalogConfig(
        catalog="AwsDataCatalog",
        database="featurestore",
        table_name=fg_name,
    ),
)

print(f"✅ Feature Group '{fg_name}' created successfully!")