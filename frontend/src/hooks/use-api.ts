import { useEffect, useState } from 'react';

/**
 * Simple data-fetching hook that replaces @tanstack/react-query.
 * Returns { data, isLoading, isError, error, refetch }.
 */
export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refetch = async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, isLoading, isError, error, refetch };
}
