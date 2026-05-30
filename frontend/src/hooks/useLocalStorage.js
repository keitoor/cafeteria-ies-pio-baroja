import { useCallback, useState } from 'react';

/**
 * Hook que sincroniza estado de React con localStorage.
 * Útil para persistir preferencias del usuario entre sesiones.
 * Acepta un valor inicial y serializa/deserializa JSON automáticamente.
 *
 * @param {string} key     - clave en localStorage
 * @param {any}    initial - valor inicial si la clave no existe
 */
export default function useLocalStorage(key, initial) {
  const [stored, setStored] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const toStore = typeof value === 'function' ? value(stored) : value;
      setStored(toStore);
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (err) {
      console.error(`useLocalStorage: error saving key "${key}"`, err);
    }
  }, [key, stored]);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStored(initial);
    } catch {}
  }, [key, initial]);

  return [stored, setValue, removeValue];
}
