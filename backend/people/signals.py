from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Staff

@receiver(post_save, sender=Staff)
def create_or_update_user_for_staff(sender, instance, created, **kwargs):
    """
    Syncs the Staff model with the Django Auth User model.
    Uses 'user_email' as the username and 'password_hash' as the password.
    """
    email = instance.user_email
    password = instance.password_hash  # Treating this as plain password input from Admin
    name = instance.name
    
    if not email:
        return

    # Check if User exists
    user, user_created = User.objects.get_or_create(username=email)
    
    # Update fields
    user.email = email
    user.first_name = name.split(' ')[0] if name else ''
    user.last_name = ' '.join(name.split(' ')[1:]) if name and ' ' in name else ''
    
    # Only set password if it is provided and (created or changed)
    # Note: Logic to detect password change in admin is tricky without older instance, 
    # but for now we basically Reset it to whatever is in 'password_hash' field of Staff.
    # This assumes 'password_hash' holds the PLAIN TEXT password intended to be set.
    if password and not password.startswith('pbkdf2_sha256$'): # Avoid re-hashing if already hashed (simple check)
        user.set_password(password)
    
    user.save()

from django.db.models import Sum
from .models import Bill, BillItem

@receiver(post_save, sender=BillItem)
@receiver(post_delete, sender=BillItem)
def update_bill_total(sender, instance, **kwargs):
    """
    Recalculate Bill total_amount whenever a BillItem is added, updated, or deleted.
    """
    bill = instance.bill
    if not bill:
        return

    # Calculate total
    total = bill.items.aggregate(total=Sum('amount'))['total'] or 0
    
    # Update bill
    bill.total_amount = total
    bill.save(update_fields=['total_amount'])
