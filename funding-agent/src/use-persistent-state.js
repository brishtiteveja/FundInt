import { useEffect, useState } from "react";

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return typeof initialValue === "function" ? initialValue() : initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored == null ? (typeof initialValue === "function" ? initialValue() : initialValue) : JSON.parse(stored);
    } catch {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Persistence is best-effort in private browsing and restricted previews.
    }
  }, [key, value]);

  return [value, setValue];
}
