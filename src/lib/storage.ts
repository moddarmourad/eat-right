import type { AppState } from "@/lib/models";

const STORAGE_KEY = "eat-right-state-v1";

export const initialState: AppState = {
  profile: null,
  logs: [],
  favorites: [],
  membership: { status: "free", period: "monthly" },
  waterLogs: {},
  weightHistory: [],
};

let currentAppState: AppState = initialState;
let initialized = false;
const listeners = new Set<() => void>();

function getStoredState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  } catch {
    return initialState;
  }
}

export function subscribeToAppState(callback: () => void): () => void {
  listeners.add(callback);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      currentAppState = getStoredState();
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getAppStateSnapshot(): AppState {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    currentAppState = getStoredState();
  }
  return currentAppState;
}

export function getServerSnapshot(): AppState {
  return initialState;
}

export function updateAppState(
  updater: AppState | ((prev: AppState) => AppState)
): void {
  const next =
    typeof updater === "function" ? updater(currentAppState) : updater;
  currentAppState = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }
  listeners.forEach((listener) => listener());
}
