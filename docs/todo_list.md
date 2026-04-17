# 📋 Healthcare Predictive Intelligence System - Todo List

This document breaks down the Product Requirements Document (PRD), Design Document, and Tech Stack into a step-by-step actionable to-do list grouped by project phases.

---

## Phase 1: Project Setup & Foundation
### 1.1 Backend Setup (Django + PostgreSQL)
- [x] Initialize Django project and define core apps (e.g., `api`, `ml_module`).
- [x] Set up PostgreSQL database with JSONB field support.
- [x] Configure `djangorestframework` for API development.
- [x] Set up JWT Authentication (`djangorestframework-simplejwt`).
- [x] Initialize Celery and Redis for asynchronous task processing.
- [x] Create ML folder structure: `backend/ml/{models, training, inference, utils}`.

### 1.2 Frontend Setup (React + Tailwind CSS)
- [x] Initialize React project.
- [x] Install and configure Tailwind CSS 4.
- [x] Set up Tailwind theme with specific medical dashboard colors:
  - Primary Blue: `#2563EB`, Soft Teal: `#0D9488`
  - Success: `#10B981`, Warning: `#F59E0B`, Danger: `#EF4444`
- [x] Configure `react-router-dom` for basic routing.
- [x] Set up typography (`Inter` or `Roboto`).

---

## Phase 2: Data Ingestion & Preprocessing (ML Layer)
### 2.1 Data Ingestion Module (Python/Pandas)
- [x] Securely import EHR dataset (CSV/Database extraction).
- [x] Implement data anonymization logic (PII masking).
- [x] Build data ingestion pipeline for structured and semi-structured data.

### 2.2 Data Preprocessing Engine
- [x] Handle missing values and detect/treat outliers.
- [x] Perform feature engineering suitable for medical records.
- [x] Create reusable preprocessing pipelines (via `scikit-learn` or `pandas`).

---

## Phase 3: Exploratory Data Analysis & Model Development
### 3.1 Exploratory Data Analysis (EDA)
- [x] Calculate patient demographics & time-based analytics.
- [x] Map out disease distribution trends.

### 3.2 Predictive Modeling Module
- [x] Train baseline models (Logistic Regression, Random Forest).
- [x] Train, tune and finalize primary XGBoost model for patient outcomes.
- [x] Evaluate model to ensure >= 85% accuracy.
- [x] Save trained model weights to `backend/ml/models/`.

### 3.3 Insight Generation Engine (Explainable AI)
- [x] Integrate SHAP library for feature importance.
- [x] Implement logic to extract top influencing factors per prediction.

### 3.4 API Integration
- [x] Create `/predict/` REST API endpoint to serve real-time predictions.
- [x] Connect prediction processing to a Celery worker to ensure async execution.
- [x] Create `/train/` endpoint for scheduled model re-training.

---

## Phase 4: Frontend UI Components & Dashboard Integration
### 4.1 Dashboard Layout Architecture
- [x] Build Left Sidebar Navigation (Collapsible).
- [x] Build Top Header (Search, Date/Time Filter, User Profile, Notifications).
- [x] Set up main 12-Column grid layout for the dashboard.
- [x] Implement Skeleton Loaders for data-fetching states.

### 4.2 Core UI Elements
- [x] Build KPI Indicator Cards (showing metrics + sparklines + trend indicators).
- [x] Build Patient Data DataTables (sticky headers, predicted outcome badge tags, action buttons).
- [x] Build Predictive Insight Alert Banners (warnings for high risk predictions).

### 4.3 Data Visualizations (Recharts / Chart.js)
- [x] Implement Predictive Risk Doughnut Chart (Low/Mod/High readmission risk).
- [x] Implement Resource Utilization Bar Chart (bed/staff usage).
- [x] Implement SHAP Feature Importance Plot (horizontal bar chart).

### 4.4 API Integration
- [x] Fetch and display data for KPIs and DataTables.
- [x] Connect Risk Model API to pass patient data and retrieve ML predictions.
- [x] Handle UI states during long Celery ML tasks (loading / success / error).

---

## Phase 5: Recommendation System & Polish
### 5.1 Recommendation System
- [x] Implement heuristic/ML logic to suggest resource allocation improvements.
- [x] Automatically flag and notify regarding high-risk patient groups.

### 5.2 Performance & Polish
- [x] Add micro-interactions: Card hover effects (`hover:-translate-y-1`), responsive Tooltips on charts.
- [x] Ensure tabular numerals are used in all table and KPI figures.
- [x] Test mobile/tablet responsiveness (Tailwind `md:`, `lg:` utilities).
- [x] Ensure API endpoints respond in < 2 sec.

---

## Phase 6: Testing & Version Control
### 6.1 Preparation
- [x] Implement Role-Based Access Control (RBAC) in Django.
- [x] Test system under generated loads (100k+ records simulation).
- [ ] (Optional) Develop Streamlit Dashboard for internal analytics testing.

### 6.2 Local Setup & Version Control
- [x] Initialize Git repository and link to a GitHub repository.
- [x] Create detailed `.gitignore` for Python, React, and local environment files.
- [x] Create `README.md` with instructions on how to start the development servers locally.
- [x] Maintain `requirements.txt` and `package.json` for reproducible local environments.
