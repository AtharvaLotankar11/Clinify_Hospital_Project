import os
from google import genai
from PyPDF2 import PdfReader
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    @staticmethod
    def get_api_key():
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            logger.error("GEMINI_API_KEY environment variable is not set.")
            raise ValueError("GEMINI_API_KEY is not set.")
        # Log masked key for debugging
        logger.info(f"Loaded GEMINI_API_KEY: {api_key[:5]}...{api_key[-5:] if len(api_key)>10 else ''}")
        return api_key

    @staticmethod
    def extract_text_from_pdf(file_obj):
        try:
            reader = PdfReader(file_obj)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise ValueError("Failed to extract text from PDF.")

    @staticmethod
    def summarize_lab_report(file_obj=None, text_content=None):
        if file_obj:
            text = GeminiService.extract_text_from_pdf(file_obj)
        elif text_content:
            text = text_content
        else:
            raise ValueError("No file or text provided.")

        if not text:
            raise ValueError("Could not extract text from document.")

        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a clinical documentation assistant.

Summarize the following lab report in exactly 3–4 bullet points.

Rules:
- Mention ONLY abnormal or critical values
- Do NOT provide diagnosis or medical advice
- Use short, clear clinical language
- If all values are normal, state that clearly

Lab Report:
{text}
"""
            
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "gemini-3-flash-preview",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting to use model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    logger.info(f"Successfully generated content with model: {model_name}")
                    break
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                error_summary = "; ".join(errors)
                raise Exception(f"Gemini API call failed with all available models. Details: {error_summary}")

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            raise Exception(f"AI Service Error: {str(e)}")
    @staticmethod
    def summarize_clinical_notes(notes_text):
        if not notes_text:
            raise ValueError("No notes text provided.")

        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a senior physician assistant specializing in summarizing patient history.
            
Summarize the following chronological clinical notes for a patient into a concise history.

Rules:
- Highlight recurring symptoms and chronic conditions.
- Summarize the progression of diagnoses.
- Mention key treatments or interventions if mentioned.
- Keep it to 5-6 bullet points maximum.
- Be professional and clinical.

Clinical Notes History:
{notes_text}
"""
            
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "gemini-3-flash-preview",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting to use model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    logger.info(f"Successfully generated clinical note summary with model: {model_name}")
                    break
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                error_summary = "; ".join(errors)
                raise Exception(f"Gemini API call failed with all available models. Details: {error_summary}")

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            raise Exception(f"AI Service Error: {str(e)}")

    @staticmethod
    def summarize_operation_report(file_obj=None, text_content=None):
        if file_obj:
            text = GeminiService.extract_text_from_pdf(file_obj)
        elif text_content:
            text = text_content
        else:
            raise ValueError("No file or text provided.")

        if not text:
            raise ValueError("Could not extract text from document.")

        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a surgical assistant.
            
Summarize the following operation report in exactly 3–4 bullet points.

Rules:
- State the procedure performed clearly.
- List key intraoperative findings.
- Highlight any complications or lack thereof (e.g., "No complications").
- Mention key post-operative instructions if present.
- Use professional medical terminology.

