import os
import joblib
import pandas as pd
import numpy as np

# Load artifacts globally so they stay in memory when worker starts
MODELS_DIR = os.path.join(os.path.dirname(__file__), '../models')
_PREPROCESSOR = None
_XGB_MODEL = None
_LABEL_ENCODER = None
_SHAP_EXPLAINER = None

def _load_artifacts():
    global _PREPROCESSOR, _XGB_MODEL, _LABEL_ENCODER, _SHAP_EXPLAINER
    if _PREPROCESSOR is None:
        _PREPROCESSOR = joblib.load(os.path.join(MODELS_DIR, 'preprocessor.pkl'))
        _XGB_MODEL = joblib.load(os.path.join(MODELS_DIR, 'xgboost_model.pkl'))
        _LABEL_ENCODER = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))
        _SHAP_EXPLAINER = joblib.load(os.path.join(MODELS_DIR, 'shap_explainer.pkl'))

def run_prediction(patient_data: dict) -> dict:
    """Takes a dictionary of patient data, runs ML model and returns prediction with SHAP."""
    _load_artifacts()
    
    # 1. Convert to DataFrame
    df = pd.DataFrame([patient_data])
    
    # 2. Preprocess 
    numeric_features = ['Age', 'Systolic_BP', 'Diastolic_BP', 'Heart_Rate', 'Glucose_Level', 'BMI']
    categorical_features = ['Gender', 'Blood_Type', 'Admission_Type', 'Diagnosis']
    
    # Extract feature names after processing to map SHAP values accurately
    num_cols = numeric_features
    cat_cols = _PREPROCESSOR.named_transformers_['cat']['onehot'].get_feature_names_out(categorical_features)
    feature_names = list(num_cols) + list(cat_cols)
    
    X_proc = _PREPROCESSOR.transform(df)
    
    # 3. Predict Probabilities
    probs = _XGB_MODEL.predict_proba(X_proc)[0]
    pred_idx = np.argmax(probs)
    pred_label = _LABEL_ENCODER.inverse_transform([pred_idx])[0]
    
    # 4. Generate SHAP values for Explanations
    shap_values = _SHAP_EXPLAINER.shap_values(X_proc)
    
    # Handle multi-class SHAP: get shap values for the predicted class
    class_shap_values = shap_values[pred_idx][0]
    
    # Match feature names to their importance values
    feature_importance = [
        {"feature": str(fname), "importance": float(fval)}
        for fname, fval in zip(feature_names, class_shap_values)
    ]
    # Sort by absolute magnitude to get "Top Influencing Factors"
    feature_importance.sort(key=lambda x: abs(x["importance"]), reverse=True)
    
    return {
        "prediction": pred_label,
        "confidence": float(probs[pred_idx]),
        "probabilities": {
            str(cls): float(prob) 
            for cls, prob in zip(_LABEL_ENCODER.classes_, probs)
        },
        "top_influencing_factors": feature_importance[:5]
    }
