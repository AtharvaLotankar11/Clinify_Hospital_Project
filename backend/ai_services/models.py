from django.db import models
from django.conf import settings

class AIRequestLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    filename = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default='pending')
    request_type = models.CharField(max_length=50, default='lab_summary')
    error_message = models.TextField(blank=True, null=True)
    summary_generated = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user} - {self.timestamp} - {self.status}"
