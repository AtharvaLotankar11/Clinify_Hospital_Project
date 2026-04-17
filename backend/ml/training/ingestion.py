import pandas as pd
import os

def load_and_anonymize_data(filepath=None):
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), '../data/synthetic_ehr_data.csv')
    
    print(f"Ingesting data from {filepath}...")
    df = pd.read_csv(filepath)
    
    # Simulate PII Anonymization
    # Drop highly sensitive PHI/PII fields like Name and SSN
    pii_columns = ['First_Name', 'Last_Name', 'SSN']
    df = df.drop(columns=[col for col in pii_columns if col in df.columns], errors='ignore')
    
    # Data is now structurally ready for ML Preprocessing
    print(f"Data Anonymized. Dropped PII fields. Shape: {df.shape}")
    return df
