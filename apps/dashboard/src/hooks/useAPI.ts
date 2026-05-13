import { useState, useEffect, useCallback } from 'react';

interface UseAPIState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAPIOptions {
  skip?: boolean;
  dependencies?: any[];
}

export function useAPI<T>(
  fetcher: () => Promise<T>,
  options: UseAPIOptions = {}
): UseAPIState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseAPIState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await fetcher();
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, loading: false, error });
    }
  }, [fetcher]);

  useEffect(() => {
    if (options.skip) return;

    fetchData();
  }, options.dependencies || [fetchData, options.skip]);

  return {
    ...state,
    refetch: fetchData,
  };
}

export function useAPIMutation<T, R = any>(
  mutator: (data: T) => Promise<R>
) {
  const [state, setState] = useState<UseAPIState<R>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (data: T) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await mutator(data);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    [mutator]
  );

  return {
    ...state,
    execute,
  };
}
