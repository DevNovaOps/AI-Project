/**
 * AETHERION Unified Language & Framework Registry
 * Comprehensive support for Spring Boot, Java, Python (Django, FastAPI, Flask),
 * JavaScript / TypeScript (React, Next.js, Vue, Angular, Svelte, Express, NestJS),
 * C#, .NET, Go, Rust, C/C++, PHP (Laravel), Ruby (Rails), Swift, Dart (Flutter),
 * SQL, GraphQL, Prisma, Docker, Shell, and all modern programming ecosystems.
 */

export const LANGUAGE_REGISTRY = {
  // ── Enterprise & Java Ecosystem ──
  springboot: {
    id: 'springboot',
    label: 'Spring Boot (Java)',
    monacoLang: 'java',
    runtime: 'Spring Boot 3.2 / Java 21',
    icon: '🍃',
    category: 'Enterprise & Frameworks',
    extensions: ['java', 'properties', 'gradle']
  },
  java: {
    id: 'java',
    label: 'Java',
    monacoLang: 'java',
    runtime: 'OpenJDK 21',
    icon: '☕',
    category: 'Backend & Systems',
    extensions: ['java', 'jar', 'class']
  },
  kotlin: {
    id: 'kotlin',
    label: 'Kotlin (Spring / Android)',
    monacoLang: 'kotlin',
    runtime: 'Kotlin 1.9',
    icon: '🟣',
    category: 'Backend & Systems',
    extensions: ['kt', 'kts']
  },
  scala: {
    id: 'scala',
    label: 'Scala',
    monacoLang: 'scala',
    runtime: 'Scala 3.3',
    icon: '🔴',
    category: 'Backend & Systems',
    extensions: ['scala', 'sc']
  },
  properties: {
    id: 'properties',
    label: 'Spring Properties (.properties)',
    monacoLang: 'ini',
    runtime: 'Java Properties',
    icon: '⚙️',
    category: 'Data & Config',
    extensions: ['properties']
  },
  gradle: {
    id: 'gradle',
    label: 'Gradle Build (.gradle)',
    monacoLang: 'groovy',
    runtime: 'Gradle 8.x',
    icon: '🐘',
    category: 'Build & Tooling',
    extensions: ['gradle', 'groovy', 'gvy']
  },

  // ── Web & Frontend Frameworks ──
  nextjs: {
    id: 'nextjs',
    label: 'Next.js (React / SSR)',
    monacoLang: 'typescript',
    runtime: 'Next.js 14 / React 18',
    icon: '▲',
    category: 'Web Frameworks',
    extensions: ['tsx', 'jsx', 'ts', 'js']
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
  react_tsx: {
    id: 'react_tsx',
    label: 'React (TSX)',
    monacoLang: 'typescript',
    runtime: 'React 18 (TS)',
    icon: '⚛️',
    category: 'Web & Frontend',
    extensions: ['tsx']
  },
  vue: {
    id: 'vue',
    label: 'Vue.js / Nuxt',
    monacoLang: 'html',
    runtime: 'Vue 3 / Vite',
    icon: '💚',
    category: 'Web & Frontend',
    extensions: ['vue']
  },
  svelte: {
    id: 'svelte',
    label: 'Svelte / SvelteKit',
    monacoLang: 'html',
    runtime: 'SvelteKit / Vite',
    icon: '🔥',
    category: 'Web & Frontend',
    extensions: ['svelte']
  },
  angular: {
    id: 'angular',
    label: 'Angular',
    monacoLang: 'typescript',
    runtime: 'Angular 17',
    icon: '🔺',
    category: 'Web Frameworks',
    extensions: ['ts', 'html']
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    monacoLang: 'javascript',
    runtime: 'Node.js 20',
    icon: '⚡',
    category: 'Web & Frontend',
    extensions: ['js', 'mjs', 'cjs']
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
    extensions: ['scss', 'sass', 'less']
  },

  // ── Python & Frameworks ──
  python: {
    id: 'python',
    label: 'Python',
    monacoLang: 'python',
    runtime: 'Python 3.11',
    icon: '🐍',
    category: 'Backend & Systems',
    extensions: ['py', 'pyw', 'wsgi']
  },
  django: {
    id: 'django',
    label: 'Django (Python)',
    monacoLang: 'python',
    runtime: 'Django 5.0 / Python 3.11',
    icon: '🎸',
    category: 'Web Frameworks',
    extensions: ['py']
  },
  fastapi: {
    id: 'fastapi',
    label: 'FastAPI (Python)',
    monacoLang: 'python',
    runtime: 'FastAPI / Uvicorn',
    icon: '⚡',
    category: 'Web Frameworks',
    extensions: ['py']
  },
  flask: {
    id: 'flask',
    label: 'Flask (Python)',
    monacoLang: 'python',
    runtime: 'Flask 3.0 / WSGI',
    icon: '🧪',
    category: 'Web Frameworks',
    extensions: ['py']
  },

  // ── Node.js & Backend JS/TS ──
  express: {
    id: 'express',
    label: 'Express.js (Node.js)',
    monacoLang: 'javascript',
    runtime: 'Express 4.x / Node 20',
    icon: '🚂',
    category: 'Web Frameworks',
    extensions: ['js', 'mjs']
  },
  nestjs: {
    id: 'nestjs',
    label: 'NestJS (TypeScript)',
    monacoLang: 'typescript',
    runtime: 'NestJS 10 / Node 20',
    icon: '🦁',
    category: 'Web Frameworks',
    extensions: ['ts']
  },

  // ── C#, .NET & Systems ──
  dotnet: {
    id: 'dotnet',
    label: '.NET / ASP.NET Core',
    monacoLang: 'csharp',
    runtime: '.NET 8 Core',
    icon: '🟣',
    category: 'Enterprise & Frameworks',
    extensions: ['cs', 'csproj', 'sln']
  },
  csharp: {
    id: 'csharp',
    label: 'C#',
    monacoLang: 'csharp',
    runtime: '.NET 8',
    icon: '🎯',
    category: 'Backend & Systems',
    extensions: ['cs', 'csx']
  },
  cpp: {
    id: 'cpp',
    label: 'C / C++',
    monacoLang: 'cpp',
    runtime: 'GCC / Clang 17',
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

  // ── PHP, Ruby & Web Backend ──
  laravel: {
    id: 'laravel',
    label: 'Laravel (PHP)',
    monacoLang: 'php',
    runtime: 'Laravel 11 / PHP 8.3',
    icon: '🔴',
    category: 'Web Frameworks',
    extensions: ['php']
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
  rails: {
    id: 'rails',
    label: 'Ruby on Rails',
    monacoLang: 'ruby',
    runtime: 'Rails 7 / Ruby 3.3',
    icon: '💎',
    category: 'Web Frameworks',
    extensions: ['rb', 'rake']
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby',
    monacoLang: 'ruby',
    runtime: 'Ruby 3.3',
    icon: '💎',
    category: 'Backend & Systems',
    extensions: ['rb']
  },

  // ── Mobile & Cross-Platform ──
  flutter: {
    id: 'flutter',
    label: 'Flutter (Dart)',
    monacoLang: 'dart',
    runtime: 'Flutter 3.x / Dart',
    icon: '💙',
    category: 'Mobile & Cross-Platform',
    extensions: ['dart']
  },
  swift: {
    id: 'swift',
    label: 'Swift (iOS / macOS)',
    monacoLang: 'swift',
    runtime: 'Swift 5.9 / Apple LLVM',
    icon: '🕊️',
    category: 'Mobile & Cross-Platform',
    extensions: ['swift']
  },
  dart: {
    id: 'dart',
    label: 'Dart',
    monacoLang: 'dart',
    runtime: 'Dart 3.x',
    icon: '🎯',
    category: 'Mobile & Cross-Platform',
    extensions: ['dart']
  },

  // ── Databases & Query Languages ──
  sql: {
    id: 'sql',
    label: 'SQL (ANSI / PostgreSQL / MySQL / Oracle)',
    monacoLang: 'sql',
    runtime: 'RDBMS / ANSI SQL',
    icon: '🗄️',
    category: 'Database & Data',
    extensions: ['sql', 'psql', 'dsql', 'pls', 'plsql']
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
  prisma: {
    id: 'prisma',
    label: 'Prisma Schema',
    monacoLang: 'graphql',
    runtime: 'Prisma ORM',
    icon: '💎',
    category: 'Database & Data',
    extensions: ['prisma']
  },
  csv: {
    id: 'csv',
    label: 'CSV / TSV Data',
    monacoLang: 'plaintext',
    runtime: 'Tabular Dataset',
    icon: '📊',
    category: 'Database & Data',
    extensions: ['csv', 'tsv']
  },

  // ── Smart Contracts & Web3 ──
  solidity: {
    id: 'solidity',
    label: 'Solidity (Ethereum / EVM)',
    monacoLang: 'solidity',
    runtime: 'Solidity 0.8',
    icon: '💠',
    category: 'Smart Contracts',
    extensions: ['sol']
  },

  // ── Data Formats & Config ──
  json: {
    id: 'json',
    label: 'JSON / JSONC',
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
    label: 'XML / Maven POM',
    monacoLang: 'xml',
    runtime: 'XML 1.0 / W3C',
    icon: '🏷️',
    category: 'Data & Config',
    extensions: ['xml', 'pom', 'svg', 'xaml']
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

  // ── DevOps & Tooling ──
  dockerfile: {
    id: 'dockerfile',
    label: 'Dockerfile',
    monacoLang: 'dockerfile',
    runtime: 'Docker Engine',
    icon: '🐳',
    category: 'DevOps & Tooling',
    extensions: ['dockerfile']
  },
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
  }
};

/**
 * Automatically detects the canonical language ID and Monaco syntax mode from a file path.
 */
export function detectLanguageFromFilename(filename = '') {
  if (!filename) return { id: 'plaintext', monacoLang: 'plaintext', label: 'Plaintext', icon: '📄', runtime: 'UTF-8' };

  const clean = filename.toLowerCase().replace(/\\/g, '/');
  const baseName = clean.split('/').pop() || '';

  // Special named files
  if (baseName === 'dockerfile' || baseName.startsWith('dockerfile.')) {
    return LANGUAGE_REGISTRY.dockerfile;
  }
  if (baseName === 'pom.xml') {
    return LANGUAGE_REGISTRY.springboot;
  }
  if (baseName === 'build.gradle' || baseName === 'settings.gradle') {
    return LANGUAGE_REGISTRY.gradle;
  }
  if (baseName.endsWith('.properties') || baseName === 'application.properties') {
    return LANGUAGE_REGISTRY.properties;
  }
  if (baseName === 'application.yml' || baseName === 'application.yaml') {
    return LANGUAGE_REGISTRY.yaml;
  }
  if (baseName.endsWith('.env') || baseName.startsWith('.env.')) {
    return { id: 'ini', monacoLang: 'ini', label: '.env Config', icon: '🔒', runtime: 'Environment' };
  }

  const ext = baseName.includes('.') ? baseName.split('.').pop() : '';

  // Exact registry extension match
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
 * Curated list of prominent languages and frameworks for quick selector menus.
 */
export const POPULAR_LANGUAGES = [
  LANGUAGE_REGISTRY.springboot,
  LANGUAGE_REGISTRY.java,
  LANGUAGE_REGISTRY.nextjs,
  LANGUAGE_REGISTRY.react_tsx,
  LANGUAGE_REGISTRY.react_jsx,
  LANGUAGE_REGISTRY.typescript,
  LANGUAGE_REGISTRY.javascript,
  LANGUAGE_REGISTRY.python,
  LANGUAGE_REGISTRY.fastapi,
  LANGUAGE_REGISTRY.django,
  LANGUAGE_REGISTRY.dotnet,
  LANGUAGE_REGISTRY.csharp,
  LANGUAGE_REGISTRY.go,
  LANGUAGE_REGISTRY.rust,
  LANGUAGE_REGISTRY.cpp,
  LANGUAGE_REGISTRY.php,
  LANGUAGE_REGISTRY.laravel,
  LANGUAGE_REGISTRY.flutter,
  LANGUAGE_REGISTRY.swift,
  LANGUAGE_REGISTRY.sql,
  LANGUAGE_REGISTRY.html,
  LANGUAGE_REGISTRY.css,
  LANGUAGE_REGISTRY.dockerfile,
  LANGUAGE_REGISTRY.shell
];
