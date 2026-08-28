/* ========================================
   DevFlow Suite — Tools Implementation
   ======================================== */

// ─── Snippet History (Undo/Redo) ────────
const SnippetHistory = {
  _undoStack: [],
  _redoStack: [],
  _maxSize: 50,
  _locked: false, // prevent recording during undo/redo

  // Save current state before an action
  record(snippets) {
    if (this._locked) return;
    this._undoStack.push(JSON.stringify(snippets));
    if (this._undoStack.length > this._maxSize) this._undoStack.shift();
    // Clear redo stack on new action
    this._redoStack = [];
    this._updateButtons();
  },

  // Undo: restore previous state, push current to redo
  undo(currentSnippets) {
    if (this._undoStack.length === 0) return null;
    this._locked = true;
    this._redoStack.push(JSON.stringify(currentSnippets));
    const prev = JSON.parse(this._undoStack.pop());
    this._locked = false;
    this._updateButtons();
    return prev;
  },

  // Redo: restore next state, push current to undo
  redo(currentSnippets) {
    if (this._redoStack.length === 0) return null;
    this._locked = true;
    this._undoStack.push(JSON.stringify(currentSnippets));
    const next = JSON.parse(this._redoStack.pop());
    this._locked = false;
    this._updateButtons();
    return next;
  },

  get canUndo() { return this._undoStack.length > 0; },
  get canRedo() { return this._redoStack.length > 0; },

  _updateButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) {
      undoBtn.disabled = !this.canUndo;
      undoBtn.title = this.canUndo ? `Undo (${this._undoStack.length})` : 'Nothing to undo';
    }
    if (redoBtn) {
      redoBtn.disabled = !this.canRedo;
      redoBtn.title = this.canRedo ? `Redo (${this._redoStack.length})` : 'Nothing to redo';
    }
  },

  clear() {
    this._undoStack = [];
    this._redoStack = [];
    this._updateButtons();
  }
};

