/**
 * AETHERION Unified Language & Framework Registry
 * Comprehensive support for web, backend, mobile, systems, databases, and DevOps.
 */

export const LANGUAGE_REGISTRY = {
  // Web & Frontend Frameworks
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    monacoLang: 'javascript',
    runtime: 'Node.js 20',
    icon: '⚡',
    category: 'Web & Frontend',
    extensions: ['js', 'mjs', 'cjs']
  },
  react_jsx: {
    id: 'react_jsx',
    label: 'React (JSX)',
    monacoLang: 'javascript',
    runtime: 'React 18 / Vite',
    icon: '⚛️',
    category: 'Web & Frontend',
    extensions: ['jsx']
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    monacoLang: 'typescript',
    runtime: 'TypeScript 5.4',
    icon: '🔷',
    category: 'Web & Frontend',
    extensions: ['ts', 'mts', 'cts']
  },
  react_tsx: {
    id: 'react_tsx',
    label: 'React (TSX)',
    monacoLang: 'typescript',
    runtime: 'React 18 (TS)',
    icon: '⚛️',
    category: 'Web & Frontend',
    extensions: ['tsx']
  },
  html: {
    id: 'html',
    label: 'HTML5',
    monacoLang: 'html',
    runtime: 'W3C HTML5',
    icon: '🌐',
    category: 'Web & Frontend',
    extensions: ['html', 'htm']
  },
  css: {
    id: 'css',
    label: 'CSS3',
    monacoLang: 'css',
    runtime: 'CSS3 / PostCSS',
    icon: '🎨',
    category: 'Web & Frontend',
    extensions: ['css']
  },
  scss: {
    id: 'scss',
    label: 'SCSS / SASS',
    monacoLang: 'scss',
    runtime: 'Dart Sass',
    icon: '🌸',
    category: 'Web & Frontend',
    extensions: ['scss', 'sass']
  },
  vue: {
    id: 'vue',
    label: 'Vue.js',
    monacoLang: 'html',
    runtime: 'Vue 3 / Vite',
    icon: '💚',
    category: 'Web & Frontend',
    extensions: ['vue']
  },
  svelte: {
    id: 'svelte',
    label: 'Svelte',
    monacoLang: 'html',
    runtime: 'SvelteKit',
    icon: '🔥',
    category: 'Web & Frontend',
    extensions: ['svelte']
  },

  // Backend & Systems
  python: {
    id: 'python',
    label: 'Python',
    monacoLang: 'python',
    runtime: 'Python 3.11',
    icon: '🐍',
    category: 'Backend & Systems',
    extensions: ['py', 'pyw', 'wsgi']
  },
  java: {
    id: 'java',
    label: 'Java',
    monacoLang: 'java',
    runtime: 'OpenJDK 21',
    icon: '☕',
    category: 'Backend & Systems',
    extensions: ['java']
  },
  csharp: {
    id: 'csharp',
    label: 'C# (.NET)',
    monacoLang: 'csharp',
    runtime: '.NET 8',
    icon: '🎯',
    category: 'Backend & Systems',
    extensions: ['cs']
  },
  cpp: {
    id: 'cpp',
    label: 'C / C++',
    monacoLang: 'cpp',
    runtime: 'GCC / Clang',
    icon: '⚙️',
    category: 'Backend & Systems',
    extensions: ['c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'hxx']
  },
  go: {
    id: 'go',
    label: 'Go (Golang)',
    monacoLang: 'go',
    runtime: 'Go 1.22',
    icon: '🐹',
    category: 'Backend & Systems',
    extensions: ['go']
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    monacoLang: 'rust',
    runtime: 'Rust 1.76',
    icon: '🦀',
    category: 'Backend & Systems',
    extensions: ['rs']
  },
  php: {
    id: 'php',
    label: 'PHP',
    monacoLang: 'php',
    runtime: 'PHP 8.3',
    icon: '🐘',
    category: 'Backend & Systems',
    extensions: ['php']
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby',
    monacoLang: 'ruby',
    runtime: 'Ruby 3.3',
    icon: '💎',
    category: 'Backend & Systems',
    extensions: ['rb', 'rake']
  },
  kotlin: {
    id: 'kotlin',
    label: 'Kotlin',
    monacoLang: 'kotlin',
    runtime: 'Kotlin 1.9',
    icon: '🟣',
    category: 'Backend & Systems',
    extensions: ['kt', 'kts']
  },
  swift: {
    id: 'swift',
    label: 'Swift',
    monacoLang: 'swift',
    runtime: 'Swift 5.9',
    icon: '🕊️',
    category: 'Backend & Systems',
    extensions: ['swift']
  },
  dart: {
    id: 'dart',
    label: 'Dart',
    monacoLang: 'dart',
    runtime: 'Dart / Flutter',
    icon: '🎯',
    category: 'Backend & Systems',
    extensions: ['dart']
  },

  // Databases & Query Languages
  sql: {
    id: 'sql',
    label: 'SQL (ANSI / T-SQL / MySQL / Postgres)',
    monacoLang: 'sql',
    runtime: 'SQL Server / PostgreSQL / MySQL',
    icon: '🗄️',
    category: 'Database & Data',
    extensions: ['sql', 'psql', 'dsql']
  },
  graphql: {
    id: 'graphql',
    label: 'GraphQL',
    monacoLang: 'graphql',
    runtime: 'GraphQL SDL',
    icon: '🕸️',
    category: 'Database & Data',
    extensions: ['graphql', 'gql']
  },
  csv: {
    id: 'csv',
    label: 'CSV Data',
    monacoLang: 'plaintext',
    runtime: 'Tabular Dataset',
    icon: '📊',
    category: 'Database & Data',
    extensions: ['csv', 'tsv']
  },

  // Data Formats & Config
  json: {
    id: 'json',
    label: 'JSON',
    monacoLang: 'json',
    runtime: 'JSON Schema',
    icon: '📋',
    category: 'Data & Config',
    extensions: ['json', 'jsonc']
  },
  yaml: {
    id: 'yaml',
    label: 'YAML',
    monacoLang: 'yaml',
    runtime: 'YAML 1.2',
    icon: '📝',
    category: 'Data & Config',
    extensions: ['yaml', 'yml']
  },
  xml: {
    id: 'xml',
    label: 'XML',
    monacoLang: 'xml',
    runtime: 'XML Schema',
    icon: '🏷️',
    category: 'Data & Config',
    extensions: ['xml', 'svg', 'xaml']
  },
  markdown: {
    id: 'markdown',
    label: 'Markdown',
    monacoLang: 'markdown',
    runtime: 'CommonMark',
    icon: '📄',
    category: 'Documentation',
    extensions: ['md', 'markdown']
  },
  plaintext: {
    id: 'plaintext',
    label: 'Plain Text',
    monacoLang: 'plaintext',
    runtime: 'Text Document',
    icon: '📄',
    category: 'Documentation',
    extensions: ['txt', 'text', 'log']
  },

  // DevOps & Shell
  shell: {
    id: 'shell',
    label: 'Bash / Shell',
    monacoLang: 'shell',
    runtime: 'Bash 5.2 / POSIX',
    icon: '🐚',
    category: 'DevOps & Tooling',
    extensions: ['sh', 'bash', 'zsh']
  },
  powershell: {
    id: 'powershell',
    label: 'PowerShell',
    monacoLang: 'powershell',
    runtime: 'PowerShell 7',
    icon: '💻',
    category: 'DevOps & Tooling',
    extensions: ['ps1', 'psm1', 'psd1']
  },
  dockerfile: {
    id: 'dockerfile',
    label: 'Dockerfile',
    monacoLang: 'dockerfile',
    runtime: 'Docker Engine',
    icon: '🐳',
    category: 'DevOps & Tooling',
    extensions: ['dockerfile']
  }
};

