/* ========================================
   DevFlow Suite — Main App Logic
   Navigation, Theme, PWA, Event Handlers
   ======================================== */

// ─── Theme Manager ─────────────────────
const ThemeManager = {
  _modes: ['dark', 'light', 'auto'], // cycle order
  _iconMap: { dark: 'fa-sun', light: 'fa-moon', auto: 'fa-desktop' },
  _labelMap: { dark: 'Switch to light mode', light: 'Switch to dark mode', auto: 'Switch to system mode' },
  _systemMQ: null,
  _transitioning: false,

  init() {
    const saved = localStorage.getItem('theme') || 'auto';
    this._systemMQ = window.matchMedia('(prefers-color-scheme: dark)');
    this._apply(saved);
    this._bindButtons();
    this._bindSystemSync();
  },

  // ── Apply theme with smooth transition ──
  _apply(mode) {
    const html = document.documentElement;
    const isDark = mode === 'dark' || (mode === 'auto' && this._systemMQ.matches);

    // Smooth transition (add class temporarily)
    if (!this._transitioning) {
      this._transitioning = true;
      html.classList.add('theme-transitioning');
      setTimeout(() => {
        html.classList.remove('theme-transitioning');
        this._transitioning = false;
      }, 500);
    }

    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    localStorage.setItem('theme', mode);
    this._updateIcons(mode);
  },

  // ── Update all toggle button icons ──
  _updateIcons(mode) {
    const icon = this._iconMap[mode];
    const label = this._labelMap[mode];
    document.querySelectorAll('[id^="theme-toggle"]').forEach(btn => {
      const i = btn.querySelector('i');
      if (i) i.className = `fas ${icon}`;
      btn.setAttribute('aria-label', label);
      btn.title = label;
    });
  },

  // ── Cycle: dark → light → auto → dark ──
  toggle() {
    const current = localStorage.getItem('theme') || 'auto';
    const idx = this._modes.indexOf(current);
    const next = this._modes[(idx + 1) % this._modes.length];
    this._apply(next);

    // Announce to screen reader
    const labels = { dark: 'Dark mode', light: 'Light mode', auto: 'System mode (auto)' };
    showNotification(`Theme: ${labels[next]}`, 'info', 1500);
  },

  // ── Listen to OS theme changes when in auto mode ──
  _bindSystemSync() {
    this._systemMQ.addEventListener('change', () => {
      const mode = localStorage.getItem('theme') || 'auto';
      if (mode === 'auto') {
        this._apply('auto'); // re-apply to update dark class
      }
    });
  },

  // ── Bind click handlers ──
  _bindButtons() {
    document.querySelectorAll('[id^="theme-toggle"]').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
  },

  // ── Public getters ──
  get currentMode() {
    return localStorage.getItem('theme') || 'auto';
  },

  get isDark() {
    return document.documentElement.classList.contains('dark');
  }
};

