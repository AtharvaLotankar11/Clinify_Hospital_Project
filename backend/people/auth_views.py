from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Staff

class AdminResetPasswordView(APIView):
    permission_classes = [IsAuthenticated] # Add IsAdminUser if stricter control needed

    def post(self, request):
        user_id = request.data.get('user_id')
        new_password = request.data.get('new_password')

        if not user_id or not new_password:
            return Response({'error': 'User ID and New Password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get Staff profile
            staff = Staff.objects.get(user_id=user_id)
            # Get Django User
            user = User.objects.get(username=staff.user_email)
            print(f"DEBUG: Resetting password for User: {user.username} (PK: {user.pk})")
            
            # 1. Update Django User Password
            user.set_password(new_password)
            user.save()
            
            # 2. Update Staff Password Hash (for sync/reference if needed)
            staff.password_hash = make_password(new_password)
            staff.save()
            
            return Response({'message': f'Password for {staff.name} reset successfully.'})
            
        except Staff.DoesNotExist:
             return Response({'error': 'Staff profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
             return Response({'error': 'User account not found'}, status=status.HTTP_404_NOT_FOUND)
