#!/usr/bin/env python3
"""
JavaScript Snippets Vault — PDF Generator
Generates a professional PDF with 52 essential JavaScript snippets.
Usage: python3 generate_pdf.py
"""
import re
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    KeepTogether, Frame
)

# ===== CONFIG =====
PAGE_W, PAGE_H = A4
OUT = 'assets/data/JavaScript_Snippets_Vault.pdf'
os.makedirs('assets/data', exist_ok=True)

# ===== COLORS =====
PRIMARY    = '#3b82f8'
SECONDARY  = '#8b5cf6'
SUCCESS    = '#10b981'
TEXT       = '#1f2937'
TEXT_LT    = '#9ca3af'
CODE_BG    = '#f8fafc'
CODE_TXT   = '#374151'
COMMENT    = '#6b7280'
STRING     = '#10b981'
KEYWORD    = '#2563eb'
NUMBER     = '#7c3aed'
BORDER     = '#e5e7eb'

# ===== SNIPPETS =====
SNIPPETS = [
    # ── DOM Manipulation ──
    {'cat': 'DOM Manipulation', 'title': 'Select Elements',
     'desc': 'Use querySelector for a single element, querySelectorAll for multiple.',
     'code': "// Single element\nconst el = document.querySelector('.btn-primary');\n\n// Multiple elements\nconst items = document.querySelectorAll('.card');\n\n// By ID (fastest)\nconst header = document.getElementById('header');"},
    {'cat': 'DOM Manipulation', 'title': 'Create & Append Element',
     'desc': 'Create new DOM nodes and insert them into the document tree.',
     'code': "const div = document.createElement('div');\ndiv.className = 'new-element';\ndiv.textContent = 'Hello World';\n\ndocument.body.appendChild(div);\n// Or: document.body.append(div);"},
    {'cat': 'DOM Manipulation', 'title': 'Remove Element',
     'desc': 'Remove an element from the DOM with proper cleanup.',
     'code': "const el = document.querySelector('.to-remove');\nif (el) {\n  el.remove();\n  // Fallback: el.parentNode.removeChild(el);\n}"},
    {'cat': 'DOM Manipulation', 'title': 'Get/Set Attributes',
     'desc': 'Manipulate HTML attributes using the element API.',
     'code': "const link = document.querySelector('a');\nconst url = link.getAttribute('href');\nlink.setAttribute('href', 'https://devflow.suite');\nlink.setAttribute('target', '_blank');\nlink.removeAttribute('target');"},
    {'cat': 'DOM Manipulation', 'title': 'Toggle CSS Classes',
     'desc': 'Add, remove, or toggle CSS classes dynamically.',
     'code': "const menu = document.querySelector('.menu');\nmenu.classList.toggle('open');\nmenu.classList.toggle('hidden', !menu.classList.contains('open'));\nconst isOpen = menu.classList.contains('open');"},
    {'cat': 'DOM Manipulation', 'title': 'Event Delegation',
     'desc': 'Single event listener on parent for child elements.',
     'code': "document.getElementById('list').addEventListener('click', (e) => {\n  if (e.target.matches('li')) {\n    console.log('Clicked:', e.target.textContent);\n  }\n});"},
    {'cat': 'DOM Manipulation', 'title': 'Detect Click Outside',
     'desc': 'Close dropdowns or modals when clicking outside the element.',
     'code': "function clickOutside(el, cb) {\n  const handler = (e) => {\n    if (!el.contains(e.target)) cb(e);\n  };\n  document.addEventListener('click', handler);\n  return () => document.removeEventListener('click', handler);\n}"},
    {'cat': 'DOM Manipulation', 'title': 'Smooth Scroll to Element',
     'desc': 'Scroll to a specific element with smooth animation.',
     'code': "function scrollToEl(selector) {\n  document.querySelector(selector)?.scrollIntoView({\n    behavior: 'smooth',\n    block: 'start'\n  });\n}"},

    # ── Async & Promises ──
    {'cat': 'Async & Promises', 'title': 'Sleep / Delay',
     'desc': 'Pause execution for a specified duration using promises.',
     'code': "const sleep = (ms) => new Promise(r => setTimeout(r, ms));\n\n// Usage\nawait sleep(1000);\nconsole.log('1 second passed');"},
    {'cat': 'Async & Promises', 'title': 'Debounce Function',
     'desc': 'Delay function execution until after a period of inactivity.',
     'code': "function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\n// Usage\ndocument.querySelector('#search').addEventListener('input',\n  debounce(e => searchAPI(e.target.value), 300));"},
    {'cat': 'Async & Promises', 'title': 'Throttle Function',
     'desc': 'Ensure a function is only called once per time period.',
     'code': "function throttle(fn, limit) {\n  let inThrottle;\n  return (...args) => {\n    if (!inThrottle) {\n      fn.apply(this, args);\n      inThrottle = true;\n      setTimeout(() => inThrottle = false, limit);\n    }\n  };\n}"},
    {'cat': 'Async & Promises', 'title': 'Retry Failed Request',
     'desc': 'Automatically retry a promise on failure with optional delay.',
     'code': "async function retry(fn, retries = 3, delay = 1000) {\n  try {\n    return await fn();\n  } catch (err) {\n    if (retries <= 0) throw err;\n    await sleep(delay);\n    return retry(fn, retries - 1, delay);\n  }\n}\n\n// Usage\nconst data = await retry(() => fetch('/api/data'));"},
    {'cat': 'Async & Promises', 'title': 'Promise with Timeout',
     'desc': 'Race a promise against a timeout that rejects on expiry.',
     'code': "function withTimeout(promise, ms) {\n  const timeout = new Promise((_, reject) =>\n    setTimeout(() => reject(new Error('Timeout after ' + ms + 'ms')), ms)\n  );\n  return Promise.race([promise, timeout]);\n}\n\n// Usage\nconst data = await withTimeout(fetch('/api'), 5000);"},
    {'cat': 'Async & Promises', 'title': 'Concurrency-Limited Promise All',
     'desc': 'Run async tasks in parallel with a configurable concurrency limit.',
     'code': "async function promisePool(tasks, concurrency = 3) {\n  const results = [];\n  for (let i = 0; i < tasks.length; i += concurrency) {\n    const batch = tasks.slice(i, i + concurrency);\n    results.push(...await Promise.all(batch.map(t => t())));\n  }\n  return results;\n}\n\n// Usage\nawait promisePool(urls.map(u => () => fetch(u)), 3);"},
    {'cat': 'Async & Promises', 'title': 'Memoize Async Function',
     'desc': 'Cache results of expensive async operations by argument.',
     'code': "function memoizeAsync(fn) {\n  const cache = new Map();\n  return async function(...args) {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = await fn.apply(this, args);\n    cache.set(key, result);\n    return result;\n  };\n}"},
    {'cat': 'Async & Promises', 'title': 'Simple Event Emitter',
     'desc': 'Lighter alternative to Node.js EventEmitter for browsers.',
     'code': "class Emitter {\n  constructor() { this.events = {}; }\n  on(e, cb) { (this.events[e] ||= []).push(cb); return this; }\n  emit(e, ...args) { this.events[e]?.forEach(cb => cb(...args)); return this; }\n  off(e, cb) { if (e) this.events[e] = this.events[e]?.filter(f => f !== cb); return this; }\n}\n\nconst emitter = new Emitter();\nemitter.on('data', d => console.log(d));"},

    # ── Arrays & Objects ──
    {'cat': 'Arrays & Objects', 'title': 'Deep Clone',
     'desc': 'Create a deep copy of any value without shared references.',
     'code': "// Method 1: JSON (fastest, no functions)\nconst clone = JSON.parse(JSON.stringify(obj));\n\n// Method 2: StructuredClone (modern browsers + Node 17+)\nconst clone2 = structuredClone(obj);\n\n// Method 3: Recursive (handles functions)\nfunction deepClone(obj, seen = new WeakMap()) {\n  if (obj === null || typeof obj !== 'object') return obj;\n  if (seen.has(obj)) return seen.get(obj);\n  const clone = Array.isArray(obj) ? [] : {};\n  seen.set(obj, clone);\n  for (const k in obj) clone[k] = deepClone(obj[k], seen);\n  return clone;\n}"},
    {'cat': 'Arrays & Objects', 'title': 'Deep Merge',
     'desc': 'Recursively merge two or more objects together.',
     'code': "function deepMerge(target, ...sources) {\n  if (!sources.length) return target;\n  const src = sources.shift();\n  if (!isObject(target) || !isObject(src)) return target;\n  for (const k in src) {\n    if (isObject(src[k])) {\n      if (!target[k]) target[k] = {};\n      deepMerge(target[k], src[k]);\n    } else {\n      target[k] = src[k];\n    }\n  }\n  return target;\n}\nfunction isObject(x) { return x && typeof x === 'object'; }"},
    {'cat': 'Arrays & Objects', 'title': 'Group By Property',
     'desc': 'Transform a flat array into an object grouped by a key.',
     'code': "const groupBy = (arr, key) =>\n  arr.reduce((acc, item) => {\n    (acc[item[key]] ||= []).push(item);\n    return acc;\n  }, {});\n\n// Usage\ngroupBy(users, 'role');\n// { admin: [...], user: [...] }"},
    {'cat': 'Arrays & Objects', 'title': 'Unique / Deduplicate',
     'desc': 'Remove duplicate values from an array.',
     'code': "// Primitives\nconst uniq = [...new Set(arr)];\n\n// Objects by key\nconst uniqBy = (arr, key) =>\n  [...arr.reduce((m, item) => m.set(item[key], item), new Map()).values()];\n\nuniq([1, 2, 2, 3]); // [1, 2, 3]"},
    {'cat': 'Arrays & Objects', 'title': 'Flatten Nested Array',
     'desc': 'Flatten arrays of arbitrary depth.',
     'code': "// Modern: .flat(Infinity)\nconst flat = arr.flat(Infinity);\n\n// Recursive\nconst flatten = arr =>\n  arr.reduce((acc, v) =>\n    Array.isArray(v) ? acc.concat(flatten(v)) : acc.concat(v), []);\n\nflatten([1, [2, [3, [4]]]]); // [1, 2, 3, 4]"},
    {'cat': 'Arrays & Objects', 'title': 'Chunk Array',
     'desc': 'Split an array into smaller arrays of a specified size.',
     'code': "const chunk = (arr, size) => {\n  const chunks = [];\n  for (let i = 0; i < arr.length; i += size) {\n    chunks.push(arr.slice(i, i + size));\n  }\n  return chunks;\n};\n\nchunk([1,2,3,4,5,6,7], 3);\n// [[1,2,3], [4,5,6], [7]]"},
    {'cat': 'Arrays & Objects', 'title': 'Array Intersection',
     'desc': 'Return elements that exist in ALL provided arrays.',
     'code': "const intersect = (a, ...arrays) =>\n  arrays.reduce((acc, arr) =>\n    acc.filter(x => arr.includes(x)), a);\n\nintersect([1,2,3,4], [2,3,5], [3,4,2]); // [2, 3]"},
    {'cat': 'Arrays & Objects', 'title': 'Array Difference',
     'desc': 'Return elements from first array not in any other arrays.',
     'code': "const difference = (arr, ...arrays) => {\n  const exclude = new Set(arrays.flat());\n  return arr.filter(x => !exclude.has(x));\n};\n\ndifference([1,2,3,4,5], [2,4], [5]); // [1, 3]"},
    {'cat': 'Arrays & Objects', 'title': 'Shuffle (Fisher-Yates)',
     'desc': 'Randomly shuffle array elements without mutation.',
     'code': "function shuffle(arr) {\n  const a = [...arr];\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(Math.random() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}\n\nshuffle([1,2,3,4,5]); // [3,1,5,2,4]"},
    {'cat': 'Arrays & Objects', 'title': 'Random Array Element',
     'desc': 'Return one or more random elements from an array.',
     'code': "const sample = arr => arr[Math.floor(Math.random() * arr.length)];\n\nconst sampleSize = (arr, n = 1) =>\n  Array.from({ length: n }, () => sample(arr));\n\nsample(['a','b','c']);   // 'b'\nsampleSize([1,2,3,4,5], 3); // [4,1,5]"},
    {'cat': 'Arrays & Objects', 'title': 'Sort By Property',
     'desc': 'Sort an array of objects by a specific property.',
     'code': "const sortBy = (arr, key, dir = 'asc') => {\n  return [...arr].sort((a, b) => {\n    if (a[key] > b[key]) return dir === 'asc' ? 1 : -1;\n    if (a[key] < b[key]) return dir === 'asc' ? -1 : 1;\n    return 0;\n  });\n};\n\nsortBy(users, 'age', 'desc');"},
    {'cat': 'Arrays & Objects', 'title': 'Sum / Average / Median',
     'desc': 'Statistical calculations on numeric arrays.',
     'code': "const sum = arr => arr.reduce((a, b) => a + b, 0);\nconst avg = arr => sum(arr) / arr.length;\nconst median = arr => {\n  const s = [...arr].sort((a,b) => a - b);\n  const mid = Math.floor(s.length / 2);\n  return s.length % 2 ? s[mid] : (s[mid-1] + s[mid]) / 2;\n};\n\nsum([1,2,3,4]);   // 10\navg([1,2,3,4]);   // 2.5\nmedian([1,3,2,4]); // 2.5"},
    {'cat': 'Arrays & Objects', 'title': 'Range Generator',
     'desc': 'Generate an array of numbers within a range.',
     'code': "const range = (start, end, step = 1) => {\n  const result = [];\n  if (end === undefined) { end = start; start = 0; }\n  for (let i = start; i < end; i += step) result.push(i);\n  return result;\n};\n\nrange(5);        // [0,1,2,3,4]\nrange(1, 6);     // [1,2,3,4,5]\nrange(0, 10, 2); // [0,2,4,6,8]"},
    {'cat': 'Arrays & Objects', 'title': 'Deep Equality Check',
     'desc': 'Check if two values are deeply equal.',
     'code': "function deepEqual(a, b) {\n  if (a === b) return true;\n  if (typeof a !== typeof b) return false;\n  if (a == null || b == null) return a === b;\n  if (typeof a !== 'object') return a === b;\n  if (Array.isArray(a) !== Array.isArray(b)) return false;\n  const ka = Object.keys(a), kb = Object.keys(b);\n  if (ka.length !== kb.length) return false;\n  return ka.every(k => deepEqual(a[k], b[k]));\n}"},
    {'cat': 'Arrays & Objects', 'title': 'Get / Set Nested Property',
     'desc': 'Access and modify nested object properties via dot-notation path.',
     'code': "// Get\nconst get = (obj, path, def) =>\n  path.split('.').reduce((o, k) =>\n    o?.[k] !== undefined ? o[k] : undefined, obj) ?? def;\n\n// Set\nconst set = (obj, path, val) => {\n  const keys = path.split('.');\n  let cur = obj;\n  for (let i = 0; i < keys.length - 1; i++) {\n    cur = cur[keys[i]] = cur[keys[i]] || {};\n  }\n  cur[keys.at(-1)] = val;\n  return obj;\n}\n\nconst obj = {a:{b:{c:1}}};\nget(obj,'a.b.c'); // 1\nset(obj,'a.b.d',2);"},
    {'cat': 'Arrays & Objects', 'title': 'Pick / Omit Keys',
     'desc': 'Select or remove specific keys from an object.',
     'code': "const pick = (obj, ...keys) =>\n  Object.fromEntries(keys.map(k => [k, obj[k]]));\n\nconst omit = (obj, ...keys) =>\n  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));\n\n// Usage\npick({a:1,b:2,c:3}, 'a','c'); // {a:1, c:3}\nomit({a:1,b:2,c:3}, 'b');     // {a:1, c:3}"},
    {'cat': 'Arrays & Objects', 'title': 'Map & Group',
     'desc': 'Apply a function and group results.',
     'code': "function mapGroup(arr, mapFn, groupFn) {\n  const groups = {};\n  for (const item of arr) {\n    const mapped = mapFn(item);\n    const key = groupFn(item);\n    (groups[key] ||= []).push(mapped);\n  }\n  return groups;\n}\n\n// Usage: map and group users by role\nmapGroup(users, u => u.name, u => u.role);"},

    # ── Strings & Utilities ──
    {'cat': 'Strings & Utilities', 'title': 'Slugify',
     'desc': 'Convert any string into a URL-friendly slug.',
     'code': "function slugify(str) {\n  return str\n    .toLowerCase()\n    .trim()\n    .replace(/[^\\w\\s-]/g, '')\n    .replace(/[\\s_-]+/g, '-')\n    .replace(/^-+|-+$/g, '');\n}\n\nslugify('Hello World!'); // 'hello-world'"},
    {'cat': 'Strings & Utilities', 'title': 'Capitalize / Title Case',
     'desc': 'Capitalize strings in sentence or title case.',
     'code': "const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);\n\nconst titleCase = s =>\n  s.toLowerCase().replace(/(?:^|\\s)\\w/g, c => c.toUpperCase());\n\ncapitalize('hello');      // 'Hello'\ntitleCase('hello world'); // 'Hello World'"},
    {'cat': 'Strings & Utilities', 'title': 'Truncate with Ellipsis',
     'desc': 'Truncate a string to a max length, appending suffix.',
     'code': "const truncate = (str, max, suffix = '...') =>\n  str.length > max\n    ? str.slice(0, max - suffix.length) + suffix\n    : str;\n\ntruncate('Hello World', 8); // 'Hello...'\ntruncate('Hello World', 5); // 'He...'"},
    {'cat': 'Strings & Utilities', 'title': 'Parse & Build Query Strings',
     'desc': 'Convert between URL query strings and objects.',
     'code': "// Parse\nconst parseQuery = str =>\n  Object.fromEntries(new URLSearchParams(str.replace(/^\\?/, '')));\n\n// Build\nconst buildQuery = obj =>\n  '?' + new URLSearchParams(obj).toString();\n\n// Usage\nparseQuery('?name=dev&tool=snippets');\n// {name: 'dev', tool: 'snippets'}\nbuildQuery({page: 2, sort: 'asc'});\n// '?page=2&sort=asc'"},
    {'cat': 'Strings & Utilities', 'title': 'Format Date',
     'desc': 'Format dates in localized, human-readable formats.',
     'code': "function fmtDate(date, locale = 'en-US', opts = {}) {\n  return new Date(date).toLocaleDateString(locale, {\n    weekday: 'short', year: 'numeric', month: 'short',\n    day: 'numeric', ...opts\n  });\n}\n\nfmtDate(new Date());\n// 'Wed, Aug 13, 2025'\nfmtDate(new Date(), 'en-US', { dateStyle: 'full' });\n// 'Wednesday, August 13, 2025'"},
    {'cat': 'Strings & Utilities', 'title': 'Generate UUID v4',
     'desc': 'Generate a RFC 4122 compliant UUID v4.',
     'code': "function uuid() {\n  return crypto.randomUUID\n    ? crypto.randomUUID()\n    : ([1e7,-1e3,-4e3,-8e3,-1e11].join('-').replace(/[0184]/g, c =>\n        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] % 16 >> c / 4).toString(16)[1] || 0\n      ));\n}\n\nuuid(); // 'f5a9b2c3-1d4e-4f5a-9b3c-8e2d7a1c0b4f'"},

    # ── Browser APIs ──
    {'cat': 'Browser APIs', 'title': 'Copy to Clipboard',
     'desc': 'Copy text to the clipboard asynchronously.',
     'code': "async function copy(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    return true;\n  } catch {\n    const ta = document.createElement('textarea');\n    ta.value = text;\n    document.body.appendChild(ta);\n    ta.select();\n    const ok = document.execCommand('copy');\n    document.body.removeChild(ta);\n    return ok;\n  }\n}\n\nawait copy('Hello clipboard!');"},
    {'cat': 'Browser APIs', 'title': 'Download File',
     'desc': 'Trigger a file download from JavaScript.',
     'code': "function download(content, name = 'file.txt', type = 'text/plain') {\n  const blob = new Blob([content], { type });\n  const url = URL.createObjectURL(blob);\n  const a = document.createElement('a');\n  a.href = url;\n  a.download = name;\n  a.click();\n  URL.revokeObjectURL(url);\n}\n\ndownload(JSON.stringify(data), 'data.json', 'application/json');"},
    {'cat': 'Browser APIs', 'title': 'Toast Notification',
     'desc': 'Show a lightweight, self-removing notification.',
     'code': "function toast(msg, ms = 3000) {\n  const t = document.createElement('div');\n  Object.assign(t.style, {\n    position: 'fixed', bottom: '20px', right: '20px',\n    padding: '12px 20px', background: '#333', color: '#fff',\n    borderRadius: '8px', zIndex: 9999, fontSize: '14px'\n  });\n  t.textContent = msg;\n  document.body.appendChild(t);\n  setTimeout(() => t.remove(), ms);\n}\n\ntoast('Saved successfully!');"},
    {'cat': 'Browser APIs', 'title': 'Detect Dark Mode',
     'desc': 'Detect user preference and react to changes.',
     'code': "const isDark = () =>\n  window.matchMedia('(prefers-color-scheme: dark)').matches;\n\n// Watch for changes\nwindow.matchMedia('(prefers-color-scheme: dark)')\n  .addEventListener('change', e => {\n    document.body.classList.toggle('dark', e.matches);\n  });"},
    {'cat': 'Browser APIs', 'title': 'Local Storage JSON Wrapper',
     'desc': 'JSON-safe localStorage that handles serialization.',
     'code': "const store = {\n  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },\n  get(k, d = null) {\n    try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; }\n    catch { return d; }\n  },\n  remove(k) { localStorage.removeItem(k); }\n};\n\nstore.set('user', {name: 'Alice'});\nconst user = store.get('user'); // {name: 'Alice'}"},
    {'cat': 'Browser APIs', 'title': 'Cookie Manager',
     'desc': 'Create, read, and delete cookies with expiration.',
     'code': "const cookie = {\n  set(name, val, days = 7) {\n    const d = new Date();\n    d.setTime(d.getTime() + days * 864e5);\n    document.cookie = `${name}=${encodeURIComponent(val)};expires=${d.toUTCString()};path=/`;\n  },\n  get(name) {\n    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\\[\\]\\/\\^\\-]/g, '\\\\$&') + '=([^;]*)'));\n    return m ? decodeURIComponent(m[1]) : undefined;\n  },\n  remove(name) { this.set(name, '', -1); }\n};"},
    {'cat': 'Browser APIs', 'title': 'Get URL Parameters',
     'desc': 'Extract query parameters from the current URL.',
     'code': "// All params\nconst params = Object.fromEntries(new URLSearchParams(window.location.search));\n\n// Single param\nconst getParam = name =>\n  new URLSearchParams(window.location.search).get(name);\n\n// Usage\nconst { page, sort } = params; // {page:'2', sort:'asc'}\nconst p = getParam('page');      // '2'"},
    {'cat': 'Browser APIs', 'title': 'Element in Viewport',
     'desc': 'Check if an element is visible within the viewport.',
     'code': "function inViewport(el, threshold = 0) {\n  const r = el.getBoundingClientRect();\n  const vp = {\n    top: 0, left: 0,\n    bottom: window.innerHeight || document.documentElement.clientHeight,\n    right: window.innerWidth || document.documentElement.clientWidth\n  };\n  return (\n    r.bottom >= vp.top * (1 + threshold) &&\n    r.top <= vp.bottom * (1 - threshold) &&\n    r.right >= vp.left * (1 + threshold) &&\n    r.left <= vp.right * (1 - threshold)\n  );\n}"},

    # ── CSS & Layout ──
    {'cat': 'CSS & Layout', 'title': 'CSS Gradient String Generator',
     'desc': 'Generate linear gradient CSS strings programmatically.',
     'code': "function gradient(colors, angle = 90) {\n  return `linear-gradient(${angle}deg, ${colors.join(', ')})`;\n}\n\ngradient(['#ff0000', '#00ff00', '#0000ff'], 45);\n// 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)'"},
    {'cat': 'CSS & Layout', 'title': 'Viewport Dimensions',
     'desc': 'Get current viewport dimensions and scroll position.',
     'code': "function viewport() {\n  return {\n    width: window.innerWidth || document.documentElement.clientWidth,\n    height: window.innerHeight || document.documentElement.clientHeight,\n    scrollX: window.pageXOffset,\n    scrollY: window.pageYOffset\n  };\n}\n\n// Usage\nconst { width, height } = viewport();\nconsole.log(`${width}x${height}`);"},
    {'cat': 'CSS & Layout', 'title': 'Format Currency',
     'desc': 'Format numbers as localized currency strings.',
     'code': "function fmtCurrency(amount, currency = 'USD', locale = 'en-US') {\n  return new Intl.NumberFormat(locale, {\n    style: 'currency',\n    currency\n  }).format(amount);\n}\n\nfmtCurrency(1234.56);     // '$1,234.56'\nfmtCurrency(99.99, 'EUR'); // '€99.99'"},
    {'cat': 'CSS & Layout', 'title': 'Device Pixel Ratio',
     'desc': 'Detect high-DPI displays for image optimization.',
     'code': "const isHiDPI = window.devicePixelRatio > 1;\nconst imageScale = window.devicePixelRatio || 1;\n\n// Usage: choose image based on DPR\nconst img = isHiDPI ? 'image@2x.jpg' : 'image.jpg';"},

    # ── Performance & Debugging ──
    {'cat': 'Performance & Debugging', 'title': 'Measure Execution Time',
     'desc': 'Profile how long async and sync functions take.',
     'code': "// Console timer\nconsole.time('task');\nawait someAsyncOp();\nconsole.timeEnd('task'); // task: 42.5ms\n\n// Wrapper\nasync function timeIt(fn, label = 'Task') {\n  const t = performance.now();\n  const result = await fn();\n  console.log(`${label}: ${(performance.now() - t).toFixed(2)}ms`);\n  return result;\n}\n\nawait timeIt(() => fetch('/api'), 'API Call');"},
    {'cat': 'Performance & Debugging', 'title': 'Lazy Load Images',
     'desc': 'Load images only when they enter the viewport.',
     'code': "function lazyLoad() {\n  const imgs = document.querySelectorAll('img[data-src]:not([src])');\n  const io = new IntersectionObserver((entries) => {\n    entries.forEach(e => {\n      if (e.isIntersecting) {\n        e.target.src = e.target.dataset.src;\n        io.unobserve(e.target);\n      }\n    });\n  }, { threshold: 0.1 });\n  imgs.forEach(img => io.observe(img));\n}\n\nlazyLoad();"},
    {'cat': 'Performance & Debugging', 'title': 'Memory Usage Helper',
     'desc': 'Estimate memory usage of data structures.',
     'code': "function sizeOf(obj) {\n  const bytes = JSON.stringify(obj).length;\n  const units = ['B', 'KB', 'MB', 'GB'];\n  let i = 0;\n  let size = bytes;\n  while (size >= 1024 && i < units.length - 1) {\n    size /= 1024; i++;\n  }\n  return `${size.toFixed(2)} ${units[i]}`;\n}\n\nsizeOf({a:1, b:[1,2,3]}); // '28 B'"},
    {'cat': 'Performance & Debugging', 'title': 'Assert Helper',
     'desc': 'Runtime assertions for development and testing.',
     'code': "function assert(condition, msg = 'Assertion failed') {\n  if (!condition) {\n    console.error(`Assert: ${msg}`, new Error().stack);\n    throw new Error(msg);\n  }\n}\n\n// Usage\nassert(user.id, 'User must have an ID');\nassert(typeof name === 'string', 'Name must be a string');"},
]


