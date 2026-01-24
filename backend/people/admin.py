from django.contrib import admin
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import  Bill, BillItem, InsuranceClaim ,Patient, Staff, Visit, Bed, Admission, Vital, ClinicalNote, Order, LabTest, RadiologyTest, Medicine, MedicineBatch, StockTransaction, Prescription, PrescriptionDispense, Operation


class StaffAdminForm(forms.ModelForm):
    """Custom form to handle password input in Django admin"""
    password = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        help_text="Leave blank to keep current password (for updates). Required for new staff."
    )
    
    class Meta:
        model = Staff
        exclude = ('password_hash',)
    
    def clean_password(self):
        password = self.cleaned_data.get('password')
        # Require password for new staff
        if not self.instance.pk and not password:
            raise forms.ValidationError("Password is required for new staff members.")
        return password
    
    def save(self, commit=True):
        staff = super().save(commit=False)
        password = self.cleaned_data.get('password')
        
        if password:
            # Hash the password
            staff.password_hash = make_password(password)
            
            # Create or update Django User for authentication
            if staff.pk:  # Updating existing staff
                try:
                    user = User.objects.get(username=staff.user_email)
                    user.set_password(password)
                    user.save()
                except User.DoesNotExist:
                    # Create user if it doesn't exist
                    user = User.objects.create_user(
                        username=staff.user_email,
                        email=staff.user_email,
                        password=password
                    )
                    user.first_name = staff.name.split(' ')[0]
                    if ' ' in staff.name:
                        user.last_name = ' '.join(staff.name.split(' ')[1:])
                    user.save()
            else:  # Creating new staff
                # Create Django User
                user = User.objects.create_user(
                    username=staff.user_email,
                    email=staff.user_email,
                    password=password
                )
                user.first_name = staff.name.split(' ')[0]
                if ' ' in staff.name:
                    user.last_name = ' '.join(staff.name.split(' ')[1:])
                user.save()
        elif not staff.pk:
            # New staff without password - should not happen due to clean_password
            raise forms.ValidationError("Password is required for new staff.")
        
        if commit:
            staff.save()
        return staff


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    form = StaffAdminForm
    list_display = ('user_id', 'name', 'user_email', 'role', 'department', 'shift_start', 'shift_end', 'is_active')
    search_fields = ('name', 'user_email')
    list_filter = ('role', 'department', 'is_active')
    readonly_fields = ('available_slots',) # Make auto-generated slots readonly
    # password_hash is excluded via the form


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'age', 'gender', 'phone', 'created_at')
    list_filter = ('gender', 'created_at')
    search_fields = ('name', 'phone')
    ordering = ('-created_at',)


from django import forms

class VisitAdminForm(forms.ModelForm):
    class Meta:
        model = Visit
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If we have an instance with a doctor, try to limit choices?
        # Standard ChoiceField is static. We can't easily dynamic-update without JS.
        # But we can at least Show the available slots in help_text.
        instance = getattr(self, 'instance', None)
        if instance and instance.pk and instance.doctor:
             slots = instance.doctor.available_slots or []
             self.fields['slot_booked'].help_text = f"Available Template: {', '.join(slots)}"

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    form = VisitAdminForm
    list_display = ('id', 'patient', 'doctor', 'visit_type', 'status', 'visit_date', 'slot_booked')
    list_filter = ('visit_type', 'status', 'visit_date', 'slot_booked')
    search_fields = ('patient__name', 'doctor__name')

@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ('bed_id', 'ward', 'bed_number', 'status')
    list_filter = ('status', 'ward')
    search_fields = ('ward', 'bed_number')

@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ('admission_id', 'visit', 'bed', 'admission_date', 'discharge_date', 'bed_price')
    list_filter = ('admission_date',)
    search_fields = ('visit__patient__name',)

@admin.register(Vital)
class VitalAdmin(admin.ModelAdmin):
    list_display = ('id', 'visit', 'nurse', 'bp_systolic', 'bp_diastolic', 'pulse', 'spo2', 'recorded_at')
    list_filter = ('recorded_at',)

@admin.register(ClinicalNote)
class ClinicalNoteAdmin(admin.ModelAdmin):
    list_display = ('note_id', 'visit', 'doctor', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('visit__patient__name', 'doctor__name')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'visit', 'doctor', 'order_type', 'status', 'ordered_at')
    list_filter = ('order_type', 'status')

@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'test_name', 'order', 'status', 'result', 'price', 'completed_at')
    list_filter = ('status', 'result')


@admin.register(RadiologyTest)
class RadiologyTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'scan_type', 'order', 'status', 'result', 'price', 'completed_at')
    list_filter = ('status', 'result')

class MedicineBatchInline(admin.TabularInline):
    model = MedicineBatch
    extra = 1

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('medicine_id', 'name', 'generic_name', 'total_stock', 'reorder_level')
    search_fields = ('name', 'generic_name')
    inlines = [MedicineBatchInline]

@admin.register(MedicineBatch)
class MedicineBatchAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'medicine', 'stock_qty', 'expiry_date', 'unit_price', 'is_recalled')
    list_filter = ('expiry_date', 'is_recalled')
    search_fields = ('batch_number', 'medicine__name')

@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'batch', 'transaction_type', 'quantity', 'timestamp', 'performed_by')
    list_filter = ('transaction_type', 'timestamp')

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('prescription_id', 'visit', 'medicine', 'dosage_per_day', 'duration', 'quantity')
    search_fields = ('visit__patient__name', 'medicine__name')

@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ('operation_id', 'operation_name', 'order', 'surgeon', 'status', 'result', 'price', 'performed_at')
    list_filter = ('status', 'result')
    search_fields = ('operation_name', 'surgeon__name')

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('id', 'visit', 'total_amount', 'insurance_applied', 'status', 'created_at')
    list_filter = ('status', 'insurance_applied')


@admin.register(BillItem)
class BillItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'bill', 'visit', 'service_type', 'service_ref_id', 'amount')
    list_filter = ('service_type',)


@admin.register(InsuranceClaim)
class InsuranceClaimAdmin(admin.ModelAdmin):
    list_display = ('id', 'bill', 'provider_name', 'claim_status', 'submitted_date', 'approved_amount')
    list_filter = ('claim_status',)
