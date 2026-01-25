from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Visit(models.Model):

    VISIT_TYPE_CHOICES = [
        ("OPD", "OPD"),
        ("IPD", "IPD"),
        ("EMERGENCY", "Emergency"),
    ]

    COLOR_CODING_CHOICES = [
        ("RED", "Red"),
        ("ORANGE", "Orange"),
        ("YELLOW", "Yellow"),
        ("GREEN", "Green"),
        ("BLACK", "Black"),
    ]

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
        ("ON_HOLD", "On Hold"),
        ("ON-HOLD", "On Hold"), # Support frontend variant
    ]

    patient = models.ForeignKey(
        "people.Patient",
        on_delete=models.CASCADE,
        related_name="visits"
    )

    doctor = models.ForeignKey(
        "people.Staff",
        on_delete=models.PROTECT,
        related_name="doctor_visits",
        limit_choices_to={'role': 'DOCTOR'}
    )

    visit_type = models.CharField(max_length=10, choices=VISIT_TYPE_CHOICES)
    color_coding = models.CharField(max_length=10, choices=COLOR_CODING_CHOICES, blank=True, null=True)
    visit_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="ACTIVE")
    slot_booked = models.CharField(max_length=20, null=True, blank=True, help_text="Time slot booked (e.g. '10:00 - 10:30')")
    chief_complaint = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Referral Fields
    referral_doctor = models.ForeignKey(
        "people.Staff",
        on_delete=models.SET_NULL,
        related_name="referral_visits",
        null=True,
        blank=True,
        limit_choices_to={'role': 'DOCTOR'},
        help_text="Internal doctor referral"
    )
    referral_external = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="External doctor/hospital referral"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Visit {self.id} - {self.patient.name} ({self.visit_type})"

    def clean(self):
        # Skip validation if required fields are missing (handled by field validation)
        # For partial updates, access existing instance values if not in self
        if not self.visit_date or not self.slot_booked:
             return

        # Ensure doctor is set (either from instance or assignment)
        # Note: self.doctor might throw RelatedObjectDoesNotExist if not assigned yet
        try:
             doctor = self.doctor
        except:
             return

        if self.visit_type == 'OPD' and doctor:
            # 1. Check if slot is in doctor's available slots template
            doctor_slots = self.doctor.available_slots or []
            if doctor_slots and self.slot_booked not in doctor_slots:
                 raise ValidationError({'slot_booked': f"Invalid slot. Available slots: {', '.join(doctor_slots)}"})
            
            # 2. Check if slot is already booked for this doctor on this day
            # Exclude self if editing
            qs = Visit.objects.filter(
                doctor=self.doctor, 
                visit_date=self.visit_date, 
                slot_booked=self.slot_booked
            ).exclude(pk=self.pk)
            
            if qs.exists():
                raise ValidationError({'slot_booked': f"Slot {self.slot_booked} is already booked for this date."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class Bed(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    BED_TYPE_CHOICES = [
        ('GENERAL', 'General Ward'),
        ('ICU', 'ICU'),
        ('OT', 'Operation Theater'),
    ]

    CLEANING_STATUS_CHOICES = [
        ('CLEANED', 'Cleaned'),
        ('NOT_CLEANED', 'Not Cleaned'),
        ('UNDER_CLEANING', 'Under Cleaning'),
    ]

    bed_id = models.BigAutoField(primary_key=True)
    ward = models.BigIntegerField()
    bed_number = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    bed_type = models.CharField(max_length=20, choices=BED_TYPE_CHOICES, default='GENERAL')
    cleaning_status = models.CharField(max_length=20, choices=CLEANING_STATUS_CHOICES, default='CLEANED') 

    def __str__(self):
        return f"{self.get_bed_type_display()} - Bed {self.bed_number} (Ward {self.ward}) [{self.get_cleaning_status_display()}]"

class Admission(models.Model):
    admission_id = models.BigAutoField(primary_key=True)
    visit = models.ForeignKey(
        Visit, 
        on_delete=models.CASCADE,
        related_name='admissions'
    )
    bed = models.ForeignKey(
        Bed,
        on_delete=models.PROTECT,
        related_name='admissions',
        null=True,
        blank=True
    )
    admission_date = models.DateTimeField()
    discharge_date = models.DateTimeField(null=True, blank=True)
    bed_price = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Admission {self.admission_id} - Visit {self.visit.id}"

    def save(self, *args, **kwargs):
        if self.bed and self.visit.visit_type == 'OPD':
            self.visit.visit_type = 'IPD'
            self.visit.save()

        # Handle Bed Status Updates
        if self.pk:
            try:
                old = Admission.objects.get(pk=self.pk)
                if old.bed and old.bed != self.bed:
                    # Bed changed, free the old one
                    old.bed.status = 'AVAILABLE'
                    old.bed.save()
            except Admission.DoesNotExist:
                pass

        if self.bed:
            if self.discharge_date:
                self.bed.status = 'AVAILABLE'
            else:
                self.bed.status = 'OCCUPIED'
            self.bed.save()

        super().save(*args, **kwargs)

class Patient(models.Model):
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    phone = models.CharField(max_length=10,unique=True)
    address = models.TextField(blank=True, null=True)
    
    aadhaar = models.CharField(max_length=20, blank=True, null=True) 
    uhid = models.CharField(max_length=20, unique=True, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    uniqueness = models.CharField(max_length=100, blank=True, null=True, help_text="Unique mark or identification on the patient")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new and not self.uhid:
            self.uhid = f"UHID{str(self.id).zfill(6)}"
            self.save()

    def __str__(self):
        return f"{self.name} ({self.gender}, {self.age}) - {self.uhid}"

class Allergy(models.Model):
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical')
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="allergies"
    )
    allergen = models.CharField(max_length=255) # e.g., Penicillin, Peanuts
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES, default='LOW')
    reaction = models.TextField(blank=True, null=True) # e.g., Rashes, Anaphylaxis
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.allergen} ({self.severity}) - {self.patient.name}"

class Staff(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('DOCTOR', 'Doctor'),
        ('RECEPTION', 'Reception'),
        ('NURSE', 'Nurse'),
        ('LAB_TECH', 'Lab_Tech'),
        ('BILLING', 'Billing'),
        ('PHARMACIST', 'Pharmacist'),
        ('SUPPORT', 'Support Staff'),
    ]

    DEPARTMENT_CHOICES = [
        ('ADMIN', 'Administration'),
        ('OPD', 'OPD'),
        ('IPD', 'IPD'),
        ('EMERGENCY', 'Emergency'),
        ('LAB', 'Lab'),
        ('BILLING', 'Billing'),
        ('PHARMACY', 'Pharmacy'),
        ('SUPPORT', 'Support'),
    ]

    DOCTOR_TYPE_CHOICES = [
        ('GENERAL_PHYSICIAN', 'General Physician'),
        ('CARDIOLOGIST', 'Cardiologist'),
        ('DERMATOLOGIST', 'Dermatologist'),
        ('ENT', 'ENT Specialist'),
        ('NEUROLOGIST', 'Neurologist'),
        ('GYNECOLOGIST', 'Gynecologist'),
        ('ORTHOPEDIC', 'Orthopedic Surgeon'),
        ('PEDIATRICIAN', 'Pediatrician'),
        ('PSYCHIATRIST', 'Psychiatrist'),
        ('SURGEON', 'General Surgeon'),
        ('UROLOGIST', 'Urologist'),
        ('OPHTHALMOLOGIST', 'Ophthalmologist'),
        ('DENTIST', 'Dentist'),
        ('ENDOCRINOLOGIST', 'Endocrinologist'),
        ('GASTROENTEROLOGIST', 'Gastroenterologist'),
        ('ONCOLOGIST', 'Oncologist'),
        ('PULMONOLOGIST', 'Pulmonologist'),
        ('NEPHROLOGIST', 'Nephrologist'),
        ('RHEUMATOLOGIST', 'Rheumatologist'),
        ('ANESTHESIOLOGIST', 'Anesthesiologist'),
        ('RADIOLOGIST', 'Radiologist'),
        ('PATHOLOGIST', 'Pathologist'),
    ]

    EXPERIENCE_CHOICES = [
        ('LESS_5', '<5 years'),
        ('5_10', '5-10 years'),
        ('MORE_10', '10+ years'),
    ]

    user_id = models.BigAutoField(primary_key=True)
    user_email = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    password_hash = models.CharField(max_length=255)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    is_active = models.BooleanField(default=True)

    # Personal Details
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Consultation fee (required for doctors only)"
    )

    doctor_type = models.CharField(
        max_length=50, 
        choices=DOCTOR_TYPE_CHOICES, 
        blank=True, 
        null=True,
        help_text="Type of doctor (Doctors only)"
    )

    experience_years = models.CharField(
        max_length=20, 
        choices=EXPERIENCE_CHOICES, 
        blank=True, 
        null=True,
        help_text="Years of experience (Doctors only)"
    )

    # Doctor Scheduling Fields
    shift_start = models.TimeField(null=True, blank=True, help_text="Shift start time (Doctors only)")
    shift_end = models.TimeField(null=True, blank=True, help_text="Shift end time (Doctors only)")
    break_start = models.TimeField(null=True, blank=True, help_text="Break start time (Doctors only)")
    break_end = models.TimeField(null=True, blank=True, help_text="Break end time (Doctors only)")
    available_slots = models.JSONField(null=True, blank=True, help_text="Auto-generated 30min slots template", default=list)

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Enforce: Doctors must have fee, others must not
        if self.role == 'DOCTOR':
            if self.fee is None:
                raise ValidationError({'fee': 'Fee is required for doctors.'})
            if not self.shift_start or not self.shift_end:
                 # Optional: enforce shift times for doctors or leave flexible
                 pass 
            
            # Enforce new fields for doctors
            # We can make them optional or required based on strictness. 
            # The prompt implies they "should be added", usually meaning they are relevant data.
            # Let's verify if we want to enforce them to be non-null. 
            # For now, let's just allow them to be set. validation below ensures only doctors have them.
            pass
        
        if self.role != 'DOCTOR':
            if self.fee is not None:
                raise ValidationError({'fee': 'Only doctors can have a fee.'})
            if any([self.shift_start, self.shift_end, self.break_start, self.break_end]):
                 raise ValidationError("Shift times are for doctors only.")
            if any([self.doctor_type, self.experience_years]):
                raise ValidationError("Doctor details (type, experience) are for doctors only.")

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Auto-generate slots if doctor and times are set
        if self.role == 'DOCTOR' and self.shift_start and self.shift_end:
            from datetime import datetime, timedelta, date
            
            slots = []
            
            # Helper to combine dummy date with time
            def to_dt(t): return datetime.combine(date.today(), t)
            
            current = to_dt(self.shift_start)
            end = to_dt(self.shift_end)
            
            # Handle overnight shifts (if end < start, assume end is next day)
            if end < current:
                end += timedelta(days=1)
                
            break_s = to_dt(self.break_start) if self.break_start else None
            break_e = to_dt(self.break_end) if self.break_end else None
            
            # If break wraps around midnight, handle it (simplified for now: assume standard day shift)
            
            while current + timedelta(minutes=30) <= end:
                slot_end = current + timedelta(minutes=30)
                
                # Check if slot overlaps with break
                in_break = False
                if break_s and break_e:
                    # Slot start inside break OR Slot end inside break OR Slot encompasses break
                    if (break_s <= current < break_e) or (break_s < slot_end <= break_e) or (current <= break_s and slot_end >= break_e):
                        in_break = True
                
                if not in_break:
                    slots.append(f"{current.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}")
                
                current = slot_end
            
            self.available_slots = slots
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.role})"


