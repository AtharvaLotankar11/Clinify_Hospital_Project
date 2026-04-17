from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .tasks import async_predict_patient_outcome, async_retrain_model
from celery.result import AsyncResult

class PredictView(APIView):
    # Removing permission classes for local testing. Add back later if needed:
    # permission_classes = [IsAuthenticated]
    
    def post(self, request):
        patient_data = request.data
        if not patient_data:
            return Response({"error": "No patient data provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Dispatch to Celery Worker
        task = async_predict_patient_outcome.delay(patient_data)
        
        return Response({
            "task_id": task.id,
            "status": "Processing Prediction"
        }, status=status.HTTP_202_ACCEPTED)

class TrainModelView(APIView):
    # permission_classes = [IsAuthenticated]
    
    def post(self, request):
        task = async_retrain_model.delay()
        return Response({
            "task_id": task.id,
            "status": "Model training initiated"
        }, status=status.HTTP_202_ACCEPTED)

class TaskStatusView(APIView):
    def get(self, request, task_id):
        task_result = AsyncResult(task_id)
        if task_result.ready():
            return Response({
                "task_id": task_id,
                "status": "completed",
                "result": task_result.result
            })
        return Response({
            "task_id": task_id,
            "status": "pending"
        })

class RecommendationView(APIView):
    """API Endpoint to generate algorithmic resource reallocation suggestions"""
    def get(self, request):
        # Simulated heuristic logic evaluating aggregated risk variables
        return Response({
            "status": "critical",
            "alert": "ER Volume Spike Predicted (98%)",
            "recommendation": "Our model predicts a surge in pulmonary admissions over the next 48 hours. Recommending proactive reallocation of 4 ventilators to the General Ward.",
            "metrics": {
                "high_risk_queue": 42,
                "icu_utilization_predicted": "85%"
            }
        }, status=status.HTTP_200_OK)