/**
 * Automatically detects the canonical language ID and Monaco syntax mode from a file path.
 */
export function detectLanguageFromFilename(filename = '') {
  if (!filename) return { id: 'plaintext', monacoLang: 'plaintext', label: 'Plaintext', icon: '📄', runtime: 'UTF-8' };

  const clean = filename.toLowerCase().replace(/\\/g, '/');
  const baseName = clean.split('/').pop() || '';

  // Special files
  if (baseName === 'dockerfile' || baseName.startsWith('dockerfile.')) {
    return LANGUAGE_REGISTRY.dockerfile;
  }
  if (baseName.endsWith('.env') || baseName.startsWith('.env.')) {
    return { id: 'ini', monacoLang: 'ini', label: '.env Config', icon: '🔒', runtime: 'Environment' };
  }

  const ext = baseName.includes('.') ? baseName.split('.').pop() : '';

  for (const lang of Object.values(LANGUAGE_REGISTRY)) {
    if (lang.extensions && lang.extensions.includes(ext)) {
      return lang;
    }
  }

  // Fallback map
  if (ext === 'bat' || ext === 'cmd') return { id: 'bat', monacoLang: 'bat', label: 'Batch Script', icon: '⚙️', runtime: 'Windows Command' };
  if (ext === 'toml') return { id: 'ini', monacoLang: 'ini', label: 'TOML', icon: '📝', runtime: 'TOML' };

  return { id: 'plaintext', monacoLang: 'plaintext', label: 'Plaintext', icon: '📄', runtime: 'Plaintext' };
}

/**
 * Gets language metadata for top bar / status bar display.
 */
export function getLanguageInfo(langId = 'python') {
  if (LANGUAGE_REGISTRY[langId]) {
    return LANGUAGE_REGISTRY[langId];
  }
  // Lookup by monacoLang or extension
  const found = Object.values(LANGUAGE_REGISTRY).find(
    l => l.id === langId || l.monacoLang === langId || (l.extensions && l.extensions.includes(langId))
  );
  if (found) return found;

  return {
    id: langId,
    label: langId.toUpperCase(),
    monacoLang: langId,
    runtime: langId,
    icon: '💻',
    category: 'Other'
  };
}

/**
 * List of prominent languages for selector menus.
 */
export const POPULAR_LANGUAGES = [
  LANGUAGE_REGISTRY.javascript,
  LANGUAGE_REGISTRY.react_jsx,
  LANGUAGE_REGISTRY.typescript,
  LANGUAGE_REGISTRY.react_tsx,
  LANGUAGE_REGISTRY.html,
  LANGUAGE_REGISTRY.css,
  LANGUAGE_REGISTRY.python,
  LANGUAGE_REGISTRY.sql,
  LANGUAGE_REGISTRY.java,
  LANGUAGE_REGISTRY.csharp,
  LANGUAGE_REGISTRY.cpp,
  LANGUAGE_REGISTRY.go,
  LANGUAGE_REGISTRY.rust,
  LANGUAGE_REGISTRY.php,
  LANGUAGE_REGISTRY.json,
  LANGUAGE_REGISTRY.yaml,
  LANGUAGE_REGISTRY.shell
];
