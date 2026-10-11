import { useState, useEffect, useCallback } from 'react';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * useState + localStorage 持久化，解析失败时回退到初始值，避免整页崩溃。
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => readStorage(key, initialValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // quota / private mode — ignore
    }
  }, [key, state]);

  const reset = useCallback(() => {
    setState(initialValue);
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key, initialValue]);

  return [state, setState, reset] as const;
}
