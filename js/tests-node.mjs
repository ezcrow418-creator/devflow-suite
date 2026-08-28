/* ========================================
   DevFlow Suite — Node.js Unit Tests
   Run: npm test
   Uses Node.js built-in test runner (node:test)
   Zero dependencies.
   ======================================== */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// ─── Reimplement pure logic from tools.js ──
// (escapeHtml uses DOM, so we reimplement it for Node)

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// SnippetManager logic (pure, no DOM)
function createSnippetStore() {
  let snippets = [];

  return {
    get all() { return snippets; },

    add(title, language, tags, code) {
      const snippet = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        title, language, tags, code,
        createdAt: new Date().toISOString()
      };
      snippets.unshift(snippet);
      return snippet;
    },

    remove(id) {
      snippets = snippets.filter(s => s.id !== id);
    },

    edit(id, updates) {
      const idx = snippets.findIndex(s => s.id === id);
      if (idx >= 0) snippets[idx] = { ...snippets[idx], ...updates };
      return idx;
    },

    search(query) {
      query = query.toLowerCase().trim();
      if (!query) return [...snippets];
      return snippets.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.tags && s.tags.toLowerCase().includes(query)) ||
        s.language.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
      );
    },

    export() { return JSON.stringify(snippets); },
    import(json) { snippets = JSON.parse(json); },
    reset() { snippets = []; },
  };
}


// ═══════════════════════════════════════════
//  TESTS
// ═══════════════════════════════════════════

// ─── Regex Tests ────────────────────────
describe('RegexTester — Pattern Matching', () => {

  it('should match a simple email pattern', () => {
    const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const matches = 'Contact hello@devflow.io or support@company.com'.match(regex);
    assert.equal(matches.length, 2);
    assert.ok(matches.includes('hello@devflow.io'));
    assert.ok(matches.includes('support@company.com'));
  });

  it('should return null for no matches', () => {
    const regex = /\d{3}-\d{3}-\d{4}/g;
    const matches = 'No phone numbers here'.match(regex);
    assert.equal(matches, null);
  });

  it('should handle case-insensitive flag (i)', () => {
    const regex = new RegExp('hello', 'i');
    assert.equal(regex.test('Hello World'), true);
    assert.equal(regex.test('HELLO'), true);
    assert.equal(regex.test('goodbye'), false);
  });

  it('should handle global flag (g) for multiple matches', () => {
    const regex = new RegExp('\\d+', 'g');
    const matches = 'a1 b22 c333'.match(regex);
    assert.equal(matches.length, 3);
    assert.ok(matches.includes('1'));
    assert.ok(matches.includes('22'));
    assert.ok(matches.includes('333'));
  });

  it('should handle multiline flag (m)', () => {
    const regex = new RegExp('^\\w+', 'm');
    assert.equal(regex.test('first line'), true);
    const lines = 'first line\nsecond line'.match(regex);
    assert.equal(lines.length, 1);
    assert.equal(lines[0], 'first');
  });

  it('should throw on invalid regex', () => {
    assert.throws(() => new RegExp('[invalid'));
  });

  it('should match URL patterns', () => {
    const regex = /https?:\/\/[^\s]+/g;
    const matches = 'Visit https://devflow.io and http://example.com/path'.match(regex);
    assert.equal(matches.length, 2);
  });

  it('should capture groups', () => {
    const regex = /(\d{4})-(\d{2})-(\d{2})/;
    const match = '2025-01-15'.match(regex);
    assert.equal(match[1], '2025');
    assert.equal(match[2], '01');
    assert.equal(match[3], '15');
  });

  it('should match with word boundaries', () => {
    const regex = /\bcat\b/g;
    assert.equal('cat concatenate cat'.match(regex).length, 2);
  });

  it('should not match partial word with word boundaries', () => {
    const regex = /\bcat\b/g;
    assert.equal('concatenate'.match(regex), null);
  });
});


