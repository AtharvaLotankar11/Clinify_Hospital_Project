# Clinify Hospital Predictive Intelligence

An advanced AI-powered diagnostic and clinical workflow predictive system. Leveraging local ML models alongside Django APIs and an interactive visual React Frontend, the system tracks simulated Electronic Health Record (EHR) data to predict patient readmission risks and evaluate hospital capacity logic dynamically. 

---

## 🛠️ Tech Stack
- **Frontend Engine**: React, Vite, TailwindCSS (v4), Recharts
- **Backend Frame**: Python, Django, Rest-Framework, Cellery, Redis.
- **Machine Learning**: Scikit-Learn (Pipelines, IsolationForest), XGBoost (Readmissions), Faker (Synthesis), SHAP (AI Interpretation).

## 🚀 Setting Up the Development Server

1. **Clone & Prerequisite Check**:
Ensure Python 3.9+, Node.js (v18+), and Redis (for Celery message broker) are installed locally.

### Start Redis
Ensure the local Redis server is executing on port 6379:
```bash
# Using Docker as an isolated container:
docker run -d -p 6379:6379 redis
```

### Start Backend Django API
Execute inside the `/backend` environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run server
python manage.py runserver
```

### Start Celery Async Worker
Keep the backend server terminal running, open a new active terminal:
```bash
cd backend
venv\Scripts\activate

# Launch local background worker
celery -A his worker -l info --pool=solo
```

### Start Frontend UI
Locate the web interfaces side of the codebase:
```bash
cd frontend
npm install

# Run the client app
npm run dev
```

Navigate to `http://localhost:5173/ml/dashboard` to experience the real-time AI metrics layout.

---

## 🧠 Regenerating Synthetic Records
Use the built-in dataset simulation engine to create custom patient payloads ranging from 5,000 to >100K profiles.
```bash
cd backend
python ml/utils/generate_synthetic_data.py --num_records=5000
```
This forces new logic inside the machine pipelines! You can retrain your newly generated mock profiles natively by hitting the API `/api/ml/train/`.
