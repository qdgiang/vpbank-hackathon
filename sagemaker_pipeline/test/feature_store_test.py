from sagemaker.feature_store.feature_group import FeatureGroup
fg = FeatureGroup("user-embeddings")
print(fg.get_record("2fc65740-da6d-43f4-b368-d7e50d952534"))
