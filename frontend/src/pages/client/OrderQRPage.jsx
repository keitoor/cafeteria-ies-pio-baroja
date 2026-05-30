import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../../services/api';
import useApi from '../../hooks/useApi';
import useCountdown from '../../hooks/useCountdown';
import { LoadingState } from '../../components/UIStates';

export default function OrderQRPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const { data: order, loading } = useApi(() => api.orders.get(id), [id]);

  // Cuenta atrás hasta la hora de recogida (asumiendo hoy)
  const pickupTime = useMemo(() => {
    if (!order) return Date.now();
    const [hh, mm] = order.pickup_slot.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d.getTime();
  }, [order]);

  const { minutes, seconds, totalMs, finished } = useCountdown(pickupTime);

  // Dibuja el QR cuando llega el pedido
  useEffect(() => {
    if (!order?.pickup_code || !canvasRef.current) return;
    const payload = JSON.stringify({
      order_id: order.id,
      pickup_code: order.pickup_code,
    });
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 1,
      color: { dark: '#141414', light: '#ffffff' },
    });
  }, [order]);

  if (loading || !order) {
    return <LoadingState text="Cargando pedido..." />;
  }

  return (
    <div className="qr-page">
      <button className="qr-back" onClick={() => navigate('/orders')}>
        ←
      </button>

      <div className="qr-content">
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 8 }}>
          Pedido #{order.id}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          ¡Pedido confirmado! 🎉
        </h2>

        <div className="qr-code-box">
          <canvas ref={canvasRef} />
        </div>

        <div className="pickup-code">{order.pickup_code}</div>

        <p className="qr-hint">
          Muestra este código al personal de la cafetería
        </p>

        <div className="qr-countdown">
          Tu pedido estará listo a las <strong>{order.pickup_slot}</strong>
          {!finished && totalMs > 0 && (
            <span className="qr-countdown-time">
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </span>
          )}
        </div>

        <button
          className="btn btn-secondary"
          style={{ marginTop: 20, color: 'var(--green)' }}
          onClick={() => navigate('/orders')}
        >
          Ver mis pedidos
        </button>
      </div>
    </div>
  );
}