// ─── Router ────────────────────────────
const Router = {
  views: ['landing', 'dashboard', 'snippets', 'regex', 'json', 'color', 'markdown', 'checkout', 'download', 'help'],

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
    if (view === 'dashboard' && typeof SnippetStats !== 'undefined') SnippetStats.update();
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
    document.getElementById('btn-back-dashboard-help')?.addEventListener('click', () => this.navigate('dashboard'));

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

    // Pro status check (uses cached value from _sec.loadAll())
    const isPro = (typeof _sec !== 'undefined' && _sec.getSync('pro') === '1') || localStorage.getItem('devflow_pro') === 'true';
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
  _showDelay: 5000, // wait 5s after page load before showing
  _dismissKey: 'devflow_install_dismissed',
  _dismissCooldown: 7 * 24 * 60 * 60 * 1000, // 7 days

  init() {
    // Don't show if already dismissed recently
    const dismissed = localStorage.getItem(this._dismissKey);
    if (dismissed && (Date.now() - parseInt(dismissed)) < this._dismissCooldown) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      // Delay showing the banner
      setTimeout(() => this._showBanner(), this._showDelay);
    });

    // Bind dismiss buttons
    document.querySelectorAll('.install-dismiss').forEach(btn => {
      btn.addEventListener('click', () => this._dismiss());
    });

    // Bind install button
    const installBtn = document.querySelector('.install-btn');
    installBtn?.addEventListener('click', () => this._install());

    // Track if already installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this._dismiss();
      showNotification('DevFlow Suite installed! 🎉', 'success', 3000);
    });
  },

  _showBanner() {
    const banner = document.getElementById('installBanner');
    if (!banner || !this.deferredPrompt) return;
    banner.classList.add('show');
  },

  async _install() {
    const banner = document.getElementById('installBanner');
    if (!this.deferredPrompt) return;

    // Show native install prompt
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;

    if (outcome === 'accepted') {
      banner?.classList.remove('show');
      showNotification('Installing DevFlow Suite...', 'info', 2000);
    }
  },

  _dismiss() {
    const banner = document.getElementById('installBanner');
    banner?.classList.remove('show');
    localStorage.setItem(this._dismissKey, String(Date.now()));
  },

  // ── One-click install from landing page ──
  async installFromHero() {
    if (this.deferredPrompt) {
      await this._install();
    } else {
      // Fallback: show instructions
      showNotification('Use your browser\'s install button (≡ or ⋮ menu) to install.', 'info', 5000);
    }
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

    // ── F11: Toggle zen mode ──
    if (e.key === 'F11') {
      e.preventDefault();
      ZenMode.toggle();
      return;
    }

    // ── ?: Open help page ──
    if (e.key === '?' && !this._inInput()) {
      e.preventDefault();
      Router.navigate('help');
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
      } else if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        SnippetManager.undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        SnippetManager.redo();
      } else if (e.key === 'a') {
        e.preventDefault();
        SnippetManager.toggleSelectAll();
      } else if (e.key === 'Escape') {
        SnippetManager.deselectAll();
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
    { label: 'Help & Shortcuts', icon: 'fa-question-circle', color: 'text-blue-500', action: () => Router.navigate('help'), keys: ['?'] },
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

// ─── Notification Center ──────────────
const NotificationCenter = {
  _notifications: [],
  _panelOpen: false,
  _iconMap: { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' },

  async init() {
    // Load saved notifications
    try {
      if (typeof DB !== 'undefined') {
        await DB.ready();
        this._notifications = (await DB.setting('notifications')) || [];
      }
    } catch (e) { /* ignore */ }

    // Bind toggle
    document.getElementById('btn-notifications')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePanel();
    });

    // Bind clear
    document.getElementById('notif-clear')?.addEventListener('click', () => this.clearAll());

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-panel') && !e.target.closest('#btn-notifications')) {
        this._closePanel();
      }
    });

    // Request browser notification permission
    this._requestPermission();

    // Render
    this._renderBadge();
    this._renderList();
  },

  // Add a notification (both in-app and browser)
  add(message, type = 'info', browser = false) {
    const notif = {
      id: Date.now().toString(),
      message,
      type,
      time: new Date().toISOString(),
      read: false
    };
    this._notifications.unshift(notif);
    if (this._notifications.length > 50) this._notifications.pop();
    this._save();
    this._renderBadge();
    this._renderList();

    // Browser notification
    if (browser && Notification.permission === 'granted') {
      new Notification('DevFlow Suite', {
        body: message,
        icon: 'assets/icons/icon-192.png',
        badge: 'assets/icons/icon-192.png',
        tag: notif.id
      });
    }
  },

  clearAll() {
    this._notifications = [];
    this._save();
    this._renderBadge();
    this._renderList();
  },

  _togglePanel() {
    this._panelOpen = !this._panelOpen;
    document.getElementById('notif-panel')?.classList.toggle('hidden', !this._panelOpen);
    if (this._panelOpen) {
      // Mark all as read
      this._notifications.forEach(n => n.read = true);
      this._save();
      this._renderBadge();
    }
  },

  _closePanel() {
    this._panelOpen = false;
    document.getElementById('notif-panel')?.classList.add('hidden');
  },

  _renderBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const unread = this._notifications.filter(n => !n.read).length;
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.classList.remove('hidden');
      badge.classList.add('flex');
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('flex');
    }
  },

  _renderList() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (this._notifications.length === 0) {
      list.innerHTML = '<div class="p-4 text-center text-sm text-gray-400">No notifications yet</div>';
      return;
    }

    list.innerHTML = this._notifications.slice(0, 20).map(n => {
      const icon = this._iconMap[n.type] || this._iconMap.info;
      const time = this._timeAgo(n.time);
      return `
        <div class="notif-item${n.read ? '' : ' font-medium'}">
          <div class="notif-icon ${n.type}"><i class="fas ${icon}"></i></div>
          <div class="notif-content">
            <div class="notif-text">${n.message}</div>
            <div class="notif-time">${time}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  _timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  async _requestPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Ask after 10s delay
      setTimeout(() => {
        Notification.requestPermission();
      }, 10000);
    }
  },

  async _save() {
    try {
      if (typeof DB !== 'undefined' && !DB._useFallback) {
        await DB.setSetting('notifications', this._notifications);
      }
    } catch (e) { /* ignore */ }
  }
};

// ─── Accent Color Picker ──────────────
const AccentManager = {
  _presets: {
    '#3b82f8': { dark: '#2563eb', light: '#60a5fa', rgb: '59, 130, 246' },
    '#8b5cf6': { dark: '#7c3aed', light: '#a78bfa', rgb: '139, 92, 246' },
    '#ec4899': { dark: '#db2777', light: '#f472b6', rgb: '236, 72, 153' },
    '#ef4444': { dark: '#dc2626', light: '#f87171', rgb: '239, 68, 68' },
    '#f97316': { dark: '#ea580c', light: '#fb923c', rgb: '249, 115, 22' },
    '#eab308': { dark: '#ca8a04', light: '#facc15', rgb: '234, 179, 8' },
    '#22c55e': { dark: '#16a34a', light: '#4ade80', rgb: '34, 197, 94' },
    '#06b6d4': { dark: '#0891b2', light: '#22d3ee', rgb: '6, 182, 212' },
    '#6b7280': { dark: '#4b5563', light: '#9ca3af', rgb: '107, 114, 128' },
  },

  async init() {
    // Load saved accent
    let saved = '#3b82f8';
    try {
      if (typeof DB !== 'undefined') {
        await DB.ready();
        saved = (await DB.setting('accent_color')) || '#3b82f8';
      }
    } catch (e) { /* use default */ }
    this._apply(saved);

    // Bind swatch clicks
    document.querySelectorAll('.accent-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        this._apply(swatch.dataset.color);
        this._save(swatch.dataset.color);
      });
    });

    // Bind custom picker
    const customPicker = document.getElementById('accent-custom-picker');
    customPicker?.addEventListener('input', (e) => {
      this._apply(e.target.value);
    });
    customPicker?.addEventListener('change', (e) => {
      this._save(e.target.value);
    });
  },

  _apply(hex) {
    const root = document.documentElement;
    const info = this._presets[hex] || this._generateShades(hex);

    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-rgb', info.rgb);
    root.style.setProperty('--accent-dark', info.dark);
    root.style.setProperty('--accent-light', info.light);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${hex}, ${info.dark})`);

    // Update swatch active state
    document.querySelectorAll('.accent-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === hex);
    });

    // Update current color label
    const label = document.getElementById('accent-current');
    if (label) label.textContent = hex;

    // Update custom picker value
    const customPicker = document.getElementById('accent-custom-picker');
    if (customPicker) customPicker.value = hex;
  },

  _generateShades(hex) {
    // Simple shade generation for custom colors
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dark = '#' + [r, g, b].map(c => Math.max(0, c - 40).toString(16).padStart(2, '0')).join('');
    const light = '#' + [r, g, b].map(c => Math.min(255, c + 40).toString(16).padStart(2, '0')).join('');
    return { dark, light, rgb: `${r}, ${g}, ${b}` };
  },

  async _save(hex) {
    try {
      if (typeof DB !== 'undefined' && !DB._useFallback) {
        await DB.setSetting('accent_color', hex);
      }
    } catch (e) { /* ignore */ }
  }
};

