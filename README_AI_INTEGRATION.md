# AI Integration Guide

## Overview
This document details the integration of Gemini AI into the HIS backend for Lab Report Summarization.

## Architecture
- **Backend**: Django (`ai_services` app)
- **Frontend**: React (`LabSummary` page)
- **AI**: Google Gemini Pro/Flash (via `google-genai` SDK)
- **Security**: JWT Authentication, Backend-only API key usage.

## Setup Instructions

### Backend
1. Dependencies installed: `google-genai`, `PyPDF2`, `python-dotenv`, `djangorestframework-simplejwt`.
2. App `ai_services` added to `INSTALLED_APPS`.
3. URLs configured at `/api/ai/` and `/api/token/`.
4. Run migrations: `python manage.py migrate`.
5. Ensure `.env` with `GEMINI_API_KEY` is in `backend/` (Auto-copied from gemini-test).

### Frontend
1. New dependencies: `axios` (used), `react-router-dom` (configured).
2. Pages created: 
   - `Login.jsx` (for Doctor authentication)
   - `LabSummary.jsx` (Upload & View)
3. Run: `npm run dev`

## Usage Flow
1. Go to `/login` (or redirected automatically).
2. Log in with a valid User (Doctor).
3. Navigate to `/lab-summary`.
4. Upload a PDF Lab Report.
5. View AI-generated summary.

## Data Logging
All requests are logged in the database table `ai_services_airequestlog` for audit purposes.
