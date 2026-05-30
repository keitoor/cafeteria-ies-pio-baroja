import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import useFavorites from '../../hooks/useFavorites';
import useFlyToCart from '../../hooks/useFlyToCart';
import TopBar from '../../components/TopBar';
import BottomNav from '../../components/BottomNav';
import RecreoBanner from '../../components/RecreoBanner';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import ProductCard from '../../components/ProductCard';
import { EmptyState, LoadingState } from '../../components/UIStates';

export default function CatalogPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, count } = useCart();
  const toast = useToast();
  const { targetRef: cartIconRef, fly } = useFlyToCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [showFavs, setShowFavs] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading } = useApi(
    () => api.products.list({ search: debouncedSearch, category }),
    [debouncedSearch, category]
  );

  const products = data?.results ?? [];
  const displayed = showFavs ? products.filter(p => isFavorite(p.id)) : products;

  const handleAdd = useCallback((product, e) => {
    if (product.stock !== undefined && product.stock <= 0) {
      toast.show(`${product.name} está agotado`, 'error');
      return;
    }
    addItem(product);
    fly(product.emoji, e.currentTarget);
    toast.show(`${product.name} añadido ✓`, 'success');
  }, [addItem, fly, toast]);

  return (
    <div className="app-shell">
      <TopBar user={user} cartCount={count} cartIconRef={cartIconRef} onCartClick={() => navigate('/cart')} />
      <RecreoBanner />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar productos..." />

      {/* Filtros de categoría + toggle favoritos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <CategoryFilter active={category} onChange={(c) => { setCategory(c); setShowFavs(false); }} inline />
        <button
          onClick={() => setShowFavs(!showFavs)}
          style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: showFavs ? '#ff6b9d' : 'var(--surface)',
            color: showFavs ? 'white' : 'var(--text-muted)',
            border: `1.5px solid ${showFavs ? '#ff6b9d' : 'var(--border)'}`,
            cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
          }}
        >
          {showFavs ? '❤️ Favoritos' : '🤍 Favoritos'}
        </button>
      </div>

      <div className="product-grid">
        {loading && <LoadingState />}

        {!loading && displayed.length === 0 && (
          <EmptyState
            emoji={showFavs ? '💔' : '🔎'}
            title={showFavs ? 'Sin favoritos' : 'No hay resultados'}
            text={showFavs ? 'Marca productos con ❤️ para verlos aquí' : 'Prueba con otra búsqueda'}
          />
        )}

        {!loading && displayed.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            isFavorite={isFavorite(p.id)}
            onToggleFavorite={toggleFavorite}
            onAdd={handleAdd}
          />
        ))}
      </div>

      <BottomNav active="catalog" />
    </div>
  );
}
