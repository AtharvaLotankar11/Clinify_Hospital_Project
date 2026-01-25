
import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'his.settings')
django.setup()

from people.models import Patient, Staff, Visit, Bill

def populate_data():
    print("🚀 Starting Data Population (Robust Mode)...")

    # 1. Get Doctors
    doctors = list(Staff.objects.filter(role='DOCTOR'))
    if not doctors:
        print("❌ No doctors found! Please create a doctor first via Admin Panel or Register API.")
        return

    # 2. Get or Create Patients
    patients = []
    for i in range(10):
        try:
            p, created = Patient.objects.get_or_create(
                phone=f"99999999{i:02d}",
                defaults={
                    'name': f"Demo Patient {i}",
                    'age': random.randint(20, 60),
                    'gender': random.choice(['Male', 'Female']),
                    'address': 'Mumbai'
                }
            )
            patients.append(p)
        except Exception as e:
            print(f"Skipping patient {i}: {e}")

    if not patients:
        # Try fetching existing
        patients = list(Patient.objects.all())
        
    if not patients:
        print("❌ Could not find or create any patients.")
        return

    # 3. Generate Historical Data
    end_date = timezone.now()
    start_date = end_date - timedelta(days=7)

    visits_created = 0
    bills_created = 0

    for i in range(8): # Last 7 days + today
        current_date = start_date + timedelta(days=i)
        
        # 5 to 10 visits per day
        daily_visits = random.randint(5, 10)
        
        for _ in range(daily_visits):
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            visit_type = random.choice(['OPD', 'OPD', 'IPD']) 
            
            try:
                # Create Visit (Bypassing some potential validation by using direct create if possible, 
                # but models usually run clean() on save() only if explicitly called or using ModelForm. 
                # Objects.create() usually skips full_clean() unless overridden.)
                
                visit = Visit.objects.create(
                    patient=patient,
                    doctor=doctor,
                    visit_type=visit_type,
                    visit_date=current_date.date(),
                    slot_booked="10:00 - 10:30", # Using a standard format
                    chief_complaint="Demo Symptom",
                    status='COMPLETED'
                )
                
                # Forcefully update created_at (Django auto_now_add makes it read-only mostly)
                Visit.objects.filter(id=visit.id).update(created_at=current_date)
                
                visits_created += 1

                # Create Bill
                amount = random.randint(500, 1500) if visit_type == 'OPD' else random.randint(20000, 50000)
                bill = Bill.objects.create(
                    visit=visit,
                    total_amount=amount,
                    status='PAID',
                    payment_mode='CASH'
                )
                Bill.objects.filter(id=bill.id).update(created_at=current_date)
                bills_created += 1
                
            except Exception as e:
                # print(f"  Error creating visit: {e}")
                pass

    print(f"✅ Successfully seeded {visits_created} Visits & {bills_created} Bills.")
    print("Graphs should now be populated!")

if __name__ == '__main__':
    populate_data()
