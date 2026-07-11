import { useEffect, useMemo, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  value: T;
  enabled?: boolean;
  delay?: number;
  resetKey?: string | number | null;
  canSave?: boolean;
  onSave: () => Promise<unknown>;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '�۰��x�s���ѡA�еy��A�աC';

export const useAutoSave = <T>({
  value,
  enabled = true,
  delay = 3000,
  resetKey,
  canSave = true,
  onSave,
}: UseAutoSaveOptions<T>) => {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const serializedValue = useMemo(() => JSON.stringify(value), [value]);
  const lastSavedValueRef = useRef(serializedValue);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    lastSavedValueRef.current = serializedValue;
    hasInitializedRef.current = false;
    setStatus(canSave ? 'saved' : 'idle');
    setError(null);
  }, [canSave, resetKey]);

  useEffect(() => {
    if (!enabled || !canSave) {
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    if (serializedValue === lastSavedValueRef.current) {
      return;
    }

    setStatus('saving');
    setError(null);

    const timerId = window.setTimeout(() => {
      void onSave()
        .then(() => {
          lastSavedValueRef.current = serializedValue;
          setLastSavedAt(new Date().toISOString());
          setStatus('saved');
        })
        .catch(saveError => {
          setError(getErrorMessage(saveError));
          setStatus('error');
        });
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [canSave, delay, enabled, onSave, serializedValue]);

  return {
    status,
    error,
    lastSavedAt,
  };
};
