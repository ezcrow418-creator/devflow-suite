/* ========================================
   DevFlow Suite — Main App Logic
   Navigation, Theme, PWA, Event Handlers
   ======================================== */

// ─── Theme Manager ─────────────────────
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && systemDark);
    this.apply(isDark);
    this.bindButtons();
  },

  apply(isDark) {
    const html = document.documentElement;
    const icon = document.querySelectorAll('#theme-toggle-landing i, #theme-toggle-dashboard i, #theme-toggle-tool i, #theme-toggle-regex i, #theme-toggle-json i, #theme-toggle-color i, #theme-toggle-markdown i, #theme-toggle-checkout i, #theme-toggle-download i');
    
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      icon.forEach(i => { i.className = 'fas fa-sun'; });
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      icon.forEach(i => { i.className = 'fas fa-moon'; });
    }
  },

  toggle() {
    const isDark = document.documentElement.classList.contains('dark');
    this.apply(!isDark);
  },

  bindButtons() {
    const buttons = [
      'theme-toggle-landing', 'theme-toggle-dashboard', 'theme-toggle-tool',
      'theme-toggle-regex', 'theme-toggle-json', 'theme-toggle-color',
      'theme-toggle-markdown'
    ];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.toggle());
    });
  }
};

// ─── Router ────────────────────────────
const Router = {
  views: ['landing', 'dashboard', 'snippets', 'regex', 'json', 'color', 'markdown', 'checkout', 'download'],

  navigate(view, skipHistory = false) {
    this.views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(`view-${view}`);
    if (target) target.classList.remove('hidden');

    const body = document.body;
    if (view === 'landing') {
      body.classList.remove('app-mode');
    } else {
      body.classList.add('app-mode');
    }

    // Move focus to the view heading for screen readers
    if (view !== 'landing') {
      const h1 = target?.querySelector('h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus();
      }
    }

    // Trigger tool init when entering a tool view
    if (view === 'snippets') SnippetManager.init();
    if (view === 'regex') RegexTester.init();
    if (view === 'json') JsonFormatter.init();
    if (view === 'color') ColorGenerator.init();
    if (view === 'markdown') {
      MarkdownEditor.init();
      if (typeof marked !== 'undefined') {
        marked.setOptions({ gfm: true, breaks: true });
      }
    }
    if (view === 'checkout' && typeof CheckoutManager !== 'undefined') CheckoutManager.init();
    if (view === 'download' && typeof DownloadManager !== 'undefined') DownloadManager.init();

    if (!skipHistory) {
      const url = view === 'landing' ? '/' : `/${view}`;
      window.history.pushState({ view }, '', url);
    }
  },

  init() {
    // Navigation buttons
    const openButtons = document.querySelectorAll('#btn-open-app, #btn-hero-open');
    openButtons.forEach(btn => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate('dashboard');
      });
    });

    // Back buttons
    document.getElementById('btn-back-landing')?.addEventListener('click', () => this.navigate('landing'));
    document.getElementById('btn-back-landing-mobile')?.addEventListener('click', () => this.navigate('landing'));
    document.getElementById('btn-back-dashboard-1')?.addEventListener('click', () => this.navigate('dashboard'));
    document.getElementById('btn-back-dashboard-2')?.addEventListener('click', () => this.navigate('dashboard'));
    document.getElementById('btn-back-dashboard-3')?.addEventListener('click', () => this.navigate('dashboard'));
    document.getElementById('btn-back-dashboard-4')?.addEventListener('click', () => this.navigate('dashboard'));
    document.getElementById('btn-back-dashboard-5')?.addEventListener('click', () => this.navigate('dashboard'));

    // Back from checkout/download
    document.getElementById('btn-back-checkout')?.addEventListener('click', () => this.navigate('dashboard'));
    document.getElementById('btn-back-dashboard-download')?.addEventListener('click', () => this.navigate('dashboard'));

    // Buy Pro / Snippets Vault buttons
    document.getElementById('btn-buy-pro')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigate('checkout');
    });
    document.getElementById('btn-buy-pro-mobile')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigate('checkout');
    });
    document.getElementById('btn-buy-vault')?.addEventListener('click', () => this.navigate('checkout'));

    // Tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', () => {
        const tool = card.dataset.tool || card.dataset.gumroad;
        if (tool === 'snippets') this.navigate('snippets');
        else if (tool === 'regex') this.navigate('regex');
        else if (tool === 'json') this.navigate('json');
        else if (tool === 'color') this.navigate('color');
        else if (tool === 'markdown') this.navigate('markdown');
        else if (tool === 'true') this.navigate('checkout');
      });
    });

    // Landing page anchor links
    const navLinks = [
      { id: 'nav-features', target: 'section-features' },
      { id: 'nav-pricing', target: 'section-pricing' },
      { id: 'nav-faq', target: 'section-faq' },
    ];
    navLinks.forEach(({ id, target }) => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.getElementById(target);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Gumroad link → checkout
    document.getElementById('btn-gumroad')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigate('checkout');
    });

    // Pro status check (uses obfuscated keys from checkout.js)
    const isPro = (typeof _sec !== 'undefined' && _sec.get('pro') === '1') || localStorage.getItem('devflow_pro') === 'true';
    const buyBtn = document.getElementById('btn-buy-pro');
    if (buyBtn) {
      buyBtn.innerHTML = isPro
        ? '<i class="fas fa-crown mr-1"></i> Pro'
        : '<i class="fas fa-bolt mr-1"></i> Snippets Vault';
    }

    // Browser back/forward
    window.addEventListener('popstate', (e) => {
      const view = e.state?.view || 'landing';
      this.navigate(view, true);
    });
  }
};

