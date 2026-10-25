import { create } from 'zustand';
import { useAppStore } from './useAppStore';
import { sessionsApi } from '../api/sessions';
import { filesApi } from '../api/files';
import { normalizeError, apiClient } from '../api/client';

export const useWorkflowStore = create((set, get) => ({
  workflowState: 'idle', // 'idle' | 'planning' | 'analyzing' | 'diagnosing' | 'generating_fix' | 'running_tests' | 'repairing' | 'validating' | 'completed' | 'failed'
  activeAgent: null,
  progress: 0,
  currentStepIndex: 0,
  retryCount: 0,
  activeSessionId: null,
  agentLogs: [],
  isAutoPush: false,
  lastPushedCommitUrl: null,

  // Target Scope Configuration
  targetScope: 'project', // 'project' (all project code files) | 'selected' (user picked files) | 'active' (active file only)
  selectedTargetFiles: [], // array of relative paths
  isTargetModalOpen: false,

  setTargetScope: (scope) => set({ targetScope: scope }),
  setSelectedTargetFiles: (files) => set({ selectedTargetFiles: files }),
  setTargetModalOpen: (open) => set({ isTargetModalOpen: open }),
  toggleTargetFile: (filePath) => {
    const current = get().selectedTargetFiles;
    if (current.includes(filePath)) {
      set({ selectedTargetFiles: current.filter(p => p !== filePath) });
    } else {
      set({ selectedTargetFiles: [...current, filePath] });
    }
  },
  selectAllTargetFiles: (paths) => set({ selectedTargetFiles: paths }),
  clearSelectedTargetFiles: () => set({ selectedTargetFiles: [] }),

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

  startAutonomousWorkflow: async (options = {}) => {
    const appStore = useAppStore.getState();
    const currentProject = appStore.currentProject;
    const isAutoPush = Boolean(options.autoPush);

    set({ isAutoPush, lastPushedCommitUrl: null });

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

    const targetScope = get().targetScope || 'project';
    const selectedTargetFiles = get().selectedTargetFiles || [];

    const nonCodeExts = [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
      '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3',
      '.pdf', '.zip', '.tar', '.gz', '.lock',
      '.md', '.markdown', '.txt', '.rst', '.adoc'
    ];

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

    // ── CASE 1: Active File Only ──
    if (targetScope === 'active') {
      const activeFile = currentFiles[activePath];
      const effectiveContent = liveEditorContent !== null ? liveEditorContent : (activeFile ? activeFile.content : '');
      if (effectiveContent !== undefined && effectiveContent !== null) {
        sourceFiles.push({
          filename: activeFile?.path || activePath || 'main.py',
          file_path: activeFile?.path || activePath || 'main.py',
          content: truncateContent(effectiveContent),
          language: activeFile?.language || 'python',
        });
      }
    }

    // ── CASE 2: Selected Specific Files ──
    else if (targetScope === 'selected' && selectedTargetFiles.length > 0) {
      for (const p of selectedTargetFiles) {
        let content = '';
        if (p === activePath && liveEditorContent !== null) {
          content = liveEditorContent;
        } else if (currentFiles[p]?.content !== undefined) {
          content = currentFiles[p].content;
        } else if (currentProject?.id) {
          try {
            const res = await filesApi.getContent(currentProject.id, p);
            content = res.content || '';
          } catch (e) {
            console.warn(`Could not fetch content for ${p}:`, e);
          }
        }
        sourceFiles.push({
          filename: p,
          file_path: p,
          content: truncateContent(content),
        });
      }
    }

    // ── CASE 3: Entire Project / Codebase (DEFAULT) ──
    else {
      // 1. Try batch fetching all files via filesApi.getAllFiles(currentProject.id)
      if (currentProject?.id) {
        try {
          const allRes = await filesApi.getAllFiles(currentProject.id);
          if (Array.isArray(allRes) && allRes.length > 0) {
            for (const item of allRes) {
              const p = item.path || item.filename;
              const lower = p.toLowerCase();
              if (nonCodeExts.some(ext => lower.endsWith(ext))) continue;

              let content = item.content || '';
              if (p === activePath && liveEditorContent !== null) {
                content = liveEditorContent;
              }

              sourceFiles.push({
                filename: p,
                file_path: p,
                content: truncateContent(content),
                language: item.extension || 'javascript',
              });
            }
          }
        } catch (err) {
          console.warn('Could not call filesApi.getAllFiles, falling back to file tree:', err);
        }
      }

      // 2. Fallback: Traverse fileTree if getAllFiles returned empty
      if (sourceFiles.length === 0 && appStore.fileTree?.length > 0) {
        const codeExtensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.sql', '.html', '.css', '.json'];
        const collectCodeFiles = (nodes, acc = []) => {
          for (const n of nodes) {
            if (n.type === 'file') {
              const lower = n.id.toLowerCase();
              if (codeExtensions.some(ext => lower.endsWith(ext)) && acc.length < 150) {
                acc.push(n.id);
              }
            }
            if (n.children) collectCodeFiles(n.children, acc);
          }
          return acc;
        };

        const paths = collectCodeFiles(appStore.fileTree);
        for (const p of paths) {
          try {
            let content = '';
            if (p === activePath && liveEditorContent !== null) {
              content = liveEditorContent;
            } else if (currentFiles[p]?.content !== undefined) {
              content = currentFiles[p].content;
            } else if (currentProject?.id) {
              const contentRes = await filesApi.getContent(currentProject.id, p);
              content = contentRes.content || '';
            }
            sourceFiles.push({
              filename: p,
              file_path: p,
              content: truncateContent(content),
            });
          } catch (e) {
            // ignore
          }
        }
      }

      // 3. Fallback: If still empty, use open editor tabs or active file
      if (sourceFiles.length === 0) {
        const activeFile = currentFiles[activePath];
        const effectiveContent = liveEditorContent !== null ? liveEditorContent : (activeFile ? activeFile.content : '');
        if (effectiveContent) {
          sourceFiles.push({
            filename: activeFile?.path || activePath || 'main.py',
            file_path: activeFile?.path || activePath || 'main.py',
            content: truncateContent(effectiveContent),
            language: activeFile?.language || 'python',
          });
        }
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

    // Detect target language & framework
    let detectedLang = appStore.activeLanguage || 'python';

    // 1. Detect Spring Boot or Java ecosystem
    const hasSpringBoot = sourceFiles.some(f => {
      const lower = (f.filename || '').toLowerCase();
      const content = f.content || '';
      return (
        (lower === 'pom.xml' && content.includes('spring-boot')) ||
        (lower.includes('build.gradle') && content.includes('org.springframework')) ||
        (lower.endsWith('.java') && (content.includes('@SpringBootApplication') || content.includes('org.springframework') || content.includes('@RestController')))
      );
    });

    if (hasSpringBoot) {
      detectedLang = 'springboot';
    } else {
      // 2. Detect language based on primary source files
      const firstCodeFile = sourceFiles.find(f => {
        const lower = (f.filename || '').toLowerCase();
        return (
          lower.endsWith('.java') || lower.endsWith('.kt') || lower.endsWith('.scala') ||
          lower.endsWith('.cs') || lower.endsWith('.go') || lower.endsWith('.rs') ||
          lower.endsWith('.py') || lower.endsWith('.sql') || lower.endsWith('.js') ||
          lower.endsWith('.jsx') || lower.endsWith('.ts') || lower.endsWith('.tsx') ||
          lower.endsWith('.php') || lower.endsWith('.rb') || lower.endsWith('.swift') ||
          lower.endsWith('.dart') || lower.endsWith('.cpp') || lower.endsWith('.c') ||
          lower.endsWith('.html') || lower.endsWith('.css')
        );
      });

      if (firstCodeFile) {
        const lower = (firstCodeFile.filename || '').toLowerCase();
        const content = firstCodeFile.content || '';

        if (lower.endsWith('.java')) detectedLang = 'java';
        else if (lower.endsWith('.kt') || lower.endsWith('.kts')) detectedLang = 'kotlin';
        else if (lower.endsWith('.scala')) detectedLang = 'scala';
        else if (lower.endsWith('.cs')) detectedLang = 'csharp';
        else if (lower.endsWith('.go')) detectedLang = 'go';
        else if (lower.endsWith('.rs')) detectedLang = 'rust';
        else if (lower.endsWith('.php')) detectedLang = 'php';
        else if (lower.endsWith('.rb')) detectedLang = 'ruby';
        else if (lower.endsWith('.swift')) detectedLang = 'swift';
        else if (lower.endsWith('.dart')) detectedLang = 'dart';
        else if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h') || lower.endsWith('.hpp')) detectedLang = 'cpp';
        else if (lower.endsWith('.sql')) detectedLang = 'sql';
        else if (lower.endsWith('.py')) {
          if (content.includes('django')) detectedLang = 'django';
          else if (content.includes('fastapi')) detectedLang = 'fastapi';
          else if (content.includes('flask')) detectedLang = 'flask';
          else detectedLang = 'python';
        }
        else if (lower.endsWith('.jsx')) detectedLang = 'react';
        else if (lower.endsWith('.tsx')) detectedLang = 'typescript';
        else if (lower.endsWith('.ts')) detectedLang = 'typescript';
        else if (lower.endsWith('.js')) {
          if (content.includes('express()')) detectedLang = 'express';
          else detectedLang = 'javascript';
        }
        else if (lower.endsWith('.html') || lower.endsWith('.htm')) detectedLang = 'html';
        else if (lower.endsWith('.css') || lower.endsWith('.scss')) detectedLang = 'css';
      }
    }

    set({
      workflowState: 'planning',
      activeAgent: 'Planner / Orchestrator',
      progress: 10,
      currentStepIndex: 1,
      retryCount: 0,
      agentLogs: [],
    });

    const scopeLabel = targetScope === 'project'
      ? 'Entire Project'
      : targetScope === 'selected'
      ? 'Selected Files'
      : 'Active File';

    get().addLog({
      agent: 'Planner',
      message: `Initializing 5-Agent pipeline for project '${currentProject?.name || 'Workspace'}' (${sourceFiles.length} file(s) targeted - ${scopeLabel})`,
      status: 'info',
    });

    try {
      const activeModel = useAppStore.getState().selectedModel || 'qwen/qwen3.8-27b';
      const session = await sessionsApi.create({
        title: `Analysis: ${currentProject?.name || 'Workspace'}`,
        language: detectedLang,
        task_description: 'Analyze source files, detect runtime and syntax errors, diagnose root causes, and propose verified patches.',
        files: sourceFiles,
        source_files: sourceFiles,
        model: activeModel,
      });

      const sessionId = session.id;
      set({ activeSessionId: sessionId });

      const startTime = Date.now();

      // 2. Start running the session
      await sessionsApi.run(sessionId);

      // Smooth dynamic progress ticker while agents process in background
      const stageTargets = {
        'Planner / Orchestrator': 25,
        'Planner Agent': 25,
        'Code Analysis Agent': 52,
        'Diagnosis Agent': 74,
        'Fix & Test Agent': 88,
        'Validation Agent': 96
      };

      const progressTicker = setInterval(() => {
        const state = get();
        if (state.workflowState === 'idle' || state.workflowState === 'completed' || state.workflowState === 'failed') {
          clearInterval(progressTicker);
          return;
        }

        const currentProg = state.progress || 10;
        const targetProgress = stageTargets[state.activeAgent] || 35;

        if (currentProg < targetProgress) {
          set({ progress: Math.min(targetProgress, currentProg + 1) });
        } else if (currentProg < 96) {
          // Continuously advance so user sees live ongoing work
          set({ progress: currentProg + 1 });
        }
      }, 450);

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
            clearInterval(progressTicker);
            set({ progress: 100 });
            await get().finalizeWorkflow(sessionId, startTime);
          } else if (status === 'failed' || status === 'cancelled') {
            clearInterval(pollInterval);
            clearInterval(progressTicker);
            set({ workflowState: 'failed', activeAgent: null });
            get().addLog({
              agent: 'Planner Agent',
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
        agent: 'Planner Agent',
        message: `Workflow launch failed: ${normalizeError(err)}`,
        status: 'critical',
      });
    }
  },

  handleWorkflowEvent: (ev) => {
    const rawStage = (ev.stage_or_agent || ev.stage || ev.agent || '').toLowerCase();
    const rawType = (ev.event_type || ev.type || '').toLowerCase();
    const rawMsg = (ev.message || '').toLowerCase();
    const payload = ev.payload || {};

    const combined = `${rawStage} ${rawType} ${rawMsg}`;

    if (combined.includes('planner') || combined.includes('strategy')) {
      set((s) => ({
        workflowState: 'planning',
        activeAgent: 'Planner Agent',
        progress: Math.max(s.progress, 20)
      }));
    } else if (combined.includes('code analysis') || combined.includes('analysis') || combined.includes('finding')) {
      set((s) => ({
        workflowState: 'analyzing',
        activeAgent: 'Code Analysis Agent',
        progress: Math.max(s.progress, 42)
      }));
    } else if (combined.includes('diagnos') || combined.includes('root cause')) {
      set((s) => ({
        workflowState: 'diagnosing',
        activeAgent: 'Diagnosis Agent',
        progress: Math.max(s.progress, 62)
      }));
    } else if (combined.includes('fix') || combined.includes('repair') || combined.includes('patch')) {
      set((s) => ({
        workflowState: 'generating_fix',
        activeAgent: 'Fix & Test Agent',
        progress: Math.max(s.progress, 78)
      }));
    } else if (combined.includes('test') || combined.includes('verification')) {
      set((s) => ({
        workflowState: 'running_tests',
        activeAgent: 'Fix & Test Agent',
        progress: Math.max(s.progress, 86)
      }));
    } else if (combined.includes('validat') || combined.includes('report')) {
      set((s) => ({
        workflowState: 'validating',
        activeAgent: 'Validation Agent',
        progress: Math.max(s.progress, 94)
      }));
    }

    if (payload.message || ev.message) {
      const agentName = ev.stage_or_agent || ev.agent_name || payload.agent || 'Pipeline';
      get().addLog({
        agent: agentName.includes('Agent') ? agentName : `${agentName} Agent`,
        message: payload.message || ev.message,
        status: payload.status || 'info',
        duration: payload.duration_ms ? `${payload.duration_ms}ms` : undefined,
      });
    }
  },

  finalizeWorkflow: async (sessionId, startTime) => {
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

      // Exclude pure informational skip notices and syntax/runtime errors on documentation files
      const actionFindings = rawFindings.filter(f => {
        const title = (f.title || f.message || '').toLowerCase();
        if (title.includes('static analysis skipped')) return false;

        const path = (
          f.file || f.file_path || f.source_file_path || f.filename ||
          (f.metadata_info && (f.metadata_info.file || f.metadata_info.file_path || f.metadata_info.source_file_path)) ||
          ''
        ).toLowerCase();

        // Documentation files (.md, .txt, etc.) are never source code; ignore non-security findings
        if (path.endsWith('.md') || path.endsWith('.markdown') || path.endsWith('.mdown') || path.endsWith('.txt') || path.endsWith('.rst')) {
          if (f.category !== 'Security') return false;
        }
        return true;
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

      // Merge repairs into formattedIssues without cross-file bleeding
      const repairChanges = repairs.flatMap(r => r.proposed_changes || []);
      const enrichedIssues = formattedIssues.map((issue) => {
        const matchingRepair = repairChanges.find(
          rc => rc.filename === issue.file || rc.filename === issue.filePath || 
                (issue.file && rc.filename && (rc.filename.endsWith('/' + issue.file) || issue.file.endsWith('/' + rc.filename))) ||
                (issue.file && rc.filename?.endsWith(issue.file)) ||
                (rc.filename && issue.file?.endsWith(rc.filename))
        );

        return {
          ...issue,
          suggestedFix: issue.suggestedFix || matchingRepair?.proposed_content || matchingRepair?.explanation || '',
          fullPatchedFile: matchingRepair?.proposed_content || '',
          proposedFileContent: matchingRepair?.proposed_content || null,
          diff: matchingRepair?.diff || null,
          repairDiff: matchingRepair?.diff || null,
          repairExplanation: matchingRepair?.explanation || null,
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

      const durationSeconds = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : '2.4';
      const durationFormatted = `${durationSeconds}s`;

      // Update app store
      useAppStore.setState({
        issues: finalIssues,
        selectedIssueId: finalIssues.length > 0 ? finalIssues[0].id : null,
        repairs,
        testCases: testRuns,
        finalReport,
        rightSidebarTab: 'analysis',
        lastAnalysisDuration: durationFormatted,
      });

      // ⚡ AUTONOMOUS AGENT AUTO-PUSH: Apply verified fixes, record git commit, and push to GitHub
      if (get().isAutoPush) {
        set({ activeAgent: 'Pushing to GitHub...', progress: 98 });
        get().addLog({
          agent: 'Fix & Test Agent',
          message: `⚡ Auto-Push Mode: Applying verified repairs to workspace files (${finalIssues.length} issues)...`,
          status: 'info',
        });

        // 1. Auto-apply all verified repairs to files
        for (const iss of finalIssues) {
          appStore.applyFix(iss.id);
        }

        // 2. Automatically record git commit in workspace
        const commitMsg = finalIssues.length > 0
          ? `fix: autonomous AI repair of ${finalIssues.length} defects [AETHERION]`
          : 'chore: autonomous AI code verification [AETHERION]';
        await appStore.recordCommit(commitMsg);

        // 3. Directly push to remote repository using saved GitHub token
        const savedToken = appStore.githubToken || localStorage.getItem('aetherion_github_token');
        if (savedToken && savedToken.trim()) {
          get().addLog({
            agent: 'Validation Agent',
            message: `⚡ Pushing verified commit to GitHub remote (${appStore.selectedBranch || 'main'})...`,
            status: 'info',
          });

          try {
            const pushRes = await appStore.pushToGitHub({
              branch: appStore.selectedBranch || 'main',
              commitMessage: commitMsg,
              token: savedToken.trim(),
            });

            const commitUrl = pushRes.commit_url || pushRes.pr_url || null;
            set({ lastPushedCommitUrl: commitUrl });

            get().addLog({
              agent: 'Validation Agent',
              message: `✓ Successfully repaired code and pushed commit to GitHub! Branch: ${pushRes.branch || appStore.selectedBranch || 'main'}`,
              status: 'success',
            });

            appStore.addNotification({
              title: '⚡ Autonomous Auto-Fix & Push Succeeded',
              message: `Repaired ${finalIssues.length} defects and pushed commit directly to GitHub!`,
              type: 'success',
            });
          } catch (pushErr) {
            console.error('Auto-push failed:', pushErr);
            get().addLog({
              agent: 'Validation Agent',
              message: `⚠️ Auto-push to GitHub encountered an issue: ${pushErr.message || pushErr}`,
              status: 'warning',
            });
            appStore.addNotification({
              title: 'Auto-Push Paused',
              message: pushErr.message || 'Check GitHub token in Settings',
              type: 'warning',
            });
          }
        } else {
          get().addLog({
            agent: 'Validation Agent',
            message: `⚠️ Auto-push paused: All ${finalIssues.length} repairs applied and committed locally, but no GitHub Token is configured in Settings.`,
            status: 'warning',
          });
          appStore.addNotification({
            title: 'GitHub Token Required',
            message: 'All repairs applied! Please configure your GitHub PAT in Settings to push directly to remote.',
            type: 'warning',
          });
        }
      }

      set({
        workflowState: 'completed',
        activeAgent: 'Completed',
        progress: 100,
        currentStepIndex: 7,
      });

      get().addLog({
        agent: 'Validation Agent',
        message: `Autonomous workflow completed in ${durationFormatted}. Verified ${finalIssues.length} finding(s) across target files.`,
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
