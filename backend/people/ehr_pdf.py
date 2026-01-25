from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from django.utils import timezone
from .models import Patient, Visit, Vital, ClinicalNote, Prescription, LabTest, RadiologyTest, Operation
import traceback

def generate_patient_ehr_pdf(patient_id):
    """Generate comprehensive EHR PDF for a patient"""
    
    try:
        # Get patient data
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            raise ValueError(f"Patient with ID {patient_id} not found")
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        elements.append(Paragraph("ELECTRONIC HEALTH RECORD", title_style))
        elements.append(Paragraph("Quasar Hospital Information System", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Patient Demographics Section
        elements.append(Paragraph("PATIENT INFORMATION", heading_style))
        
        demo_data = [
            ['UHID:', str(patient.uhid or 'N/A'), 'Name:', str(patient.name or 'N/A')],
            ['Age:', f"{patient.age} years" if patient.age else 'N/A', 'Gender:', str(patient.gender or 'N/A')],
            ['Phone:', str(patient.phone or 'N/A'), 'Email:', str(patient.email or 'N/A')],
            ['Blood Group:', str(patient.blood_group or 'N/A'), 'Address:', str(patient.address or 'N/A')[:50]],
        ]
        
        demo_table = Table(demo_data, colWidths=[1*inch, 2*inch, 1*inch, 2*inch])
        demo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0f2fe')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#e0f2fe')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),  
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(demo_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Vitals History
        try:
            vitals = Vital.objects.filter(visit__patient=patient).order_by('-recorded_at')[:10]
            if vitals.exists():
                elements.append(Paragraph("VITAL SIGNS HISTORY (Last 10 Readings)", heading_style))
                
                vital_data = [['Date', 'BP (mmHg)', 'Pulse (bpm)', 'Temp (F)', 'SpO2 (%)']]
                for v in vitals:
                    vital_data.append([
                        v.recorded_at.strftime('%Y-%m-%d %H:%M') if v.recorded_at else 'N/A',
                        f"{v.bp_systolic or 0}/{v.bp_diastolic or 0}",
                        str(v.pulse or 'N/A'),
                        str(v.temperature or 'N/A'),
                        str(v.spo2 or 'N/A')
                    ])
                
                vital_table = Table(vital_data, colWidths=[1.5*inch, 1.2*inch, 1*inch, 1*inch, 1*inch])
                vital_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                elements.append(vital_table)
                elements.append(Spacer(1, 0.2*inch))
        except Exception as e:
            print(f"Error in vitals section: {e}")
            elements.append(Paragraph("Vitals data unavailable", styles['Normal']))
        
        # Clinical Notes
        try:
            notes = ClinicalNote.objects.filter(visit__patient=patient).order_by('-created_at')[:15]
            if notes.exists():
                elements.append(Paragraph("CLINICAL NOTES & DIAGNOSES", heading_style))
                
                note_data = [['Date', 'Type', 'Diagnosis/Note', 'Doctor']]
                for note in notes:
                    diagnosis_text = note.diagnosis or note.notes or 'N/A'
                    truncated_text = diagnosis_text[:60] + '...' if len(diagnosis_text) > 60 else diagnosis_text
                    note_data.append([
                        note.created_at.strftime('%Y-%m-%d') if note.created_at else 'N/A',
                        str(note.note_type or 'CLINICAL'),
                        str(truncated_text),
                        note.doctor.name if note.doctor else 'N/A'
                    ])
                
                note_table = Table(note_data, colWidths=[1.2*inch, 1*inch, 3*inch, 1.3*inch])
                note_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                elements.append(note_table)
                elements.append(Spacer(1, 0.2*inch))
        except Exception as e:
            print(f"Error in clinical notes section: {e}")
        
        # Prescriptions
        try:
            prescriptions = Prescription.objects.filter(visit__patient=patient).order_by('-created_at')[:20]
            if prescriptions.exists():
                elements.append(Paragraph("PRESCRIPTION HISTORY", heading_style))
                
                presc_data = [['Date', 'Medicine', 'Dosage', 'Duration', 'Status']]
                for presc in prescriptions:
                    dosage_text = 'N/A'
                    if presc.dosage and presc.frequency:
                        dosage_text = f"{presc.dosage} {presc.frequency}"
                    
                    presc_data.append([
                        presc.created_at.strftime('%Y-%m-%d') if presc.created_at else 'N/A',
                        presc.medicine.name if presc.medicine else 'N/A',
                        str(dosage_text),
                        str(presc.duration or 'N/A'),
                        str(presc.status or 'N/A')
                    ])
                
                presc_table = Table(presc_data, colWidths=[1.2*inch, 2*inch, 1.5*inch, 1*inch, 1*inch])
                presc_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                elements.append(presc_table)
                elements.append(Spacer(1, 0.2*inch))
        except Exception as e:
            print(f"Error in prescriptions section: {e}")
        
        # Visit History Summary
        try:
            visits = Visit.objects.filter(patient=patient).order_by('-visit_date')[:20]
            if visits.exists():
                elements.append(Paragraph("VISIT HISTORY", heading_style))
                
                visit_data = [['Date', 'Type', 'Doctor', 'Status']]
                for visit in visits:
                    visit_data.append([
                        visit.visit_date.strftime('%Y-%m-%d') if visit.visit_date else 'N/A',
                        str(visit.visit_type or 'N/A'),
                        visit.doctor.name if visit.doctor else 'N/A',
                        str(visit.status or 'N/A')
                    ])
                
                visit_table = Table(visit_data, colWidths=[1.2*inch, 1.3*inch, 2.5*inch, 1.5*inch])
                visit_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                elements.append(visit_table)
        except Exception as e:
            print(f"Error in visit history section: {e}")
        
        # Footer
        elements.append(Spacer(1, 0.5*inch))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
        elements.append(Paragraph(f"Generated on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} | Quasar HIS", footer_style))
        elements.append(Paragraph("This is a confidential medical document", footer_style))
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and return it
        pdf = buffer.getvalue()
        buffer.close()
        return pdf
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        print(traceback.format_exc())
        raise
