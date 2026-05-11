import { useEffect, useCallback, useRef } from 'react';

const AUTOSAVE_PREFIX = 'cms_autosave_';

/**
 * Auto-save form data to localStorage
 * Prevents data loss on accidental refresh
 */
export function useAutoSave(key, data, { interval = 5000, enabled = true } = {}) {
  const storageKey = `${AUTOSAVE_PREFIX}${key}`;
  const timerRef = useRef(null);

  // Save function
  const save = useCallback(() => {
    if (!enabled || !data) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch {
      // Storage full or unavailable
    }
  }, [storageKey, data, enabled]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(save, interval);
    return () => clearInterval(timerRef.current);
  }, [save, interval, enabled]);

  // Save on unmount
  useEffect(() => {
    return () => save();
  }, [save]);

  // Load saved data
  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { data: savedData, timestamp } = JSON.parse(raw);
        // Only restore if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return savedData;
        }
      }
    } catch {
      // Parse failed
    }
    return null;
  }, [storageKey]);

  // Clear saved data
  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Check if saved data exists
  const hasSaved = useCallback(() => {
    return !!localStorage.getItem(storageKey);
  }, [storageKey]);

  return { save, load, clear, hasSaved };
}

export default useAutoSave;
