export interface PersistedStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
}

export function createPersistedStore<T>(
  key: string,
  fallback: T,
  decode: (raw: string) => T | null,
  encode: (value: T) => string
): PersistedStore<T> {
  function read(): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : decode(raw) ?? fallback;
    } catch {
      return fallback;
    }
  }

  let value = read();
  const listeners = new Set<() => void>();

  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  function handleStorage(event: StorageEvent): void {
    if (event.key !== null && event.key !== key) return;
    const next = read();
    if (next === value) return;
    value = next;
    notify();
  }

  return {
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", handleStorage);
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", handleStorage);
        }
      };
    },
    getSnapshot: () => value,
    getServerSnapshot: () => fallback,
    set(next) {
      value = next;
      try {
        localStorage.setItem(key, encode(next));
      } catch {
        /* empty */
      }
      notify();
    },
  };
}
