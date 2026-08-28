/* ========================================
   DevFlow Suite — Checkout & Download Logic
   Safety-net: obfuscated keys, time-gate,
   purchase fingerprint, console warning
   ======================================== */// ─── Security Helpers ────────────────────
const _sec = {
  _cache: {}, // in-memory cache for fast sync reads

  // Simple hash for fingerprinting (not cryptographic — just obfuscation)
  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  },

  // Store name for IndexedDB
  _store: 'settings',

  // Build a purchase fingerprint from email + method + timestamp
  buildFingerprint(email, method, timestamp) {
    const raw = `${email.toLowerCase().trim()}|${method}|${timestamp}|devflow_vault_2025`;
    return this._hash(raw);
  },

  // ── Async: read from IndexedDB (with cache) ──
  async get(name) {
    // Return cached value if available (fast path)
    if (name in this._cache) return this._cache[name];

    try {
      if (typeof DB !== 'undefined') {
        await DB.ready();
        const val = await DB.setting('sec_' + name);
        this._cache[name] = val;
        return val;
      }
    } catch (e) { /* fallback below */ }

    // Fallback: localStorage
    const val = localStorage.getItem('df_sec_' + name);
    this._cache[name] = val;
    return val;
  },

  // ── Async: write to IndexedDB + cache ──
  async set(name, value) {
    this._cache[name] = value;
    try {
      if (typeof DB !== 'undefined' && !DB._useFallback) {
        await DB.ready();
        await DB.setSetting('sec_' + name, value);
        return;
      }
    } catch (e) { /* fallback below */ }
    localStorage.setItem('df_sec_' + name, value);
  },

  // ── Async: delete from IndexedDB + cache ──
  async remove(name) {
    delete this._cache[name];
    try {
      if (typeof DB !== 'undefined' && !DB._useFallback) {
        await DB.ready();
        await DB.delete(this._store, 'sec_' + name);
        return;
      }
    } catch (e) { /* fallback below */ }
    localStorage.removeItem('df_sec_' + name);
  },

  // ── Sync read from cache (for fast checks) ──
  getSync(name) {
    return this._cache[name] ?? null;
  },

  // ── Verify the fingerprint is valid ──
  async verifyFingerprint(email, method, timestamp) {
    const stored = await this.get('fingerprint');
    const expected = this.buildFingerprint(email, method, timestamp);
    return stored === expected;
  },

  // ── Load all settings into cache (call at startup) ──
  async loadAll() {
    const keys = ['purchased', 'email', 'payMethod', 'payTime', 'fingerprint', 'pro', 'proKey'];
    for (const k of keys) {
      await this.get(k); // populates cache
    }
  },

  // ── Migrate from old obfuscated localStorage keys ──
  async migrateFromLocalStorage() {
    const oldMap = {
      '_df_8a3f': 'purchased', '_df_b7c1': 'email', '_df_d4e2': 'payMethod',
      '_df_f5a3': 'payTime', '_df_91b4': 'fingerprint', '_df_c2d5': 'pro', '_df_e6f7': 'proKey',
    };
    let migrated = false;
    for (const [oldKey, newName] of Object.entries(oldMap)) {
      const val = localStorage.getItem(oldKey);
      if (val) {
        await this.set(newName, val);
        localStorage.removeItem(oldKey);
        migrated = true;
      }
    }
    // Also migrate plain devflow_pro key
    const oldPro = localStorage.getItem('devflow_pro');
    if (oldPro) {
      await this.set('pro', oldPro === 'true' ? '1' : '0');
      localStorage.removeItem('devflow_pro');
      migrated = true;
    }
    if (migrated) console.log('[Sec] Migrated settings from localStorage to IndexedDB');
  },

  // ── Console anti-tampering warning ──
  warn() {
    console.log(
      '%c⚠️ DevFlow Suite — Purchase Verification',
      'color: #f59e0b; font-size: 16px; font-weight: bold;'
    );
    console.log(
      '%cBypassing the checkout is unethical.\nIf you want the JavaScript Snippets Vault, please purchase it for $9.99.\npaypal.me/aiforgestudio/9.99',
      'color: #9ca3af; font-size: 13px;'
    );
  },
};

