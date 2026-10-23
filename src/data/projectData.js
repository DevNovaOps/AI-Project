// Project Explorer structure and project metadata

export const currentProject = {
  id: 'aegis-vault',
  name: 'AegisVault',
  subtitle: 'Multi-agent debugging system',
  description: 'Enterprise-grade multi-agent autonomous debugging, verification, and code repair pipeline.',
  branch: 'main',
  branches: ['main', 'feature/autonomous-fix', 'dev', 'release-v1.4'],
  projects: ['AegisVault', 'CyberMesh-Core', 'HyperQuery-Engine'],
  stats: {
    files: 24,
    agents: 6,
    tools: 12,
    lastAnalysis: '2.1s',
    lastSync: '2 min ago',
    coverage: '84.6%',
    memory: '1.1 GB'
  }
};

export const initialFileTree = [
  {
    id: 'backend',
    name: 'backend',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'backend/app',
        name: 'app',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'backend/app/agents',
            name: 'agents',
            type: 'folder',
            isOpen: true,
            children: [
              { id: 'backend/app/agents/planner.py', name: 'planner.py', type: 'file', ext: 'py' },
              { id: 'backend/app/agents/code_analysis.py', name: 'code_analysis.py', type: 'file', ext: 'py' },
              { id: 'backend/app/agents/diagnosis.py', name: 'diagnosis.py', type: 'file', ext: 'py' },
              { id: 'backend/app/agents/fix_test.py', name: 'fix_test.py', type: 'file', ext: 'py' },
              { id: 'backend/app/agents/validation.py', name: 'validation.py', type: 'file', ext: 'py' }
            ]
          },
          {
            id: 'backend/app/core',
            name: 'core',
            type: 'folder',
            isOpen: false,
            children: [
              { id: 'backend/app/core/engine.py', name: 'engine.py', type: 'file', ext: 'py' }
            ]
          },
          {
            id: 'backend/app/tools',
            name: 'tools',
            type: 'folder',
            isOpen: false,
            children: [
              { id: 'backend/app/tools/ast_parser.py', name: 'ast_parser.py', type: 'file', ext: 'py' }
            ]
          },
          {
            id: 'backend/app/prompts',
            name: 'prompts',
            type: 'folder',
            isOpen: false,
            children: [
              { id: 'backend/app/prompts/templates.py', name: 'templates.py', type: 'file', ext: 'py' }
            ]
          }
        ]
      },
      { id: 'backend/main.py', name: 'main.py', type: 'file', ext: 'py', hasIssue: true },
      { id: 'backend/utils.py', name: 'utils.py', type: 'file', ext: 'py' },
      { id: 'backend/models.py', name: 'models.py', type: 'file', ext: 'py' }
    ]
  },
  {
    id: 'frontend',
    name: 'frontend',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'frontend/src',
        name: 'src',
        type: 'folder',
        isOpen: true,
        children: [
          { id: 'frontend/src/components', name: 'components', type: 'folder', isOpen: false, children: [] },
          { id: 'frontend/src/pages', name: 'pages', type: 'folder', isOpen: false, children: [] },
          { id: 'frontend/src/assets', name: 'assets', type: 'folder', isOpen: false, children: [] },
          { id: 'frontend/src/App.jsx', name: 'App.jsx', type: 'file', ext: 'jsx' },
          { id: 'frontend/src/main.jsx', name: 'main.jsx', type: 'file', ext: 'jsx' },
          { id: 'frontend/src/index.css', name: 'index.css', type: 'file', ext: 'css' }
        ]
      }
    ]
  },
  {
    id: 'tests',
    name: 'tests',
    type: 'folder',
    isOpen: false,
    children: [
      { id: 'tests/test_main.py', name: 'test_main.py', type: 'file', ext: 'py', hasFailedTest: true }
    ]
  },
  {
    id: 'docs',
    name: 'docs',
    type: 'folder',
    isOpen: false,
    children: [
      { id: 'docs/architecture.md', name: 'architecture.md', type: 'file', ext: 'md' }
    ]
  },
  { id: '.env', name: '.env', type: 'file', ext: 'env' },
  { id: 'requirements.txt', name: 'requirements.txt', type: 'file', ext: 'txt' },
  { id: 'README.md', name: 'README.md', type: 'file', ext: 'md' }
];
