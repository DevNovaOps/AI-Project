# AETHERION — Autonomous Debugging, Testing & Validation

> **A Next-Generation AI-Powered Developer IDE built with React, Monaco Editor, Zustand, and Recharts.**

AETHERION is an enterprise-grade autonomous debugging, testing, and code repair IDE designed to diagnose root causes, synthesize guarded patches, execute automated test suites, and generate comprehensive diagnostics telemetry.

---

## 📸 Key Interface Highlights

- **Desktop IDE Workspace**: Exact reproduction and elevation of the dark navy and clean light reference designs.
- **Central Monaco Code Editor**: Language-aware syntax highlighting (Python, JSX, JS, CSS, JSON, Markdown), line numbers, minimap, cursor tracking, and custom glyph/inline squiggly error decorations.
- **Inline Diagnostic Popup**: Anchored contextually next to problematic lines (`main.py:6`), displaying runtime error tags, root cause summaries, and instant actions (**Explain**, **Fix with AI**, **Add Test**).
- **Multi-Agent Autonomous Workflow**: 5 cooperating agents (**Planner / Orchestrator**, **Code Analysis Agent**, **Diagnosis Agent**, **Fix & Test Agent**, **Validation & Reporting Agent**) running bounded repair loops with real-time event streaming and status updates.
- **Developer Console**: Tabbed workspace with **Problems (4)** (filterable by severity and searchable), **Terminal** (simulated Python sandbox REPL with command execution), **Test Results (2)** (pytest runner with tracebacks), **Output**, **Debug Console**, and **Agent Logs**.
- **Contextual AI Sidebar**: Segmented tabs for **Chat**, **Analysis**, **Tests**, **Fixes** (interactive side-by-side / unified code diffs with apply & undo), and **Report Preview**, plus quick bottom prompt chips.
- **Full Analytics & Reports Page (`/reports`)**: Executive KPI summaries, Recharts visualizations (7-day issue velocity area chart, severity distribution donut chart, category breakdown bar chart, agent accuracy telemetry), filterable issues directory, detail modal, and **one-click CSV data export**.
- **Dark & Light Themes**: Flawlessly styled themes matching the reference screenshots with CSS variables persisted in `localStorage`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 18, Vite 6, JavaScript (ES Modules, `.js` / `.jsx`) |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **State Management** | Zustand (persistent global app & workflow stores) |
| **Data Visualizations** | Recharts (Area charts, Donut charts, Bar charts) |
| **Icons & Design** | Lucide React, Google Fonts (`Inter`, `JetBrains Mono`) |
| **Styling** | Custom CSS Design System with CSS Variables (`tokens.css`, `themes.css`, `layout.css`, `components.css`) |
| **Routing** | React Router v6 (`/`, `/editor`, `/search`, `/source-control`, `/debug`, `/tests`, `/fixes`, `/reports`, `/settings`) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ or v20+ recommended, tested on Node v22.19)
- npm (v9+ or v11+)

### Installation & Run

1. Clone or navigate to the repository directory:
   ```bash
   cd c:/Ai-Project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```text
   http://localhost:3000/
   ```

5. To create a production build:
   ```bash
   npm run build
   ```

---

## 🧭 Navigation & Routes

| Route | View | Description |
|---|---|---|
| `/` or `/editor` | **Main IDE** | Full IDE layout with Project Explorer, Monaco Editor, Developer Console, and Contextual AI Sidebar |
| `/search` | **Global Search** | Workspace symbol, function, and string indexer with case-sensitive filtering |
| `/source-control` | **Git Source Control** | Branch manager, modified files tracker, commit message simulator |
| `/debug` | **Debugger** | Breakpoint manager, call stack, and variable inspector (`numbers = []`, `len = 0`) |
| `/tests` | **Test Suite** | Pytest runner, pass/fail meters, execution time, and failure tracebacks |
| `/fixes` | **AI Fixes** | Unified code diff viewer, patch preview, apply fix, and undo fix workflows |
| `/reports` | **Reports & Telemetry** | Recharts analytics, KPI cards, issue directory, and working CSV export |
| `/settings` | **Preferences** | Light/dark theme selector, AI model pipeline settings, Monaco editor options |

---

## ⌨️ Keyboard Shortcuts

- <kbd>Ctrl</kbd> + <kbd>K</kbd>: Open Global Command &amp; File Palette
- <kbd>Ctrl</kbd> + <kbd>↵</kbd>: Send Prompt to Autonomous AI Assistant
- <kbd>Esc</kbd>: Dismiss Dialogs, Popovers, and Command Palette

---

## 🔒 Security & Engineering Boundaries

This frontend application is engineered as a production-quality developer tools prototype:
- Code analysis, diagnostics, and test executions run deterministically through simulated sandbox state machines.
- Does not expose backend credentials or require arbitrary system code execution in the browser.
- Prepared for easy integration with future live backend LLM and sandboxed container execution microservices.
