import { useState, useEffect } from "react";

/**
 * Hydration-safe wrapper for persisted Zustand stores in Next.js SSR.
 * Prevents "Text content did not match. Server: X, Client: Y" errors.
 */
export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F
): F | undefined {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
}
