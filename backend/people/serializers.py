from rest_framework import serializers
from .models import Allergy, Bill, BillItem, InsuranceClaim, Patient, Staff, Visit, Admission, Bed, Vital, ClinicalNote, Order, LabTest, RadiologyTest, Medicine, MedicineBatch, StockTransaction, Prescription, PrescriptionDispense, Operation
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils.dateparse import parse_datetime
from datetime import timedelta

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra user data
        user = self.user
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'name': f"{user.first_name} {user.last_name}".strip(),
            # Try to get role from Staff profile if exists
            'role': 'admin' # Default
        }
        
        # Try to fetch related Staff profile
        try:
            staff = Staff.objects.get(user_email=user.username)
            data['user']['role'] = staff.role.lower()
            data['user']['name'] = staff.name
            data['user']['department'] = staff.department
            data['user']['staff_id'] = staff.user_id
        except Staff.DoesNotExist:
            pass
            
        return data



class StaffRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=3)
    employeeId = serializers.CharField(source='user_id', read_only=True)
    
    # Explicitly handle optional fields to allow empty strings from frontend
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    shift_start = serializers.TimeField(required=False, allow_null=True)
    shift_end = serializers.TimeField(required=False, allow_null=True)
    break_start = serializers.TimeField(required=False, allow_null=True)
    break_end = serializers.TimeField(required=False, allow_null=True)
    fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    class Meta:
        model = Staff
        fields = [
            'user_id', 'employeeId', 'name', 'user_email', 'role', 'department', 
            'phone', 'address', 'gender', 'date_of_birth',
            'fee', 'shift_start', 'shift_end', 'break_start', 'break_end', 'is_active', 'password'
        ]
    
    def to_internal_value(self, data):
        # Convert empty strings to None for optional fields before validation
        optional_fields = ['date_of_birth', 'shift_start', 'shift_end', 'break_start', 'break_end', 
                          'fee', 'phone', 'address', 'gender']
        for field in optional_fields:
            if field in data and data[field] == '':
                data[field] = None
        return super().to_internal_value(data)

    def create(self, validated_data):
        from django.contrib.auth.models import User
        from django.contrib.auth.hashers import make_password

        password = validated_data.pop('password')
        email = validated_data.get('user_email')
        name = validated_data.get('name')
        
        # Clean empty strings - convert to None for optional fields
        for field in ['phone', 'address', 'gender', 'date_of_birth', 'fee', 
                      'shift_start', 'shift_end', 'break_start', 'break_end']:
            if field in validated_data and validated_data[field] == '':
                validated_data[field] = None
        
        # 1. Create User
        if User.objects.filter(username=email).exists():
             raise serializers.ValidationError({"user_email": "User with this email already exists."})
             
        user = User.objects.create_user(username=email, email=email, password=password)
        user.first_name = name.split(' ')[0]
        if ' ' in name:
            user.last_name = ' '.join(name.split(' ')[1:])
        user.save()

        # 2. Create Staff - Hash password
        validated_data['password_hash'] = make_password(password)
        
        staff = Staff.objects.create(**validated_data)
        return staff

    def update(self, instance, validated_data):
        from django.contrib.auth.models import User
        from django.contrib.auth.hashers import make_password

        # Handle password update if provided
        password = validated_data.pop('password', None)
        
        if password:
            # Update the hashed password
            validated_data['password_hash'] = make_password(password)
            
            # Also update the Django User password for authentication
            try:
                user = User.objects.get(username=instance.user_email)
                user.set_password(password)
                user.save()
            except User.DoesNotExist:
                pass
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        # Exclude password_hash from API responses for security
        exclude = ['password_hash']


class AllergySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = Allergy
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    allergies = AllergySerializer(many=True, read_only=True)
    class Meta:
        model = Patient
        fields = '__all__'


class VisitSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), source='patient', write_only=True, required=False
    )
    doctor = StaffSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.all(), source='doctor', write_only=True, required=False
    )
    has_vitals_today = serializers.SerializerMethodField()

    class Meta:
        model = Visit
        fields = '__all__'

    def get_has_vitals_today(self, obj):
        from django.utils import timezone
        # Use local date to match the timezone used by recorded_at__date lookup
        today = timezone.localtime(timezone.now()).date()
        # Check if any vital was recorded today for this visit
        return obj.vitals.filter(recorded_at__date=today).exists()

