import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiError } from '../services/api';

interface UseApiRequestOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiRequestResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  execute: (...args: unknown[]) => Promise<T | void>;
  cancel: () => void;
  reset: () => void;
}

export function useApiRequest<T = unknown>(
  apiMethod: (...args: unknown[]) => Promise<T>,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestResult<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Effect for cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
    setLoading(false);
  }, [cancel]);

  const execute = useCallback(async (...args: unknown[]) => {
    try {
      cancel(); // Cancel any pending request

      setLoading(true);
      setError(null);

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Inject abort controller into the last argument if it's an options object
      const lastArg = args[args.length - 1];
      if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)) {
        args[args.length - 1] = { ...lastArg, cancelToken: abortControllerRef.current };
      } else {
        args.push({ cancelToken: abortControllerRef.current });
      }

      const result = await apiMethod(...args);

      if (!mountedRef.current) return;

      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof ApiError ? err : new ApiError(String(err));
      setError(error);
      onError?.(error);

      // Don't throw if it's a cancellation
      if (error.message !== 'Request was cancelled') {
        throw error;
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiMethod, cancel, onSuccess, onError]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]); // Include execute in dependencies

  return {
    data,
    error,
    loading,
    execute,
    cancel,
    reset,
  };
}

// Example usage:
// const { data, loading, error, execute } = useApiRequest(
//   apiService.getVisualizations,
//   {
//     immediate: true,
//     onSuccess: (data) => console.log('Loaded:', data),
//     onError: (error) => console.error('Error:', error)
//   }
// );
