import { useState, useEffect, useCallback } from "react";

/**
 * Hook reutilizable para realizar llamadas a la API con control de estado
 */
export function useApi(apiFunc, autoFetch = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...params) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...params);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "Error al realizar la petición");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, [autoFetch, execute]);

  return { data, loading, error, refetch: execute };
}
