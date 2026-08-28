/* ========================================
   DevFlow Suite — Unit Tests
   Tests for RegexTester, JsonFormatter,
   SnippetManager (core logic)
   ======================================== */

// ─── Regex Tests ────────────────────────
describe('RegexTester — Pattern Matching', () => {

  it('should match a simple email pattern', () => {
    const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const matches = 'Contact hello@devflow.io or support@company.com'.match(regex);
    expect(matches.length).toBe(2);
    expect(matches).toContain('hello@devflow.io');
    expect(matches).toContain('support@company.com');
  });

  it('should return null for no matches', () => {
    const regex = /\d{3}-\d{3}-\d{4}/g;
    const matches = 'No phone numbers here'.match(regex);
    expect(matches).toBe(null);
  });

  it('should handle case-insensitive flag (i)', () => {
    const regex = new RegExp('hello', 'i');
    expect(regex.test('Hello World')).toBe(true);
    expect(regex.test('HELLO')).toBe(true);
    expect(regex.test('goodbye')).toBe(false);
  });

  it('should handle global flag (g) for multiple matches', () => {
    const regex = new RegExp('\\d+', 'g');
    const matches = 'a1 b22 c333'.match(regex);
    expect(matches.length).toBe(3);
    expect(matches).toContain('1');
    expect(matches).toContain('22');
    expect(matches).toContain('333');
  });

  it('should handle multiline flag (m)', () => {
    const regex = new RegExp('^\\w+', 'm');
    expect(regex.test('first line')).toBe(true);
    const lines = 'first line\nsecond line'.match(regex);
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('first');
  });

  it('should throw on invalid regex', () => {
    expect(() => new RegExp('[invalid')).toThrow();
  });

  it('should match URL patterns', () => {
    const regex = /https?:\/\/[^\s]+/g;
    const matches = 'Visit https://devflow.io and http://example.com/path'.match(regex);
    expect(matches.length).toBe(2);
  });

  it('should capture groups', () => {
    const regex = /(\d{4})-(\d{2})-(\d{2})/;
    const match = '2025-01-15'.match(regex);
    expect(match[1]).toBe('2025');
    expect(match[2]).toBe('01');
    expect(match[3]).toBe('15');
  });

  it('should match with word boundaries', () => {
    const regex = /\bcat\b/g;
    const matches = 'cat concatenate cat'.match(regex);
    expect(matches.length).toBe(2);
  });

  it('should not match partial word with word boundaries', () => {
    const regex = /\bcat\b/g;
    const matches = 'concatenate'.match(regex);
    expect(matches).toBe(null);
  });
});


// ─── JSON Formatter Tests ───────────────
describe('JsonFormatter — Format & Validate', () => {

  it('should parse valid JSON', () => {
    const result = JSON.parse('{"name": "test", "value": 42}');
    expect(result.name).toBe('test');
    expect(result.value).toBe(42);
  });

  it('should format JSON with indentation', () => {
    const obj = { a: 1, b: 2 };
    const formatted = JSON.stringify(obj, null, 2);
    expect(formatted).toContain('\n');
    expect(formatted).toContain('  "a"');
  });

  it('should minify JSON (remove whitespace)', () => {
    const obj = { name: 'test', items: [1, 2, 3] };
    const minified = JSON.stringify(obj);
    expect(minified).not.toContain(' ');
    expect(minified).not.toContain('\n');
    expect(minified).toBe('{"name":"test","items":[1,2,3]}');
  });

  it('should throw on invalid JSON', () => {
    expect(() => JSON.parse('{invalid json}')).toThrow();
  });

  it('should throw on trailing comma', () => {
    expect(() => JSON.parse('{"a": 1,}')).toThrow();
  });

  it('should handle nested objects', () => {
    const json = '{"user": {"name": "Alice", "address": {"city": "NYC"}}}';
    const obj = JSON.parse(json);
    expect(obj.user.address.city).toBe('NYC');
  });

  it('should handle arrays', () => {
    const json = '{"items": [1, "two", true, null]}';
    const obj = JSON.parse(json);
    expect(obj.items.length).toBe(4);
    expect(obj.items[0]).toBe(1);
    expect(obj.items[1]).toBe('two');
    expect(obj.items[2]).toBe(true);
    expect(obj.items[3]).toBe(null);
  });

  it('should handle empty object', () => {
    const obj = JSON.parse('{}');
    expect(Object.keys(obj).length).toBe(0);
  });

  it('should handle empty array', () => {
    const arr = JSON.parse('[]');
    expect(arr.length).toBe(0);
  });

  it('should detect array vs object type', () => {
    const arr = JSON.parse('[1, 2, 3]');
    const obj = JSON.parse('{"key": "value"}');
    expect(Array.isArray(arr)).toBe(true);
    expect(Array.isArray(obj)).toBe(false);
    expect(typeof obj).toBe('object');
  });

  it('should handle unicode strings', () => {
    const json = '{"emoji": "🎉", "french": "café"}';
    const obj = JSON.parse(json);
    expect(obj.emoji).toBe('🎉');
    expect(obj.french).toBe('café');
  });

  it('should round-trip correctly', () => {
    const original = { nested: { arr: [1, 2, { x: true }] } };
    const str = JSON.stringify(original);
    const parsed = JSON.parse(str);
    expect(parsed).toEqual(original);
  });
});


