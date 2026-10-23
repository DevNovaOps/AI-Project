Set-Location $PSScriptRoot

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting AutonomusAI Backend Server" -ForegroundColor Green
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Health:   http://127.0.0.1:8000/api/v1/health" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
