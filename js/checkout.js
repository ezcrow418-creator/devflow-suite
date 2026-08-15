/* ========================================
   DevFlow Suite — Checkout & Download Logic
   ======================================== */

// ─── Checkout Manager ───────────────────
const CheckoutManager = {
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
      copyText: 'bc1q5qn2ck8dt5ul9uj2pasnnzrayefwpjkvfkya2q',
    },
    interac: {
      name: 'Interac e-Transfer',
      icon: 'fas fa-university',
      instructions: 'Send exactly $9.99 via Interac e-Transfer to the email below. Then enter your email to unlock the download.',
      link: null,
      copyText: 'smart.voucher.agentic@gmail.com',
    },
  },

  init() {
    this.bindEvents();
    this.resetState();
  },

  resetState() {
    document.getElementById('payment-instructions')?.classList.add('hidden');
    document.getElementById('payment-form-section')?.classList.add('hidden');
    document.getElementById('payment-title').innerHTML = '';
    document.getElementById('payment-details').textContent = '';
  },

  bindEvents() {
    // Payment method buttons
    ['paypal', 'venmo', 'crypto', 'interac'].forEach(m => {
      const btn = document.getElementById(`btn-${m}`);
      btn?.addEventListener('click', () => this.selectPayment(m));
    });

    // Copy payment info
    document.getElementById('btn-copy-payment')?.addEventListener('click', () => {
      const details = document.getElementById('payment-details');
      const codeEl = details?.querySelector('code');
      if (codeEl) {
        copyToClipboard(codeEl.textContent.trim());
      } else if (details) {
        copyToClipboard(details.textContent);
      }
    });

    // Unlock download
    document.getElementById('btn-unlock-download')?.addEventListener('click', () => {
      this.unlockDownload();
    });

    // Apply Pro key
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

    // For PayPal, open the payment link
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

    // Store purchase info
    localStorage.setItem('devflow_purchased', 'true');
    localStorage.setItem('devflow_purchased_email', email);

    showNotification('Purchase confirmed! Redirecting to download...');

    // Navigate to download page
    setTimeout(() => {
      Router.navigate('download');
    }, 1000);
  },

  applyProKey() {
    const key = 'DEVFLOW-PRO-2025-JS-VAULT';
    localStorage.setItem('devflow_pro', 'true');
    localStorage.setItem('devflow_pro_key', key);
    showNotification('🎉 Pro features unlocked! Visit the dashboard to see them.');
    setTimeout(() => {
      Router.navigate('dashboard');
    }, 1500);
  },
};

// ─── Download Manager ────────────────────
const DownloadManager = {
  init() {
    const purchased = localStorage.getItem('devflow_purchased');
    if (purchased === 'true') {
      showNotification('Your purchase is confirmed! Download the PDF below.');
    }

    // Apply Pro key on page load
    const isPro = localStorage.getItem('devflow_pro') === 'true';
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
  CheckoutManager.init();
});