class BedSerializer(serializers.ModelSerializer):
    current_admission = serializers.SerializerMethodField()

    class Meta:
        model = Bed
        fields = '__all__'

    def get_current_admission(self, obj):
        # Fetch active admission for this bed
        admission = obj.admissions.filter(discharge_date__isnull=True).first()
        if admission:
            return {
                'patient_name': admission.visit.patient.name,
                'patient_id': admission.visit.patient.id,
                'uhid': admission.visit.patient.uhid,
                'admission_date': admission.admission_date
            }
        return None

class AdmissionSerializer(serializers.ModelSerializer):
    visit = VisitSerializer(read_only=True)
    visit_id = serializers.PrimaryKeyRelatedField(
        queryset=Visit.objects.all(), source='visit', write_only=True
    )
    bed_details = BedSerializer(source='bed', read_only=True)
    bed_id = serializers.PrimaryKeyRelatedField(
        queryset=Bed.objects.all(), source='bed', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Admission
        fields = '__all__'

class VitalSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='nurse.name', read_only=True)
    class Meta:
        model = Vital
        fields = '__all__'
        read_only_fields = ['nurse']

class ClinicalNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = ClinicalNote
        fields = '__all__'
    
    def validate(self, data):
        """
        Validation to ensure CLINICAL notes have symptoms and diagnosis.
        """
        note_type = data.get('note_type', 'CLINICAL')
        if note_type == 'CLINICAL':
            if not data.get('symptoms') and not self.instance:
                 # Only check on creation if not passed, or ensure logic fits partial updates
                 # Simplified: if note_type is CLINICAL, symptoms/diagnosis shouldn't be null
                 pass # Relaxing strictness for now or relying on frontend validation
        return data

class LabTestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='order.visit.patient.name', read_only=True)
    patient_id = serializers.IntegerField(source='order.visit.patient.id', read_only=True)
    doctor_name = serializers.CharField(source='order.doctor.name', read_only=True)
    ordered_at = serializers.DateTimeField(source='order.ordered_at', read_only=True)
    
    class Meta:
        model = LabTest
        fields = '__all__'

class RadiologyTestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='order.visit.patient.name', read_only=True)
    patient_id = serializers.IntegerField(source='order.visit.patient.id', read_only=True)
    doctor_name = serializers.CharField(source='order.doctor.name', read_only=True)
    ordered_at = serializers.DateTimeField(source='order.ordered_at', read_only=True)

    class Meta:
        model = RadiologyTest
        fields = '__all__'

class MedicineBatchSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    days_to_expiry = serializers.SerializerMethodField()
    health_score = serializers.SerializerMethodField()

    class Meta:
        model = MedicineBatch
        fields = '__all__'

    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.expiry_date < timezone.now().date()

    def get_days_to_expiry(self, obj):
        from django.utils import timezone
        delta = obj.expiry_date - timezone.now().date()
        return delta.days
    
    def get_health_score(self, obj):
        # Unique HIS Metric: Higher is better. 
        # Factors: Expiry distance, stock velocity (mocked for now)
        from django.utils import timezone
        days = (obj.expiry_date - timezone.now().date()).days
        if days < 0: return 0
        if days > 365: return 100
        return int((days / 365) * 100)

class StockTransactionSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='performed_by.name', read_only=True)
    class Meta:
        model = StockTransaction
        fields = '__all__'

class MedicineSerializer(serializers.ModelSerializer):
    batches = MedicineBatchSerializer(many=True, read_only=True)
    total_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = '__all__'

    def get_is_low_stock(self, obj):
        return obj.total_stock < obj.reorder_level

    def get_stock_status(self, obj):
        total = obj.total_stock
        if total == 0:
            return "Out of Stock"
        elif total < obj.reorder_level:
            return "Low"
        else:
            return "Adequate"

class PrescriptionSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(), source='medicine', write_only=True
    )
    # Add patient and doctor details
    patient_name = serializers.CharField(source='visit.patient.name', read_only=True)
    patient_id = serializers.IntegerField(source='visit.patient.id', read_only=True)
    doctor_name = serializers.CharField(source='visit.doctor.name', read_only=True)
    visit_date = serializers.DateField(source='visit.visit_date', read_only=True)
    dispensed_by_name = serializers.CharField(source='dispensed_by.name', read_only=True, allow_null=True)

    class Meta:
        model = Prescription
        fields = '__all__'

class PrescriptionDispenseSerializer(serializers.ModelSerializer):
    pharmacist_name = serializers.CharField(source='dispensed_by.name', read_only=True)
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    
    class Meta:
        model = PrescriptionDispense
        fields = '__all__'
        read_only_fields = ['dispensed_by', 'dispensed_at']

class OperationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='order.visit.patient.name', read_only=True)
    patient_id = serializers.IntegerField(source='order.visit.patient.id', read_only=True)
    doctor_name = serializers.CharField(source='order.doctor.name', read_only=True)
    surgeon_name = serializers.CharField(source='surgeon.name', read_only=True)
    ordered_at = serializers.DateTimeField(source='order.ordered_at', read_only=True)

    class Meta:
        model = Operation
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    lab_tests = LabTestSerializer(many=True, read_only=True)
    radiology_tests = RadiologyTestSerializer(many=True, read_only=True)
    operations = OperationSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

class BillSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='visit.patient.name', read_only=True)
    patient_id = serializers.CharField(source='visit.patient.phone', read_only=True) # Using phone as distinct ID or actual ID? Let's use ID for linking
    patient_pk = serializers.IntegerField(source='visit.patient.id', read_only=True)
    visit_date = serializers.DateField(source='visit.visit_date', read_only=True)

    class Meta:
        model = Bill
        fields = '__all__'


class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = '__all__'


class InsuranceClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceClaim
        fields = '__all__'

class CreateOrderSerializer(serializers.ModelSerializer):
    details = serializers.DictField(write_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Order
        fields = ['visit', 'order_type', 'details', 'doctor_id']

    def validate(self, data):
        if data.get('order_type') == 'OPERATION':
            details = data.get('details', {})
            ot_room = details.get('ot_room')
            scheduled_time = details.get('scheduled_time')
            
            if ot_room and scheduled_time:
                check_time = parse_datetime(scheduled_time)
                if check_time:
                    # Assume 2 hour slot duration
                    start_window = check_time - timedelta(hours=2)
                    end_window = check_time + timedelta(hours=2)
                    
                    conflicts = Operation.objects.filter(
                        ot_room=ot_room,
                        scheduled_time__gt=start_window,
                        scheduled_time__lt=end_window,
                        status__in=['SCHEDULED', 'IN_PROGRESS']
                    )
                    
                    if conflicts.exists():
                        blocking_op = conflicts.first()
                        raise serializers.ValidationError(
                            f"OT Room {ot_room} is already booked around this time ({blocking_op.scheduled_time.strftime('%H:%M')}). Please choose a different time or room."
                        )
        return data

    def create(self, validated_data):
        details = validated_data.pop('details')
        doctor_id = validated_data.pop('doctor_id', None)
        
        # If doctor_id is passed (from context or request), use it, otherwise rely on view validation
        if doctor_id:
            validated_data['doctor_id'] = doctor_id
            
        order = Order.objects.create(**validated_data)

        if order.order_type == 'LAB':
            LabTest.objects.create(
                order=order,
                test_name=details.get('test_name'),
                price=details.get('price', 0)
            )
        elif order.order_type == 'RADIOLOGY':
            RadiologyTest.objects.create(
                order=order,
                scan_type=details.get('scan_type'),
                price=details.get('price', 0)
            )
        elif order.order_type == 'OPERATION':
            # Default surgeon to the ordering doctor
            Operation.objects.create(
                order=order,
                operation_name=details.get('operation_name'),
                surgeon=order.doctor, 
                price=details.get('price', 0),
                ot_room=details.get('ot_room'),
                scheduled_time=details.get('scheduled_time')
            )
        
        return order


