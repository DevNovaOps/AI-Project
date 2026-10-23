import { create } from 'zustand';
import { useAppStore } from './useAppStore';
import { sessionsApi } from '../api/sessions';
import { normalizeError, apiClient } from '../api/client';

export const useWorkflowStore = create((set, get) => ({
  workflowState: 'idle', // 'idle' | 'planning' | 'analyzing' | 'diagnosing' | 'generating_fix' | 'running_tests' | 'repairing' | 'validating' | 'completed' | 'failed'
  activeAgent: null,
  progress: 0,
  currentStepIndex: 0,
  retryCount: 0,
  activeSessionId: null,
  agentLogs: [],

  addLog: (log) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      time: new Date().toTimeString().split(' ')[0],
      duration: log.duration || '—',
      ...log
    };
    set((s) => ({ agentLogs: [newEntry, ...s.agentLogs] }));
  },

  clearLogs: () => set({ agentLogs: [] }),

  startAutonomousWorkflow: async () => {
    const appStore = useAppStore.getState();
    const currentProject = appStore.currentProject;

    if (get().workflowState !== 'idle' && get().workflowState !== 'completed' && get().workflowState !== 'failed') {
      return; // Already running
    }

    const truncateContent = (text) => {
      if (!text || typeof text !== 'string') return '';
      if (text.length > 120000) {
        return text.slice(0, 120000) + '\n# [Content truncated for analysis: exceeded size limit]';
      }
      return text;
    };

    // Gather files from appStore
    let sourceFiles = [];
    const openFiles = Object.values(appStore.files);

    if (openFiles.length > 0) {
      sourceFiles = openFiles.map(f => ({
        filename: f.path || f.filename || 'main.py',
        file_path: f.path || f.filename || 'main.py',
        content: truncateContent(f.content),
      }));
    }

    // Always supplement with project code files (up to 5 total) if available
    if (currentProject?.id && sourceFiles.length < 5 && appStore.fileTree?.length > 0) {
      try {
        const tree = appStore.fileTree;
        const codeExtensions = ['.sql', '.py', '.js', '.jsx', '.ts', '.tsx'];
        const existingPaths = new Set(sourceFiles.map(f => f.filename));

        const collectCodeFiles = (nodes, acc = []) => {
          for (const n of nodes) {
            if (n.type === 'file' && !existingPaths.has(n.id)) {
              const lower = n.id.toLowerCase();
              if (codeExtensions.some(ext => lower.endsWith(ext)) && (sourceFiles.length + acc.length) < 5) {
                acc.push(n.id);
              }
            }
            if (n.children) collectCodeFiles(n.children, acc);
          }
          return acc;
        };

        const paths = collectCodeFiles(tree);
        for (const p of paths) {
          try {
            const contentRes = await apiClient.get(`/projects/${currentProject.id}/files/content?path=${encodeURIComponent(p)}`);
            sourceFiles.push({
              filename: p,
              file_path: p,
              content: truncateContent(contentRes.content),
            });
          } catch (e) {
            // Ignore single file fetch error
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch project files for analysis:', err);
      }
    }

    // If still empty, inform user
    if (sourceFiles.length === 0) {
      appStore.addNotification({
        title: 'No Code Found',
        message: 'Please import a GitHub repository or create a file in the workspace first.',
        type: 'warning',
      });
      return;
    }

    // Detect target language
    let detectedLang = appStore.activeLanguage || 'python';
    const firstCodeFile = sourceFiles.find(f => {
      const lower = f.filename.toLowerCase();
      return lower.endsWith('.py') || lower.endsWith('.sql') || lower.endsWith('.js') || lower.endsWith('.ts');
    });
    if (firstCodeFile) {
      const lower = firstCodeFile.filename.toLowerCase();
      if (lower.endsWith('.sql')) detectedLang = 'sql';
      else if (lower.endsWith('.py')) detectedLang = 'python';
      else if (lower.endsWith('.js') || lower.endsWith('.jsx')) detectedLang = 'javascript';
      else if (lower.endsWith('.ts') || lower.endsWith('.tsx')) detectedLang = 'typescript';
    }

    set({
      workflowState: 'planning',
      activeAgent: 'Planner / Orchestrator',
      progress: 10,
      currentStepIndex: 1,
      retryCount: 0,
      agentLogs: [],
    });

    get().addLog({
      agent: 'Planner',
      message: `Initializing 5-Agent pipeline for project '${currentProject?.name || 'Workspace'}' (${sourceFiles.length} file(s) targeted)`,
      status: 'info',
    });

    try {
      // 1. Create real DebugSession on FastAPI backend
      const session = await sessionsApi.create({
        title: `Analysis: ${currentProject?.name || 'Workspace'}`,
        language: detectedLang,
        task_description: 'Analyze source files, detect runtime and syntax errors, diagnose root causes, and propose verified patches.',
        files: sourceFiles,
        source_files: sourceFiles,
      });

      const sessionId = session.id;
      set({ activeSessionId: sessionId });

      // 2. Start running the session
      await sessionsApi.run(sessionId);

      // 3. Connect WebSocket for live events, with polling fallback
      let wsConnected = false;
      const wsUrl = sessionsApi.getWebSocketUrl(sessionId);

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          wsConnected = true;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            get().handleWorkflowEvent(data);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onerror = () => {
          wsConnected = false;
        };
      } catch (err) {
        wsConnected = false;
      }

      // 4. Polling monitor to ensure completion tracking
      const pollInterval = setInterval(async () => {
        try {
          const updated = await sessionsApi.get(sessionId);
          const status = updated.status;

          if (status === 'completed' || status === 'partially_validated') {
            clearInterval(pollInterval);
            await get().finalizeWorkflow(sessionId);
          } else if (status === 'failed' || status === 'cancelled') {
            clearInterval(pollInterval);
            set({ workflowState: 'failed', activeAgent: null });
            get().addLog({
              agent: 'Planner',
              message: `Autonomous workflow terminated with status: ${status}`,
              status: 'critical',
            });
          } else {
            // Update progress based on state
            if (status === 'running') {
              // Fetch latest events
              const events = await sessionsApi.getEvents(sessionId);
              if (Array.isArray(events)) {
                for (const ev of events) {
                  get().handleWorkflowEvent(ev);
                }
              }
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1000);

    } catch (err) {
      set({ workflowState: 'failed', activeAgent: null });
      get().addLog({
        agent: 'Planner',
        message: `Workflow launch failed: ${normalizeError(err)}`,
        status: 'critical',
      });
    }
  },

  handleWorkflowEvent: (ev) => {
    const type = ev.event_type || ev.type;
    const payload = ev.payload || {};

    if (type?.includes('planner')) {
      set({ workflowState: 'planning', activeAgent: 'Planner / Orchestrator', progress: 20 });
    } else if (type?.includes('analysis')) {
      set({ workflowState: 'analyzing', activeAgent: 'Code Analysis Agent', progress: 40 });
    } else if (type?.includes('diagnos')) {
      set({ workflowState: 'diagnosing', activeAgent: 'Diagnosis Agent', progress: 60 });
    } else if (type?.includes('fix') || type?.includes('repair')) {
      set({ workflowState: 'generating_fix', activeAgent: 'Fix & Test Agent', progress: 75 });
    } else if (type?.includes('test')) {
      set({ workflowState: 'running_tests', activeAgent: 'Fix & Test Agent', progress: 85 });
    } else if (type?.includes('validat') || type?.includes('report')) {
      set({ workflowState: 'validating', activeAgent: 'Validation Agent', progress: 95 });
    }

    if (payload.message || ev.message) {
      const agentName = ev.agent_name || payload.agent || 'System';
      get().addLog({
        agent: agentName,
        message: payload.message || ev.message,
        status: payload.status || 'info',
        duration: payload.duration_ms ? `${payload.duration_ms}ms` : undefined,
      });
    }
  },

  finalizeWorkflow: async (sessionId) => {
    const appStore = useAppStore.getState();

    try {
      // 1. Fetch real findings
      const findingsRes = await apiClient.get(`/debug/sessions/${sessionId}/findings`);
      const rawFindings = Array.isArray(findingsRes) ? findingsRes : [];

      const formattedIssues = rawFindings.map((f, idx) => ({
        id: f.id || `FINDING-${idx + 1}`,
        title: f.title || f.message || 'Code Finding',
        detail: f.description || f.message,
        message: f.message || f.title,
        file: f.source_file_path || 'file.py',
        filePath: f.source_file_path || 'file.py',
        line: f.line_number || 1,
        col: f.column_number || 1,
        severity: (f.severity || 'medium').charAt(0).toUpperCase() + (f.severity || 'medium').slice(1),
        category: f.category || 'Static Analysis',
        confidence: Math.round((f.confidence_score || 0.9) * 100),
        rootCause: f.description,
        suggestedFix: f.suggested_fix || '',
        codeSnippet: f.code_snippet || '',
        status: 'Open',
        source: f.detection_tool || 'AutonomusAI',
      }));

      // 2. Fetch repairs
      let repairs = [];
      try {
        const repairsRes = await apiClient.get(`/debug/sessions/${sessionId}/repairs`);
        repairs = Array.isArray(repairsRes) ? repairsRes : [];
      } catch (e) {
        repairs = [];
      }

      // 3. Fetch test runs
      let testRuns = [];
      try {
        const testRes = await apiClient.get(`/debug/sessions/${sessionId}/tests`);
        testRuns = Array.isArray(testRes) ? testRes : [];
      } catch (e) {
        testRuns = [];
      }

      // 4. Fetch final report
      let finalReport = null;
      try {
        finalReport = await apiClient.get(`/debug/sessions/${sessionId}/report`);
      } catch (e) {
        finalReport = null;
      }

      // Update app store
      useAppStore.setState({
        issues: formattedIssues,
        selectedIssueId: formattedIssues.length > 0 ? formattedIssues[0].id : null,
        repairs,
        testCases: testRuns,
        finalReport,
        rightSidebarTab: formattedIssues.length > 0 ? 'analysis' : 'report',
      });

      set({
        workflowState: 'completed',
        activeAgent: null,
        progress: 100,
        currentStepIndex: 7,
      });

      get().addLog({
        agent: 'Validation & Reporting',
        message: `Autonomous workflow completed. Found ${formattedIssues.length} finding(s) across target files.`,
        status: 'success',
      });

      appStore.addNotification({
        title: 'Analysis Completed',
        message: `Identified ${formattedIssues.length} finding(s) with AI diagnosis.`,
        type: formattedIssues.length > 0 ? 'warning' : 'success',
      });

    } catch (err) {
      console.error('Error finalizing workflow:', err);
      set({ workflowState: 'completed', activeAgent: null, progress: 100 });
    }
  },

  cancelAutonomousWorkflow: () => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      sessionsApi.cancel(activeSessionId).catch(() => {});
    }
    set({
      workflowState: 'idle',
      activeAgent: null,
      progress: 0,
      currentStepIndex: 0,
    });
    get().addLog({
      agent: 'Planner',
      message: 'Workflow execution cancelled by user.',
      status: 'warning',
    });
  },

  resetWorkflow: () => {
    set({
      workflowState: 'idle',
      activeAgent: null,
      progress: 0,
      currentStepIndex: 0,
      activeSessionId: null,
    });
  },
}));