// ─── PWA ─────────────────────────────────
const PWA = {
  deferredPrompt: null,

  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showBanner();
    });

    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.querySelector('.install-dismiss')?.addEventListener('click', () => {
        banner.classList.remove('show');
      });
    }
  },

  showBanner() {
    const banner = document.getElementById('installBanner');
    if (!banner) return;
    banner.classList.add('show');
    const installBtn = banner.querySelector('.install-btn');
    installBtn?.addEventListener('click', async () => {
      banner.classList.remove('show');
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
      }
    });
  }
};

// ─── Notifications ───────────────────────
function showNotification(message, type = 'success', duration = 3000) {
  const container = document.getElementById('notificationContainer') || (() => {
    const c = document.createElement('div');
    c.id = 'notificationContainer';
    c.className = 'fixed bottom-4 right-4 z-50 space-y-2';
    document.body.appendChild(c);
    return c;
  })();

  const config = {
    success: { bg: 'bg-green-500', icon: 'fa-check-circle', border: 'border-green-400' },
    error:   { bg: 'bg-red-500',   icon: 'fa-exclamation-circle', border: 'border-red-400' },
    warning: { bg: 'bg-amber-500',  icon: 'fa-exclamation-triangle', border: 'border-amber-400' },
    info:    { bg: 'bg-blue-500',   icon: 'fa-info-circle', border: 'border-blue-400' },
  };
  const cfg = config[type] || config.success;

  const el = document.createElement('div');
  el.className = `${cfg.bg} text-white pl-4 pr-2 py-3 rounded-lg shadow-lg border-l-4 ${cfg.border} flex items-center gap-3 transform translate-x-full opacity-0 transition-all duration-300 max-w-sm`;
  el.innerHTML = `
    <i class="fas ${cfg.icon} text-lg flex-shrink-0"></i>
    <span class="flex-1 text-sm font-medium">${message}</span>
    <button class="ml-2 p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0" aria-label="Close">
      <i class="fas fa-times text-sm"></i>
    </button>
  `;
  container.appendChild(el);

  // Slide in
  requestAnimationFrame(() => {
    el.classList.remove('translate-x-full', 'opacity-0');
    el.classList.add('translate-x-0', 'opacity-100');
  });

  // Close button
  const closeBtn = el.querySelector('button');
  const dismiss = () => {
    el.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => el.remove(), 300);
  };
  closeBtn.addEventListener('click', dismiss);

  // Auto-dismiss (pause on hover)
  let timeout = setTimeout(dismiss, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timeout));
  el.addEventListener('mouseleave', () => {
    timeout = setTimeout(dismiss, 1500);
  });

  // Screen reader announcement
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = message;
    setTimeout(() => { announcer.textContent = ''; }, 3000);
  }
}

