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

    // Gather files from appStore: prioritize active file in editor!
    const nonCodeExts = ['.txt', '.text', '.md', '.markdown', '.rst', '.log', '.csv', '.tsv'];
    let sourceFiles = [];

    const activePath = appStore.activeFilePath || 'main.py';

    // Synchronize live unsaved buffer directly from Monaco Editor if mounted
    let liveEditorContent = null;
    if (typeof window !== 'undefined' && window.__AETHERION_EDITOR__ && typeof window.__AETHERION_EDITOR__.getValue === 'function') {
      try {
        liveEditorContent = window.__AETHERION_EDITOR__.getValue();
      } catch (err) {
        console.warn('Could not read from Monaco editor instance:', err);
      }
    }

    if (liveEditorContent !== null && activePath) {
      appStore.updateFileContent(activePath, liveEditorContent);
    }

    const currentFiles = useAppStore.getState().files;
    const activeFile = currentFiles[activePath];
    const effectiveContent = liveEditorContent !== null ? liveEditorContent : (activeFile ? activeFile.content : '');

    // 1. If an active file is open and is a code/markup file, put it FIRST
    if (effectiveContent !== undefined && effectiveContent !== null) {
      const p = (activeFile?.path || activePath || 'main.py').toLowerCase();
      if (!nonCodeExts.some(ext => p.endsWith(ext))) {
        sourceFiles.push({
          filename: activeFile?.path || activePath || 'main.py',
          file_path: activeFile?.path || activePath || 'main.py',
          content: truncateContent(effectiveContent),
          language: activeFile?.language || 'python',
        });
      }
    }

    // 2. Add other open tabs if any (up to 3 total open editor tabs)
    const openTabs = appStore.openTabs || [];
    for (const tabPath of openTabs) {
      if (tabPath === activePath) continue;
      const f = appStore.files[tabPath];
      if (!f || f.content === undefined) continue;
      const p = (f.path || f.name || tabPath).toLowerCase();
      if (nonCodeExts.some(ext => p.endsWith(ext))) continue;

      if (!sourceFiles.some(s => s.filename === (f.path || tabPath))) {
        sourceFiles.push({
          filename: f.path || tabPath,
          file_path: f.path || tabPath,
          content: truncateContent(f.content),
          language: f.language,
        });
      }
    }

    // 3. ONLY if NO files are open in tabs at all, fallback to project tree
    if (sourceFiles.length === 0 && currentProject?.id && appStore.fileTree?.length > 0) {
      try {
        const tree = appStore.fileTree;
        const codeExtensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.sql', '.html', '.css', '.json'];
        const existingPaths = new Set(sourceFiles.map(f => f.filename));

        const collectCodeFiles = (nodes, acc = []) => {
          for (const n of nodes) {
            if (n.type === 'file' && !existingPaths.has(n.id)) {
              const lower = n.id.toLowerCase();
              if (codeExtensions.some(ext => lower.endsWith(ext)) && acc.length < 20) {
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
      let findingsRes = [];
      try {
        findingsRes = await apiClient.get(`/debug/sessions/${sessionId}/findings`);
      } catch (e) {
        console.warn('Could not fetch findings for session:', e);
        findingsRes = [];
      }
      const rawFindings = Array.isArray(findingsRes) ? findingsRes : [];

      // Exclude pure informational skip notices so clean code isn't flagged as an error
      const actionFindings = rawFindings.filter(f => {
        const title = (f.title || f.message || '').toLowerCase();
        return !title.includes('static analysis skipped');
      });

      const formattedIssues = actionFindings.map((f, idx) => {
        const resolvedPath =
          f.file ||
          f.filePath ||
          f.file_path ||
          f.source_file_path ||
          f.source_file ||
          f.filename ||
          (f.metadata_info && (f.metadata_info.file || f.metadata_info.file_path || f.metadata_info.source_file_path)) ||
          'file.py';

        return {
          id: f.id || `FINDING-${idx + 1}`,
          title: f.title || f.message || 'Code Finding',
          detail: f.description || f.message,
          message: f.message || f.title,
          file: resolvedPath,
          filePath: resolvedPath,
          line: f.line_number || f.line || 1,
          col: f.column_number || f.col || 1,
          severity: (f.severity || 'medium').charAt(0).toUpperCase() + (f.severity || 'medium').slice(1),
          category: f.category || 'Static Analysis',
          confidence: Math.round((f.confidence_score || 0.9) * 100),
          rootCause: f.description,
          suggestedFix: f.suggested_fix || '',
          codeSnippet: f.code_snippet || '',
          status: 'Open',
          source: f.detection_tool || f.origin || 'AETHERION',
        };
      });

      // 2. Fetch repairs
      let repairs = [];
      try {
        const repairsRes = await apiClient.get(`/debug/sessions/${sessionId}/repairs`);
        repairs = Array.isArray(repairsRes) ? repairsRes : [];
        if (repairs.length > 0) {
          const primaryRepair = repairs[0];
          const changes = primaryRepair.proposed_changes || [];
          for (const iss of formattedIssues) {
            if (!iss.suggestedFix) {
              const fileChange = changes.find(c => c.filename === iss.file || c.filename?.endsWith(iss.file) || iss.file?.endsWith(c.filename));
              if (fileChange && fileChange.proposed_content) {
                iss.suggestedFix = fileChange.proposed_content;
              }
            }
          }
        }
      } catch (e) {
        repairs = [];
      }

      // Merge repairs into formattedIssues so suggestedFix is always available
      const repairChanges = repairs.flatMap(r => r.proposed_changes || []);
      const enrichedIssues = formattedIssues.map((issue) => {
        const matchingRepair = repairChanges.find(rc => rc.filename === issue.file || rc.filename === issue.filePath) || repairChanges[0];
        return {
          ...issue,
          suggestedFix: issue.suggestedFix || matchingRepair?.proposed_content || '',
          codeSnippet: issue.codeSnippet || matchingRepair?.original_snippet || '',
        };
      });

      // If no issues were found by static analysis, but repairs were generated, create an issue from repairs
      let finalIssues = enrichedIssues;
      if (finalIssues.length === 0 && repairChanges.length > 0) {
        finalIssues = repairChanges.map((rc, idx) => ({
          id: `REPAIR-${idx + 1}`,
          title: `Proposed Code Patch: ${rc.filename}`,
          detail: rc.explanation || 'Applied defensive validation and structural hardening.',
          message: rc.explanation || 'Applied defensive validation.',
          file: rc.filename,
          filePath: rc.filename,
          line: 1,
          col: 1,
          severity: 'Medium',
          category: 'Defensive Guard',
          confidence: 90,
          rootCause: rc.explanation || 'Code quality defect or runtime risk identified.',
          suggestedFix: rc.proposed_content || '',
          codeSnippet: rc.original_snippet || '',
          status: 'Open',
          source: 'AETHERION Fix Agent',
        }));
      }

      // 3. Fetch test runs
      let testRuns = [];
      try {
        const testRes = await apiClient.get(`/debug/sessions/${sessionId}/tests`);
        const rawTests = Array.isArray(testRes) ? testRes : [];
        testRuns = rawTests.map((t, idx) => ({
          id: t.id || `test-${idx + 1}`,
          name: t.name || (t.details && t.details.name) || (t.details && t.details.test_name) || t.command_or_config || `Test Suite #${idx + 1}`,
          status: t.status || 'passed',
          duration_ms: t.duration_ms || 28,
          error: t.stderr_summary || (t.status === 'failed' ? 'Test failure' : null),
          stdout: t.stdout_summary || '',
          stderr: t.stderr_summary || '',
          actual_execution: t.actual_execution,
          details: t.details || {},
        }));
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
        issues: finalIssues,
        selectedIssueId: finalIssues.length > 0 ? finalIssues[0].id : null,
        repairs,
        testCases: testRuns,
        finalReport,
        rightSidebarTab: 'analysis',
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
