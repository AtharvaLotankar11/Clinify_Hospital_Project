from django.urls import path
from .views import PredictView, TrainModelView, TaskStatusView, RecommendationView

urlpatterns = [
    path('predict/', PredictView.as_view(), name='ml_predict'),
    path('train/', TrainModelView.as_view(), name='ml_train'),
    path('status/<str:task_id>/', TaskStatusView.as_view(), name='ml_task_status'),
    path('recommendations/', RecommendationView.as_view(), name='ml_recommendations'),
]
