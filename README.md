# Echoes of the Manor

A landscape mobile murder mystery game built with Expo, React Native, FastAPI, and Gemini-powered agent orchestration.

## Project Structure

```text
frontend/   Expo React Native mobile app
backend/    FastAPI agentic orchestrator
```

## Frontend

```powershell
cd frontend
npm install
npx expo start -c
```

The mobile app currently targets landscape orientation and connects to the backend URL configured in `frontend/src/services/api.ts`.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Add your real Gemini key to `backend/.env` before running the backend.

## Validation

```powershell
cd frontend
npx tsc --noEmit

cd ..\backend
.\.venv\Scripts\python.exe -m compileall main.py agents models
```
