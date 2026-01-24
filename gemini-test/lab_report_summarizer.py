import os
import sys
from google import genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv

load_dotenv()

def analyze_lab_report():
    # 1. Configuration Check
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        sys.exit(1)

    try:
        # New SDK Client Initialization
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        sys.exit(1)

    # 2. Input Handling
    try:
        pdf_path = input("Enter path to lab report PDF: ").strip().strip('"').strip("'")

        if not os.path.exists(pdf_path):
            print("Error: File does not exist.")
            sys.exit(1)

        if not pdf_path.lower().endswith(".pdf"):
            print("Error: File is not a PDF.")
            sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(0)

    # 3. Text Extraction
    try:
        reader = PdfReader(pdf_path)
        text = ""

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        text = text.strip()
        if not text:
            print("Error: Could not extract text from PDF. It may be scanned.")
            sys.exit(1)

    except Exception as e:
        print(f"Error reading PDF: {e}")
        sys.exit(1)

    # 4. Prompt (Clean + Token Efficient)
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

    # 5. API Call
    print("\nAnalyzing report with Gemini...\n")

    try:
        models_to_try = [
            "gemini-3-flash-preview",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash"
        ]
        
        response = None
        for model_name in models_to_try:
            try:
                print(f"Trying model: {model_name}...")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                print(f"Successfully used model: {model_name}")
                break
            except Exception as model_error:
                 error_str = str(model_error)
                 if "404" in error_str or "429" in error_str or "Resource has been exhausted" in error_str:
                     print(f"Model {model_name} failed: {error_str.splitlines()[0]}")
                     continue # Try next model
                 else:
                     raise model_error # Re-raise other errors
        
        if not response:
             raise Exception("All specified models returned 404 Not Found.")

        print("=" * 40)
        print("LAB REPORT SUMMARY")
        print("=" * 40)
        print(response.text.strip())
        print("=" * 40)

    except Exception as e:
        print(f"An error occurred: {e}")

        if "404" in str(e):
            print("\nModel not found. Attempting to list available models...")
            try:
                for m in client.models.list():
                    print(f" - {m.name}")
            except Exception as listing_error:
                print(f"Could not list models: {listing_error}")

        sys.exit(1)


if __name__ == "__main__":
    analyze_lab_report()
