import os
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import shap

from ml.training.ingestion import load_and_anonymize_data
from ml.training.preprocessing import preprocess_data

def train_models():
    print("--- Phase 3.2: Predictive Modeling Module ---")
    data_path = os.path.join(os.path.dirname(__file__), '../data/synthetic_ehr_data.csv')
    df = load_and_anonymize_data(data_path)
    
    # 1. Preprocess data
    X_train_proc, X_test_proc, y_train, y_test, preprocessor = preprocess_data(df, target_col='Readmission_Risk')
    
    # Needs LabelEncoder for target (Low, Moderate, High) -> (0, 1, 2)
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    y_test_encoded = le.transform(y_test)
    
    # Save the label encoder
    models_dir = os.path.join(os.path.dirname(__file__), '../models')
    joblib.dump(le, os.path.join(models_dir, 'label_encoder.pkl'))
    
    # 2. Train Baselines
    print("\nTraining Baseline: Logistic Regression")
    lr_model = LogisticRegression(max_iter=1000)
    lr_model.fit(X_train_proc, y_train_encoded)
    lr_preds = lr_model.predict(X_test_proc)
    print(f"Logistic Regression Accuracy: {accuracy_score(y_test_encoded, lr_preds):.4f}")

    print("\nTraining Baseline: Random Forest")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train_proc, y_train_encoded)
    rf_preds = rf_model.predict(X_test_proc)
    print(f"Random Forest Accuracy: {accuracy_score(y_test_encoded, rf_preds):.4f}")

    # 3. Train Primary Target Model (XGBoost)
    print("\nTraining Primary Model: XGBoost")
    xgb_model = XGBClassifier(
        n_estimators=200, 
        max_depth=5, 
        learning_rate=0.1, 
        objective='multi:softprob',
        random_state=42
    )
    xgb_model.fit(X_train_proc, y_train_encoded)
    xgb_preds = xgb_model.predict(X_test_proc)
    acc = accuracy_score(y_test_encoded, xgb_preds)
    print(f"XGBoost Accuracy: {acc:.4f}")
    
    print("\nClassification Report (XGBoost):")
    print(classification_report(y_test_encoded, xgb_preds, target_names=le.classes_))
    
    # Save XGBoost Model
    xgb_path = os.path.join(models_dir, 'xgboost_model.pkl')
    joblib.dump(xgb_model, xgb_path)
    print(f"\nXGBoost Model exported to {xgb_path}")
    
    return xgb_model, X_train_proc, preprocessor

def setup_shap(xgb_model, X_train_proc):
    print("\n--- Phase 3.3: Insight Generation Engine (SHAP) ---")
    # Wrap model for SHAP TreeExplainer
    explainer = shap.TreeExplainer(xgb_model)
    # Validate explainer works by computing a batch
    _ = explainer.shap_values(X_train_proc[:5])
    
    shap_path = os.path.join(os.path.dirname(__file__), '../models/shap_explainer.pkl')
    joblib.dump(explainer, shap_path)
    print(f"SHAP explainer artifact saved to {shap_path}")

if __name__ == "__main__":
    xgb_model, X_train_proc, preprocessor = train_models()
    setup_shap(xgb_model, X_train_proc)
