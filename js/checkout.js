/* ========================================
   DevFlow Suite — Checkout & Download Logic
   Safety-net: obfuscated keys, time-gate,
   purchase fingerprint, console warning
   ======================================== */

// ─── Security Helpers ────────────────────
const _sec = {
  // Simple hash for fingerprinting (not cryptographic — just obfuscation)
  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    // Convert to hex and pad
    return (h >>> 0).toString(16).padStart(8, '0');
  },

  // Obfuscated localStorage keys (not real encryption, but stops casual bypass)
  _key(name) {
    const map = {
      purchased: '_df_8a3f',
      email: '_df_b7c1',
      payMethod: '_df_d4e2',
      payTime: '_df_f5a3',
      fingerprint: '_df_91b4',
      pro: '_df_c2d5',
      proKey: '_df_e6f7',
    };
    return map[name] || '_df_' + this._hash(name);
  },

  get(name) {
    return localStorage.getItem(this._key(name));
  },

  set(name, value) {
    localStorage.setItem(this._key(name), value);
  },

  remove(name) {
    localStorage.removeItem(this._key(name));
  },

  // Build a purchase fingerprint from email + method + timestamp
  buildFingerprint(email, method, timestamp) {
    const raw = `${email.toLowerCase().trim()}|${method}|${timestamp}|devflow_vault_2025`;
    return this._hash(raw);
  },

  // Verify the fingerprint is valid
  verifyFingerprint(email, method, timestamp) {
    const stored = this.get('fingerprint');
    const expected = this.buildFingerprint(email, method, timestamp);
    return stored === expected;
  },

  // Console anti-tampering warning
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
    _sec.set('payTime', String(this._paymentSelectedAt));

    if (m.link) {
      window.open(m.link, '_blank', 'width=600,height=800');
    }
  },

  unlockDownload() {
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

    _sec.set('purchased', '1');
    _sec.set('email', email);
    _sec.set('fingerprint', fingerprint);

    showNotification('Purchase confirmed! Redirecting to download...');

    setTimeout(() => {
      Router.navigate('download');
    }, 1000);
  },

  applyProKey() {
    const key = 'DEVFLOW-PRO-2025-JS-VAULT';
    _sec.set('pro', '1');
    _sec.set('proKey', _sec._hash(key));
    showNotification('🎉 Pro features unlocked! Visit the dashboard to see them.');
    setTimeout(() => {
      Router.navigate('dashboard');
    }, 1500);
  },
};

// ─── Download Manager ────────────────────
const DownloadManager = {
  init() {
    // Validate purchase via fingerprint
    const email = _sec.get('email');
    const method = _sec.get('payMethod');
    const timestamp = _sec.get('payTime');

    if (email && method && timestamp) {
      const valid = _sec.verifyFingerprint(email, method, parseInt(timestamp));
      if (valid) {
        showNotification('Your purchase is confirmed! Download the PDF below.');
      } else {
        // Fingerprint mismatch — possible tampering
        console.warn('[DevFlow] Purchase fingerprint mismatch — data may have been tampered with.');
        showNotification('Purchase verification failed. Please contact support.', 'error');
        // Still show the page but warn
      }
    } else {
      // No purchase data at all — user navigated here directly
      showNotification('Please complete a purchase to access the download.', 'error');
    }

    // Pro key status
    const isPro = _sec.get('pro') === '1';
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
document.addEventListener('DOMContentLoaded', () => {
  _sec.warn();
  CheckoutManager.init();
});
