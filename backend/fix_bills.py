
import os
import django
import random
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'his.settings')
django.setup()

from people.models import Visit, Bill

def fix_bills():
    print("🔧 Fixing Bills...")
    
    # Get all visits from last 8 days
    visits = Visit.objects.all().order_by('-created_at')[:50]
    
    count = 0
    for v in visits:
        # Check if bill exists
        if not hasattr(v, 'bill'):
            try:
                amount = 800 if v.visit_type == 'OPD' else 25000
                b = Bill.objects.create(
                    visit=v,
                    total_amount=amount,
                    status='PAID'
                )
                Bill.objects.filter(id=b.id).update(created_at=v.created_at) # Sync dates
                count += 1
            except Exception as e:
                print(f"Error on visit {v.id}: {e}")
                
    print(f"✅ Created {count} missing bills.")

if __name__ == '__main__':
    fix_bills()
