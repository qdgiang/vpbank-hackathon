import pandas as pd

df = pd.read_csv('test/data/structured_features.csv')
print(df['category_label'].unique())