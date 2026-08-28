/* ========================================
   DevFlow Suite — IndexedDB Wrapper
   Minimal async storage with localStorage
   fallback for older browsers.
   ======================================== */

const DB = {
  _dbName: 'devflow-suite',
  _version: 1,
  _db: null,
  _ready: null,
  _useFallback: false,

  // ── Initialize (call once at startup) ────
  init() {
    // Check IndexedDB support
    if (typeof indexedDB === 'undefined') {
      this._useFallback = true;
      console.warn('[DB] IndexedDB not available, using localStorage fallback');
      this._ready = Promise.resolve();
      return this._ready;
    }

    this._ready = new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, this._version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Snippets store
        if (!db.objectStoreNames.contains('snippets')) {
          const store = db.createObjectStore('snippets', { keyPath: 'id' });
          store.createIndex('language', 'language', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        // Settings store (key-value)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        // Deleted snippets (for undo)
        if (!db.objectStoreNames.contains('deleted')) {
          db.createObjectStore('deleted', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this._db = e.target.result;
        resolve();
      };

      request.onerror = (e) => {
        console.warn('[DB] IndexedDB failed, using localStorage fallback', e);
        this._useFallback = true;
        resolve(); // Don't block the app
      };
    });

    return this._ready;
  },

  // ── Wait for DB to be ready ──────────────
  async ready() {
    if (this._ready) await this._ready;
  },

  // ── Generic store operations ─────────────
  async _getStore(storeName, mode = 'readonly') {
    await this.ready();
    if (this._useFallback) return null;
    const tx = this._db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  },

  async getAll(storeName) {
    if (this._useFallback) {
      const data = localStorage.getItem(`df_${storeName}`);
      return data ? JSON.parse(data) : [];
    }
    const store = await this._getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async get(storeName, key) {
    if (this._useFallback) {
      const data = localStorage.getItem(`df_${storeName}_${key}`);
      return data ? JSON.parse(data) : null;
    }
    const store = await this._getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async put(storeName, value) {
    if (this._useFallback) {
      const key = value.key || value.id || value;
      localStorage.setItem(`df_${storeName}_${key}`, JSON.stringify(value));
      return;
    }
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async putAll(storeName, values) {
    if (this._useFallback) {
      localStorage.setItem(`df_${storeName}`, JSON.stringify(values));
      return;
    }
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const tx = store.transaction;
      values.forEach(v => store.put(v));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(storeName, key) {
    if (this._useFallback) {
      localStorage.removeItem(`df_${storeName}_${key}`);
      return;
    }
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async clear(storeName) {
    if (this._useFallback) {
      // Only clear keys for this store
      const prefix = `df_${storeName}`;
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      return;
    }
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // ── Convenience: simple key-value (settings) ──
  async setting(key, defaultValue = null) {
    const result = await this.get('settings', key);
    return result ? result.value : defaultValue;
  },

  async setSetting(key, value) {
    return this.put('settings', { key, value });
  },

  // ── Migrate from localStorage ────────────
  async migrateFromLocalStorage(storageKey, storeName) {
    const data = localStorage.getItem(storageKey);
    if (!data) return false;
    try {
      const items = JSON.parse(data);
      if (Array.isArray(items) && items.length > 0) {
        await this.clear(storeName);
        await this.putAll(storeName, items);
        localStorage.removeItem(storageKey);
        console.log(`[DB] Migrated ${items.length} items from localStorage`);
        return true;
      }
    } catch (e) {
      console.warn('[DB] Migration failed:', e);
    }
    return false;
  }
};