// ─── JSON Formatter Tests ───────────────
describe('JsonFormatter — Format & Validate', () => {

  it('should parse valid JSON', () => {
    const result = JSON.parse('{"name": "test", "value": 42}');
    assert.equal(result.name, 'test');
    assert.equal(result.value, 42);
  });

  it('should format JSON with indentation', () => {
    const obj = { a: 1, b: 2 };
    const formatted = JSON.stringify(obj, null, 2);
    assert.ok(formatted.includes('\n'));
    assert.ok(formatted.includes('  "a"'));
  });

  it('should minify JSON (remove whitespace)', () => {
    const obj = { name: 'test', items: [1, 2, 3] };
    const minified = JSON.stringify(obj);
    assert.ok(!minified.includes(' '));
    assert.ok(!minified.includes('\n'));
    assert.equal(minified, '{"name":"test","items":[1,2,3]}');
  });

  it('should throw on invalid JSON', () => {
    assert.throws(() => JSON.parse('{invalid json}'));
  });

  it('should throw on trailing comma', () => {
    assert.throws(() => JSON.parse('{"a": 1,}'));
  });

  it('should handle nested objects', () => {
    const json = '{"user": {"name": "Alice", "address": {"city": "NYC"}}}';
    const obj = JSON.parse(json);
    assert.equal(obj.user.address.city, 'NYC');
  });

  it('should handle arrays', () => {
    const json = '{"items": [1, "two", true, null]}';
    const obj = JSON.parse(json);
    assert.equal(obj.items.length, 4);
    assert.equal(obj.items[0], 1);
    assert.equal(obj.items[1], 'two');
    assert.equal(obj.items[2], true);
    assert.equal(obj.items[3], null);
  });

  it('should handle empty object', () => {
    const obj = JSON.parse('{}');
    assert.equal(Object.keys(obj).length, 0);
  });

  it('should handle empty array', () => {
    const arr = JSON.parse('[]');
    assert.equal(arr.length, 0);
  });

  it('should detect array vs object type', () => {
    const arr = JSON.parse('[1, 2, 3]');
    const obj = JSON.parse('{"key": "value"}');
    assert.equal(Array.isArray(arr), true);
    assert.equal(Array.isArray(obj), false);
    assert.equal(typeof obj, 'object');
  });

  it('should handle unicode strings', () => {
    const json = '{"emoji": "🎉", "french": "café"}';
    const obj = JSON.parse(json);
    assert.equal(obj.emoji, '🎉');
    assert.equal(obj.french, 'café');
  });

  it('should round-trip correctly', () => {
    const original = { nested: { arr: [1, 2, { x: true }] } };
    const str = JSON.stringify(original);
    const parsed = JSON.parse(str);
    assert.deepEqual(parsed, original);
  });
});


