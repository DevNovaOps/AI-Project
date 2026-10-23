import { create } from 'zustand';
import { useAppStore } from './useAppStore';

export const initialAgentLogs = [
  {
    id: 1,
    time: '13:28:02',
    agent: 'Planner',
    icon: 'Bot',
    message: 'Initialized debugging session #dbg_session_9281. Targeted: backend/main.py',
    status: 'success',
    duration: '210ms'
  },
  {
    id: 2,
    time: '13:28:03',
    agent: 'Code Analysis',
    icon: 'Code',
    message: 'AST traversed. Identified critical BinOp Div on line 6 without zero check.',
    status: 'warning',
    duration: '430ms'
  },
  {
    id: 3,
    time: '13:28:04',
    agent: 'Diagnosis',
    icon: 'Search',
    message: 'Root cause confirmed: len(numbers) evaluates to 0 when input is empty list.',
    status: 'info',
    duration: '310ms'
  },
  {
    id: 4,
    time: '13:28:05',
    agent: 'Fix & Test',
    icon: 'Wrench',
    message: 'Synthesized defensive guard `if not numbers or len(numbers) == 0: return 0`.',
    status: 'success',
    duration: '520ms'
  },
  {
    id: 5,
    time: '13:28:06',
    agent: 'Validation',
    icon: 'CheckCircle',
    message: 'Simulated unit tests executed. Awaiting manual apply or autonomous execution.',
    status: 'info',
    duration: '180ms'
  }
];

export const useWorkflowStore = create((set, get) => ({
  workflowState: 'idle', // 'idle' | 'planning' | 'analyzing' | 'diagnosing' | 'generating_fix' | 'running_tests' | 'repairing' | 'validating' | 'completed' | 'failed'
  activeAgent: null,
  progress: 0,
  currentStepIndex: 0,
  retryCount: 0,
  abortController: null,
  agentLogs: initialAgentLogs,

  addLog: (log) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      time: new Date().toTimeString().split(' ')[0],
      ...log
    };
    set((s) => ({ agentLogs: [newEntry, ...s.agentLogs] }));
  },

  clearLogs: () => set({ agentLogs: [] }),

  startAutonomousWorkflow: async () => {
    if (get().workflowState !== 'idle' && get().workflowState !== 'completed' && get().workflowState !== 'failed') {
      return; // already running
    }

    set({
      workflowState: 'planning',
      activeAgent: 'Planner / Orchestrator',
      progress: 10,
      currentStepIndex: 1,
      retryCount: 0
    });

    get().addLog({
      agent: 'Planner',
      message: 'Dispatching 5-Agent pipeline for AegisVault (Aegis-Protocol v2.4)',
      status: 'info',
      duration: '150ms'
    });

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    try {
      await sleep(700);
      set({ workflowState: 'analyzing', activeAgent: 'Code Analysis Agent', progress: 30, currentStepIndex: 2 });
      get().addLog({
        agent: 'Code Analysis',
        message: 'Parsing backend/main.py AST. Detected unchecked division at line 6.',
        status: 'warning',
        duration: '420ms'
      });

      await sleep(700);
      set({ workflowState: 'diagnosing', activeAgent: 'Diagnosis Agent', progress: 50, currentStepIndex: 3 });
      get().addLog({
        agent: 'Diagnosis',
        message: 'ZeroDivisionError diagnosis verified with 95% confidence score.',
        status: 'info',
        duration: '380ms'
      });

      await sleep(800);
      set({ workflowState: 'generating_fix', activeAgent: 'Fix & Test Agent', progress: 70, currentStepIndex: 4 });
      get().addLog({
        agent: 'Fix & Test',
        message: 'Synthesized patch with boundary guard and type validation.',
        status: 'success',
        duration: '610ms'
      });

      await sleep(700);
      set({ workflowState: 'running_tests', activeAgent: 'Fix & Test Agent', progress: 85, currentStepIndex: 5 });
      get().addLog({
        agent: 'Fix & Test',
        message: 'Simulating pytest suite on patched sandbox...',
        status: 'info',
        duration: '500ms'
      });

      await sleep(700);
      set({ workflowState: 'validating', activeAgent: 'Validation & Reporting Agent', progress: 95, currentStepIndex: 6 });
      get().addLog({
        agent: 'Validation',
        message: 'All 4/4 test cases passed (100% pass rate). Zero regressions detected.',
        status: 'success',
        duration: '220ms'
      });

      // Automatically apply the verified fix to the app state
      const appStore = useAppStore.getState();
      appStore.applyFix('ISSUE-01');
      appStore.setRightSidebarTab('fixes');

      await sleep(500);
      set({
        workflowState: 'completed',
        activeAgent: null,
        progress: 100,
        currentStepIndex: 7
      });

      get().addLog({
        agent: 'Validation',
        message: 'Autonomous repair pipeline completed successfully. Fix deployed to editor.',
        status: 'success',
        duration: '110ms'
      });

    } catch (err) {
      set({ workflowState: 'failed', activeAgent: null });
      get().addLog({
        agent: 'Planner',
        message: `Workflow aborted or failed: ${err.message}`,
        status: 'critical',
        duration: '0ms'
      });
    }
  },

  cancelAutonomousWorkflow: () => {
    set({
      workflowState: 'idle',
      activeAgent: null,
      progress: 0,
      currentStepIndex: 0
    });
    get().addLog({
      agent: 'Planner',
      message: 'Workflow execution cancelled by user.',
      status: 'warning',
      duration: '0ms'
    });
  }
}));