class Vital(models.Model):

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="vitals"
    )

    nurse = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="recorded_vitals",
        limit_choices_to={'role': 'NURSE'}
    )

    # Vitals data
    bp_systolic = models.PositiveSmallIntegerField()     # e.g. 120
    bp_diastolic = models.PositiveSmallIntegerField()    # e.g. 80
    pulse = models.PositiveSmallIntegerField()           # beats per minute
    temperature = models.DecimalField(max_digits=4, decimal_places=1)  # e.g. 98.6
    spo2 = models.PositiveSmallIntegerField()            # percentage (0–100)

    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Vitals for Visit {self.visit.id} at {self.recorded_at}"

class ClinicalNote(models.Model):
    note_id = models.BigAutoField(primary_key=True)
    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="clinical_notes"
    )
    NOTE_TYPE_CHOICES = [
        ("CLINICAL", "Clinical Note"),
        ("PROGRESS", "Progress Note"),
    ]

    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES, default="CLINICAL")
    
    doctor = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="clinical_notes",
        limit_choices_to={'role': 'DOCTOR'},
        null=True,
        blank=True
    )
    
    created_by = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="created_notes",
        null=True,
        blank=True
    )
    
    symptoms = models.TextField(null=True, blank=True)
    diagnosis = models.TextField(null=True, blank=True)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note {self.note_id} - Visit {self.visit.id}"

