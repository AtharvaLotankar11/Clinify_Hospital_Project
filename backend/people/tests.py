from django.test import TestCase
from django.core.exceptions import ValidationError
from people.models import Staff

class StaffDoctorFieldsTest(TestCase):
    def test_doctor_fields_creation(self):
        """Test that doctor specific fields can be saved for a doctor."""
        doctor = Staff.objects.create(
            user_email="doc_test@example.com",
            name="Dr. Test",
            role="DOCTOR",
            department="OPD",
            password_hash="hashed_pass",
            fee=100.0,
            shift_start="09:00",
            shift_end="17:00",
            doctor_type="CARDIOLOGIST",
            specialization="Interventional Cardiology",
            experience_years="MORE_10"
        )
        # Verify fields are saved (create does save, but full_clean validates)
        doctor.full_clean()
        self.assertEqual(doctor.doctor_type, "CARDIOLOGIST")
        self.assertEqual(doctor.experience_years, "MORE_10")
        self.assertEqual(doctor.specialization, "Interventional Cardiology")

    def test_non_doctor_validation(self):
        """Test that non-doctors cannot have doctor fields."""
        nurse = Staff(
            user_email="nurse_test@example.com",
            name="Nurse Test",
            role="NURSE",
            department="OPD",
            password_hash="hashed_pass",
            doctor_type="CARDIOLOGIST" # Invalid for nurse
        )
        # full_clean raises ValidationError due to the check in clean()
        with self.assertRaises(ValidationError):
            nurse.full_clean()

    def test_choices_validation(self):
        """Test that invalid choices are rejected."""
        doctor = Staff(
            user_email="doc_invalid@example.com",
            name="Dr. Invalid",
            role="DOCTOR",
            department="OPD",
            password_hash="hashed_pass",
            fee=100.0,
            shift_start="09:00",
            shift_end="17:00",
            doctor_type="INVALID_TYPE",
            experience_years="100_YEARS"
        )
        with self.assertRaises(ValidationError):
            doctor.full_clean()
