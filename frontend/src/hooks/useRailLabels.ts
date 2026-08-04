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

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRailLabels(next: boolean): void {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    /* empty */
  }
  listeners.forEach((listener) => listener());
}

export function useRailLabels(): boolean {
  return useSyncExternalStore(subscribe, () => enabled, () => true);
}
