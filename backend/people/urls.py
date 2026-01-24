from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AllergyViewSet, BillViewSet, BillItemViewSet, InsuranceClaimViewSet, PatientViewSet, StaffViewSet, VisitViewSet, AdmissionViewSet, BedViewSet, VitalViewSet, ClinicalNoteViewSet, OrderViewSet, LabTestViewSet, RadiologyTestViewSet, MedicineViewSet, MedicineBatchViewSet, StockTransactionViewSet, PrescriptionViewSet, PrescriptionDispenseViewSet, OperationViewSet, DoctorPatientProfileView

router = DefaultRouter()
router.register('patients', PatientViewSet)
router.register('allergies', AllergyViewSet)
router.register('staff', StaffViewSet)
router.register('visits', VisitViewSet, basename='visit')
router.register('admissions', AdmissionViewSet)
router.register('beds', BedViewSet)
router.register('vitals', VitalViewSet)
router.register('clinical-notes', ClinicalNoteViewSet)
router.register('orders', OrderViewSet)
router.register('lab-tests', LabTestViewSet)
router.register('radiology-tests', RadiologyTestViewSet)
router.register('medicines', MedicineViewSet)
router.register('medicine-batches', MedicineBatchViewSet)
router.register('stock-transactions', StockTransactionViewSet)
router.register('prescriptions', PrescriptionViewSet)
router.register('prescription-dispenses', PrescriptionDispenseViewSet)
router.register('operations', OperationViewSet)
router.register('bills', BillViewSet)
router.register('bill-items', BillItemViewSet)
router.register('insurance-claims', InsuranceClaimViewSet)


from .auth_views import AdminResetPasswordView

urlpatterns = [
    path('doctor/patients/<int:pk>/', DoctorPatientProfileView.as_view(), name='doctor-patient-profile'),
    path('admin-reset-password/', AdminResetPasswordView.as_view(), name='admin-reset-password'),
] + router.urls
