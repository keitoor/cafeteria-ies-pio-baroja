import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * Encapsula la lógica de favoritos del usuario: carga inicial,
 * comprobación de si un id es favorito y toggle optimista.
 */
export default function useFavorites() {
  const [favIds, setFavIds] = useState([]);

  useEffect(() => {
    api.products
      .favorites()
      .then((favs) => setFavIds(favs.map((f) => f.id)))
      .catch(() => setFavIds([]));
  }, []);

  const isFavorite = useCallback((id) => favIds.includes(id), [favIds]);

  const toggleFavorite = useCallback(async (id) => {
    // Optimistic update: cambiamos el estado local antes de la respuesta
    setFavIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    try {
      const result = await api.products.toggleFavorite(id);
      // Reconcilia con el valor real del servidor por si hubo conflicto
      setFavIds((prev) =>
        result.is_favorite
          ? prev.includes(id) ? prev : [...prev, id]
          : prev.filter((x) => x !== id)
      );
      return result;
    } catch (err) {
      // Revert en caso de error
      setFavIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      throw err;
    }
  }, []);

  return { favIds, isFavorite, toggleFavorite };
}
