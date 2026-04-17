# 🏥 Clinify Hospital Predictive AI Ecosystem

**A Next-Generation Clinical Workflow & Predictive Intelligence Platform**

*Leveraging robust local Machine Learning models (XGBoost & SHAP) alongside asynchronous Python APIs and a dynamic React Frontend, this system autonomously tracks synthetic Electronic Health Record (EHR) data to predict patient readmissions and intelligently allocate hospital resources across all administrative verticals.*

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" alt="Django" />
  <img src="https://img.shields.io/badge/XGBoost-1761A0?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
  <img src="https://img.shields.io/badge/Redis-%23DD0031?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## 👨‍⚕️ PRD Fulfillment: Ecosystem & Staff Integrations

After extensive auditing spanning original legacy workflows and modern data implementations (Phases 1-6), the full suite integrates comprehensively across every single hospital team. 

| Role | Legacy Capabilities Preserved | Predictive AI Value Added |
| :--- | :--- | :--- |
| **Doctors** | Full patient charting, Orders, Operation Theater, Dashboards. | **Diagnostic SHAP Tools**: Visual feature breakdowns clearly explain *why* the XGBoost model flagged a patient. |
| **Nurses** | Vitals tracking, OT assistance, Dynamic Bed deployment. | **Triage Prioritization**: "Live Risk Queue" tables automatically surface the highest-risk critical patients. |
| **Reception** | Patient records, Visit creation, Admission coordination. | **Volume Forecasting**: Predictive banners anticipating total emergency room capacity surges. |
| **Support Staff**| Physical asset and ward-bed tracking. | **Resource Utilization Scanners**: Real-time bar charts dynamically balancing staffing versus bed capacity limits. |
| **Lab Techs** | Diagnostic report uploads and sample tagging. | Rapid severity routing allows tech queues to prioritize AI-flagged critical tests. |
| **Pharmacists**| Medication dispensing, Inventory, Interaction alerts. | Unified view of upcoming prescription demand based on AI-identified disease readmissions. |
| **Billing** | Fast invoice pipelines and clearance processing. | Full system stability decoupling core hospital financials from ML computation overhead. |
| **Patients** | Vitals logging, Digital health records, Telemetry. | Protected, siloed routing completely shields PII profiles from analytical components. |
| **Admin** | Global system visibility, Staff management. | Central oversight of both operational analytics and AI metrics in a unified sidebar. |

---

## 🔮 Core Pipeline & Capabilities

| Module | Sub-System | Description |
| :--- | :--- | :--- |
| 💊 **ML Inference** | `Predictive Routing` | Deploys Scikit-Learn pipelines dynamically via REST endpoints to categorize patient admission probabilities. |
| 📊 **Analytics Hub** | `Recharts Dashboard` | A native React 12-column interactive grid visualizing capacity and heuristic resource recommendations. |
| ⚡ **Heavy Lifting** | `Celery Async Workers` | Defends the Django core from bottlenecking when rendering 100K+ synthetic records via background Redis queues. |

---

## 🚀 Local Deployment Guide

You can run the entire hospital simulation suite locally using 3 simultaneous terminal processes.

### 1️⃣ Background Systems (Message Broker)
**Ensures Django can communicate securely with the asynchronous task worker.**
```bash
# Using Docker (Run once and keep active)
docker run -d -p 6379:6379 redis
```

### 2️⃣ Backend Brain (Django + XGBoost Worker)
**Handles dataset generation, model processing, and API handshakes.**
```bash
cd backend
venv\Scripts\activate

# Terminal A: Boot REST API Server
python manage.py runserver 
```
```bash
# Terminal B: Boot the local Celery Pool (Must be in a separate terminal window)
cd backend
venv\Scripts\activate
celery -A his worker -l info --pool=solo
```

### 3️⃣ Visual Interface (Client)
**The UI portal featuring high-fidelity clinical analytics and legacy hospital tools.**
```bash
# Terminal C (Separate window)
cd frontend
npm install
npm run dev
```

Navigate your browser to **`http://localhost:5173/`** to securely login and access your unified dashboard!

---

## 🔬 AI Playground Controls

The platform handles completely synthetic EHR distributions to train algorithms locally without HIPAA violations. To execute an algorithmic refresh:

```bash
# Generate 5,000 completely randomized and anonymized patient data profiles 
cd backend
python ml/utils/generate_synthetic_data.py --num_records=5000

# Retrain the Scikit-Learn tools and XGBoost Model
python -m ml.training.train
```
