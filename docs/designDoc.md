# 🎨 Design Document (DesignDoc)
## 🏥 Healthcare Data Analysis & Predictive Intelligence Dashboard

---

## 1. 📌 Overview & Design Philosophy

Based on the Product Requirements Document (PRD), this Design Document outlines the UI/UX architecture for the **Predictive Intelligence System**. Following the aesthetic principles observed in modern "Doktor - Medical Dashboard" designs (from references like Dribbble) and modern component-driven architectures like Google Stitch, the design focuses on:

- **Clarity & Focus**: Surfacing critical data insights and AI predictions smoothly without overwhelming the healthcare provider or analyst.
- **Trust & Professionalism**: Using a clean, clinical, yet modern color palette.
- **Predictive Visibility**: Highlighting ML-driven outcomes (like risk levels, readmission probability, and resource optimization) effectively using visual hierarchy.

---

## 2. 🎨 Color Scheme

The color palette is engineered to present trust, clarity, and immediate attention to risk factors.

### Primary Colors (Brand & Core Actions)
- **Primary Blue**: `#2563EB` (Tailwind Blue-600) – Used for primary buttons, active sidebar links, and main interactive elements.
- **Soft Teal**: `#0D9488` (Tailwind Teal-600) – Used for secondary highlights and data visualizations to signify health and wellness.

### Background & Surface Elements
- **Main Background**: `#F3F4F6` (Gray-100) – Provides a soft contrast against white cards.
- **Surface / Card Background**: `#FFFFFF` (White) – Allows data and charts to breathe. Clean and readable.
- **Border Mute**: `#E5E7EB` (Gray-200) – Subtle dividers for data tables and card borders.

### Feedback & Predictive Status Colors
- **Success / Low Risk**: `#10B981` (Emerald-500) – High recovery probability, stable vitals.
- **Warning / Moderate Risk**: `#F59E0B` (Amber-500) – Approaching thresholds, attention needed.
- **Critical / High Readmission Risk**: `#EF4444` (Red-500) – High risk predictions, critical drops in resources.

---

## 3. ✍️ Typography

Medical dashboards require maximum legibility.

- **Primary Font**: `Inter` or `Roboto` (Sans-serif)
- **Heading Font weights**: Semi-Bold (600) and Bold (700)
- **Data / Numbers Font**: Tabular numerals are mandatory for tables and KPI cards to ensure numbers align perfectly vertical.

### Hierarchy Hierarchy
- **H1 (Page Title)**: 24px, Semi-bold, `#111827` (Gray-900)
- **H2 (Card/Section Title)**: 18px, Medium, `#374151` (Gray-700)
- **Body Text**: 14px, Regular, `#4B5563` (Gray-600)
- **Micro-Copy / Labels**: 12px, Medium, `#6B7280` (Gray-500)

---

## 4. 📐 Layout Architecture

The dashboard will utilize a highly functional **Sidebar + Top Navbar** layout, allowing maximum screen real estate for complex charts and AI insights.

### Grid System
- **12-Column Grid** using standard Tailwind CSS grid utilities.
- Standard gap of `1.5rem` (`gap-6`) between cards and components.
- Responsive breakpoints: Mobile-first approach, optimizing primarily for Tablet (`md:`), Laptop (`lg:`), and Desktop (`xl:`).

### Structure
1. **Left Sidebar (Navigation)**: 
   - Collapsible. Used for switching between main PRD modules (Exploratory Data Analysis, Predictive Models, Resource Allocation, Patient Insights).
2. **Top Header**: 
   - Contains Global Search, Date/Time Filter (critical for time-based analytics), Notification Bell (for automated AI alerts), and User Profile.
3. **Main Content Area**:
   - Scrollable area containing widgets and data tables.

---

## 5. 🧩 Core UI Components

### 5.1 KPI Indicator Cards
Used for top-level stats (e.g., *Total Admissions, High-Risk Patients, Resource Utilization %*).
- Formatted as rectangular white cards with subtle drop shadows (`shadow-sm` or `shadow-md`).
- Should include a **trend indicator** (e.g., `+5.2% vs last week` in green/red) alongside the primary number.
- Sparkline charts (mini-line charts) in the background of the card to show historical trajectory.

### 5.2 Data Visualizations & Charts
To map to the PRD requirements (EDA and Insights):
- **Predictive Risk Doughnut Chart**: Shows percentage of Low / Moderate / High readmission risk among current patients.
- **Resource Utilization Bar Chart**: Displays bed and staff utilization across departments.
- **SHAP Feature Importance Plot**: Horizontal bar charts styled cleanly to show which factors (e.g., age, specific lab levels) influenced the ML prediction the most.
- **Tools**: Recharts / Chart.js configured to use the exact color scheme defined above. No default palette.

### 5.3 Patient Data Tables
Used for viewing dataset outputs and ML prediction scores per patient.
- Sticky headers.
- Tag/Badge components for the "Predicted Outcome" column (e.g., a Red tag for `High Risk`).
- Action buttons at the end of each row for "View Detailed AI Analysis".

### 5.4 Predictive Insight Alerts
- Informational banners placed at the top of the dashboard.
- Example: *"⚠️ High influx of respiratory cases predicted in the next 48 hours. Suggest increasing staff in Pulmonology."*
- Features an icon, text, and an action button ("Review Staff Allocation").

---

## 6. ✨ Interactions & Animations (Micro-interactions)

- **Hover States**: Cards lift slightly on hover (`hover:-translate-y-1 hover:shadow-lg transition-all`).
- **Loading States**: Since ML models and large dataset queries (100k+ records) may take >1 second, Skeleton Loaders must be used instead of standard spinners to maintain layout structure during data fetching.
- **Tooltips**: Data points on charts must have interactive tooltips displaying precise values and AI confidence scores.

---

## 7. 🔗 Alignment with Tech Stack

As per the PRD and project architecture:
- Designs will be implemented using **React + Tailwind CSS 4**.
- Dashboard views will interact with the Django/FastAPI backend, polling or receiving JSON payloads of predictions.
- **Recharts** will handle the real-time data visualization aspects directly on the client.
