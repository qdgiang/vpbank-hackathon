from sagemaker.feature_store.feature_group import FeatureGroup
fg = FeatureGroup("user-embeddings")
print(fg.get_record("ff331ffe-d095-4e9c-9ca1-32b5259cf9ac"))