// ─── Shared Utilities ───────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Snippet Manager ─────────────────────
const SnippetManager = {
  storageKey: 'devflow_snippets',
  snippets: [],
  filteredSnippets: [],
  currentEditId: null,
  _selectedIds: new Set(),

  init() {
    this.bindEvents();
    this.render(); // render immediately (empty or cached)
    this.load();   // async load from IndexedDB, re-renders when done
  },

  async load() {
    try {
      if (typeof DB !== 'undefined') {
        await DB.ready();
        // Migrate from localStorage on first run
        await DB.migrateFromLocalStorage(this.storageKey, 'snippets');
        this.snippets = await DB.getAll('snippets');
      } else {
        // Fallback: localStorage
        const data = localStorage.getItem(this.storageKey);
        this.snippets = data ? JSON.parse(data) : [];
      }
    } catch (e) {
      console.warn('[SnippetManager] Load failed:', e);
      this.snippets = [];
    }
    this.filteredSnippets = [...this.snippets];
    this.render(); // re-render with loaded data
  },

  async save() {
    try {
      if (typeof DB !== 'undefined' && !DB._useFallback) {
        await DB.putAll('snippets', this.snippets);
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(this.snippets));
      }
    } catch (e) {
      console.warn('[SnippetManager] Save failed:', e);
      // Fallback to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.snippets));
    }
  },

  bindEvents() {
    // Add snippet button
    document.getElementById('btn-add-snippet')?.addEventListener('click', () => {
      this.openForm('add');
    });

    // Cancel button
    document.getElementById('btn-cancel-snippet')?.addEventListener('click', () => {
      this.closeForm();
    });

    // Save button
    document.getElementById('btn-save-snippet')?.addEventListener('click', () => {
      this.saveSnippet();
    });

    // Search
    const searchInput = document.getElementById('snippet-search');
    searchInput?.addEventListener('input', (e) => {
      this.search(e.target.value);
    });

    // Export
    document.getElementById('btn-export-snippets')?.addEventListener('click', () => {
      this.export();
    });

    // Import
    document.getElementById('btn-import-snippets')?.addEventListener('click', () => {
      document.getElementById('snippet-import-file')?.click();
    });

    // Import file change
    const importFile = document.getElementById('snippet-import-file');
    importFile?.addEventListener('change', (e) => {
      this.importFile(e.target.files[0]);
    });
  },

  openForm(mode, snippet = null) {
    const modal = document.getElementById('snippet-form-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (mode === 'edit' && snippet) {
      this.currentEditId = snippet.id;
      document.getElementById('snippet-title').value = snippet.title;
      document.getElementById('snippet-language').value = snippet.language;
      document.getElementById('snippet-tags').value = snippet.tags || '';
      document.getElementById('snippet-code').value = snippet.code;
      modal.querySelector('h2').textContent = 'Edit Snippet';
    } else {
      this.currentEditId = null;
      document.getElementById('snippet-title').value = '';
      document.getElementById('snippet-language').value = 'javascript';
      document.getElementById('snippet-tags').value = '';
      document.getElementById('snippet-code').value = '';
      modal.querySelector('h2').textContent = 'Add New Snippet';
    }
  },

  closeForm() {
    document.getElementById('snippet-form-modal')?.classList.add('hidden');
    document.body.style.overflow = '';
    this.currentEditId = null;
  },

  saveSnippet() {
    const title = document.getElementById('snippet-title').value.trim();
    const language = document.getElementById('snippet-language').value;
    const tags = document.getElementById('snippet-tags').value.trim();
    const code = document.getElementById('snippet-code').value.trim();

    if (!title || !code) {
      showNotification('Please fill in title and code', 'error');
      return;
    }

    // Record history BEFORE the change
    SnippetHistory.record(this.snippets);

    if (this.currentEditId) {
      const idx = this.snippets.findIndex(s => s.id === this.currentEditId);
      if (idx >= 0) {
        this.snippets[idx] = { ...this.snippets[idx], title, language, tags, code };
      }
    } else {
      this.snippets.unshift({
        id: Date.now().toString(),
        title, language, tags, code,
        createdAt: new Date().toISOString()
      });
    }

    this.save();
    this.closeForm();
    this.render();
    showNotification(this.currentEditId ? 'Snippet updated!' : 'Snippet saved!');
  },

  deleteSnippet(id) {
    const idx = this.snippets.findIndex(s => s.id === id);
    if (idx < 0) return;

    const removed = this.snippets[idx];

    // Record history BEFORE the change
    SnippetHistory.record(this.snippets);

    // Remove from list
    this.snippets.splice(idx, 1);
    this.save();
    this.render();
    showNotification(`"${removed.title}" deleted`, 'info', 2000);
  },

  // ── Undo / Redo ──────────────────────
  undo() {
    const prev = SnippetHistory.undo(this.snippets);
    if (!prev) return showNotification('Nothing to undo', 'warning', 1500);
    this.snippets = prev;
    this.filteredSnippets = [...this.snippets];
    this.save();
    this.render();
    showNotification('Undone!', 'success', 1500);
  },

  redo() {
    const next = SnippetHistory.redo(this.snippets);
    if (!next) return showNotification('Nothing to redo', 'warning', 1500);
    this.snippets = next;
    this.filteredSnippets = [...this.snippets];
    this.save();
    this.render();
    showNotification('Redone!', 'success', 1500);
  },

  search(query) {
    query = query.toLowerCase().trim();
    if (!query) {
      this.filteredSnippets = [...this.snippets];
    } else {
      this.filteredSnippets = this.snippets.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.tags && s.tags.toLowerCase().includes(query)) ||
        s.language.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
      );
    }
    this.render();
  },

  export() {
    const data = JSON.stringify(this.snippets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devflow-snippets.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Snippets exported!');
  },

  importFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          this.snippets = [...data, ...this.snippets];
          this.save();
          this.render();
          showNotification(`Imported ${data.length} snippets!`);
        }
      } catch (err) {
        showNotification('Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
  },

  render() {
    const container = document.getElementById('snippets-container');
    if (!container) return;

    if (this.filteredSnippets.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <i class="fas fa-folder-open text-4xl mb-4"></i>
          <p class="text-lg">No snippets found. Click "Add Snippet" to get started!</p>
        </div>
      `;
    } else {
      container.innerHTML = this.filteredSnippets.map((s, i) => `
        <div class="snippet-card group bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 overflow-hidden transition-all duration-200${this._selectedIds.has(s.id) ? ' selected' : ''}" draggable="true" data-id="${s.id}" data-index="${i}">
          <div class="flex items-center p-4 border-b dark:border-gray-700 gap-3">
            <!-- Checkbox -->
            <input type="checkbox" class="snippet-checkbox w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0" data-id="${s.id}"${this._selectedIds.has(s.id) ? ' checked' : ''} aria-label="Select snippet ${escapeHtml(s.title)}">
            <!-- Drag handle -->
            <div class="drag-handle cursor-grab text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0" title="Drag to reorder">
              <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-lg truncate">${escapeHtml(s.title)}</h3>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">${escapeHtml(s.language)}</span>
                ${s.tags ? s.tags.split(',').map(tag => '<span class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300">' + escapeHtml(tag.trim()) + '</span>').join('') : ''}
              </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button onclick="SnippetManager.openForm('edit', ${JSON.stringify(s).replace(/"/g, '&quot;')})" class="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Edit">
                <i class="fas fa-edit text-sm"></i>
              </button>
              <button onclick="SnippetManager.deleteSnippet('${s.id}')" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete">
                <i class="fas fa-trash text-sm"></i>
              </button>
              <button onclick="copyToClipboard(\`${s.code}\`, this)" class="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Copy code">
                <i class="fas fa-copy text-sm"></i>
              </button>
            </div>
          </div>
          <div class="p-4">
            <pre class="language-${s.language} bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 overflow-x-auto"><code class="language-${s.language}">${escapeHtml(s.code)}</code></pre>
          </div>
        </div>
      `).join('');

      // Bind drag-and-drop events
      this._bindDragEvents(container);

      // Bind selection events
      this._bindSelectionEvents(container);

      // Re-highlight syntax
      if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
      }
    }
  },

  // ── Drag & Drop ──────────────────────
  _dragSrcId: null,

  _bindDragEvents(container) {
    const cards = container.querySelectorAll('.snippet-card');

    cards.forEach(card => {
      const handle = card.querySelector('.drag-handle');

      // Only start drag from handle
      handle.addEventListener('mousedown', () => card.setAttribute('draggable', 'true'));
      handle.addEventListener('mouseup', () => card.setAttribute('draggable', 'false'));

      card.addEventListener('dragstart', (e) => {
        this._dragSrcId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        container.querySelectorAll('.snippet-card').forEach(c => {
          c.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });
        this._dragSrcId = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        // Remove all indicators first
        container.querySelectorAll('.snippet-card').forEach(c => {
          c.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        // Show drop indicator
        if (e.clientY < midY) {
          card.classList.add('drag-over-top');
        } else {
          card.classList.add('drag-over-bottom');
        }
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const srcId = e.dataTransfer.getData('text/plain');
        const dstId = card.dataset.id;
        if (!srcId || srcId === dstId) return;

        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertBefore = e.clientY < midY;

        this._reorder(srcId, dstId, insertBefore);
      });
    });
  },

  _reorder(srcId, dstId, insertBefore) {
    const srcIdx = this.snippets.findIndex(s => s.id === srcId);
    const dstIdx = this.snippets.findIndex(s => s.id === dstId);
    if (srcIdx < 0 || dstIdx < 0) return;

    // Record history BEFORE the change
    SnippetHistory.record(this.snippets);

    // Remove source
    const [moved] = this.snippets.splice(srcIdx, 1);

    // Find new destination index (adjusted after removal)
    let newDstIdx = this.snippets.findIndex(s => s.id === dstId);
    if (!insertBefore) newDstIdx++;

    // Insert
    this.snippets.splice(newDstIdx, 0, moved);

    // Save and re-render
    this.save();
    this.render();
  },

  // ── Selection & Bulk Actions ──────────
  toggleSelect(id) {
    if (this._selectedIds.has(id)) {
      this._selectedIds.delete(id);
    } else {
      this._selectedIds.add(id);
    }
    this._updateBulkBar();
    this._highlightSelected();
  },

  selectAll() {
    this.filteredSnippets.forEach(s => this._selectedIds.add(s.id));
    this._updateBulkBar();
    this._highlightSelected();
  },

  deselectAll() {
    this._selectedIds.clear();
    this._updateBulkBar();
    this._highlightSelected();
  },

  toggleSelectAll() {
    if (this._selectedIds.size === this.filteredSnippets.length) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
  },

  _highlightSelected() {
    document.querySelectorAll('.snippet-card').forEach(card => {
      const id = card.dataset.id;
      const isSelected = this._selectedIds.has(id);
      card.classList.toggle('selected', isSelected);
      const cb = card.querySelector('.snippet-checkbox');
      if (cb) cb.checked = isSelected;
    });
    // Update header checkbox
n    const headerCb = document.getElementById('snippet-select-all');
    if (headerCb) {
      const total = this.filteredSnippets.length;
      const selected = this._selectedIds.size;
      headerCb.checked = total > 0 && selected === total;
      headerCb.indeterminate = selected > 0 && selected < total;
    }
  },

  _updateBulkBar() {
    const bar = document.getElementById('bulk-actions');
    const count = document.getElementById('bulk-count');
    if (!bar) return;
    if (this._selectedIds.size > 0) {
      bar.classList.remove('hidden');
      if (count) count.textContent = this._selectedIds.size;
    } else {
      bar.classList.add('hidden');
    }
  },

  bulkDelete() {
    if (this._selectedIds.size === 0) return;
    const count = this._selectedIds.size;
    SnippetHistory.record(this.snippets);
    this.snippets = this.snippets.filter(s => !this._selectedIds.has(s.id));
    this._selectedIds.clear();
    this.save();
    this.render();
    this._updateBulkBar();
    showNotification(`${count} snippet${count > 1 ? 's' : ''} deleted`, 'info', 2000);
  },

  bulkExport() {
    const selected = this.snippets.filter(s => this._selectedIds.has(s.id));
    if (selected.length === 0) return;
    const data = JSON.stringify(selected, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devflow-snippets-${selected.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${selected.length} snippet${selected.length > 1 ? 's' : ''}`);
  },

  bulkChangeLanguage(lang) {
    if (!lang || this._selectedIds.size === 0) return;
    SnippetHistory.record(this.snippets);
    let count = 0;
    this.snippets.forEach(s => {
      if (this._selectedIds.has(s.id)) {
        s.language = lang;
        count++;
      }
    });
    this._selectedIds.clear();
    this.save();
    this.render();
    this._updateBulkBar();
    showNotification(`${count} snippet${count > 1 ? 's' : ''} → ${lang}`, 'success', 2000);
  },

  _bindSelectionEvents(container) {
    container.querySelectorAll('.snippet-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleSelect(cb.dataset.id);
      });
    });
  }
};

