// Tiny IndexedDB wrapper. Photos are stored inline with each bowl record
// (compressed JPEG data-URLs), so a backup file round-trips everything.
const DB = (() => {
  const NAME = 'slurp-db';
  const VERSION = 1;
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('bowls')) {
          db.createObjectStore('bowls', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  // fn receives the object store and may return a function that yields the
  // result once the transaction completes.
  function tx(store, mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const getResult = fn(t.objectStore(store));
      t.oncomplete = () => resolve(typeof getResult === 'function' ? getResult() : undefined);
      t.onerror = () => reject(t.error);
    }));
  }

  return {
    allBowls: () => tx('bowls', 'readonly', (s) => {
      const req = s.getAll();
      return () => req.result || [];
    }),
    putBowl: (bowl) => tx('bowls', 'readwrite', (s) => { s.put(bowl); }),
    deleteBowl: (id) => tx('bowls', 'readwrite', (s) => { s.delete(id); }),
    getMeta: (key) => tx('meta', 'readonly', (s) => {
      const req = s.get(key);
      return () => (req.result ? req.result.value : undefined);
    }),
    setMeta: (key, value) => tx('meta', 'readwrite', (s) => { s.put({ key, value }); }),
  };
})();
