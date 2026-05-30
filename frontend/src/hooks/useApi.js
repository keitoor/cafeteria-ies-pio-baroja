import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook genérico para llamadas a la API.
 * Maneja loading, error, datos y reintentos de forma consistente.
 * Evita race conditions con un flag "cancelled" que ignora respuestas
 * de peticiones obsoletas si las dependencias cambian antes de resolver.
 *
 * @param {Function} fetcher - función async que devuelve la promesa
 * @param {Array}    deps    - dependencias que disparan refetch (como useEffect)
 * @param {Object}   options - { immediate: true } para auto-ejecutar al montar
 */
export default function useApi(fetcher, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Guardamos el fetcher en ref para que cambios en deps no recreen la función
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: execute, setData };
}
