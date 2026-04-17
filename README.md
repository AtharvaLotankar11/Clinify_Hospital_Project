<div align="center">
  
  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.png" alt="Clinify AI Logo" width="120" />

  <h1>🏥 Clinify Hospital Predictive AI</h1>

  <p>
    <strong>A Next-Generation Clinical Workflow & Predictive Intelligence Ecosystem</strong>
  </p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" alt="Django" /></a>
    <a href="#"><img src="https://img.shields.io/badge/XGBoost-1761A0?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Redis-%23DD0031?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" /></a>
  </p>
</div>

---

<details open>
  <summary><b>✨ System Overview (Click to Collapse)</b></summary>
  <br/>
  <blockquote>
    Leveraging robust local Machine Learning models (<b>XGBoost</b> & <b>SHAP</b>) alongside asynchronous Python APIs and a dynamic React Frontend, this system autonomously tracks synthetic Electronic Health Record (EHR) data to predict patient readmissions and intelligently allocate hospital resources.
  </blockquote>
</details>

<br>

## 🔮 Core Intelligence Features

| Module | Sub-System | Description |
| :--- | :--- | :--- |
| 💊 **ML Inference** | `Predictive Routing` | Deploys Scikit-Learn pipelines mapped directly against incoming API endpoints to instantly return risk categorizations. |
| 📊 **Analytics Hub** | `Recharts Dashboard` | Implements a 12-column dynamic CSS grid to visualize real-time capacity and AI resource recommendations. |
| ⚡ **Async Workers** | `Celery Pipeline` | Prevents the server from bottlenecking when rendering 100K+ synthetic records simultaneously. |
| 🧬 **Explainable AI** | `SHAP Interventions` | Provides a horizontal dependency chart to visually explain to the Doctor *why* a specific diagnosis was given. |

---

## 🚀 Live Environment Setup

<details open>
  <summary><b>1️⃣ Background Systems (Message Broker)</b></summary>
  
  > 🕒 Ensures the system can communicate using the asynchronous task queue.
  ```bash
  # Using Docker locally to host Redis Message Broker
  docker run -d -p 6379:6379 redis
  ```
</details>

<details open>
  <summary><b>2️⃣ Backend Brain (Django + XGBoost)</b></summary>

  > 🧠 Handles dataset generation, ML operations, and secure API handshakes.
  ```bash
  cd backend
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  
  # Boot REST API Server
  python manage.py runserver 
  ```

  Keep that terminal open! Open a **new terminal** explicitly for the Worker:
  ```bash
  cd backend
  venv\Scripts\activate
  celery -A his worker -l info --pool=solo
  ```
</details>

<details open>
  <summary><b>3️⃣ Visual Interface (Vite React)</b></summary>

  > 🎨 The medical UI portal featuring high-fidelity charts and dashboard grids.
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  🔗 **Access the live AI dashboard at**: [http://localhost:5173/ml/dashboard](http://localhost:5173/ml/dashboard)
</details>

---

## 🔬 AI Playground Controls

You control the datasets! Play around with the synthetic simulation models.

```bash
# Generate 5,000 brand new randomized EHR profiles with realistic constraints
cd backend
python ml/utils/generate_synthetic_data.py --num_records=5000

# You can then command the AI to adapt via an API script or curl!
# Endpoint: POST /api/ml/train/
```

---

<p align="center">
  <i>Architected beautifully for clinical intelligence modeling.</i>
</p>
