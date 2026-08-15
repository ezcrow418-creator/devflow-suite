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

    // Pro status check
    const isPro = localStorage.getItem('devflow_pro') === 'true';
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

  const el = document.createElement('div');
  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  el.className = `${bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-300`;
  el.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => el.remove(), 300);
  }, duration);
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

// ─── Initialize App ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Router.init();
  PWA.init();
  Analytics.init();

  // Check for deep link
  const hash = window.location.hash.replace('#', '');
  if (hash && ['landing', 'dashboard', 'snippets', 'regex', 'json', 'color', 'markdown', 'checkout', 'download'].includes(hash)) {
    setTimeout(() => Router.navigate(hash, true), 100);
  }
});