// ─── Regex Tester ─────────────────────
const RegexTester = {
  init() {
    const pattern = document.getElementById('regex-pattern');
    const testStr = document.getElementById('regex-test');

    // Debounce for real-time testing
    const handler = debounce(() => this.test(), 300);
    pattern?.addEventListener('input', handler);
    testStr?.addEventListener('input', handler);

    // Flag checkboxes
    document.querySelectorAll('.regex-flag').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.test());
    });

    // Initial test with some example data
    if (!pattern.value && !testStr.value) {
      pattern.value = '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b';
      testStr.value = 'Contact us at hello@devflow.io or support@company.com for help.';
    }
    this.test();
  },

  getFlags() {
    const flags = [];
    ['g', 'i', 'm', 's', 'u', 'y'].forEach(f => {
      const checkbox = document.getElementById(`flag-${f}`);
      if (checkbox && checkbox.checked) flags.push(f);
    });
    return flags.join('');
  },

  test() {
    const pattern = document.getElementById('regex-pattern')?.value || '';
    const testStr = document.getElementById('regex-test')?.value || '';
    const output = document.getElementById('regex-output');
    if (!output) return;

    if (!pattern) {
      output.innerHTML = '<p class="text-gray-500">Enter a regex pattern to test...</p>';
      return;
    }

    try {
      const flags = this.getFlags();
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;

      // Find all matches
      if (flags.includes('g')) {
        let match;
        while ((match = regex.exec(testStr)) !== null) {
          matches.push({ match: match[0], index: match.index, groups: match });
          if (regex.lastIndex === match.index) regex.lastIndex++;
        }
      } else {
        match = regex.exec(testStr);
        if (match) matches.push({ match: match[0], index: match.index, groups: match });
      }

      // Highlight matches in test string
      // Build HTML by escaping segments from the ORIGINAL string
      let highlighted = '';
      if (matches.length > 0) {
        let lastIndex = 0;
        matches.forEach(m => {
          highlighted += escapeHtml(testStr.substring(lastIndex, m.index));
          highlighted += `<span class="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100 font-bold px-1 rounded">${escapeHtml(m.match)}</span>`;
          lastIndex = m.index + m.match.length;
        });
        highlighted += escapeHtml(testStr.substring(lastIndex));
      } else {
        highlighted = escapeHtml(testStr);
      }

      // Build output
      let html = '';
      html += `<div class="mb-3"><pre class="whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">${highlighted || '<span class="text-gray-500">No text to search</span>'}</pre></div>`;
      
      if (matches.length > 0) {
        html += `<div class="space-y-2">`;
        html += `<p class="text-sm text-gray-600 dark:text-gray-300 font-medium">Found <span class="text-green-500">${matches.length}</span> ${matches.length === 1 ? 'match' : 'matches'}:</p>`;
        matches.forEach((m, i) => {
          html += `<div class="text-xs bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border-l-2 border-green-500">
            <span class="text-gray-500">Match ${i + 1}:</span>
            <code class="text-green-600 dark:text-green-400 ml-2">"${escapeHtml(m.match)}"</code>
            <span class="text-gray-400"> at position ${m.index}</span>`;
          if (m.groups && m.groups.length > 1) {
            html += `<div class="mt-1"><span class="text-gray-500">Groups:</span>`;
            for (let j = 1; j < m.groups.length; j++) {
              if (m.groups[j] !== undefined) {
                html += `<code class="text-blue-600 dark:text-blue-400 text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded ml-1">$${j}: "${escapeHtml(m.groups[j])}"</code>`;
              }
            }
            html += `</div>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      } else {
        html += `<p class="text-sm text-gray-500 dark:text-gray-400">No matches found.</p>`;
      }

      output.innerHTML = html;
    } catch (err) {
      output.innerHTML = `<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-red-700 dark:text-red-300 text-sm"><i class="fas fa-exclamation-circle mr-1"></i> Invalid regex: ${escapeHtml(err.message)}</p>
      </div>`;
    }
  }
};

// ─── JSON Formatter ────────────────────
const JsonFormatter = {
  init() {
    // Set default example
    const input = document.getElementById('json-input');
    if (input && !input.value.trim()) {
      input.value = JSON.stringify({
        "name": "DevFlow Suite",
        "version": "1.0.0",
        "features": ["snippets", "regex", "json", "color", "markdown"],
        "license": "MIT"
      }, null, 2);
    }

    document.getElementById('btn-format-json')?.addEventListener('click', () => this.format());
    document.getElementById('btn-minify-json')?.addEventListener('click', () => this.minify());
    document.getElementById('btn-validate-json')?.addEventListener('click', () => this.validate());
    document.getElementById('btn-copy-json')?.addEventListener('click', () => this.copy());

    // Real-time validation
    input?.addEventListener('input', debounce(() => this.validate(), 500));
  },

  format() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    if (!input || !output) return;

    try {
      const obj = JSON.parse(input.value);
      const formatted = JSON.stringify(obj, null, 2);
      output.innerHTML = this.colorizeJson(formatted);
      input.value = formatted;
      showNotification('JSON formatted!');
    } catch (err) {
      showNotification('Invalid JSON: ' + err.message, 'error');
    }
  },

  minify() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    if (!input || !output) return;

    try {
      const obj = JSON.parse(input.value);
      const minified = JSON.stringify(obj);
      output.innerHTML = this.colorizeJson(minified);
      input.value = minified;
      showNotification('JSON minified!');
    } catch (err) {
      showNotification('Invalid JSON: ' + err.message, 'error');
    }
  },

  validate() {
    const input = document.getElementById('json-input');
    const output = document.getElementById('json-output');
    if (!input || !output) return;

    try {
      const obj = JSON.parse(input.value);
      output.innerHTML = `<div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p class="text-green-700 dark:text-green-300"><i class="fas fa-check-circle mr-2"></i> Valid JSON! ✓</p>
        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Type: ${Array.isArray(obj) ? 'Array' : typeof obj}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300">Top-level keys: ${Object.keys(obj).length}</p>
      </div>`;
      this.colorizeJson(JSON.stringify(obj, null, 2));
    } catch (err) {
      output.innerHTML = `<div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-red-700 dark:text-red-300"><i class="fas fa-exclamation-circle mr-2"></i> Invalid JSON: ${escapeHtml(err.message)}</p>
      </div>`;
    }
  },

  colorizeJson(json) {
    const output = document.getElementById('json-output');
    if (!output) return '';
    // Simple colorization with Prism
    output.innerHTML = `<pre class="language-json"><code class="language-json">${escapeHtml(json)}</code></pre>`;
    setTimeout(() => { if (typeof Prism !== 'undefined') Prism.highlightAll(); }, 10);
    return output.innerHTML;
  },

  copy() {
    const output = document.getElementById('json-output');
    if (!output) return;
    const text = output.textContent || output.innerText || '';
    if (text && text !== 'Output will appear here...') {
      copyToClipboard(text);
    }
  }
};

// ─── Color Palette Generator ───────────
const ColorGenerator = {
  imageData: null,

  init() {
    // Image URL input
    document.getElementById('color-image-url')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.loadImageUrl(e.target.value);
      }
    });

    // Upload button
    document.getElementById('btn-color-upload')?.addEventListener('click', () => {
      document.getElementById('color-image-upload')?.click();
    });

    // Image upload
    document.getElementById('color-image-upload')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        this.loadImageUrl(url);
      }
    });

    // Color count slider
    document.getElementById('color-count')?.addEventListener('input', (e) => {
      if (this.imageData) {
        this.extractColors(this.imageData, parseInt(e.target.value));
      }
    });

    // Color picker
    document.getElementById('color-picker')?.addEventListener('input', (e) => {
      document.getElementById('color-hex').value = e.target.value;
    });

    // Hex input
    document.getElementById('color-hex')?.addEventListener('input', (e) => {
      const hex = e.target.value;
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        document.getElementById('color-picker').value = hex;
      }
    });

    // Copy hex
    document.getElementById('btn-copy-hex')?.addEventListener('click', () => {
      const hex = document.getElementById('color-hex').value;
      copyToClipboard(hex);
    });

    // Harmony buttons
    document.querySelectorAll('[data-harmony]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = document.getElementById('color-hex').value;
        this.generateHarmony(hex, btn.dataset.harmony);
      });
    });

    // Load a default image on first init
    const hasDefault = localStorage.getItem('devflow_color_default_set');
    if (!hasDefault) {
      localStorage.setItem('devflow_color_default_set', 'true');
      this.loadImageUrl('https://images.unsplash.com/photo-1507525428034-b7c3b6a9a7ce?ixlib=rb-4.0.3&ixid=M3wxMjM3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80');
    }
  },

  loadImageUrl(url) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height, 500);
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      this.imageData = ctx.getImageData(0, 0, size, size);
      const count = parseInt(document.getElementById('color-count')?.value || '5');
      this.extractColors(this.imageData, count);
    };
    img.src = url;
  },

  extractColors(imageData, count = 5) {
    const data = imageData.data;
    const colors = {};

    // Sample pixels
    for (let i = 0; i < data.length; i += 32) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Quantize to reduce unique colors
      const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
      if (key in colors) {
        colors[key]++;
      } else {
        colors[key] = 1;
      }
    }

    // Sort by frequency
    const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
    
    // Take top N
    const topColors = sorted.slice(0, count).map(([key]) => {
      const [r, g, b] = key.split(',').map(n => parseInt(n));
      return this.rgbToHex(r, g, b);
    });

    this.renderPalette(topColors);
  },

  renderPalette(colors) {
    const container = document.getElementById('palette-colors');
    if (!container) return;

    container.className = 'grid gap-3 h-24';
    container.style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;
    container.innerHTML = colors.map(hex => `
      <div class="rounded-lg flex items-end justify-center p-2 shadow-inner relative group" style="background-color: ${hex};">
        <span class="text-xs font-medium text-black/70 dark:text-white/90 transition-opacity">${hex}</span>
        <button onclick="copyToClipboard('${hex}', this)" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-white/20 dark:bg-gray-800/20 rounded transition-all">
          <i class="fas fa-copy text-xs"></i>
        </button>
      </div>
    `).join('');
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q - (q - p) * (2/3 - t) * 6;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },

  generateHarmony(hex, type) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;
    const { h, s, l } = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    let hues = [h];
    switch (type) {
      case 'complementary': hues = [h, (h + 180) % 360]; break;
      case 'analogous': hues = [h, (h - 30 + 360) % 360, (h + 30) % 360]; break;
      case 'triadic': hues = [h, (h + 120) % 360, (h + 240) % 360]; break;
      case 'tetradic': hues = [h, (h + 60) % 360, (h + 180) % 360, (h + 240) % 360]; break;
    }

    const colors = hues.map(hue => {
      const { r, g, b } = this.hslToRgb(hue, s, l);
      return this.rgbToHex(r, g, b);
    });

    this.renderPalette(colors);
  }
};

// ─── Markdown Editor ───────────────────
const MarkdownEditor = {
  init() {
    const input = document.getElementById('md-input');
    const preview = document.getElementById('md-preview');
    if (!input || !preview) return;

    // Set default content
    if (!input.value.trim()) {
      input.value = '# Welcome to MarkDown Editor\n\nThis is a live preview editor. Start typing below:\n\n## Features\n\n- **Bold** and *italic* text\n- `inline code`\n- Lists\n- [Links](https://devflow.suite)\n\n```javascript\nconst hello = "world";\nconsole.log(hello);\n```';
    }

    // Live preview
    input.addEventListener('input', () => {
      this.updatePreview();
    });

    // Export buttons
    document.getElementById('btn-md-export')?.addEventListener('click', () => this.export());
    document.getElementById('btn-md-copy')?.addEventListener('click', () => this.copy());
    document.getElementById('btn-md-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());

    // Initial render
    this.updatePreview();
  },

  updatePreview() {
    const input = document.getElementById('md-input');
    const preview = document.getElementById('md-preview');
    if (!input || !preview) return;
    
    if (input.value.trim()) {
      if (typeof marked !== 'undefined') {
        preview.innerHTML = marked.parse(input.value);
        setTimeout(() => { if (typeof Prism !== 'undefined') Prism.highlightAll(); }, 10);
      } else {
        preview.innerHTML = '<p class="text-gray-500">Markdown library loading...</p>';
      }
    } else {
      preview.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Your rendered markdown will appear here...</p>';
    }
  },

  export() {
    const input = document.getElementById('md-input');
    const preview = document.getElementById('md-preview');
    if (!input || !preview) return;

    if (typeof marked === 'undefined') {
      showNotification('Markdown library not loaded yet', 'error');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Exported Document</title>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/themes/prism.min.css" rel="stylesheet">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1f2937; }
    pre { background: #1e293b; border-radius: 8px; padding: 16px; overflow-x: auto; }
    code { font-family: 'Fira Code', monospace; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  ${marked.parse(input.value)}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prismjs/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devflow-markdown-export.html';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Markdown exported as HTML!');
  },

  copy() {
    const preview = document.getElementById('md-preview');
    if (!preview) return;
    const html = preview.innerHTML;
    copyToClipboard(html);
  },

  toggleFullscreen() {
    const input = document.getElementById('md-input');
    const preview = document.getElementById('md-preview');
    if (!input) return;

    if (!document.fullscreenElement) {
      const container = input.closest('.grid');
      container?.requestFullscreen();
      const fsIcon = document.getElementById('btn-md-fullscreen')?.querySelector('i');
      if (fsIcon) fsIcon.className = 'fas fa-compress';
    } else {
      document.exitFullscreen();
      const fsIcon = document.getElementById('btn-md-fullscreen')?.querySelector('i');
      if (fsIcon) fsIcon.className = 'fas fa-expand';
    }
  }
};

// ─── Initialize Tools on DOM Ready ─────
document.addEventListener('DOMContentLoaded', () => {
  // Tools are initialized via Router.navigate() when their view becomes active
  // Also set up the snippet import file input (hidden)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'snippet-import-file';
  fileInput.accept = '.json';
  fileInput.className = 'hidden';
  document.body.appendChild(fileInput);
});
