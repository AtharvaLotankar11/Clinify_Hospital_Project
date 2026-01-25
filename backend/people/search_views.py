from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Patient, Visit, Staff
from .serializers import PatientSerializer, VisitSerializer, StaffSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """
    Global search across patients, visits, and staff
    Query params: q (search query)
    """
    query = request.query_params.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response({
            'patients': [],
            'visits': [],
            'staff': [],
            'total': 0
        })
    
    # Search Patients by name, UHID, phone, email
    patients = Patient.objects.filter(
        Q(name__icontains=query) |
        Q(uhid__icontains=query) |
        Q(phone__icontains=query) |
        Q(email__icontains=query)
    )[:5]  # Limit to 5 results
    
    # Search Visits by patient name, UHID, or visit ID
    visits = Visit.objects.filter(
        Q(patient__name__icontains=query) |
        Q(patient__uhid__icontains=query) |
        Q(id__icontains=query)
    ).select_related('patient', 'doctor')[:5]
    
    # Search Staff by name or email
    staff = Staff.objects.filter(
        Q(name__icontains=query) |
        Q(user_email__icontains=query)
    )[:5]
    
    total_results = patients.count() + visits.count() + staff.count()
    
    return Response({
        'patients': PatientSerializer(patients, many=True).data,
        'visits': VisitSerializer(visits, many=True).data,
        'staff': StaffSerializer(staff, many=True).data,
        'total': total_results
    })