# ===== SYNTAX HIGHLIGHTER =====
KW = {'break','case','catch','class','const','continue','debugger','default','delete',
      'do','else','export','extends','false','finally','for','function','if','import',
      'in','instanceof','new','null','return','super','switch','this','throw','true',
      'try','typeof','var','void','while','with','yield','async','await','Promise',
      'undefined','let','of','as','from','static','get','set','true','false'}


def highlight_js(code):
    code = code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    pat = re.compile(
        r'(//[^\n]*|/\*.*?\*/)'
        r"|('[^']*'|\"[^\"]*\"|`[^`]*`)"
        r'|(\b\d+\.?\d*\b)'
        r'|(\b\w+\b)'
        r'|([^\w\s])', re.DOTALL)
    out, last = [], 0
    for m in pat.finditer(code):
        if m.start() > last:
            out.append(code[last:m.start()])
        if m.group(1):
            out.append(f'<font color="{COMMENT}">{m.group(1)}</font>')
        elif m.group(2):
            out.append(f'<font color="{STRING}">{m.group(2)}</font>')
        elif m.group(3):
            out.append(f'<font color="{NUMBER}">{m.group(3)}</font>')
        elif m.group(4) and m.group(4) in KW:
            out.append(f'<font color="{KEYWORD}">{m.group(4)}</font>')
        else:
            out.append(m.group())
        last = m.end()
    if last < len(code):
        out.append(code[last:])
    return ''.join(out)