// ─── Copy to Clipboard ───────────────────
async function copyToClipboard(text, sourceElement = null) {
  try {
    await navigator.clipboard.writeText(text);
    if (sourceElement) {
      const original = sourceElement.innerHTML;
      sourceElement.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
      sourceElement.classList.add('bg-green-500');
      setTimeout(() => {
        sourceElement.innerHTML = original;
        sourceElement.classList.remove('bg-green-500');
      }, 1500);
    } else {
      showNotification('Copied to clipboard!');
    }
  } catch (err) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Copied to clipboard!');
  }
}

// ─── Analytics ───────────────────────────
const Analytics = {
  init() {
    this.log('page_view', this.currentView());
    // Free analytics via CountAPI (no auth required, no cookies)
    fetch('https://api.countapi.xyz/hit/devflow-suite/tunnel')
      .catch(() => {});
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[id], a[id]');
      if (btn) {
        this.log('click', btn.id);
        fetch(`https://api.countapi.xyz/hit/devflow-suite/${btn.id}`)
          .catch(() => {});
      }
    });
  },
  currentView() {
    const v = document.querySelector('[id^="view-"]:not(.hidden)');
    return v ? v.id : 'landing';
  },
  log(action, label = '') {
    console.log('[Analytics]', action, label);
  },
};

