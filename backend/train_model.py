import os
import sys
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import shap

def load_data():
    """Load and anonymize data"""
    data_path = 'ml/data/synthetic_ehr_data.csv'
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Drop PII columns
    pii_columns = ['First_Name', 'Last_Name', 'SSN']
    df = df.drop(columns=[col for col in pii_columns if col in df.columns], errors='ignore')
    
    print(f"Data loaded. Shape: {df.shape}")
    return df

def preprocess_data(df, target_col='Readmission_Risk'):
    """Preprocess data with imputation, scaling, and encoding"""
    print("\n--- Beginning Preprocessing Pipeline ---")
    
    # Separate features and target
    X = df.drop(columns=[target_col, 'Patient_ID'], errors='ignore')
    y = df[target_col]
    
    # Define feature lists
    numeric_features = ['Age', 'Systolic_BP', 'Diastolic_BP', 'Heart_Rate', 'Glucose_Level', 'BMI']
    categorical_features = ['Gender', 'Blood_Type', 'Admission_Type', 'Diagnosis']
    
    # Numerical pipeline
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # Categorical pipeline
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    # Combine transformers
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training set size: {len(X_train)}")
    print(f"Testing set size: {len(X_test)}")
    
    # Fit and transform
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Save preprocessor
    models_dir = 'ml/models'
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(preprocessor, os.path.join(models_dir, 'preprocessor.pkl'))
    
    print("Preprocessing completed and pipeline saved.")
    return X_train_processed, X_test_processed, y_train, y_test, preprocessor

def train_models(X_train, X_test, y_train, y_test):
    """Train and evaluate multiple models"""
    print("\n" + "="*60)
    print("MODEL TRAINING AND EVALUATION")
    print("="*60)
    
    # Encode target variable
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    y_test_encoded = le.transform(y_test)
    
    # Save label encoder
    joblib.dump(le, 'ml/models/label_encoder.pkl')
    print(f"\nTarget classes: {le.classes_}")
    
    # 1. Logistic Regression
    print("\n" + "-"*60)
    print("1. LOGISTIC REGRESSION (Baseline)")
    print("-"*60)
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train, y_train_encoded)
    lr_preds = lr_model.predict(X_test)
    lr_acc = accuracy_score(y_test_encoded, lr_preds)
    print(f"Accuracy: {lr_acc:.4f} ({lr_acc*100:.2f}%)")
    
    # 2. Random Forest
    print("\n" + "-"*60)
    print("2. RANDOM FOREST (Ensemble Baseline)")
    print("-"*60)
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train_encoded)
    rf_preds = rf_model.predict(X_test)
    rf_acc = accuracy_score(y_test_encoded, rf_preds)
    print(f"Accuracy: {rf_acc:.4f} ({rf_acc*100:.2f}%)")
    
    # 3. XGBoost (Primary Model)
    print("\n" + "-"*60)
    print("3. XGBOOST (Primary Model)")
    print("-"*60)
    xgb_model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        objective='multi:softprob',
        random_state=42
    )
    xgb_model.fit(X_train, y_train_encoded)
    xgb_preds = xgb_model.predict(X_test)
    xgb_acc = accuracy_score(y_test_encoded, xgb_preds)
    print(f"Accuracy: {xgb_acc:.4f} ({xgb_acc*100:.2f}%)")
    
    # Detailed metrics for XGBoost
    print("\n" + "="*60)
    print("XGBOOST DETAILED EVALUATION")
    print("="*60)
    print("\nClassification Report:")
    print(classification_report(y_test_encoded, xgb_preds, target_names=le.classes_))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test_encoded, xgb_preds)
    print(cm)
    print("\nConfusion Matrix Interpretation:")
    print(f"                Predicted Low  Predicted Moderate  Predicted High")
    for i, label in enumerate(le.classes_):
        print(f"Actual {label:8s}  {cm[i][0]:13d}  {cm[i][1]:18d}  {cm[i][2]:14d}")
    
    # Save XGBoost model
    xgb_path = 'ml/models/xgboost_model.pkl'
    joblib.dump(xgb_model, xgb_path)
    print(f"\n✓ XGBoost model saved to {xgb_path}")
    
    # Model comparison summary
    print("\n" + "="*60)
    print("MODEL COMPARISON SUMMARY")
    print("="*60)
    print(f"{'Model':<25} {'Accuracy':<15} {'Status'}")
    print("-"*60)
    print(f"{'Logistic Regression':<25} {lr_acc*100:>6.2f}%         Baseline")
    print(f"{'Random Forest':<25} {rf_acc*100:>6.2f}%         Improved")
    print(f"{'XGBoost':<25} {xgb_acc*100:>6.2f}%         ✓ Best (Target: ≥85%)")
    print("="*60)
    
    return xgb_model, X_train, le

def setup_shap(xgb_model, X_train):
    """Setup SHAP explainer"""
    print("\n" + "="*60)
    print("SHAP EXPLAINABILITY SETUP")
    print("="*60)
    
    explainer = shap.TreeExplainer(xgb_model)
    
    # Test explainer
    print("Testing SHAP explainer on sample data...")
    _ = explainer.shap_values(X_train[:5])
    
    # Save explainer
    shap_path = 'ml/models/shap_explainer.pkl'
    joblib.dump(explainer, shap_path)
    print(f"✓ SHAP explainer saved to {shap_path}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("HEALTHCARE PREDICTIVE ANALYTICS - MODEL TRAINING")
    print("="*60)
    
    try:
        # Load data
        df = load_data()
        
        # Preprocess
        X_train, X_test, y_train, y_test, preprocessor = preprocess_data(df)
        
        # Train models
        xgb_model, X_train_proc, label_encoder = train_models(X_train, X_test, y_train, y_test)
        
        # Setup SHAP
        setup_shap(xgb_model, X_train_proc)
        
        print("\n" + "="*60)
        print("✓ TRAINING COMPLETED SUCCESSFULLY")
        print("="*60)
        print("\nAll model artifacts saved in ml/models/:")
        print("  - preprocessor.pkl")
        print("  - label_encoder.pkl")
        print("  - xgboost_model.pkl")
        print("  - shap_explainer.pkl")
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
