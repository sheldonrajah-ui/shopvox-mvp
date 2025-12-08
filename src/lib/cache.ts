import { openDB } from 'idb';

const DB_NAME = 'shopvox-cache';
const STORE_NAME = 'products';

// Open (or create) the database
const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  },
});

// Save products (run this once when merchant updates catalogue)
export async function saveProducts(products: any[]) {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  products.forEach(p => tx.store.put(p));
  await tx.done;
}

// Get products – works offline
export async function getProducts() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

// Optional: clear old data
export async function clearCache() {
  const db = await dbPromise;
  await db.clear(STORE_NAME);
}