# ===== STYLES =====
h1 = ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=24, leading=28,
                    textColor=colors.HexColor(TEXT), alignment=TA_CENTER, spaceAfter=8)

h1_large = ParagraphStyle('H1Large', parent=h1, fontSize=32, leading=36, spaceAfter=4)

sub = ParagraphStyle('Sub', fontName='Helvetica', fontSize=13, leading=17,
                     textColor=colors.HexColor(TEXT_LT), alignment=TA_CENTER, spaceAfter=2)

h2 = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=18, leading=22,
                    textColor=colors.HexColor(TEXT), alignment=TA_CENTER, spaceAfter=10)

h3 = ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=14, leading=18,
                    textColor=colors.HexColor(TEXT), spaceAfter=6)

h4 = ParagraphStyle('H4', fontName='Helvetica-Bold', fontSize=11, leading=14,
                    textColor=colors.HexColor(TEXT), spaceAfter=2)

body = ParagraphStyle('Body', fontName='Helvetica', fontSize=10, leading=14,
                      textColor=colors.HexColor(TEXT), spaceAfter=6, leftIndent=0, alignment=TA_LEFT)

desc_s = ParagraphStyle('Desc', parent=body, fontSize=9, textColor=colors.HexColor(TEXT_LT),
                        spaceAfter=10, leftIndent=12, rightIndent=12)