// ─── Snippet Stats Dashboard ─────────
const SnippetStats = {
  _colors: {
    javascript: '#f59e0b', typescript: '#3b82f6', python: '#22c55e',
    go: '#06b6d4', rust: '#f97316', html: '#ef4444', css: '#8b5cf6',
    bash: '#6b7280', sql: '#ec4899', json: '#eab308', yaml: '#a855f7', other: '#9ca3af'
  },

  async update() {
    let snippets = [];
    try {
      if (typeof DB !== 'undefined') {
        await DB.ready();
        snippets = await DB.getAll('snippets');
      }
    } catch (e) { /* empty */ }

    const dashboard = document.getElementById('stats-dashboard');
    if (!dashboard) return;

    if (snippets.length === 0) {
      dashboard.classList.add('hidden');
      return;
    }

    dashboard.classList.remove('hidden');

    // Total
    const totalEl = document.getElementById('stat-total');
    if (totalEl) totalEl.textContent = snippets.length;

    // Languages
    const langMap = {};
    snippets.forEach(s => { langMap[s.language] = (langMap[s.language] || 0) + 1; });
    const langCount = Object.keys(langMap).length;
    const langEl = document.getElementById('stat-languages');
    if (langEl) langEl.textContent = langCount;

    // Tags
    const tagSet = new Set();
    snippets.forEach(s => {
      if (s.tags) s.tags.split(',').forEach(t => tagSet.add(t.trim().toLowerCase()));
    });
    const tagEl = document.getElementById('stat-tags');
    if (tagEl) tagEl.textContent = tagSet.size;

    // Storage estimate
    const jsonStr = JSON.stringify(snippets);
    const bytes = new Blob([jsonStr]).size;
    const storageEl = document.getElementById('stat-storage');
    if (storageEl) {
      storageEl.textContent = bytes > 1024
        ? (bytes / 1024).toFixed(1) + ' KB'
        : bytes + ' B';
    }

    // Language bars
    const barsContainer = document.getElementById('lang-bars-container');
    if (barsContainer) {
      const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
      const max = sorted[0]?.[1] || 1;
      barsContainer.innerHTML = sorted.map(([lang, count]) => {
        const pct = (count / max) * 100;
        const color = this._colors[lang] || this._colors.other;
        return `
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600 dark:text-gray-400 w-20 truncate text-right">${lang}</span>
            <div class="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" style="width:${pct}%;background:${color}"></div>
            </div>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 w-6 text-right">${count}</span>
          </div>
        `;
      }).join('');
    }
  }
};

