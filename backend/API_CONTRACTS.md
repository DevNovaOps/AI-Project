# AutonomusAI — Frontend Integration Guide & API Contracts

This document provides the exact API specifications, schema definitions, and frontend integration code examples for integrating the React/Vite/JavaScript frontend with the AutonomusAI backend.

---

## 1. Overview & Base URL

- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **WebSocket URL**: `ws://localhost:8000/api/v1/debug/sessions/{session_id}/ws`
- **CORS Allowed Origins**: Configured in `.env` (`http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`)

> **Note on Authentication**: Authentication is deferred in development mode. For production, add JWT Bearer authentication and rate limiting before public exposure.

---

## 2. API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, DB connectivity, Groq config status, and sandbox availability |
| `POST` | `/api/v1/debug/sessions` | Create a new debug session with submitted files |
| `GET` | `/api/v1/debug/sessions/{id}` | Get session details, files, and status |
| `POST` | `/api/v1/debug/sessions/{id}/run` | Start the autonomous 5-agent LangGraph workflow |
| `GET` | `/api/v1/debug/sessions/{id}/events` | Poll chronological workflow events (REST fallback) |
| `GET` | `/api/v1/debug/sessions/{id}/findings` | Get structured static analysis findings (supports filters) |
| `GET` | `/api/v1/debug/sessions/{id}/repairs` | Get proposed patches and before/after diffs |
| `GET` | `/api/v1/debug/sessions/{id}/tests` | Get sandboxed test execution results |
| `GET` | `/api/v1/debug/sessions/{id}/report` | Get final evidence-based debugging report |
| `POST` | `/api/v1/debug/sessions/{id}/cancel` | Cancel an in-flight workflow |
| `WS` | `/api/v1/debug/sessions/{id}/ws` | Real-time WebSocket streaming of events |

---

## 3. Detailed Request and Response Contracts

### 3.1 Health Check

```http
GET /api/v1/health
```

#### Response (200 OK)
```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-10-23T15:30:00Z",
  "database": {
    "connected": true,
    "detail": "connected",
    "url_type": "postgresql"
  },
  "ai_provider": {
    "provider": "Groq",
    "configured": true,
    "model": "llama-3.3-70b-versatile",
    "status": "ready"
  },
  "execution_subsystem": {
    "enabled": false,
    "backend": "docker",
    "available": false,
    "reason": "Sandbox execution is disabled in configuration (SANDBOX_ENABLED=false). Tests will be marked as skipped."
  }
}
```

---

### 3.2 Create Debug Session

```http
POST /api/v1/debug/sessions
Content-Type: application/json
```

#### Request Body
```json
{
  "title": "AegisVault division error",
  "language": "python",
  "files": [
    {
      "filename": "backend/main.py",
      "content": "def calculate_average(numbers):\n    return sum(numbers) / len(numbers)\n",
      "language": "python"
    }
  ],
  "task_description": "Prevent ZeroDivisionError when numbers is empty.",
  "requested_checks": ["syntax", "style", "runtime", "security"],
  "max_repair_attempts": 3
}
```