Operation Report:
{text}
"""
            
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "gemini-3-flash-preview",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting to use model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    logger.info(f"Successfully generated operation summary with model: {model_name}")
                    break
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                error_summary = "; ".join(errors)
                raise Exception(f"Gemini API call failed with all available models. Details: {error_summary}")

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            raise Exception(f"AI Service Error: {str(e)}")

    @staticmethod
    def check_interactions(patient_allergies, medicines):
        """
        AI check for Drug-Drug and Drug-Allergy interactions
        """
        # Force reload Env to be absolutely sure
        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a senior clinical pharmacist.
            
Analyze potential drug-drug and drug-allergy interactions for the following:

PATIENT ALLERGIES:
{patient_allergies if patient_allergies else "None recorded"}

MEDICINES TO CHECK:
{medicines}

Rules:
1. Identify any drug-allergy interactions (where a medicine might trigger a reaction based on listed allergies).
2. Identify any drug-drug interactions among the medicines listed.
3. For each interaction found, specify:
   - SEVERITY (Minor, Moderate, Major, or Contraindicated)
   - CLINICAL EXPLANATION (Briefly why it happens)
   - RECOMMENDATION (Action to take)
4. If no interactions are found, state "No significant clinical interactions detected."
5. Use a clear, professional medical tone.
6. Format with bullet points.
"""
            
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "gemini-3-flash-preview",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Interaction Check: Attempting {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    break
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                error_summary = "; ".join(errors)
                raise Exception(f"Gemini API call failed: {error_summary}")

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini API Error in check_interactions: {e}")
            raise Exception(f"AI Interaction Check Failed: {str(e)}")


    @staticmethod
    def fix_grammar(text):
        """
        Fix grammar and format clinical text
        """
        if not text:
            raise ValueError("No text provided.")

        # Force reload Env to be absolutely sure
        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a medical scribe perfectionist.
            
Fix the grammar, spelling, and punctuation of the following clinical note.
Format it nicely (e.g., bullet points if multiple items are listed, clear paragraphs).
Do NOT change the medical meaning or facts.
IMPORTANT: Maintain the original language of the text. Do NOT translate it. If the text is in Hindi, keep it in Hindi. If it is in Marathi, keep it in Marathi.
Do NOT add any introductory or concluding conversational text (like 'Here is the fixed text'). Just output the cleaned final text.

Text to fix:
{text}
"""
            
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "gemini-3-flash-preview",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Fix Grammar: Attempting {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    break
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                error_summary = "; ".join(errors)
                raise Exception(f"Gemini API call failed: {error_summary}")

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini API Error in fix_grammar: {e}")
            raise Exception(f"AI Grammar Fix Failed: {str(e)}")

    @staticmethod
    def recommend_doctor(complaint, valid_types):
        """
        Recommend doctor type based on complaint.
        Note: Severity is now largely handled by user input, but we ask Gemini for a second opinion or type confirmation.
        """
        # Force reload Env
        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            # Format types for prompt
            types_str = ", ".join(valid_types)
            
            prompt = f"""You are an intelligent medical triage assistant.
Patient Complaint: "{complaint}"

Available Specialist Types:
{types_str}

Task:
1. Identify the BEST matching specialist from the list above.
   - Example: "Ear pain" -> ENT
   - Example: "Skin rash" -> DERMATOLOGIST
   - Example: "Chest pain" -> CARDIOLOGIST
   - Example: "General weakness" -> GENERAL_PHYSICIAN
2. If the complaint is specific, choose the Specialist. Do NOT default to General Physician unless it is general.

Output JSON ONLY:
{{
    "doctor_type": "EXACT_TYPE_FROM_LIST"
}}
"""
            
            # Use the same models that work for summary generation
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting doctor recommendation with model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config={'response_mime_type': 'application/json'}
                    )
                    logger.info(f"Successfully got doctor recommendation with model: {model_name}")
                    break 
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                logger.error(f"All Gemini models failed. Errors: {'; '.join(errors)}")
                # Fallback to General Physician if really broken? No, raise.
                raise Exception(f"AI Service Unavailable: {errors[0] if errors else 'Unknown error'}")
                
            import json
            text = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(text)
            
        except Exception as e:
            logger.error(f"Gemini Triage Error: {e}")
            raise Exception(f"AI Triage Failed: {str(e)}")

    @staticmethod
    def translate_text(text, target_lang='English'):
        """
        Translate clinical text to English (or other target).
        """
        if not text:
            raise ValueError("No text provided.")

        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        api_key = GeminiService.get_api_key()
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a medical translator.
            
Translate the following medical/clinical text into professional English.
Preserve all medical terminology accuracy.
Output ONLY the translated text. Do not add conversational filler.

Text to translate:
{text}
"""
            
            models_to_try = [
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-exp-1206",
                "models/gemini-2.0-flash",
                "models/gemini-flash-latest"
            ]
            
            response = None
            errors = []
            for model_name in models_to_try:
                try:
                    logger.info(f"Translate: Attempting {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    break
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    errors.append(f"{model_name}: {str(e)}")
                    continue
            
            if not response:
                error_summary = "; ".join(errors)
                raise Exception(f"Gemini API call failed: {error_summary}")

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini API Error in translate_text: {e}")
            raise Exception(f"AI Translation Failed: {str(e)}")