code_s = ParagraphStyle('Code', fontName='Courier', fontSize=7.5, leading=9,
                        textColor=colors.HexColor(CODE_TXT), backColor=colors.HexColor(CODE_BG),
                        leftIndent=16, rightIndent=16, spaceBefore=2, spaceAfter=8,
                        borderPadding=8, borderWidth=0.5, borderColor=colors.HexColor(BORDER),
                        borderRadius=4)

cat_s = ParagraphStyle('Cat', fontName='Helvetica-Bold', fontSize=12, leading=15,
                       textColor=colors.HexColor(SECONDARY), spaceAfter=6, spaceBefore=14)

toc_s = ParagraphStyle('TOC', fontName='Helvetica', fontSize=9, leading=12,
                       textColor=colors.HexColor(TEXT), leftIndent=16, spaceAfter=1)

badge_s = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10, leading=12,
                         alignment=TA_CENTER, spaceAfter=2)


def code_block(code):
    return Paragraph(
        f'<font face="Courier" size="7.5" color="{CODE_TXT}">{highlight_js(code).replace(chr(10), "<br/>")}</font>',
        code_s)


# ===== FOOTER =====
PAGE_NUM = [0]


def footer(canvas, doc):
    PAGE_NUM[0] += 1
    canvas.saveState()
    canvas.setFont('Helvetica-Oblique', 7)
    canvas.setFillColor(colors.HexColor(TEXT_LT))
    canvas.drawCentredString(PAGE_W / 2, 14, 'DevFlow Suite • JavaScript Snippets Vault v1.0')
    canvas.setFont('Helvetica', 7)
    canvas.drawCentredString(PAGE_W / 2, 7, str(PAGE_NUM[0]))
    canvas.restoreState()