class Order(models.Model):

    ORDER_TYPE_CHOICES = [
        ("LAB", "Lab"),
        ("RADIOLOGY", "Radiology"),
        ("OPERATION", "Operation"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    doctor = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="orders_created",
        limit_choices_to={'role': 'DOCTOR'},
        null=False
    )

    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    ordered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.order_type} (Visit {self.visit.id})"


class LabTest(models.Model):

    STATUS_CHOICES = [
        ("ORDERED", "Ordered"),
        ("SAMPLE_COLLECTED", "Sample Collected"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    RESULT_CHOICES = [
        ("NORMAL", "Normal"),
        ("ABNORMAL", "Abnormal"),
        ("CRITICAL", "Critical"),
        ("INCONCLUSIVE", "Inconclusive"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="lab_tests",
        limit_choices_to={'order_type': 'LAB'}
    )

    test_name = models.CharField(max_length=100)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, blank=True, null=True)
    report_file = models.FileField(upload_to="lab_reports/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ORDERED")
    completed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    price = models.IntegerField(default=0)
    ai_summary = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"LabTest {self.test_name} (Order {self.order.id})"


class RadiologyTest(models.Model):

    STATUS_CHOICES = [
        ("ORDERED", "Ordered"),
        ("SCHEDULED", "Scheduled"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    RESULT_CHOICES = [
        ("NORMAL", "Normal"),
        ("ABNORMAL", "Abnormal"),
        ("CRITICAL", "Critical"),
        ("INCONCLUSIVE", "Inconclusive"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="radiology_tests",
        limit_choices_to={'order_type': 'RADIOLOGY'}
    )

    scan_type = models.CharField(max_length=100)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, blank=True, null=True)
    report_file = models.FileField(upload_to="radiology_reports/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ORDERED")
    completed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    price = models.IntegerField(default=0)
    ai_summary = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Radiology {self.scan_type} (Order {self.order.id})"

class Medicine(models.Model):
    medicine_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True) # e.g. Antibiotic, Analgesic
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    reorder_level = models.IntegerField(default=10) # Unique: proactive reordering
    
    @property
    def total_stock(self):
        return sum(batch.stock_qty for batch in self.batches.all())

    def __str__(self):
        return self.name

class MedicineBatch(models.Model):
    batch_id = models.BigAutoField(primary_key=True)
    medicine = models.ForeignKey(
        Medicine, 
        on_delete=models.CASCADE, 
        related_name='batches'
    )
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    stock_qty = models.IntegerField(default=0)
    received_qty = models.IntegerField(default=0) # Original quantity in this batch
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2) # Selling price
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Unique HIS Features
    is_recalled = models.BooleanField(default=False)
    recall_reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['expiry_date'] # Supporting FEFO (First Expiry First Out)

    def __str__(self):
        return f"{self.medicine.name} - Batch: {self.batch_number} (Exp: {self.expiry_date})"

class StockTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('PURCHASE', 'Purchase / GRN'),
        ('DISPENSE', 'Dispense to Patient'),
        ('RETURN', 'Patient Return'),
        ('ADJUSTMENT', 'Stock Adjustment'),
        ('EXPIRED', 'Expired / Discarded'),
    ]

    transaction_id = models.BigAutoField(primary_key=True)
    batch = models.ForeignKey(MedicineBatch, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField() # Positive for incoming, negative for outgoing
    reference_id = models.CharField(max_length=100, blank=True, null=True) # e.g. Prescription ID or GRN ID
    performed_by = models.ForeignKey(Staff, on_delete=models.PROTECT)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.quantity} for {self.batch.batch_number}"


class Prescription(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("DISPENSED", "Dispensed"),
        ("PARTIALLY_DISPENSED", "Partially Dispensed"),
        ("CANCELLED", "Cancelled"),
    ]

    prescription_id = models.BigAutoField(primary_key=True)
    visit = models.ForeignKey(
        Visit, 
        on_delete=models.CASCADE, 
        related_name='prescriptions'
    )
    medicine = models.ForeignKey(
        Medicine, 
        on_delete=models.PROTECT, 
        related_name='prescriptions'
    )
    dosage_per_day = models.IntegerField()
    duration = models.IntegerField()
    quantity = models.IntegerField(editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    dispensed_at = models.DateTimeField(null=True, blank=True)
    dispensed_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dispensed_prescriptions",
        limit_choices_to={'role': 'PHARMACIST'}
    )

    def save(self, *args, **kwargs):
        self.quantity = self.dosage_per_day * self.duration
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Prescription {self.prescription_id} - {self.medicine.name} (Visit {self.visit.id})"

class PrescriptionDispense(models.Model):
    dispense_id = models.BigAutoField(primary_key=True)
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name="dispenses"
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name="dispenses"
    )
    batch = models.ForeignKey(
        MedicineBatch,
        on_delete=models.PROTECT,
        related_name="dispenses",
        null=True, # Allowing null for legacy but making it preferred
        blank=True
    )
    quantity_dispensed = models.IntegerField()
    dispensed_by = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="prescription_dispenses",
        limit_choices_to={'role': 'PHARMACIST'}
    )
    dispensed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)


    def __str__(self):
        return f"Dispense {self.dispense_id} - Prescription {self.prescription.prescription_id} ({self.quantity_dispensed} units)"