// ─── SnippetManager Tests ──────────────
describe('SnippetManager — CRUD & Search', () => {

  let store;

  before(() => { store = createSnippetStore(); });

  it('should add a snippet', () => {
    store.reset();
    store.add('Debounce', 'javascript', 'utils', 'const debounce = ...');
    assert.equal(store.all.length, 1);
    assert.equal(store.all[0].title, 'Debounce');
    assert.equal(store.all[0].language, 'javascript');
  });

  it('should add snippet at the beginning (newest first)', () => {
    store.reset();
    store.add('First', 'javascript', '', 'code1');
    store.add('Second', 'python', '', 'code2');
    assert.equal(store.all[0].title, 'Second');
    assert.equal(store.all[1].title, 'First');
  });

  it('should delete a snippet', () => {
    store.reset();
    const s = store.add('Delete Me', 'javascript', '', 'code');
    store.remove(s.id);
    assert.equal(store.all.length, 0);
  });

  it('should only delete the target snippet', () => {
    store.reset();
    const s1 = store.add('Keep', 'javascript', '', 'code1');
    store.add('Delete', 'python', '', 'code2');
    store.remove(s1.id);
    assert.equal(store.all.length, 1);
    assert.equal(store.all[0].title, 'Delete');
  });

  it('should edit a snippet', () => {
    store.reset();
    const s = store.add('Old Title', 'javascript', '', 'old code');
    const idx = store.edit(s.id, { title: 'New Title', code: 'new code' });
    assert.equal(idx, 0);
    assert.equal(store.all[0].title, 'New Title');
    assert.equal(store.all[0].code, 'new code');
  });

  it('should search by title', () => {
    store.reset();
    store.add('Debounce Function', 'javascript', 'utils', 'const debounce = ...');
    store.add('Fetch Wrapper', 'javascript', 'api', 'const fetch = ...');
    const results = store.search('debounce');
    assert.equal(results.length, 1);
    assert.equal(results[0].title, 'Debounce Function');
  });

  it('should search by language', () => {
    store.reset();
    store.add('Python Func', 'python', '', 'def func(): pass');
    store.add('JS Func', 'javascript', '', 'function func() {}');
    const results = store.search('python');
    assert.equal(results.length, 1);
    assert.equal(results[0].language, 'python');
  });

  it('should search by tags', () => {
    store.reset();
    store.add('Helper', 'javascript', 'utils,dom', 'const h = ...');
    store.add('API Call', 'javascript', 'api,fetch', 'fetch(...)');
    const results = store.search('dom');
    assert.equal(results.length, 1);
    assert.ok(results[0].tags.includes('dom'));
  });

  it('should search by code content', () => {
    store.reset();
    store.add('Debounce', 'javascript', '', 'function debounce(fn, ms) {...}');
    store.add('Throttle', 'javascript', '', 'function throttle(fn, ms) {...}');
    const results = store.search('throttle');
    assert.equal(results.length, 1);
    assert.equal(results[0].title, 'Throttle');
  });

  it('should return all snippets on empty query', () => {
    store.reset();
    store.add('A', 'javascript', '', 'code1');
    store.add('B', 'python', '', 'code2');
    assert.equal(store.search('').length, 2);
  });

  it('should be case-insensitive', () => {
    store.reset();
    store.add('MySnippet', 'JavaScript', '', 'CODE');
    assert.equal(store.search('mysnippet').length, 1);
    assert.equal(store.search('JAVASCRIPT').length, 1);
    assert.equal(store.search('code').length, 1);
  });

  it('should return empty array for no matches', () => {
    store.reset();
    store.add('Test', 'javascript', '', 'code');
    assert.equal(store.search('nonexistent').length, 0);
  });

  it('should serialize and deserialize correctly', () => {
    store.reset();
    store.add('Export Test', 'typescript', 'export', 'const x: number = 1');
    const json = store.export();
    store.import(json);
    assert.equal(store.all.length, 1);
    assert.equal(store.all[0].title, 'Export Test');
    assert.equal(store.all[0].language, 'typescript');
  });

  it('should generate unique IDs', () => {
    store.reset();
    const s1 = store.add('A', 'javascript', '', 'code1');
    const s2 = store.add('B', 'python', '', 'code2');
    assert.notEqual(s1.id, s2.id);
  });
});


// ─── Utility Function Tests ─────────────
describe('Utilities — Shared Functions', () => {

  it('debounce should delay execution', (_, done) => {
    let called = false;
    const fn = () => { called = true; };
    const debounced = debounce(fn, 50);
    debounced();
    assert.equal(called, false);
    setTimeout(() => {
      assert.equal(called, true);
      done();
    }, 100);
  });

  it('escapeHtml should escape < and >', () => {
    const input = '<script>alert("xss")</script>';
    const escaped = escapeHtml(input);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
  });

  it('escapeHtml should handle & and quotes', () => {
    assert.equal(escapeHtml('&'), '&amp;');
    assert.equal(escapeHtml('"'), '&quot;');
    assert.equal(escapeHtml("'"), '&#039;');
  });

  it('escapeHtml should pass through plain text unchanged', () => {
    assert.equal(escapeHtml('hello world'), 'hello world');
  });
});