// ─── Checkout Manager ───────────────────
const CheckoutManager = {
  _selectedMethod: null,
  _paymentSelectedAt: 0,
  _MIN_WAIT_SECONDS: 15, // Must wait at least 15s after selecting payment

  methods: {
    paypal: {
      name: 'PayPal',
      icon: 'fab fa-paypal',
      instructions: 'PayPal will open in a new tab. Send exactly $9.99.',
      link: 'https://paypal.me/aiforgestudio/9.99',
      copyText: 'paypal.me/aiforgestudio/9.99',
    },
    venmo: {
      name: 'Venmo',
      icon: 'fas fa-mobile-alt',
      instructions: 'Open Venmo app and send exactly $9.99. Then return to enter your email.',
      link: null,
      copyText: '@aiforgestudio',
    },
    crypto: {
      name: 'Crypto (Bitcoin)',
      icon: 'fas fa-coins',
      instructions: 'Send exactly $9.99 worth of BTC to the address below. Then enter your email.',
      link: null,
      copyText: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkf5h3cxm',
    },
    zelle: {
      name: 'Zelle',
      icon: 'fas fa-building',
      instructions: 'Send exactly $9.99 to the Zelle email below.',
      link: null,
      copyText: 'payment@aiforgestudio.com',
    },
  },

  init() {
    this.bindEvents();
    this.resetState();
  },

  resetState() {
    document.getElementById('payment-instructions')?.classList.add('hidden');
    document.getElementById('payment-form-section')?.classList.add('hidden');
    const titleEl = document.getElementById('payment-title');
    if (titleEl) titleEl.innerHTML = '';
    const detailsEl = document.getElementById('payment-details');
    if (detailsEl) detailsEl.textContent = '';
  },

  bindEvents() {
    ['paypal', 'venmo', 'crypto', 'zelle'].forEach(m => {
      const btn = document.getElementById(`btn-${m}`);
      btn?.addEventListener('click', () => this.selectPayment(m));
    });

    document.getElementById('btn-copy-payment')?.addEventListener('click', () => {
      const details = document.getElementById('payment-details');
      const codeEl = details?.querySelector('code');
      if (codeEl) {
        copyToClipboard(codeEl.textContent.trim());
      } else if (details) {
        copyToClipboard(details.textContent);
      }
    });

    document.getElementById('btn-unlock-download')?.addEventListener('click', () => {
      this.unlockDownload();
    });

    document.getElementById('btn-apply-pro')?.addEventListener('click', () => {
      this.applyProKey();
    });
  },

  selectPayment(method) {
    const m = this.methods[method];
    const titleEl = document.getElementById('payment-title');
    const detailsEl = document.getElementById('payment-details');
    const instrEl = document.getElementById('payment-instructions');
    const formEl = document.getElementById('payment-form-section');

    if (titleEl) {
      titleEl.innerHTML = `<i class="${m.icon} mr-2"></i> ${m.name} — $9.99`;
    }
    if (detailsEl) {
      let html = `<p class="mb-2">${m.instructions}</p>`;
      if (m.copyText) {
        html += `<p class="mt-2"><code class="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded break-all">${m.copyText}</code></p>`;
      }
      detailsEl.innerHTML = html;
    }

    instrEl?.classList.remove('hidden');
    formEl?.classList.remove('hidden');

    // Track payment selection time and method
    this._selectedMethod = method;
    this._paymentSelectedAt = Date.now();
    _sec.set('payMethod', method);
    _sec.set('payTime', String(this._paymentSelectedAt)); // fire-and-forget async

    if (m.link) {
      window.open(m.link, '_blank', 'width=600,height=800');
    }
  },

  async unlockDownload() {
    const email = document.getElementById('checkout-email')?.value.trim();
    if (!email || !email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    // Time-gate: must wait at least MIN_WAIT_SECONDS after selecting payment
    if (this._selectedMethod && this._paymentSelectedAt > 0) {
      const elapsed = (Date.now() - this._paymentSelectedAt) / 1000;
      if (elapsed < this._MIN_WAIT_SECONDS) {
        const remaining = Math.ceil(this._MIN_WAIT_SECONDS - elapsed);
        showNotification(`Please wait ${remaining}s before confirming payment.`, 'warning');
        return;
      }
    } else if (!this._selectedMethod) {
      showNotification('Please select a payment method first.', 'error');
      return;
    }

    // Build and store purchase fingerprint
    const timestamp = this._paymentSelectedAt || Date.now();
    const fingerprint = _sec.buildFingerprint(email, this._selectedMethod, timestamp);

    await _sec.set('purchased', '1');
    await _sec.set('email', email);
    await _sec.set('fingerprint', fingerprint);

    showNotification('Purchase confirmed! Redirecting to download...');

    setTimeout(() => {
      Router.navigate('download');
    }, 1000);
  },

  async applyProKey() {
    const key = 'DEVFLOW-PRO-2025-JS-VAULT';
    await _sec.set('pro', '1');
    await _sec.set('proKey', _sec._hash(key));
    showNotification('🎉 Pro features unlocked! Visit the dashboard to see them.');
    setTimeout(() => {
      Router.navigate('dashboard');
    }, 1500);
  },
};

// ─── Download Manager ────────────────────
const DownloadManager = {
  async init() {
    // Load all settings into cache first
    await _sec.loadAll();

    // Validate purchase via fingerprint
    const email = await _sec.get('email');
    const method = await _sec.get('payMethod');
    const timestamp = await _sec.get('payTime');

    if (email && method && timestamp) {
      const valid = await _sec.verifyFingerprint(email, method, parseInt(timestamp));
      if (valid) {
        showNotification('Your purchase is confirmed! Download the PDF below.');
      } else {
        console.warn('[DevFlow] Purchase fingerprint mismatch — data may have been tampered with.');
        showNotification('Purchase verification failed. Please contact support.', 'error');
      }
    } else {
      showNotification('Please complete a purchase to access the download.', 'error');
    }

    // Pro key status (from cache, fast)
    const isPro = _sec.getSync('pro') === '1';
    const applyBtn = document.getElementById('btn-apply-pro');
    if (applyBtn) {
      if (isPro) {
        applyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Pro Unlocked';
        applyBtn.classList.add('bg-green-500');
      }
    }
  },
};

// ─── Initialize ─────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings into cache for fast sync reads
  await _sec.loadAll();
  _sec.migrateFromLocalStorage(); // fire-and-forget
  _sec.warn();
  CheckoutManager.init();
});
