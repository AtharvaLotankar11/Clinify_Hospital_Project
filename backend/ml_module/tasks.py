from celery import shared_task
from ml.inference.predict import run_prediction
from ml.training.train import train_models, setup_shap
import time

@shared_task
def async_predict_patient_outcome(patient_data):
    """Celery task to run prediction in the background."""
    print("Celery Worker picked up prediction task...")
    start_time = time.time()
    
    result = run_prediction(patient_data)
    
    print(f"Prediction completed in {time.time()-start_time:.3f} seconds.")
    return result

@shared_task
def async_retrain_model():
    """Celery task to retrain the model."""
    print("Celery Worker initiated model retraining...")
    xgb_model, X_train_proc, preprocessor = train_models()
    setup_shap(xgb_model, X_train_proc)
    return {"status": "success", "message": "Model retrained and artifacts saved successfully."}
