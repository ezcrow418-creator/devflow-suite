/* ========================================
   DevFlow Suite — Snippet Templates
   Pre-filled templates for common patterns
   ======================================== */

const SnippetTemplates = [
  {
    name: 'Debounce',
    description: 'Delay function execution until user stops triggering',
    lang: 'javascript',
    tags: 'utils,performance',
    code: `function debounce(fn, ms = 300) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), ms);\n  };\n}`
  },
  {
    name: 'Throttle',
    description: 'Limit function execution to once per interval',
    lang: 'javascript',
    tags: 'utils,performance',
    code: `function throttle(fn, ms = 300) {\n  let last = 0;\n  return (...args) => {\n    const now = Date.now();\n    if (now - last >= ms) {\n      last = now;\n      fn.apply(this, args);\n    }\n  };\n}`
  },
  {
    name: 'Fetch Wrapper',
    description: 'Clean async fetch with error handling and JSON parsing',
    lang: 'javascript',
    tags: 'api,http,async',
    code: `async function api(url, options = {}) {\n  const res = await fetch(url, {\n    headers: { 'Content-Type': 'application/json', ...options.headers },\n    ...options,\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);\n  return res.json();\n}`
  },
  {
    name: 'Event Emitter',
    description: 'Simple pub/sub event system',
    lang: 'javascript',
    tags: 'patterns,events',
    code: `class EventEmitter {\n  #listeners = {};\n\n  on(event, fn) {\n    (this.#listeners[event] ??= []).push(fn);\n    return () => this.off(event, fn);\n  }\n\n  off(event, fn) {\n    this.#listeners[event] = this.#listeners[event]?.filter(f => f !== fn);\n  }\n\n  emit(event, ...args) {\n    this.#listeners[event]?.forEach(fn => fn(...args));\n  }\n}`
  },
  {
    name: 'React Component',
    description: 'Functional React component with useState and useEffect',
    lang: 'javascript',
    tags: 'react,components',
    code: `import { useState, useEffect } from 'react';\n\nexport default function MyComponent({ title }) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetchData().then(setData).finally(() => setLoading(false));\n  }, []);\n\n  if (loading) return <p>Loading...</p>;\n\n  return (\n    <div>\n      <h1>{title}</h1>\n      <pre>{JSON.stringify(data, null, 2)}</pre>\n    </div>\n  );\n}`
  },
  {
    name: 'Express Route',
    description: 'Express.js REST API route with error handling',
    lang: 'javascript',
    tags: 'node,express,api',
    code: `import { Router } from 'express';\nconst router = Router();\n\nrouter.get('/items', async (req, res) => {\n  try {\n    const items = await db.query('SELECT * FROM items');\n    res.json(items);\n  } catch (err) {\n    console.error(err);\n    res.status(500).json({ error: 'Internal server error' });\n  }\n});\n\nexport default router;`
  },
  {
    name: 'DOM Ready',
    description: 'Safe DOM ready handler',
    lang: 'javascript',
    tags: 'dom,utils',
    code: `function onReady(fn) {\n  if (document.readyState !== 'loading') {\n    fn();\n  } else {\n    document.addEventListener('DOMContentLoaded', fn);\n  }\n}`
  },
  {
    name: 'LocalStorage Wrapper',
    description: 'Safe localStorage with JSON and expiry support',
    lang: 'javascript',
    tags: 'storage,utils',
    code: `const storage = {\n  get(key, fallback = null) {\n    try {\n      const raw = localStorage.getItem(key);\n      if (!raw) return fallback;\n      const { value, expiry } = JSON.parse(raw);\n      if (expiry && Date.now() > expiry) {\n        localStorage.removeItem(key);\n        return fallback;\n      }\n      return value;\n    } catch { return fallback; }\n  },\n  set(key, value, ttlMs = null) {\n    const data = { value, expiry: ttlMs ? Date.now() + ttlMs : null };\n    localStorage.setItem(key, JSON.stringify(data));\n  },\n  remove(key) { localStorage.removeItem(key); }\n};`
  },
  {
    name: 'Python Function',
    description: 'Type-hinted Python function with docstring',
    lang: 'python',
    tags: 'utils,boilerplate',
    code: `def process_data(items: list[str], limit: int = 10) -> dict:\n    """Process a list of items and return summary statistics.\n\n    Args:\n        items: List of string items to process.\n        limit: Maximum number of items to consider.\n\n    Returns:\n        Dictionary with count, unique items, and truncated list.\n    """\n    truncated = items[:limit]\n    return {\n        "count": len(truncated),\n        "unique": len(set(truncated)),\n        "items": truncated,\n    }`
  },
  {
    name: 'Go HTTP Handler',
    description: 'Go HTTP handler with JSON response',
    lang: 'go',
    tags: 'api,http,backend',
    code: `func handleGetItems(w http.ResponseWriter, r *http.Request) {\n\tw.Header().Set("Content-Type", "application/json")\n\n\titems, err := db.GetAllItems(r.Context())\n\tif err != nil {\n\t\tw.WriteHeader(http.StatusInternalServerError)\n\t\tjson.NewEncoder(w).Encode(map[string]string{"error": err.Error()})\n\t\treturn\n\t}\n\n\tjson.NewEncoder(w).Encode(items)\n}`
  },
  {
    name: 'Rust Error Handling',
    description: 'Rust function with Result and custom error',
    lang: 'rust',
    tags: 'errors,utils',
    code: `use std::fmt;\n\n#[derive(Debug)]\nenum AppError {\n    NotFound(String),\n    Parse(String),\n}\n\nimpl fmt::Display for AppError {\n    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {\n        match self {\n            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),\n            AppError::Parse(msg) => write!(f, "Parse error: {}", msg),\n        }\n    }\n}\n\nfn parse_number(input: &str) -> Result<i64, AppError> {\n    input.parse().map_err(|_| AppError::Parse(input.to_string()))\n}`
  },
  {
    name: 'SQL Create Table',
    description: 'PostgreSQL table with indexes and constraints',
    lang: 'sql',
    tags: 'database,schema',
    code: `CREATE TABLE users (\n    id          SERIAL PRIMARY KEY,\n    email       VARCHAR(255) UNIQUE NOT NULL,\n    name        VARCHAR(100) NOT NULL,\n    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_users_email ON users (email);\nCREATE INDEX idx_users_created ON users (created_at);`
  },
  {
    name: 'CSS Grid Layout',
    description: 'Responsive CSS Grid with auto-fill',
    lang: 'css',
    tags: 'layout,responsive',
    code: `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1.5rem;\n  padding: 1.5rem;\n}\n\n@media (max-width: 640px) {\n  .grid-container {\n    grid-template-columns: 1fr;\n    gap: 1rem;\n    padding: 1rem;\n  }\n}`
  },
  {
    name: 'Bash Script',
    description: 'Safe bash script with error handling and logging',
    lang: 'bash',
    tags: 'cli,devops',
    code: `#!/usr/bin/env bash\nset -euo pipefail\n\n# Colors\nRED='\\033[0;31m'\nGREEN='\\033[0;32m'\nNC='\\033[0m'\n\nlog()  { echo -e \"${GREEN}[INFO]${NC} $*\"; }\ndie()  { echo -e \"${RED}[ERROR]${NC} $*\" >&2; exit 1; }\n\n# Main\nmain() {\n  log \"Starting...\"\n  # Your code here\n  log \"Done!\"\n}\n\nmain "$@"`
  }
];
