import { useSyncExternalStore } from "react";
import { createPersistedStore } from "../lib/persistedStore";

const store = createPersistedStore<boolean>(
  "vesty.rail-labels",
  true,
  (raw) => raw !== "off",
  (value) => (value ? "on" : "off")
);

export const setRailLabels = store.set;

export function useRailLabels(): boolean {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}
