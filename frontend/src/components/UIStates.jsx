import { memo } from 'react';

export const EmptyState = memo(function EmptyState({ emoji = '📭', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-emoji">{emoji}</div>
      {title && <div className="empty-state-title">{title}</div>}
      {text && <div className="empty-state-text">{text}</div>}
      {action}
    </div>
  );
});

export const LoadingState = memo(function LoadingState({ text }) {
  return (
    <div className="empty-state">
      <div className="loader" style={{ margin: '0 auto' }} />
      {text && <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>{text}</div>}
    </div>
  );
});

export const StatusPill = memo(function StatusPill({ status }) {
  const labels = {
    pending_payment: 'Pendiente pago',
    paid: 'Pagado',
    ready: '¡Listo!',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return (
    <span className={`status-pill status-${status}`}>
      {labels[status] || status}
    </span>
  );
});

export const ErrorState = memo(function ErrorState({ onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-state-emoji">⚠️</div>
      <div className="empty-state-title">Error al cargar</div>
      <div className="empty-state-text">Comprueba tu conexión</div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ marginTop: 16, maxWidth: 200, marginInline: 'auto' }}>
          Reintentar
        </button>
      )}
    </div>
  );
});
