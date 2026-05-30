import { memo } from 'react';
import { allergenLabels } from '../services/mockData';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function ProductCard({ product, isFavorite, onToggleFavorite, onAdd }) {
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const lowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <div
      ref={ref}
      className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity .35s ease, transform .35s ease',
      }}
    >
      <button
        className="product-fav"
        onClick={() => onToggleFavorite(product.id)}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      <div className="product-emoji">{product.emoji}</div>

      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-desc">{product.description}</div>

        {outOfStock && <div className="stock-badge stock-out">Agotado</div>}
        {lowStock && !outOfStock && (
          <div className="stock-badge stock-low">¡Últimas {product.stock}!</div>
        )}

        {product.allergens?.length > 0 && (
          <div className="product-allergens">
            {product.allergens.map((a) => (
              <span key={a} className="allergen-tag" title={allergenLabels[a]}>
                {allergenLabels[a]}
              </span>
            ))}
          </div>
        )}

        <div className="product-bottom">
          <span className="product-price">{Number(product.price).toFixed(2)} €</span>
          <button
            className={`product-add ${outOfStock ? 'disabled' : ''}`}
            onClick={(e) => !outOfStock && onAdd(product, e)}
            disabled={outOfStock}
            aria-label={outOfStock ? 'Sin stock' : `Añadir ${product.name}`}
          >
            {outOfStock ? '✕' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard, (prev, next) =>
  prev.product.id === next.product.id &&
  prev.product.price === next.product.price &&
  prev.product.stock === next.product.stock &&
  prev.product.available === next.product.available &&
  prev.isFavorite === next.isFavorite
);
