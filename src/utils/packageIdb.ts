import { IDB_NAME, IDB_STORE } from '../constants/nexplay';
import type { NexplayPackageRecord } from '../types/nexplay';

let idbDb: IDBDatabase | null = null;
const memoryPackages: Record<string, NexplayPackageRecord> = {};

function openPkgIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (idbDb) {
      resolve(idbDb);
      return;
    }
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'packageId' });
        }
      };
      req.onsuccess = () => {
        idbDb = req.result;
        resolve(idbDb);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbPutPackage(rec: NexplayPackageRecord): Promise<boolean> {
  if (!rec || !rec.packageId) return false;
  memoryPackages[rec.packageId] = rec;
  const db = await openPkgIdb();
  if (!db) return true;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(rec);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    } catch {
      resolve(true);
    }
  });
}

export async function idbGetPackage(packageId: string): Promise<NexplayPackageRecord | null> {
  if (!packageId) return null;
  const db = await openPkgIdb();
  if (db) {
    const res = await new Promise<NexplayPackageRecord | null>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(packageId);
        req.onsuccess = () => resolve((req.result as NexplayPackageRecord) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (res) return res;
  }
  return memoryPackages[packageId] || null;
}

export async function idbDeletePackage(packageId: string): Promise<void> {
  if (!packageId) return;
  delete memoryPackages[packageId];
  const db = await openPkgIdb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(packageId);
  } catch {
    // Ignore cleanup errors
  }
}
