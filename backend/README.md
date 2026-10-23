# AutonomusAI Backend

Autonomous Code Analysis, Debugging, Repair, Testing, and Validation Platform.

AutonomusAI accepts source code from a user and autonomously:
1. Analyzes the code using deterministic AST parsing and Ruff.
2. Diagnoses underlying root causes with Groq LLM through LangChain.
3. Generates minimal, targeted proposed code repairs.
4. Executes permitted tests strictly inside an isolated sandbox container.
5. Retries repair attempts within configurable limits.
6. Validates proposed solutions based strictly on empirical evidence (never LLM opinion alone).
7. Produces an evidence-based final report and streams real-time events over WebSockets.

---

## 1. Architecture Overview

### 5-Agent LangGraph Workflow
```
START
  |
  v
[Agent 1: Planner & Orchestrator]
  |
  v
[Agent 2: Code Analysis Agent] (AST + Ruff deterministic findings)
  |
  v
[Agent 3: Diagnosis Agent] (Groq LangChain root-cause diagnosis)
  |
  v
[Agent 4: Fix & Test Agent] (Minimal patch synthesis + Sandboxed test run)
  |
  v
[Agent 5: Validation Agent] (Empirical evidence evaluation)
  |
  +--- Validation Passed OR Attempt Limit Reached ---> [Final Report Agent] ---> END
  |
  +--- Validation Failed AND Retries Remain ---------> [Agent 3: Diagnosis Agent]
```

### Technology Stack
- **Language**: Python 3.11+
- **API Framework**: FastAPI + Uvicorn
- **AI Integration**: Groq API via LangChain (`langchain-groq`)
- **Multi-Agent Orchestration**: LangGraph stateful graph
- **Database & ORM**: PostgreSQL + SQLAlchemy 2.x
- **Migrations**: Alembic
- **Static Analysis**: Python AST + Ruff
- **Testing**: Pytest + HTTPX + pytest-asyncio
- **Real-Time Streaming**: WebSockets + REST polling fallback

---

## 2. Quickstart & Local Setup

### Step 1: Virtual Environment Setup

#### Windows PowerShell:
```powershell
# Navigate to backend folder
cd "c:\Users\ASUS\Desktop\Ai Project\backend"

# Create virtual environment with Python 3.11
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install all backend dependencies
pip install -r requirements.txt
```

#### macOS / Linux:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

### Step 2: Environment Configuration

Copy the example environment file:
```powershell
Copy-Item .env.example .env
```

Edit `.env` to configure your settings:
```ini
APP_NAME=AutonomusAI
APP_ENV=development
API_V1_PREFIX=/api/v1

# MySQL Database URL (replace 'YOUR_MYSQL_PASSWORD' with your actual MySQL password)
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/autonomusai

# Groq AI Provider
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TIMEOUT_SECONDS=60

# Workflow Limits
MAX_REPAIR_ATTEMPTS=3
MAX_FILES_PER_SESSION=20
MAX_SOURCE_FILE_SIZE_BYTES=200000
MAX_SESSION_SOURCE_SIZE_BYTES=1000000

# Sandbox Security Boundary
SANDBOX_ENABLED=false

# Frontend CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]
```

---

### Step 3: MySQL Database Setup

Ensure MySQL Server is running locally on port 3306, and create the `autonomusai` database in your MySQL client (MySQL Workbench, phpMyAdmin, or MySQL CLI):

```sql
CREATE DATABASE autonomusai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update your password in `.env`:
```ini
DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/autonomusai
```

---

### Step 4: Run Database Migrations

Apply database migrations using Alembic:
```powershell
alembic upgrade head
```

---

### Step 5: Start FastAPI Server

Run the development server with Uvicorn:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Redoc UI: `http://127.0.0.1:8000/redoc`
- Health Endpoint: `http://127.0.0.1:8000/api/v1/health`

---

### Step 6: Run Automated Tests

Execute the Pytest test suite:
```powershell
pytest -v
```

Run specific test modules:
```powershell
# Unit tests
pytest tests/unit/ -v

# API integration tests
pytest tests/integration/ -v

# Multi-agent workflow tests
pytest tests/workflow/ -v

# Security boundary tests
pytest tests/security/ -v
```

---

### Step 7: Connecting the React Frontend

The React frontend runs on Vite at `http://localhost:5173`.
1. The backend automatically allows CORS requests from `http://localhost:5173`.
2. See [API_CONTRACTS.md](file:///c:/Users/ASUS/Desktop/Ai%20Project/backend/API_CONTRACTS.md) for complete request/response schemas and JavaScript client integration examples.
