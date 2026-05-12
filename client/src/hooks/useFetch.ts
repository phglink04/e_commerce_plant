/**
 * useFetch - Generic Data Fetching Hook
 * Xử lý loading, error, retry logic cho bất kỳ API call nào
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { ApiError } from "@/types";

interface UseFetchOptions {
  skip?: boolean;
  retries?: number;
  retryDelay?: number;
  cacheTime?: number;
}

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const cache = new Map<string, { data: any; timestamp: number }>();

export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  options: UseFetchOptions = {},
): UseFetchState<T> {
  const {
    skip = false,
    retries = 3,
    retryDelay = 1000,
    cacheTime = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<ApiError | null>(null);

  const retryCount = useRef(0);
  const cacheKey = useRef(JSON.stringify([...deps, fetcher.toString()]));

  const fetchData = useCallback(
    async (attempt = 0) => {
      try {
        setLoading(true);
        setError(null);

        // Check cache
        const cached = cache.get(cacheKey.current);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        const result = await fetcher();
        setData(result);

        // Cache result
        if (cacheTime > 0) {
          cache.set(cacheKey.current, { data: result, timestamp: Date.now() });
        }

        retryCount.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);

        // Retry logic
        if (attempt < retries) {
          retryCount.current = attempt + 1;
          setTimeout(
            () => fetchData(attempt + 1),
            retryDelay * Math.pow(2, attempt),
          );
        }
      } finally {
        if (attempt === retries || attempt === 0) {
          setLoading(false);
        }
      }
    },
    [fetcher, retries, retryDelay, cacheTime],
  );

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(0),
  };
}