// ─── Zen Mode (distraction-free) ────
const ZenMode = {
  _active: false,

  init() {
    // Create floating toggle button
    const btn = document.createElement('button');
    btn.className = 'zen-toggle';
    btn.id = 'zen-toggle-btn';
    btn.innerHTML = '<i class="fas fa-expand"></i>';
    btn.title = 'Toggle zen mode (F11)';
    btn.setAttribute('aria-label', 'Toggle zen mode');
    btn.addEventListener('click', () => this.toggle());
    document.body.appendChild(btn);
  },

  toggle() {
    this._active = !this._active;
    document.body.classList.toggle('zen-mode', this._active);

    const btn = document.getElementById('zen-toggle-btn');
    if (btn) {
      btn.innerHTML = this._active
        ? '<i class="fas fa-compress"></i>'
        : '<i class="fas fa-expand"></i>';
      btn.title = this._active ? 'Exit zen mode (F11)' : 'Enter zen mode (F11)';
    }

    // Announce to screen reader
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
      announcer.textContent = this._active ? 'Zen mode enabled' : 'Zen mode disabled';
      setTimeout(() => { announcer.textContent = ''; }, 2000);
    }
  }
};

// ─── Onboarding Tour ─────────────────
const OnboardingTour = {
  _currentStep: 0,
  _steps: [
    {
      target: '[data-tool="snippets"]',
      title: '📁 Snippet Vault',
      desc: 'Save, tag, and organize your code snippets with syntax highlighting for 20+ languages. Your code, always accessible.',
      pos: 'bottom'
    },
    {
      target: '[data-tool="regex"]',
      title: '🔍 Regex Forge',
      desc: 'Test regex patterns in real-time with match highlighting, capture groups, and flag toggles (g, i, m, s, u, y).',
      pos: 'bottom'
    },
    {
      target: '[data-tool="json"]',
      title: '📋 JSON Wizard',
      desc: 'Format, minify, validate, and colorize JSON data instantly. Perfect for API responses and config files.',
      pos: 'bottom'
    },
    {
      target: '[data-tool="color"]',
      title: '🎨 ColorCraft',
      desc: 'Upload images to extract color palettes, pick colors, and generate harmonies (complementary, triadic, etc.).',
      pos: 'bottom'
    },
    {
      target: '[data-tool="markdown"]',
      title: '✍️ Markdown Editor',
      desc: 'Write Markdown with live preview, export to HTML, and distraction-free fullscreen mode.',
      pos: 'bottom'
    },
    {
      target: null,
      title: '🎉 You\'re all set!',
      desc: 'All tools work offline and store data locally in your browser. No signup required. Press <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+K</kbd> anytime to open the command palette.',
      pos: 'center'
    }
  ],

  async init() {
    let seen = false;
    try {
      if (typeof DB !== 'undefined') {
        await DB.ready();
        seen = await DB.setting('tour_done');
      }
    } catch (e) { /* fallback */ }
    if (!seen) seen = localStorage.getItem('devflow_tour_done');
    if (!seen) {
      setTimeout(() => this.start(), 600);
    }
  },

  start() {
    this._currentStep = 0;
    document.getElementById('tour-overlay')?.classList.add('active');
    this._showStep();
  },

  _showStep() {
    const step = this._steps[this._currentStep];
    const spotlight = document.getElementById('tour-spotlight');
    const tooltip = document.getElementById('tour-tooltip');
    const title = document.getElementById('tour-title');
    const desc = document.getElementById('tour-desc');
    const dots = document.getElementById('tour-dots');
    const nextBtn = document.getElementById('tour-next');
    if (!tooltip || !title || !desc) return;

    // Dots
    dots.innerHTML = this._steps.map((_, i) =>
      `<div class="tour-dot${i === this._currentStep ? ' active' : ''}"></div>`
    ).join('');

    // Content
    title.textContent = step.title;
    desc.innerHTML = step.desc;

    // Button text
    const isLast = this._currentStep === this._steps.length - 1;
    nextBtn.textContent = isLast ? 'Get started ✓' : 'Next →';
    nextBtn.className = isLast ? 'tour-btn-done' : 'tour-btn-next';

    // Position tooltip
    if (step.pos === 'center' || !step.target) {
      spotlight.style.display = 'none';
      tooltip.style.left = '50%';
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
    } else {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        const pad = 8;
        spotlight.style.display = 'block';
        spotlight.style.top = (rect.top - pad) + 'px';
        spotlight.style.left = (rect.left - pad) + 'px';
        spotlight.style.width = (rect.width + pad * 2) + 'px';
        spotlight.style.height = (rect.height + pad * 2) + 'px';

        // Tooltip below the element
        tooltip.style.transform = '';
        const tooltipW = 380;
        let left = rect.left + rect.width / 2 - tooltipW / 2;
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
        tooltip.style.left = left + 'px';
        tooltip.style.top = (rect.bottom + 16) + 'px';

        // If tooltip would go below viewport, show above
        if (rect.bottom + 250 > window.innerHeight) {
          tooltip.style.top = (rect.top - 16) + 'px';
          tooltip.style.transform = 'translateY(-100%)';
        }
      }
    }

    // Show with animation
    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });

    // Bind buttons
    nextBtn.onclick = () => this._next();
    document.getElementById('tour-skip').onclick = () => this._end();

    // ESC to skip
    this._escHandler = (e) => {
      if (e.key === 'Escape') this._end();
    };
    document.addEventListener('keydown', this._escHandler);
  },

  _next() {
    const tooltip = document.getElementById('tour-tooltip');
    tooltip?.classList.remove('visible');

    this._currentStep++;
    if (this._currentStep >= this._steps.length) {
      this._end();
    } else {
      setTimeout(() => this._showStep(), 200);
    }
  },

  _end() {
    document.removeEventListener('keydown', this._escHandler);
    document.getElementById('tour-overlay')?.classList.remove('active');
    document.getElementById('tour-spotlight').style.display = 'none';
    document.getElementById('tour-tooltip')?.classList.remove('visible');
    localStorage.setItem('devflow_tour_done', '1');
    if (typeof DB !== 'undefined' && !DB._useFallback) {
      DB.setSetting('tour_done', true).catch(() => {});
    }
  }
};

// ─── Initialize App ─────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize IndexedDB (async, non-blocking)
  if (typeof DB !== 'undefined') await DB.init();

  ThemeManager.init();
  Router.init();
  PWA.init();
  Analytics.init();
  Shortcuts.init();
  ZenMode.init();
  AccentManager.init();
  NotificationCenter.init();
  OnboardingTour.init();

  // Listen for online/offline status from SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'OFFLINE_STATUS') {
        if (event.data.online) {
          showNotification('Back online! Syncing...', 'success', 2000);
        } else {
          showNotification('You are offline. Changes will sync later.', 'warning', 3000);
        }
      }
      if (event.data?.type === 'SYNC_SNIPPET') {
        showNotification('Syncing snippets...', 'info', 1500);
      }
    });
  }

  // Check for deep link
  const hash = window.location.hash.replace('#', '');
  if (hash && ['landing', 'dashboard', 'snippets', 'regex', 'json', 'color', 'markdown', 'checkout', 'download'].includes(hash)) {
    setTimeout(() => Router.navigate(hash, true), 100);
  }
});
