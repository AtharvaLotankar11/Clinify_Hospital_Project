from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import LabReportUploadSerializer
from .services.gemini_service import GeminiService
from .models import AIRequestLog
from people.models import LabTest, RadiologyTest, Operation
import logging

logger = logging.getLogger(__name__)

class LabSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = LabReportUploadSerializer(data=request.data)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['file']
            
            # Log the request
            log_entry = AIRequestLog.objects.create(
                user=request.user,
                filename=uploaded_file.name,
                status='processing'
            )

            try:
                # Call Gemini Service
                # Note: uploaded_file is an InMemoryUploadedFile or TemporaryUploadedFile works as file-like object
                summary = GeminiService.summarize_lab_report(file_obj=uploaded_file)
                
                # Update log
                log_entry.status = 'success'
                log_entry.summary_generated = summary
                log_entry.save()

                return Response({"summary": summary}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error processing lab report: {e}")
                log_entry.status = 'failed'
                log_entry.error_message = str(e)
                log_entry.save()
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SummarizeReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        report_type = request.data.get('report_type') # 'LAB', 'RADIOLOGY', or 'OPERATION'
        report_id = request.data.get('report_id')

        if not report_type or not report_id:
            return Response({"error": "report_type and report_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            obj = None
            filename = "unknown"
            file_field = None
            summary_method = GeminiService.summarize_lab_report
            
            if report_type == 'LAB':
                obj = LabTest.objects.get(id=report_id)
                filename = f"LabTest_{obj.test_name}_{obj.id}"
                file_field = obj.report_file
            elif report_type == 'RADIOLOGY':
                obj = RadiologyTest.objects.get(id=report_id)
                filename = f"Radiology_{obj.scan_type}_{obj.id}"
                file_field = obj.report_file
            elif report_type == 'OPERATION':
                obj = Operation.objects.get(pk=report_id)
                filename = f"Operation_{obj.operation_name}_{obj.pk}"
                file_field = obj.post_op_file
                summary_method = GeminiService.summarize_operation_report
            else:
                return Response({"error": "Invalid report_type"}, status=status.HTTP_400_BAD_REQUEST)

            if not file_field:
                return Response({"error": "No report file associated with this record"}, status=status.HTTP_404_NOT_FOUND)

            # Log
            log_entry = AIRequestLog.objects.create(
                user=request.user,
                filename=filename,
                status='processing'
            )

            try:
                # Open the file
                with file_field.open('rb') as f:
                     summary = summary_method(file_obj=f)
                
                # Save summary to the model
                obj.ai_summary = summary
                obj.save()
                
                log_entry.status = 'success'
                log_entry.summary_generated = summary
                log_entry.save()
                
                return Response({"summary": summary}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error summarizing report {filename}: {e}")
                log_entry.status = 'failed'
                log_entry.error_message = str(e)
                log_entry.save()
                return Response({"error": f"AI Processing Failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except (LabTest.DoesNotExist, RadiologyTest.DoesNotExist, Operation.DoesNotExist):
            return Response({"error": "Report record not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from people.models import ClinicalNote, Patient
class SummarizeClinicalNotesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get('patient_id')

        if not patient_id:
            return Response({"error": "patient_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if patient exists
            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                 return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

            # Fetch all clinical notes for the patient
            notes = ClinicalNote.objects.filter(visit__patient_id=patient_id).order_by('created_at')
            
            if not notes.exists():
                return Response({"summary": "No clinical notes found for this patient."}, status=status.HTTP_200_OK)

            # Format notes for the prompt
            notes_text = ""
            for note in notes:
                date_str = note.created_at.strftime("%Y-%m-%d")
                doctor_name = note.doctor.name if note.doctor else "Unknown Doctor"
                notes_text += f"[Date: {date_str}] [Dr. {doctor_name}]:\nSymptoms: {note.symptoms}\nDiagnosis: {note.diagnosis}\nNotes: {note.notes}\n\n"

            # Log
            log_entry = AIRequestLog.objects.create(
                user=request.user,
                filename=f"ClinicalNotesSummary_Patient_{patient_id}",
                status='processing'
            )

            try:
                summary = GeminiService.summarize_clinical_notes(notes_text)
                
                log_entry.status = 'success'
                log_entry.summary_generated = summary
                log_entry.save()
                
                return Response({"summary": summary}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error summarizing clinical notes: {e}")
                log_entry.status = 'failed'
                log_entry.error_message = str(e)
                log_entry.save()
                return Response({"error": f"AI Processing Failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckInteractionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get('patient_id')
        additional_medicines = request.data.get('medicines', []) # List of medicine names

        if not patient_id and not additional_medicines:
            return Response({"error": "patient_id or medicines list is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient_allergies_text = "None recorded"
            if patient_id:
                try:
                    patient = Patient.objects.get(id=patient_id)
                    allergies = patient.allergies.all()
                    if allergies.exists():
                        patient_allergies_text = "\n".join([f"- {a.allergen} (Severity: {a.severity}, Reaction: {a.reaction})" for a in allergies])
                    
                    # Also consider medical history
                    if patient.medical_history:
                        patient_allergies_text += f"\nMedical History Notes: {patient.medical_history}"
                except Patient.DoesNotExist:
                     return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

            medicines_text = ", ".join(additional_medicines) if additional_medicines else "None provided"

            # Log
            log_entry = AIRequestLog.objects.create(
                user=request.user,
                filename=f"InteractionCheck_Patient_{patient_id if patient_id else 'None'}",
                status='processing'
            )

            try:
                alert = GeminiService.check_interactions(patient_allergies_text, medicines_text)
                
                log_entry.status = 'success'
                log_entry.summary_generated = alert
                log_entry.save()
                
                return Response({"alerts": alert}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error checking interactions: {e}")
                log_entry.status = 'failed'
                log_entry.error_message = str(e)
                log_entry.save()
                return Response({"error": f"AI interaction check failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FixGrammarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text')

        if not text:
             return Response({"error": "text is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Log
            log_entry = AIRequestLog.objects.create(
                user=request.user,
                filename="GrammarCheck",
                status='processing'
            )

            try:
                fixed_text = GeminiService.fix_grammar(text)
                
                log_entry.status = 'success'
                log_entry.summary_generated = fixed_text
                log_entry.save()
                
                return Response({"fixed_text": fixed_text}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error fixing grammar: {e}")
                log_entry.status = 'failed'
                log_entry.error_message = str(e)
                log_entry.save()
                return Response({"error": f"AI Grammar Fix Failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
