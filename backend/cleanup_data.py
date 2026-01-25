
import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'his.settings')
django.setup()

from people.models import Patient, Visit, Bill

def cleanup_data():
    print("🧹 Starting Data Cleanup...")
    
    # 1. Delete "Test Patient X" (from seed_data.py)
    # 2. Delete "Demo Patient" names if any
    
    # Using istartswith to catch "Test Patient 1", "DUMMY", etc if patterned.
    # Based on seed_data.py, names were f"Test Patient {i}" and f"Demo Patient {i}"
    
    targets = Patient.objects.filter(name__startswith="Test Patient")
    count_1 = targets.count()
    targets.delete()
    
    targets_2 = Patient.objects.filter(name__startswith="Demo Patient") 
    count_2 = targets_2.count()
    targets_2.delete()
    
    print(f"✅ Deleted {count_1 + count_2} dummy patients.")
    print("   (Visits and Bills should cascade delete automatically)")

    # Verify if any bills remain without patients (orphan check, though cascade handles it)
    orphan_bills = Bill.objects.filter(visit__patient__isnull=True).count()
    if orphan_bills > 0:
        print(f"⚠️ Found {orphan_bills} orphan bills. Deleting...")
        Bill.objects.filter(visit__patient__isnull=True).delete()
        
    print("🎉 Cleanup Complete! Dashboard should be empty of demo data.")

if __name__ == '__main__':
    cleanup_data()
