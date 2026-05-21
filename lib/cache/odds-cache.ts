/**
 * Simple TTL cache for Odds API responses.
 * Prevents repeated API calls for the same data within the cache window,
 * regardless of how many users are requesting simultaneously.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached<T>(key: string, data: T, ttlMs = TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Prune expired entries every 10 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt < now) store.delete(key);
    }
  }, 10 * 60 * 1000);
}