// ─── Keyboard Shortcuts ────────────────
const Shortcuts = {
  _paletteOpen: false,

  init() {
    document.addEventListener('keydown', (e) => this._handle(e));
    this._buildPalette();
  },

  // Get the current active view name
  _currentView() {
    const el = document.querySelector('[id^="view-"]:not(.hidden)');
    return el ? el.id.replace('view-', '') : 'landing';
  },

  // Is the user typing in an input/textarea?
  _inInput() {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
  },

  _handle(e) {
    const mod = e.ctrlKey || e.metaKey;
    const view = this._currentView();

    // ── Escape: close palette, close modals, go back ──
    if (e.key === 'Escape') {
      if (this._paletteOpen) {
        this._hidePalette();
        return;
      }
      // Close snippet modal if open
      const modal = document.getElementById('snippet-form-modal');
      if (modal && !modal.classList.contains('hidden')) {
        SnippetManager.closeForm();
        return;
      }
      // Go back to dashboard
      if (view !== 'landing' && view !== 'dashboard') {
        Router.navigate('dashboard');
        return;
      }
    }

    // ── Ctrl/Cmd + K: Command palette ──
    if (mod && e.key === 'k') {
      e.preventDefault();
      this._paletteOpen ? this._hidePalette() : this._showPalette();
      return;
    }

    // ── Ctrl/Cmd + D: Toggle dark mode ──
    if (mod && e.key === 'd') {
      e.preventDefault();
      ThemeManager.toggle();
      return;
    }

    // ── Skip remaining shortcuts if typing in an input ──
    if (this._inInput()) return;

    // ── Dashboard: number/letter keys to open tools ──
    if (view === 'dashboard' || view === 'landing') {
      const toolMap = {
        '1': 'snippets', 's': 'snippets',
        '2': 'regex',    'r': 'regex',
        '3': 'json',     'j': 'json',
        '4': 'color',    'c': 'color',
        '5': 'markdown', 'm': 'markdown',
      };
      if (toolMap[e.key]) {
        e.preventDefault();
        Router.navigate(toolMap[e.key]);
        return;
      }
      // O = Open app (from landing)
      if (e.key === 'o' && view === 'landing') {
        e.preventDefault();
        Router.navigate('dashboard');
        return;
      }
    }

    // ── Tool views: Ctrl shortcuts ──
    if (mod && view === 'snippets') {
      if (e.key === 'n') {
        e.preventDefault();
        SnippetManager.openForm('add');
      } else if (e.key === 'f') {
        e.preventDefault();
        document.getElementById('snippet-search')?.focus();
      }
    }
  },

  // ── Command Palette ──────────────────────
  _buildPalette() {
    const overlay = document.createElement('div');
    overlay.id = 'shortcutPalette';
    overlay.className = 'fixed inset-0 bg-black/50 z-[999] hidden items-start justify-center pt-[15vh]';
    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700">
          <i class="fas fa-search text-gray-400"></i>
          <input type="text" id="palette-input" placeholder="Type a command or tool name..." class="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400">
          <kbd class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-500">ESC</kbd>
        </div>
        <div id="palette-results" class="max-h-64 overflow-y-auto p-2">
          <div class="text-xs text-gray-400 dark:text-gray-500 px-3 py-1 uppercase tracking-wider">Tools</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._hidePalette();
    });

    // Input filtering
    const input = document.getElementById('palette-input');
    input?.addEventListener('input', () => this._filterPalette(input.value));

    // Enter to select first result
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#palette-results .palette-item');
        if (first) first.click();
      }
    });
  },

  _paletteItems: [
    { label: 'Snippet Vault', icon: 'fa-folder-open', color: 'text-blue-500', action: () => Router.navigate('snippets'), keys: ['1', 'S'] },
    { label: 'Regex Forge', icon: 'fa-magic', color: 'text-green-500', action: () => Router.navigate('regex'), keys: ['2', 'R'] },
    { label: 'JSON Wizard', icon: 'fa-cubes', color: 'text-orange-500', action: () => Router.navigate('json'), keys: ['3', 'J'] },
    { label: 'ColorCraft', icon: 'fa-palette', color: 'text-violet-500', action: () => Router.navigate('color'), keys: ['4', 'C'] },
    { label: 'Markdown Editor', icon: 'fa-edit', color: 'text-pink-500', action: () => Router.navigate('markdown'), keys: ['5', 'M'] },
    { label: 'Dashboard', icon: 'fa-th-large', color: 'text-gray-500', action: () => Router.navigate('dashboard'), keys: ['ESC'] },
    { label: 'Toggle Dark Mode', icon: 'fa-moon', color: 'text-indigo-500', action: () => ThemeManager.toggle(), keys: ['Ctrl', 'D'] },
  ],

  _showPalette() {
    const overlay = document.getElementById('shortcutPalette');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    this._paletteOpen = true;
    this._filterPalette('');
    setTimeout(() => document.getElementById('palette-input')?.focus(), 50);
  },

  _hidePalette() {
    const overlay = document.getElementById('shortcutPalette');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    this._paletteOpen = false;
    const input = document.getElementById('palette-input');
    if (input) input.value = '';
  },

  _filterPalette(query) {
    const container = document.getElementById('palette-results');
    if (!container) return;
    query = query.toLowerCase().trim();

    const items = this._paletteItems.filter(item =>
      item.label.toLowerCase().includes(query)
    );

    container.innerHTML = items.length
      ? `<div class="text-xs text-gray-400 dark:text-gray-500 px-3 py-1 uppercase tracking-wider">Tools</div>`
      + items.map(item => `
        <button class="palette-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
          <i class="fas ${item.icon} ${item.color} w-5 text-center"></i>
          <span class="flex-1 text-sm text-gray-900 dark:text-white">${item.label}</span>
          <span class="flex gap-1">
            ${item.keys.map(k => `<kbd class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono">${k}</kbd>`).join('')}
          </span>
        </button>
      `).join('')
      : `<p class="text-sm text-gray-400 dark:text-gray-500 px-3 py-4 text-center">No results found</p>`;

    // Bind click handlers
    container.querySelectorAll('.palette-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        items[i].action();
        this._hidePalette();
      });
    });
  }
};

// ─── Initialize App ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Router.init();
  PWA.init();
  Analytics.init();
  Shortcuts.init();

  // Check for deep link
  const hash = window.location.hash.replace('#', '');
  if (hash && ['landing', 'dashboard', 'snippets', 'regex', 'json', 'color', 'markdown', 'checkout', 'download'].includes(hash)) {
    setTimeout(() => Router.navigate(hash, true), 100);
  }
});