class Operation(models.Model):
    STATUS_CHOICES = [
        ("SCHEDULED", "Scheduled"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
        ("POSTPONED", "Postponed"),
    ]

    RESULT_CHOICES = [
        ("SUCCESSFUL", "Successful"),
        ("COMPLICATIONS", "Complications"),
        ("FAILED", "Failed"),
    ]
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="operations",
        limit_choices_to={'order_type': 'OPERATION'},
    )
    
    operation_id = models.BigAutoField(primary_key=True)

    operation_name = models.CharField(max_length=255)
    surgeon = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="operations_performed",
        limit_choices_to={'role': 'DOCTOR'}
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="SCHEDULED")
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, blank=True, null=True)
    price = models.IntegerField(default=0)
    performed_at = models.DateTimeField(blank=True, null=True)
    operation_notes = models.TextField(blank=True, null=True) # Legacy field, prefer intra_op_notes
    post_op_file = models.FileField(upload_to="operation_reports/", blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)

    # New OT Lite Fields
    scheduled_time = models.DateTimeField(null=True, blank=True)
    ot_room = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. OT-1")
    checklist_data = models.JSONField(default=dict, blank=True, help_text="Stores Yes/No for safety checks")
    anesthesia_notes = models.TextField(blank=True, null=True)
    intra_op_notes = models.TextField(blank=True, null=True)
    consumables_used = models.JSONField(default=list, blank=True, help_text="List of items for billing")
    team_members = models.JSONField(default=dict, blank=True, help_text="Snapshot of staff involved")

    def __str__(self):
        return f"{self.operation_name} (Order {self.order.id})"

