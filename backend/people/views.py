from rest_framework import filters, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework import permissions
from django.utils import timezone
from django.db.models import Sum, Count
from decimal import Decimal
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings
import random
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Allergy, Bill, BillItem, InsuranceClaim, Patient, Staff, Visit, Admission, Bed, Vital, ClinicalNote, Order, LabTest, RadiologyTest, Medicine, MedicineBatch, StockTransaction, Prescription, PrescriptionDispense, Operation
from .serializers import AllergySerializer, BillSerializer, BillItemSerializer, InsuranceClaimSerializer, PatientSerializer, StaffSerializer, StaffRegistrationSerializer, VisitSerializer, AdmissionSerializer, BedSerializer, VitalSerializer, ClinicalNoteSerializer,OrderSerializer, LabTestSerializer, RadiologyTestSerializer, MedicineSerializer, MedicineBatchSerializer, StockTransactionSerializer, PrescriptionSerializer, PrescriptionDispenseSerializer, OperationSerializer, CreateOrderSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class PatientAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, action=None):
        if action == 'send-otp':
            email = request.data.get('email')
            if not email:
                return Response({'error': 'Email is required'}, status=400)
            
            try:
                # Use filter().first() to avoid MultipleObjectsReturned error
                patient = Patient.objects.filter(email=email).first()
                if not patient:
                    return Response({'error': 'No patient found with this email. Please contact support.'}, status=404)
            except Exception as e:
                return Response({'error': 'Database error occurred'}, status=500)
            
            otp = str(random.randint(100000, 999999))
            try:
                cache.set(f"otp_{email}", otp, timeout=300) # 5 minutes
            except Exception as e:
                print(f"Cache Error: {e}")
                # Fallback: Can't really proceed without cache unless we store in DB, 
                # but for now let's return error so frontend knows.
                return Response({'error': 'System error: Unable to generate OTP. Support notified.'}, status=500)
            
            import threading
            from django.core.mail import EmailMessage
            
            def send_otp_email():
                try:
                    msg = EmailMessage(
                        subject=f'Login OTP: {otp}',
                        body=f'Dear {patient.name},\n\nYour security code is: {otp}',
                        from_email=settings.EMAIL_HOST_USER,
                        to=[email]
                    )
                    msg.send(fail_silently=True)
                except Exception as e:
                     print(f"Mail Error: {e}")

            try:
                thread = threading.Thread(target=send_otp_email, daemon=True)
                thread.start()
            except Exception as e:
                send_otp_email()
            
            return Response({'message': 'OTP sent successfully'})

        elif action == 'verify-otp':
            email = request.data.get('email')
            otp = request.data.get('otp')
            
            if not email or not otp:
                return Response({'error': 'Email and OTP are required'}, status=400)
            
            cached_otp = cache.get(f"otp_{email}")
            if cached_otp and str(cached_otp) == str(otp):
                cache.delete(f"otp_{email}")
                
                try:
                    patient = Patient.objects.get(email=email)
                    
                    # Ensure a User object exists for this patient for JWT authentication
                    from django.contrib.auth.models import User
                    user, created = User.objects.get_or_create(
                        username=f"p_{patient.uhid}", 
                        email=email,
                        defaults={'first_name': patient.name}
                    )
                    
                    refresh = RefreshToken.for_user(user)
                    
                    return Response({
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': {
                            'id': patient.id,
                            'name': patient.name,
                            'role': 'patient',
                            'email': patient.email,
                            'uhid': patient.uhid
                        }
                    })
                except Patient.DoesNotExist:
                    return Response({'error': 'Patient not found'}, status=404)
            
            return Response({'error': 'Invalid or expired OTP'}, status=400)
        
        return Response({'error': 'Invalid action'}, status=400)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class StaffViewSet(ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return StaffRegistrationSerializer
        return StaffSerializer

    def get_queryset(self):
        queryset = Staff.objects.all()
        role = self.request.query_params.get('role')
        if role is not None:
            queryset = queryset.filter(role=role)
        return queryset

    def perform_destroy(self, instance):
        # Also delete the associated Django User
        from django.contrib.auth.models import User
        from django.db.models import ProtectedError
        from rest_framework.exceptions import ValidationError

        try:
            # First try to delete the instance to check for protection
            # We wrap this because if Staff delete fails, we shouldn't delete the User yet
            # But wait, if we delete instance first, the User remains orphan if we fail?
            # Actually, User is not linked by FK in model, so order matters less for DB constraints,
            # but logically we should ensure Staff can be deleted.
            
            # Better approach: Check if deletable?
            # Or just wrap both? 
            # If Staff is protected, instance.delete() raises ProtectedError. User is untouched.
            # If Staff deletes, then we delete User.
            
            instance.delete()
            
            try:
                user = User.objects.get(username=instance.user_email)
                user.delete()
            except User.DoesNotExist:
                pass
                
        except ProtectedError as e:
            raise ValidationError(
                {"detail": "Cannot delete this user because they are linked to other records (e.g. Visits, Operations). Please deactivate them instead."}
            )
        except Exception as e:
            # Catch unexpected errors to avoid 500
            print(f"Delete Error: {str(e)}") # Log to console
            raise ValidationError(
                {"detail": f"Deletion failed: {str(e)}"}
            )


class PatientViewSet(ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'id', 'uhid']


class VisitViewSet(ModelViewSet):
    serializer_class = VisitSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['patient__name', 'patient__uhid', 'patient__phone']

    def get_queryset(self):
        user = self.request.user
        # By default return all
        queryset = Visit.objects.all()
        
        # Check if filtering by patient (client side uses ?patient=ID but DRF uses ?search for full text, or ?patient=ID for exact filter)
        # We should support basic filtering too if needed, but search covers 'search'.
        # However, createVisit uses `visitAPI.getAll({ patient: patient.id })`. 
        # Django Filter Backend is needed for query params like `patient=...`.
        # Standard DRF doesn't filter fields by query param automatically unless `django-filter` is installed and configured.
        # But `VitalViewSet` does manual filtering. Let's add manual filtering here too if needed, or assume defaults.
        # Given previous code worked, `VisitViewSet` likely didn't support ?patient=ID filter explicitly? 
        # Actually my previous summary said "Verify backend visitAPI.getAll..".
        # Let's add manual filtering for `patient` param just in case.
        
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if user.is_authenticated:
            try:
                # Match Django User username (email) with Staff user_email
                staff = Staff.objects.get(user_email=user.username)
                # if staff.role == 'DOCTOR':
                #    queryset = queryset.filter(doctor=staff)
            except Staff.DoesNotExist:
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def booked_slots(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')
        
        if not doctor_id or not date:
            return Response({'error': 'doctor_id and date are required'}, status=400)
            
        booked = Visit.objects.filter(
            doctor_id=doctor_id, 
            visit_date=date
        ).exclude(status='CANCELLED').values_list('slot_booked', flat=True)
        
        return Response(list(booked))

class AdmissionViewSet(ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['visit__patient__name', 'visit__patient__uhid']

class BedViewSet(ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer

class VitalViewSet(ModelViewSet):
    queryset = Vital.objects.all()
    serializer_class = VitalSerializer

    def get_queryset(self):
        queryset = Vital.objects.all()
        visit_id = self.request.query_params.get('visit')
        patient_id = self.request.query_params.get('patient')
        
        if visit_id is not None:
            queryset = queryset.filter(visit_id=visit_id)
        
        if patient_id is not None:
            queryset = queryset.filter(visit__patient_id=patient_id)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        try:
            staff = Staff.objects.get(user_email=user.username)
            serializer.save(nurse=staff)
        except Staff.DoesNotExist:
             raise serializers.ValidationError({"nurse": "User is not a staff member"})

class ClinicalNoteViewSet(ModelViewSet):
    queryset = ClinicalNote.objects.all()
    serializer_class = ClinicalNoteSerializer

    def get_queryset(self):
        queryset = ClinicalNote.objects.all().order_by('-created_at')
        visit_id = self.request.query_params.get('visit')
        patient_id = self.request.query_params.get('patient')
        note_type = self.request.query_params.get('note_type')
        
        if visit_id is not None:
            queryset = queryset.filter(visit_id=visit_id)
        if patient_id is not None:
            queryset = queryset.filter(visit__patient_id=patient_id)
        if note_type is not None:
            queryset = queryset.filter(note_type=note_type)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        try:
            staff = Staff.objects.get(user_email=user.username)
            # If it's a doctor, set doctor field for backward compatibility or CLINICAL notes
            if staff.role == 'DOCTOR':
                 serializer.save(created_by=staff, doctor=staff)
            else:
                 serializer.save(created_by=staff)
        except Staff.DoesNotExist:
             # Fallback or error? For now allow but won't have created_by
             serializer.save()

class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        queryset = Order.objects.all()
        visit_id = self.request.query_params.get('visit')
        patient_id = self.request.query_params.get('patient')

        if visit_id is not None:
            queryset = queryset.filter(visit_id=visit_id)
        
        if patient_id is not None:
            queryset = queryset.filter(visit__patient_id=patient_id)
            
        return queryset

    def perform_create(self, serializer):
        # Auto-assign doctor based on authenticated user
        user = self.request.user
        try:
            staff = Staff.objects.get(user_email=user.username)
            serializer.save(doctor=staff)
        except Staff.DoesNotExist:
            raise serializers.ValidationError({"doctor": "User is not a staff member"})

class LabTestViewSet(ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['test_name', 'status']

    def get_queryset(self):
        queryset = LabTest.objects.all()
        patient_id = self.request.query_params.get('patient')
        status = self.request.query_params.get('status')
        if patient_id:
            queryset = queryset.filter(order__visit__patient_id=patient_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class RadiologyTestViewSet(ModelViewSet):
    queryset = RadiologyTest.objects.all()
    serializer_class = RadiologyTestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['scan_type', 'status']

    def get_queryset(self):
        queryset = RadiologyTest.objects.all()
        patient_id = self.request.query_params.get('patient')
        status = self.request.query_params.get('status')
        if patient_id:
            queryset = queryset.filter(order__visit__patient_id=patient_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

class MedicineBatchViewSet(ModelViewSet):
    queryset = MedicineBatch.objects.all()
    serializer_class = MedicineBatchSerializer

    @action(detail=True, methods=['get'])
    def traceability(self, request, pk=None):
        """Unique HIS Feature: Trace all patients who received this batch"""
        batch = self.get_object()
        dispenses = PrescriptionDispense.objects.filter(batch=batch).select_related('prescription__visit__patient')
        
        patients = []
        for d in dispenses:
            patient = d.prescription.visit.patient
            patients.append({
                'patient_name': patient.name,
                'uhid': patient.uhid,
                'phone': patient.phone,
                'dispensed_at': d.dispensed_at,
                'quantity': d.quantity_dispensed
            })
        
        return Response({
            'batch_number': batch.batch_number,
            'medicine': batch.medicine.name,
            'patients_affected': patients
        })

class StockTransactionViewSet(ModelViewSet):
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer

class MedicineViewSet(ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get medicines where total stock is less than reorder level"""
        medicines = Medicine.objects.all()
        low_stock_list = [m for m in medicines if m.total_stock < m.reorder_level]
        serializer = self.get_serializer(low_stock_list, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get advanced pharmacy statistics across batches"""
        from django.utils import timezone
        today = timezone.now().date()
        
        total_medicines = Medicine.objects.count()
        batches = MedicineBatch.objects.all()
        
        low_stock_count = sum(1 for m in Medicine.objects.all() if m.total_stock < m.reorder_level)
        expired_count = batches.filter(expiry_date__lt=today).count()
        expiring_soon_count = batches.filter(expiry_date__gte=today, expiry_date__lte=today + timezone.timedelta(days=30)).count()
        
        total_value = sum(b.stock_qty * b.unit_price for b in batches)
        
        return Response({
            'total_medicines': total_medicines,
            'active_batches': batches.count(),
            'low_stock_count': low_stock_count,
            'expired_count': expired_count,
            'expiring_soon_count': expiring_soon_count,
            'inventory_valuation': total_value
        })

class PrescriptionViewSet(ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = Prescription.objects.all().select_related(
            'visit__patient', 'visit__doctor', 'medicine', 'dispensed_by'
        )
        visit_id = self.request.query_params.get('visit')
        status = self.request.query_params.get('status')
        patient_id = self.request.query_params.get('patient')
        
        if visit_id is not None:
            queryset = queryset.filter(visit_id=visit_id)
        if status is not None:
            queryset = queryset.filter(status=status)
        if patient_id is not None:
            queryset = queryset.filter(visit__patient_id=patient_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending prescriptions"""
        pending_prescriptions = self.get_queryset().filter(status='PENDING').order_by('-created_at')
        serializer = self.get_serializer(pending_prescriptions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dispense(self, request, pk=None):
        """Dispense a prescription and update stock"""
        prescription = self.get_object()
        
        # Validate prescription status
        if prescription.status == 'DISPENSED':
            return Response(
                {'error': 'Prescription has already been dispensed'},
                status=http_status.HTTP_400_BAD_REQUEST
            )
        
        if prescription.status == 'CANCELLED':
            return Response(
                {'error': 'Cannot dispense cancelled prescription'},
                status=http_status.HTTP_400_BAD_REQUEST
            )
        
        # Get quantity and batch
        quantity_to_dispense = request.data.get('quantity_dispensed', prescription.quantity)
        batch_id = request.data.get('batch_id')
        notes = request.data.get('notes', '')
        
        # Get authenticated pharmacist
        try:
            pharmacist = Staff.objects.get(user_email=request.user.username)
        except Staff.DoesNotExist:
            return Response({'error': 'Pharmacist record not found'}, status=403)

        if batch_id:
            batch = get_object_or_404(MedicineBatch, pk=batch_id)
        else:
            # FEFO Auto-selection if no batch specified
            batch = MedicineBatch.objects.filter(
                medicine=prescription.medicine, 
                stock_qty__gte=quantity_to_dispense,
                expiry_date__gt=timezone.now().date()
            ).order_by('expiry_date').first()
            
            if not batch:
                return Response({'error': 'No valid batches available with sufficient stock'}, status=400)

        # Check stock availability
        if batch.stock_qty < quantity_to_dispense:
            return Response(
                {
                    'error': f'Batch {batch.batch_number} has insufficient stock',
                    'available': batch.stock_qty,
                    'required': quantity_to_dispense
                },
                status=http_status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Update batch stock
        batch.stock_qty -= quantity_to_dispense
        batch.save()
        
        # 2. Create Stock Transaction
        StockTransaction.objects.create(
            batch=batch,
            transaction_type='DISPENSE',
            quantity=-quantity_to_dispense,
            reference_id=f"Presc-{prescription.prescription_id}",
            performed_by=pharmacist,
            notes=notes
        )
        
        # 3. Create dispense record
        PrescriptionDispense.objects.create(
            prescription=prescription,
            medicine=prescription.medicine,
            batch=batch,
            quantity_dispensed=quantity_to_dispense,
            dispensed_by=pharmacist,
            notes=notes
        )
        
        # 4. Update prescription status
        if quantity_to_dispense >= (prescription.quantity - sum(d.quantity_dispensed for d in prescription.dispenses.all())):
            prescription.status = 'DISPENSED'
        else:
            prescription.status = 'PARTIALLY_DISPENSED'
        
        prescription.dispensed_at = timezone.now()
        prescription.dispensed_by = pharmacist
        prescription.save()
        
        return Response(self.get_serializer(prescription).data)


from .permissions import IsDoctorOrNurse
from rest_framework.permissions import IsAuthenticated

class OperationViewSet(ModelViewSet):
    queryset = Operation.objects.all()
    serializer_class = OperationSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]

    def get_queryset(self):
        queryset = Operation.objects.all()
        patient_id = self.request.query_params.get('patient')
        visit_id = self.request.query_params.get('visit')
        
        if patient_id is not None:
            queryset = queryset.filter(order__visit__patient_id=patient_id)
            
        if visit_id is not None:
            queryset = queryset.filter(order__visit_id=visit_id)
            
        return queryset

class PrescriptionDispenseViewSet(ModelViewSet):
    queryset = PrescriptionDispense.objects.all()
    serializer_class = PrescriptionDispenseSerializer

    def get_queryset(self):
        queryset = PrescriptionDispense.objects.all().select_related(
            'prescription', 'medicine', 'dispensed_by'
        )
        prescription_id = self.request.query_params.get('prescription')
        pharmacist_id = self.request.query_params.get('pharmacist')
        
        if prescription_id is not None:
            queryset = queryset.filter(prescription_id=prescription_id)
        if pharmacist_id is not None:
            queryset = queryset.filter(dispensed_by_id=pharmacist_id)
            
        return queryset.order_by('-dispensed_at')

class BillViewSet(ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer

    def get_queryset(self):
        queryset = Bill.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(visit__patient_id=patient_id)
        return queryset

    @action(detail=False, methods=['get'])
    def pending_items(self, request):
        """
        Get all unbilled items per patient
        """
        patient_id = request.query_params.get('patient_id')

        pending = {}

        def add_item(p_id, p_name, item):
            # If filtering by patient, skip others (double check)
            if patient_id and str(p_id) != str(patient_id):
                return

            if p_id not in pending:
                pending[p_id] = {
                    'patientId': p_id,
                    'patientName': p_name,
                    'items': [],
                    'totalAmount': Decimal('0')
                }
            pending[p_id]['items'].append(item)
            # Convert price to Decimal to avoid type mismatch
            price = item.get('price', 0)
            pending[p_id]['totalAmount'] += Decimal(str(price)) if price else Decimal('0')

        # Helper to filter by patient
        def filter_by_patient(queryset, patient_field):
            if patient_id:
                return queryset.filter(**{patient_field: patient_id})
            return queryset

        # 1. Lab Tests
        lab_tests = LabTest.objects.filter(status='COMPLETED')
        lab_tests = filter_by_patient(lab_tests, 'order__visit__patient_id')
        billed_lab_ids = BillItem.objects.filter(service_type='LAB_TEST').values_list('service_ref_id', flat=True)
        
        for test in lab_tests:
            if test.id not in billed_lab_ids:
                add_item(test.order.visit.patient.id, test.order.visit.patient.name, {
                    'type': 'LAB_TEST',
                    'id': test.id,
                    'name': test.test_name,
                    'price': float(test.price),
                    'date': test.completed_at,
                    'visitId': test.order.visit.id
                })

        # 2. Radiology Tests
        rad_tests = RadiologyTest.objects.filter(status='COMPLETED')
        rad_tests = filter_by_patient(rad_tests, 'order__visit__patient_id')
        billed_rad_ids = BillItem.objects.filter(service_type='RADIOLOGY_TEST').values_list('service_ref_id', flat=True)

        for test in rad_tests:
            if test.id not in billed_rad_ids:
                 add_item(test.order.visit.patient.id, test.order.visit.patient.name, {
                    'type': 'RADIOLOGY_TEST',
                    'id': test.id,
                    'name': test.scan_type,
                    'price': float(test.price),
                    'date': test.completed_at,
                    'visitId': test.order.visit.id
                })

        # 3. Operations
        ops = Operation.objects.filter(status='COMPLETED')
        ops = filter_by_patient(ops, 'order__visit__patient_id')
        billed_ops_ids = BillItem.objects.filter(service_type='OPERATION').values_list('service_ref_id', flat=True)

        for op in ops:
             # Add Operation Fee itself
             if op.operation_id not in billed_ops_ids:
                 add_item(op.order.visit.patient.id, op.order.visit.patient.name, {
                    'type': 'OPERATION',
                    'id': op.operation_id,
                    'name': op.operation_name,
                    'price': float(op.price),
                    'date': op.performed_at,
                    'visitId': op.order.visit.id
                })
             
             # Add Consumables used in this operation
             # Consumables are stored as JSON: [{ item: 'Name', price: 100, id: 12345 }]
             # We need to track them individually to avoid double billing.
             # We use 'OT_CONSUMABLE' as type and the consumable's UNIQUE ID as ref_id.
             # If consumable doesn't have an ID (legacy), we might skip or risk duplicates.
             # Ideally frontend ensures IDs.
             
             billed_consumable_ids = BillItem.objects.filter(
                 service_type='OT_CONSUMABLE', 
                 visit_id=op.order.visit.id
             ).values_list('service_ref_id', flat=True)

             for consumable in op.consumables_used:
                 c_id = consumable.get('id')
                 # If no ID, fallback to something? No, plan requires frontend to generate IDs.
                 # If legacy data lacks ID, we can't reliably track it.
                 # However, we can use a hash or just skip. Let's assume IDs exist or will be added.
                 # Actually for now, to be safe, if no ID, we can't serve it as a pending item reliably.
                 if c_id and c_id not in billed_consumable_ids:
                      add_item(op.order.visit.patient.id, op.order.visit.patient.name, {
                        'type': 'OT_CONSUMABLE',
                        'id': c_id,
                        'name': f"OT Consumable: {consumable.get('item')}",
                        'price': float(consumable.get('price', 0)),
                        'date': op.performed_at or op.scheduled_time, # Fallback date
                        'visitId': op.order.visit.id
                    })

        # 4. Medicines (Prescriptions)
        prescriptions = Prescription.objects.all()
        prescriptions = filter_by_patient(prescriptions, 'visit__patient_id')
        billed_presc_ids = BillItem.objects.filter(service_type='PHARMACY').values_list('service_ref_id', flat=True)
        
        for p in prescriptions:
            if p.prescription_id not in billed_presc_ids:
                # Calculate cost from dispensed batches if available
                dispenses = p.dispenses.all()
                if dispenses.exists():
                    # Sum up actual dispensed costs
                    cost = sum(d.quantity_dispensed * (d.batch.unit_price if d.batch else Decimal('0')) for d in dispenses)
                else:
                    # Fallback: use average batch price for this medicine
                    batches = p.medicine.batches.filter(stock_qty__gt=0)
                    if batches.exists():
                        avg_price = sum(b.unit_price for b in batches) / batches.count()
                        cost = p.quantity * avg_price
                    else:
                        # No batches available, use 0 or skip
                        cost = Decimal('0')
                
                add_item(p.visit.patient.id, p.visit.patient.name, {
                    'type': 'PHARMACY',
                    'id': p.prescription_id,
                    'name': f"{p.medicine.name} (x{p.quantity})",
                    'price': float(cost),
                    'date': p.visit.visit_date,
                    'visitId': p.visit.id
                })

        # 5. IPD Admission (Bed Charges)
        admissions = Admission.objects.filter(discharge_date__isnull=False)
        admissions = filter_by_patient(admissions, 'visit__patient_id')
        billed_bed_ids = BillItem.objects.filter(service_type='BED').values_list('service_ref_id', flat=True)

        for adm in admissions:
            if adm.admission_id not in billed_bed_ids:
                duration = adm.discharge_date - adm.admission_date
                days = max(1, duration.days)
                cost = days * adm.bed_price
                add_item(adm.visit.patient.id, adm.visit.patient.name, {
                    'type': 'BED',
                    'id': adm.admission_id,
                    'name': f"Bed Charge ({days} days)",
                    'price': float(cost),
                    'date': adm.discharge_date,
                    'visitId': adm.visit.id
                })

        # 6. Consultations (Visits)
        visits = Visit.objects.exclude(status='CANCELLED')
        if patient_id:
             visits = visits.filter(patient_id=patient_id)

        billed_visit_ids = BillItem.objects.filter(service_type='CONSULTATION').values_list('service_ref_id', flat=True)
        
        for v in visits:
            if v.id not in billed_visit_ids and v.doctor and v.doctor.fee:
                 add_item(v.patient.id, v.patient.name, {
                    'type': 'CONSULTATION',
                    'id': v.id,
                    'name': f"Dr. {v.doctor.name} Consultation",
                    'price': float(v.doctor.fee),
                    'date': v.visit_date,
                    'visitId': v.id
                })

        result = list(pending.values())
        return Response(result)


class BillItemViewSet(ModelViewSet):
    queryset = BillItem.objects.all()
    serializer_class = BillItemSerializer


class InsuranceClaimViewSet(ModelViewSet):
    queryset = InsuranceClaim.objects.all()
    serializer_class = InsuranceClaimSerializer


from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

class DoctorPatientProfileView(APIView):
    def get(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        
        # Get all visits for history
        visits = Visit.objects.filter(patient=patient).order_by('-visit_date')
        
        visit_history = []
        for v in visits:
            # Try to get diagnosis from clinical note
            note = ClinicalNote.objects.filter(visit=v).first()
            diagnosis = v.chief_complaint or 'Routine Checkup'
            if note and hasattr(note, 'diagnosis'):
                 diagnosis = note.diagnosis
            
            visit_history.append({
                'date': v.visit_date,
                'diagnosis': diagnosis, 
                'status': v.status,
                'visit_id': v.id
            })

        # Get latest vitals (from any visit, sorted by recorded_at)
        latest_vital = Vital.objects.filter(visit__patient=patient).order_by('-recorded_at').first()
        
        # Construct Vitals object
        vitals_data = {}
        if latest_vital:
            vitals_data = {
                'bp': f"{latest_vital.bp_systolic}/{latest_vital.bp_diastolic}",
                'hr': latest_vital.pulse,
                'temp': latest_vital.temperature,
                'weight': 'N/A' 
            }
        else:
            vitals_data = { 'bp': 'N/A', 'hr': 'N/A', 'temp': 'N/A', 'weight': 'N/A' }

        data = {
            'id': patient.id,
            'name': patient.name,
            'age': patient.age,
            'gender': patient.gender,
            'phone': patient.phone,
            'bloodType': patient.blood_group,
            'allergies': 'None known', 
            'conditions': patient.medical_history or 'No major conditions recorded.',
            'lastVisit': visits.first().visit_date if visits.exists() else 'N/A',
            'visitHistory': visit_history,
            'vitals': vitals_data
        }
        return Response(data)

class AllergyViewSet(ModelViewSet):
    queryset = Allergy.objects.all()
    serializer_class = AllergySerializer
    
    def get_queryset(self):
        queryset = Allergy.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

