
import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'his.settings')
django.setup()

from people.models import Staff, Patient, Visit
from django.contrib.auth.models import User

def create_test_users():
    print("Setting up test users...")
    
    # Create Doctor
    doctor_user, created = User.objects.get_or_create(username='doctor_test')
    if created:
        doctor_user.set_password('password123')
        doctor_user.save()
        print("Created doctor_user")
    else:
        print("doctor_user exists")
        
    doctor_staff, created = Staff.objects.get_or_create(
        user_email='doctor_test', # matches User.username
        defaults={
            'name': 'Dr. Test',
            'role': 'DOCTOR',
            'department': 'OPD',
            'doctor_type': 'CARDIOLOGIST',
            'password_hash': 'dummy_hash', # required field
            'fee': 500
        }
    )
    
    # Create Receptionist
    reception_user, created = User.objects.get_or_create(username='reception_test')
    if created:
        reception_user.set_password('password123')
        reception_user.save()
        print("Created reception_user")
    else:
        print("reception_user exists")
        
    reception_staff, created = Staff.objects.get_or_create(
        user_email='reception_test', # matches User.username
        defaults={
            'name': 'Reception Test',
            'role': 'RECEPTION',
            'department': 'ADMIN',
            'password_hash': 'dummy_hash'
        }
    )
    
    # Create Patient
    patient, created = Patient.objects.get_or_create(
        name='Test Patient Notification',
        defaults={
            'age': 30,
            'gender': 'Male',
            'phone': '9998887776'
        }
    )
    
    # Create Visit
    visit_date = timezone.now().date() + timedelta(days=1)
    visit, created = Visit.objects.get_or_create(
        patient=patient,
        doctor=doctor_staff,
        visit_date=visit_date,
        defaults={
            'visit_type': 'OPD',
            'status': 'ACTIVE',
            'chief_complaint': 'Regular checkup',
            'slot_booked': '10:00 - 10:30'
        }
    )
    if created:
        print(f"Created visit for {visit_date}")
    else:
        print(f"Visit exists for {visit_date}")
        
    print("\nCredentials:")
    print("Doctor: doctor_test / password123")
    print("Reception: reception_test / password123")
    print(f"Visit ID: {visit.id}")

if __name__ == '__main__':
    create_test_users()
