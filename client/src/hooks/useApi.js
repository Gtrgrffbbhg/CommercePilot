import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/apiClient.js';

export function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  const abortControllerRef = useRef(null);

  const reload = useCallback(() => {
    setReloadIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!endpoint) return;

    // Cancel any active prior request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    apiClient(endpoint, { signal: controller.signal })
      .then((resData) => {
        setData(resData);
        setError(null);
      })
      .catch((err) => {
        // Do not update state if aborted on unmount
        if (err.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [endpoint, reloadIndex]);

  return { data, loading, error, reload };
}