#### Response (201 Created)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "AegisVault division error",
  "language": "python",
  "status": "queued",
  "task_description": "Prevent ZeroDivisionError when numbers is empty.",
  "configuration": {
    "requested_checks": ["syntax", "style", "runtime", "security"],
    "max_repair_attempts": 3
  },
  "source_metadata": {
    "file_count": 1,
    "filenames": ["backend/main.py"]
  },
  "created_at": "2026-10-23T15:30:00Z",
  "updated_at": "2026-10-23T15:30:00Z",
  "completed_at": null,
  "files": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "filename": "backend/main.py",
      "language": "python",
      "original_content": "def calculate_average(numbers):\n    return sum(numbers) / len(numbers)\n",
      "proposed_content": null,
      "file_metadata": {
        "size_bytes": 69
      },
      "created_at": "2026-10-23T15:30:00Z",
      "updated_at": "2026-10-23T15:30:00Z"
    }
  ]
}
```

---

### 3.3 Start Workflow Run

```http
POST /api/v1/debug/sessions/3fa85f64-5717-4562-b3fc-2c963f66afa6/run
```

#### Response (200 OK)
```json
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "running",
  "workflow_id": "wf-3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Autonomous debugging workflow started in background."
}
```

---

### 3.4 Findings (Problems Panel)

```http
GET /api/v1/debug/sessions/3fa85f64-5717-4562-b3fc-2c963f66afa6/findings?severity=Critical
```

#### Response (200 OK)
```json
[
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "source_file_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "file": "backend/main.py",
    "category": "Runtime Error",
    "severity": "High",
    "title": "Potential division by zero (empty collection)",
    "description": "Division by len(...) could result in ZeroDivisionError if the input collection is empty. Add a length/truthiness validation guard before dividing.",
    "line_number": 2,
    "column_number": 11,
    "evidence": "Division by len(...) without verifiable zero guard.",
    "origin": "AST",
    "status": "Open",
    "suggested_fix": null,
    "root_cause": null,
    "confidence": 90,
    "metadata_info": {},
    "created_at": "2026-10-23T15:30:02Z"
  }
]
```

---

### 3.5 Proposed Repairs (Fixes Panel)

```http
GET /api/v1/debug/sessions/3fa85f64-5717-4562-b3fc-2c963f66afa6/repairs
```

#### Response (200 OK)
```json
[
  {
    "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
    "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "attempt_number": 1,
    "diagnosis": {
      "root_cause_summary": "Unchecked division by len(numbers) when input list is empty.",
      "confidence": 95
    },
    "proposed_changes": [
      {
        "filename": "backend/main.py",
        "original_snippet": "def calculate_average(numbers):\n    return sum(numbers) / len(numbers)\n",
        "proposed_snippet": "def calculate_average(numbers):\n    if not numbers or len(numbers) == 0:\n        return 0\n    return sum(numbers) / len(numbers)\n",
        "diff": "--- a/backend/main.py\n+++ b/backend/main.py\n@@ -1,2 +1,4 @@\n def calculate_average(numbers):\n+    if not numbers or len(numbers) == 0:\n+        return 0\n     return sum(numbers) / len(numbers)\n",
        "explanation": "Added defensive guard to prevent ZeroDivisionError."
      }
    ],
    "test_result_summary": {
      "status": "skipped",
      "actual_execution": false,
      "exit_code": null
    },
    "validation_status": "pending",
    "explanation": "Generated patch modifying 1 file(s).",
    "created_at": "2026-10-23T15:30:05Z"
  }
]
```

---

### 3.6 Final Report

```http
GET /api/v1/debug/sessions/3fa85f64-5717-4562-b3fc-2c963f66afa6/report
```

#### Response (200 OK)
```json
{
  "id": "f9e8d7c6-b5a4-3f2e-1d0c-9b8a7f6e5d4c",
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "summary": "Debugging session completed with validation status: could_not_run. Identified 1 initial finding(s). Generated 1 file modification(s). Test execution boundary: skipped (actual_execution=False).",
  "validation_status": "could_not_run",
  "findings_summary": {
    "initial_count": 1,
    "critical_count": 0,
    "high_count": 1,
    "medium_count": 0
  },
  "repairs_summary": [
    {
      "filename": "backend/main.py",
      "explanation": "Added zero guard to prevent ZeroDivisionError."
    }
  ],
  "tests_summary": {
    "status": "skipped",
    "actual_execution": false,
    "exit_code": null,
    "command": "pytest"
  },
  "unresolved_issues": [
    {
      "issue": "Tests Skipped",
      "detail": "Sandbox execution is disabled in configuration."
    }
  ],
  "created_at": "2026-10-23T15:30:08Z"
}
```

---

## 4. Frontend Integration Code Examples (JavaScript / React)

### 4.1 REST Session Creation & Polling Fallback

```javascript
// src/services/autonomusApi.js
const API_BASE = 'http://localhost:8000/api/v1';

export async function createAndRunDebugSession({ title, language, files, taskDescription }) {
  // 1. Create session
  const createRes = await fetch(`${API_BASE}/debug/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      language: language || 'python',
      files: files.map(f => ({
        filename: f.path || f.name,
        content: f.content,
      })),
      task_description: taskDescription,
      max_repair_attempts: 3,
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.message || 'Failed to create debug session');
  }

  const session = await createRes.json();
  const sessionId = session.id;

  // 2. Start workflow
  await fetch(`${API_BASE}/debug/sessions/${sessionId}/run`, {
    method: 'POST',
  });

  return sessionId;
}

export async function pollSessionStatus(sessionId, onProgress) {
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/debug/sessions/${sessionId}`);
      const session = await res.json();

      const eventsRes = await fetch(`${API_BASE}/debug/sessions/${sessionId}/events`);
      const events = await eventsRes.json();

      onProgress({ session, events });

      if (['completed', 'failed', 'cancelled', 'partially_validated'].includes(session.status)) {
        clearInterval(pollInterval);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 1000);

  return () => clearInterval(pollInterval);
}
```

### 4.2 Real-Time WebSocket Streaming

```javascript
// src/services/useWorkflowSocket.js
import { useEffect, useRef } from 'react';

export function useWorkflowSocket(sessionId, onEvent) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = `ws://localhost:8000/api/v1/debug/sessions/${sessionId}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to AutonomusAI WebSocket for session:', sessionId);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse WebSocket event:', err);
      }
    };

    socket.onclose = () => {
      console.log('AutonomusAI WebSocket closed.');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sessionId, onEvent]);
}
```