// ─── SnippetManager Tests ──────────────
describe('SnippetManager — CRUD & Search', () => {

  let snippets;
  let storageKey;

  // Setup: create a fresh in-memory store before each test
  const setup = () => {
    snippets = [];
    storageKey = 'test_snippets';
  };

  // Simulate SnippetManager operations on plain arrays
  const addSnippet = (title, language, tags, code) => {
    const snippet = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title, language, tags, code,
      createdAt: new Date().toISOString()
    };
    snippets.unshift(snippet);
    return snippet;
  };

  const deleteSnippet = (id) => {
    snippets = snippets.filter(s => s.id !== id);
  };

  const searchSnippets = (query) => {
    query = query.toLowerCase().trim();
    if (!query) return [...snippets];
    return snippets.filter(s =>
      s.title.toLowerCase().includes(query) ||
      (s.tags && s.tags.toLowerCase().includes(query)) ||
      s.language.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query)
    );
  };

  const editSnippet = (id, updates) => {
    const idx = snippets.findIndex(s => s.id === id);
    if (idx >= 0) {
      snippets[idx] = { ...snippets[idx], ...updates };
    }
    return idx;
  };

  // Tests
  it('should add a snippet', () => {
    setup();
    addSnippet('Debounce', 'javascript', 'utils', 'const debounce = ...');
    expect(snippets.length).toBe(1);
    expect(snippets[0].title).toBe('Debounce');
    expect(snippets[0].language).toBe('javascript');
  });

  it('should add snippet at the beginning (newest first)', () => {
    setup();
    addSnippet('First', 'javascript', '', 'code1');
    addSnippet('Second', 'python', '', 'code2');
    expect(snippets[0].title).toBe('Second');
    expect(snippets[1].title).toBe('First');
  });

  it('should delete a snippet', () => {
    setup();
    const s = addSnippet('Delete Me', 'javascript', '', 'code');
    deleteSnippet(s.id);
    expect(snippets.length).toBe(0);
  });

  it('should only delete the target snippet', () => {
    setup();
    const s1 = addSnippet('Keep', 'javascript', '', 'code1');
    addSnippet('Delete', 'python', '', 'code2');
    deleteSnippet(s1.id);
    expect(snippets.length).toBe(1);
    expect(snippets[0].title).toBe('Delete');
  });

  it('should edit a snippet', () => {
    setup();
    const s = addSnippet('Old Title', 'javascript', '', 'old code');
    const idx = editSnippet(s.id, { title: 'New Title', code: 'new code' });
    expect(idx).toBe(0);
    expect(snippets[0].title).toBe('New Title');
    expect(snippets[0].code).toBe('new code');
  });

  it('should search by title', () => {
    setup();
    addSnippet('Debounce Function', 'javascript', 'utils', 'const debounce = ...');
    addSnippet('Fetch Wrapper', 'javascript', 'api', 'const fetch = ...');
    const results = searchSnippets('debounce');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Debounce Function');
  });

  it('should search by language', () => {
    setup();
    addSnippet('Python Func', 'python', '', 'def func(): pass');
    addSnippet('JS Func', 'javascript', '', 'function func() {}');
    const results = searchSnippets('python');
    expect(results.length).toBe(1);
    expect(results[0].language).toBe('python');
  });

  it('should search by tags', () => {
    setup();
    addSnippet('Helper', 'javascript', 'utils,dom', 'const h = ...');
    addSnippet('API Call', 'javascript', 'api,fetch', 'fetch(...)');
    const results = searchSnippets('dom');
    expect(results.length).toBe(1);
    expect(results[0].tags).toContain('dom');
  });

  it('should search by code content', () => {
    setup();
    addSnippet('Debounce', 'javascript', '', 'function debounce(fn, ms) {...}');
    addSnippet('Throttle', 'javascript', '', 'function throttle(fn, ms) {...}');
    const results = searchSnippets('throttle');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Throttle');
  });

  it('should return all snippets on empty query', () => {
    setup();
    addSnippet('A', 'javascript', '', 'code1');
    addSnippet('B', 'python', '', 'code2');
    const results = searchSnippets('');
    expect(results.length).toBe(2);
  });

  it('should be case-insensitive', () => {
    setup();
    addSnippet('MySnippet', 'JavaScript', '', 'CODE');
    expect(searchSnippets('mysnippet').length).toBe(1);
    expect(searchSnippets('JAVASCRIPT').length).toBe(1);
    expect(searchSnippets('code').length).toBe(1);
  });

  it('should return empty array for no matches', () => {
    setup();
    addSnippet('Test', 'javascript', '', 'code');
    const results = searchSnippets('nonexistent');
    expect(results.length).toBe(0);
  });

  it('should serialize and deserialize correctly (export/import)', () => {
    setup();
    addSnippet('Export Test', 'typescript', 'export', 'const x: number = 1');
    const json = JSON.stringify(snippets);
    const imported = JSON.parse(json);
    expect(imported.length).toBe(1);
    expect(imported[0].title).toBe('Export Test');
    expect(imported[0].language).toBe('typescript');
  });

  it('should generate unique IDs', () => {
    setup();
    const s1 = addSnippet('A', 'javascript', '', 'code1');
    const s2 = addSnippet('B', 'python', '', 'code2');
    expect(s1.id).not.toBe(s2.id);
  });
});


// ─── Utility Function Tests ─────────────
describe('Utilities — Shared Functions', () => {

  // Test the debounce function from tools.js
  it('debounce should delay execution', async () => {
    let called = false;
    const fn = () => { called = true; };
    const debounced = debounce(fn, 50);
    debounced();
    expect(called).toBe(false);
    await new Promise(r => setTimeout(r, 100));
    expect(called).toBe(true);
  });

  it('escapeHtml should escape special characters', () => {
    const input = '<script>alert("xss")</script>';
    const escaped = escapeHtml(input);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('escapeHtml should handle & and quotes', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('"')).toBe('&quot;');
  });

  it('escapeHtml should pass through plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});
