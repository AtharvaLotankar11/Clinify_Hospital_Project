from rest_framework import permissions
from .models import Staff

class IsDoctorOrNurse(permissions.BasePermission):
    """
    Custom permission to only allow Doctors and Nurses to access the view.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        try:
            # Match Django User username/email with Staff user_email
            # Assuming request.user.username holds the email as seen in auth_views.py
            staff = Staff.objects.get(user_email=request.user.username)
            return staff.role in ['DOCTOR', 'NURSE']
        except Staff.DoesNotExist:
            return False
