import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

def preprocess_data(df, target_col='Readmission_Risk'):
    print("Beginning Preprocessing Pipeline...")
    
    # Separate features and target
    X = df.drop(columns=[target_col, 'Patient_ID'], errors='ignore')
    y = df[target_col]
    
    # Define Numerical and Categorical feature lists based on synthetic data structure
    numeric_features = ['Age', 'Systolic_BP', 'Diastolic_BP', 'Heart_Rate', 'Glucose_Level', 'BMI']
    categorical_features = ['Gender', 'Blood_Type', 'Admission_Type', 'Diagnosis']
    
    # Pipeline 1: Numerical Features (Handle missing values -> Scale)
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # Pipeline 2: Categorical Features (Handle missing values -> One-Hot Encode)
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Split into 80% training / 20% testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Fit and transform
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Save the fitted preprocessor for inference later on API calls
    models_dir = os.path.join(os.path.dirname(__file__), '../models')
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(preprocessor, os.path.join(models_dir, 'preprocessor.pkl'))
    
    print("Preprocessing completed and pipeline artifact saved.")
    return X_train_processed, X_test_processed, y_train, y_test, preprocessor