def cover_bg(canvas, doc):
    """Draw cover page background."""
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#f8fafc'))
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Light accent top band
    canvas.setFillColor(colors.HexColor('#dbeafe'))
    canvas.rect(0, PAGE_H - 15, PAGE_W, 15, fill=1, stroke=0)
    canvas.restoreState()
    PAGE_NUM[0] += 1


# ===== BUILD PDF =====
def build():
    doc = SimpleDocTemplate(
        OUT, pagesize=A4,
        leftMargin=22*mm, rightMargin=22*mm,
        topMargin=25*mm, bottomMargin=22*mm,
    )

    story = []

    # ── Cover Page ──
    story.append(Spacer(1, 12))
    story.append(Paragraph('JavaScript', h1_large))
    story.append(Paragraph('Snippets', h1_large))
    story.append(Paragraph('Vault', ParagraphStyle('H1B', parent=h1_large, textColor=colors.HexColor(SECONDARY))))
    story.append(Spacer(1, 12))
    story.append(Paragraph('150+ Essential Code Snippets for Modern Developers', sub))

    story.append(Paragraph(
        f'<font backColor="{PRIMARY}" color="white" face="Helvetica-Bold" size="12">'
        f'&nbsp;&nbsp;52 Premium Snippets&nbsp;&nbsp;</font>', badge_s))

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        'A curated collection of production-ready JavaScript utilities for frontend engineers, '
        'backend developers, and full-stack builders.',
        ParagraphStyle('BodyC', parent=body, alignment=TA_CENTER, spaceAfter=4)))
    story.append(Paragraph(
        'All snippets are self-contained, dependency-free, and compatible with modern browsers and Node.js 18+.',
        ParagraphStyle('BodyC2', parent=body, alignment=TA_CENTER, spaceAfter=20)))

    story.append(Paragraph('Created by', body))
    story.append(Paragraph('DevFlow Suite', ParagraphStyle('Author', parent=h3, textColor=colors.HexColor(SECONDARY))))
    story.append(Paragraph('v1.0 • August 2025', ParagraphStyle('Ver', parent=body, textColor=colors.HexColor(TEXT_LT))))

    story.append(PageBreak())

    # ── Introduction ──
    story.append(Paragraph('Introduction', h2))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        'Welcome to the JavaScript Snippets Vault — a curated collection of 52 production-ready '
        'JavaScript utilities organized into 7 categories. Each snippet has been carefully written '
        'to be concise, efficient, and battle-tested in real-world applications.',
        body))
    story.append(Spacer(1, 12))
    story.append(Paragraph('What you will learn:', h4))
    story.append(Paragraph('• 8 DOM manipulation utilities for efficient UI interactions', body))
    story.append(Paragraph('• 8 async patterns for robust promise-based code', body))
    story.append(Paragraph('• 14 array and object methods for data transformation', body))
    story.append(Paragraph('• 6 string utilities for text processing', body))
    story.append(Paragraph('• 8 browser API helpers for modern web features', body))
    story.append(Paragraph('• 4 CSS and layout helpers for responsive design', body))
    story.append(Paragraph('• 4 performance and debugging tools', body))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        'All snippets are 100% client-side, require no external dependencies, and can be '
        'copied directly into your project. Happy coding!',
        body))

    # ── Table of Contents ──
    story.append(PageBreak())
    story.append(Paragraph('Table of Contents', h2))
    story.append(Spacer(1, 12))

    # Build categories
    cats = {}
    for i, s in enumerate(SNIPPETS):
        cats.setdefault(s['cat'], []).append((i + 1, s['title']))

    for cat, items in cats.items():
        story.append(Paragraph(cat, cat_s))
        for num, title in items:
            story.append(Paragraph(f'#{num}\u00a0\u00a0{title}', toc_s))

    # ── Snippets ──
    current = None
    for i, s in enumerate(SNIPPETS):
        if s['cat'] != current:
            story.append(PageBreak())
            story.append(Paragraph(s['cat'], h3))
            current = s['cat']

        block = KeepTogether([
            Paragraph(f'#{i+1} {s["title"]}', h4),
            code_block(s['code']),
            Paragraph(s['desc'], desc_s),
        ])
        story.append(block)

    # ── Pro Upgrade Page ──
    story.append(PageBreak())
    story.append(Spacer(1, 12))
    story.append(Paragraph('Unlock DevFlow Suite Pro',
                           ParagraphStyle('ProH', fontName='Helvetica-Bold', fontSize=26,
                                          textColor=colors.HexColor(SECONDARY),
                                          alignment=TA_CENTER, spaceAfter=10)))
    story.append(Paragraph('This is a free sample from the JavaScript Snippets Vault.',
                           ParagraphStyle('ProSub', fontName='Helvetica', fontSize=11,
                                          textColor=colors.HexColor(TEXT_LT), alignment=TA_CENTER, spaceAfter=4)))
    story.append(Paragraph('Upgrade to Pro for the full experience and 98 bonus snippets.',
                           ParagraphStyle('ProSub2', parent=body, alignment=TA_CENTER, spaceAfter=20)))

    story.append(Paragraph('What is in Pro:', h4))
    story.append(Paragraph('\u2022 All 150 snippets (52 in this guide + 98 bonus)', body))
    story.append(Paragraph('\u2022 Cloud sync across all devices', body))
    story.append(Paragraph('\u2022 Export to ZIP with individual .js files', body))
    story.append(Paragraph('\u2022 Team sharing & collaboration', body))
    story.append(Paragraph('\u2022 Custom themes & color palettes', body))
    story.append(Paragraph('\u2022 Priority email support', body))
    story.append(Spacer(1, 12))
    story.append(Paragraph('devflowsuite.com',
                           ParagraphStyle('ProLink', fontName='Helvetica', fontSize=12,
                                          textColor=colors.HexColor(PRIMARY), alignment=TA_CENTER)))
    story.append(Paragraph('$5/month \u2022 Cancel anytime',
                           ParagraphStyle('ProPrice', fontName='Helvetica', fontSize=9,
                                          textColor=colors.HexColor(TEXT_LT), alignment=TA_CENTER)))

    doc.build(story,
              onFirstPage=cover_bg,
              onLaterPages=footer)

    fsize = os.path.getsize(OUT) / 1024
    print(f'✅ PDF generated: {OUT} ({fsize:.0f} KB)')


if __name__ == '__main__':
    build()
