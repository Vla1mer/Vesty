import { useSyncExternalStore } from "react";

const STORAGE_KEY = "vesty.rail-labels";

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

let enabled = read();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  const next = read();
  if (next === enabled) return;
  enabled = next;
  notify();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", handleStorage);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
}

export function setRailLabels(next: boolean): void {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    /* empty */
  }
  notify();
}

export function useRailLabels(): boolean {
  return useSyncExternalStore(subscribe, () => enabled, () => true);
}
