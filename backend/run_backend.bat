@echo off
cd /d "%~dp0"
echo =======================================================
echo Starting AutonomusAI Backend Server
echo API Docs: http://127.0.0.1:8000/docs
echo Health:   http://127.0.0.1:8000/api/v1/health
echo =======================================================
".venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
