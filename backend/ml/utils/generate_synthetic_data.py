import os
import pandas as pd
import numpy as np
from faker import Faker
import random

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

def generate_data(num_records=5000):
    data = []
    diagnoses = ['Pneumonia', 'Diabetes Type 2', 'Hypertension', 'Heart Failure', 'COPD', 'Asthma']
    blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    admission_types = ['Emergency', 'Elective', 'Urgent']
    
    for i in range(num_records):
        age = np.random.randint(18, 90)
        gender = random.choice(['Male', 'Female'])
        diagnosis = random.choice(diagnoses)
        
        # Make a simplistic outcome logic to simulate a real ML problem
        risk_score = age * 0.6
        if diagnosis in ['Heart Failure', 'COPD']:
            risk_score += 25
        if admission_types == 'Emergency':
            risk_score += 15
            
        target = 'Low'
        if risk_score > 70:
            target = 'High'
        elif risk_score > 45:
            target = 'Moderate'
            
        data.append({
            'Patient_ID': f"PID-{i+1000}",
            'First_Name': fake.first_name(),
            'Last_Name': fake.last_name(),
            'SSN': fake.ssn(),
            'Age': age,
            'Gender': gender,
            'Blood_Type': random.choice(blood_types),
            'Admission_Type': random.choice(admission_types),
            'Diagnosis': diagnosis,
            'Systolic_BP': np.random.randint(90, 180),
            'Diastolic_BP': np.random.randint(60, 120),
            'Heart_Rate': np.random.randint(60, 110),
            'Glucose_Level': round(np.random.normal(120, 30), 2),
            # Intentionally inject missing values (NaN) to test our preprocessing module later
            'BMI': round(np.random.uniform(18.5, 40.0), 1) if random.random() > 0.05 else np.nan, 
            'Readmission_Risk': target
        })
        
    df = pd.DataFrame(data)
    
    output_dir = os.path.join(os.path.dirname(__file__), '../data')
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, 'synthetic_ehr_data.csv')
    df.to_csv(out_path, index=False)
    print(f"Generated {num_records} synthetic EHR patient records at {out_path}")

if __name__ == "__main__":
    generate_data()
