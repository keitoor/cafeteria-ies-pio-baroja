import { useEffect, useState } from 'react';

/**
 * Hook que devuelve true/false según si una media query CSS
 * está activa. Se actualiza automáticamente al cambiar el tamaño
 * de pantalla. Usado para adaptar el layout (sidebar, columnas, etc.)
 *
 * @param {string} query - media query CSS, ej: '(min-width: 1024px)'
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
