import { useEffect, useState } from 'react';

/**
 * Devuelve un valor "debounced" que solo se actualiza después de `delay`
 * milisegundos sin cambios. Útil para campos de búsqueda y filtros: en
 * vez de llamar a la API por cada letra, solo llama cuando el usuario
 * deja de escribir.
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