class Bill(models.Model):

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("NOT_PAID", "Not Paid"),
        ("PARTIALLY_PAID", "Partially Paid"),
        ("PAID", "Paid"),
        ("CANCELLED", "Cancelled"),
    ]

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="bills"
    )

    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    insurance_applied = models.BooleanField(default=False)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bill {self.id} (Visit {self.visit.id})"

class BillItem(models.Model):

    SERVICE_TYPE_CHOICES = [
        ("CONSULTATION", "Consultation"),
        ("LAB_TEST", "Lab Test"),
        ("RADIOLOGY_TEST", "Radiology Test"),
        ("OPERATION", "Operation"),
        ("BED", "Bed"),
        ("PHARMACY", "Pharmacy"),
        ("OT_CONSUMABLE", "OT Consumable"),
    ]

    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name="items"
    )

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="bill_items"
    )

    service_type = models.CharField(max_length=30, choices=SERVICE_TYPE_CHOICES)

    service_ref_id = models.BigIntegerField()  # NOT a FK (as per your requirement)

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"BillItem {self.id} - {self.service_type}"

class InsuranceClaim(models.Model):

    CLAIM_STATUS_CHOICES = [
        ("CREATED", "Created"),
        ("SUBMITTED", "Submitted"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("SETTLED", "Settled"),
    ]

    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name="insurance_claims"
    )

    provider_name = models.CharField(max_length=255)

    claim_status = models.CharField(
        max_length=20,
        choices=CLAIM_STATUS_CHOICES,
        default="CREATED"
    )

    submitted_date = models.DateField(blank=True, null=True)

    approved_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"Claim {self.id} - {self.provider_name}"

class Notification(models.Model):
    TYPE_CHOICES = [
        ('RESCHEDULE', 'Reschedule'),
        ('ALERT', 'Alert'),
        ('INFO', 'Info'),
    ]

    recipient = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type}: {self.title}"
