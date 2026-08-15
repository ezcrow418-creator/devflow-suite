# DevFlow Suite

**A free, privacy-first PWA with 5+ essential developer tools — plus a premium JavaScript Snippets Vault.**

[![DevFlow Suite](https://t-1-66e873563d81ce47.tunnel.pinfra.io/assets/icons/icon-192.png)](https://t-1-66e873563d81ce47.tunnel.pinfra.io)

> **Built in 48 hours. Zero budget. No team. Just AI + action.**

## 🌟 What's Inside

| Tool | Description |
|------|-------------|
| **Snippet Vault** | Save, tag, search, and organize code snippets with syntax highlighting |
| **Regex Tester** | Real-time regex testing with flags (g, i, m, s, etc.) |
| **JSON Formatter** | Format, minify, validate, and colorize JSON |
| **Color Generator** | Upload images, extract palettes, generate color harmonies |
| **Markdown Editor** | Live preview with Marked.js |

## 💰 Monetization

- **Free**: All 5 core tools, offline access, dark/light mode — forever free.
- **JavaScript Snippets Vault** — $9.99 one-time: 52 production-ready JS snippets organized into 7 categories, as a syntax-highlighted PDF. Includes a Pro unlock key for DevFlow Suite.

**Payment methods**: PayPal · Bitcoin (BTC) · Interac e-Transfer

👉 [Live Demo](https://t-1-66e873563d81ce47.tunnel.pinfra.io) | 💳 [PayPal](https://tinyurl.com/2a7chdhv) | ₿ [Bitcoin](bc1qydukx6u0mng2ax75usyzpwynqauzrvz94cejkz)

## 🛠️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS, vanilla JavaScript (no frameworks)
- **PWA**: Service Worker caching, Web App Manifest, offline support
- **PDF Generation**: Python + ReportLab (52 syntax-highlighted snippets)
- **Hosting**: Prime Tunnel (free tier)
- **Payment**: PayPal · Bitcoin (BTC) · Interac e-Transfer

## 📁 File Structure

```
devflow-suite/
├── index.html              # Main app (landing, dashboard, tools, checkout, download)
├── css/styles.css          # Tailwind + custom styles, dark mode, animations
├── js/
│   ├── app.js              # Theme manager, router, PWA, analytics
│   ├── tools.js            # 5 developer tools (snippets, regex, json, color, markdown)
│   └── checkout.js         # Checkout flow, payment methods, Pro unlock
├── sw.js                   # Service worker (caching, offline support)
├── manifest.json           # PWA manifest
├── offline.html            # Offline fallback page
├── robots.txt              # SEO robots.txt
├── sitemap.xml             # SEO sitemap
├── generate_pdf.py         # PDF generator (52 JS snippets)
├── assets/
│   ├── icons/              # 8 PWA icons (72×72 to 512×512)
│   └── data/
│       └── JavaScript_Snippets_Vault.pdf
└── Dockerfile              # Docker deployment
```

## 🚀 Run Locally

```bash
# Simple HTTP server
python3 -m http.server 3000

# Or with Docker
docker build -t devflow-suite .
docker run -p 3000:80 devflow-suite
```

## 📱 Features

- ✅ Works offline (PWA)
- ✅ Install on mobile/desktop
- ✅ No signup, no tracking
- ✅ Dark/light mode (persists to localStorage)
- ✅ Responsive design
- ✅ Syntax highlighting
- ✅ Copy to clipboard
- ✅ Export/import snippets

## 📄 JavaScript Snippets Vault

The **JavaScript Snippets Vault** ($9.99) contains 52 production-ready snippets organized into 7 categories:

| Category | Count |
|----------|-------|
| DOM Manipulation | 8 |
| Async & Promises | 8 |
| Arrays & Objects | 14 |
| Strings & Utilities | 6 |
| Browser APIs | 8 |
| CSS & Layout | 4 |
| Performance & Debugging | 4 |

**Pro Unlock Key**: `DEVFLOW-PRO-2025-JS-VAULT`

Buy the PDF → Get the Pro key → Unlock all Pro features.

## 🎯 Built This To

1. **Prove** that one person with AI tools can build and launch a profitable product in 48 hours with zero budget.
2. **Solve** a real need — developers needing quick, reusable snippets and tools in one place.
3. **Iterate** based on real user feedback.

## 📬 Feedback

Found a bug? Want a feature? Have a snippet to add?

- Open an issue
- Or reach out via [PayPal](https://tinyurl.com/2a7chdhv) · Bitcoin (BTC): `bc1qydukx6u0mng2ax75usyzpwynqauzrvz94cejkz` or Interac e-Transfer: `smart.voucher.agentic@gmail.com`

---

*Made with ❤️ using AI in Québec, Canada.*
