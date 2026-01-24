from django.urls import path
from .views import LabSummaryView, SummarizeReportView, SummarizeClinicalNotesView, CheckInteractionsView

urlpatterns = [
    path('lab-summary/', LabSummaryView.as_view(), name='lab-summary'),
    path('summarize-report/', SummarizeReportView.as_view(), name='summarize-report'),
    path('summarize-clinical-notes/', SummarizeClinicalNotesView.as_view(), name='summarize-clinical-notes'),
    path('check-interactions/', CheckInteractionsView.as_view(), name='check-interactions'),
]
