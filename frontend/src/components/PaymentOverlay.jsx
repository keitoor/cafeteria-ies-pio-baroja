import { useEffect, useState } from 'react';

// Simula el TPV de Redsys con formulario de tarjeta realista
export default function PaymentOverlay({ state, onClose, onConfirmCard }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});
  const [cardType, setCardType] = useState('');

  useEffect(() => {
    if (state === 'success') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  // Detectar tipo de tarjeta
  const detectCard = (num) => {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return '';
  };

  // Formatear número de tarjeta con espacios
  const formatCardNumber = (val) => {
    const num = val.replace(/\D/g, '').slice(0, 16);
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  // Formatear fecha MM/AA
  const formatExpiry = (val) => {
    const num = val.replace(/\D/g, '').slice(0, 4);
    if (num.length >= 2) return num.slice(0, 2) + '/' + num.slice(2);
    return num;
  };

  const validate = () => {
    const e = {};
    const num = card.number.replace(/\s/g, '');
    if (num.length < 16) e.number = 'Número de tarjeta inválido';
    if (!card.name.trim()) e.name = 'Introduce el nombre del titular';
    const [mm, yy] = card.expiry.split('/');
    if (!mm || !yy || mm > 12 || mm < 1) e.expiry = 'Fecha inválida';
    if (card.cvv.length < 3) e.cvv = 'CVV inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (validate()) onConfirmCard();
  };

  const cardLogos = {
    visa: '💳 VISA',
    mastercard: '💳 MC',
    amex: '💳 AMEX',
  };

  if (state === 'form') {
    return (
      <div className="payment-overlay">
        <div className="payment-card redsys-tpv">
          {/* Header estilo TPV Redsys */}
          <div className="redsys-header">
            <div className="redsys-logo">🏦 Pago Seguro</div>
            <div className="redsys-secure">🔒 SSL</div>
          </div>

          <p style={{ fontSize: 12, color: '#888', marginBottom: 16, textAlign: 'center' }}>
            Introduce los datos de tu tarjeta
          </p>

          {/* Tarjeta visual */}
          <div className="card-visual">
            <div className="card-chip">▬▬</div>
            <div className="card-number-display">
              {card.number || '•••• •••• •••• ••••'}
            </div>
            <div className="card-bottom-display">
              <span>{card.name || 'NOMBRE TITULAR'}</span>
              <span>{card.expiry || 'MM/AA'}</span>
            </div>
            {cardType && <div className="card-type-badge">{cardLogos[cardType]}</div>}
          </div>

          {/* Formulario */}
          <div className="form-field">
            <label className="form-label">Número de tarjeta</label>
            <input
              className={`form-input ${errors.number ? 'input-error' : ''}`}
              placeholder="1234 5678 9012 3456"
              value={card.number}
              maxLength={19}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                setCard({ ...card, number: formatted });
                setCardType(detectCard(formatted));
              }}
              style={{ fontFamily: 'DM Mono', letterSpacing: 2 }}
            />
            {errors.number && <span className="field-error">{errors.number}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Titular de la tarjeta</label>
            <input
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="NOMBRE APELLIDO"
              value={card.name}
              maxLength={30}
              onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-field flex-1">
              <label className="form-label">Caducidad</label>
              <input
                className={`form-input ${errors.expiry ? 'input-error' : ''}`}
                placeholder="MM/AA"
                value={card.expiry}
                maxLength={5}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                style={{ fontFamily: 'DM Mono' }}
              />
              {errors.expiry && <span className="field-error">{errors.expiry}</span>}
            </div>
            <div className="form-field flex-1">
              <label className="form-label">CVV</label>
              <input
                className={`form-input ${errors.cvv ? 'input-error' : ''}`}
                placeholder="•••"
                value={card.cvv}
                maxLength={4}
                type="password"
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                style={{ fontFamily: 'DM Mono', letterSpacing: 4 }}
              />
              {errors.cvv && <span className="field-error">{errors.cvv}</span>}
            </div>
          </div>

          <div className="redsys-footer">
            <span>🔒 Pago cifrado con TLS 1.3</span>
            <span>PCI DSS Compliant</span>
          </div>

          <button className="btn btn-primary" onClick={handlePay} style={{ marginTop: 8 }}>
            💳 Confirmar pago
          </button>
          <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 8 }}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="payment-overlay">
        <div className="payment-card">
          {state === 'processing' && (
            <>
              <div className="payment-icon">🏦</div>
              <div className="loader" style={{ margin: '0 auto 16px' }} />
              <h2 className="payment-title">Procesando pago</h2>
              <p className="payment-text">Conectando con Redsys...<br />No cierres esta pantalla</p>
            </>
          )}
          {state === 'success' && (
            <>
              <div className="payment-icon" style={{ color: 'var(--green)' }}>✅</div>
              <h2 className="payment-title">¡Pago confirmado!</h2>
              <p className="payment-text">Generando tu código de recogida...</p>
            </>
          )}
          {state === 'error' && (
            <>
              <div className="payment-icon">❌</div>
              <h2 className="payment-title">Pago rechazado</h2>
              <p className="payment-text">La entidad bancaria ha rechazado el pago.<br />Comprueba los datos e inténtalo de nuevo.</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>
                Volver a intentar
              </button>
            </>
          )}
        </div>
      </div>
      {showConfetti && <Confetti />}
    </>
  );
}

function Confetti() {
  const colors = ['#1D9E75', '#f0a050', '#FFD700', '#ff6b9d', '#5b8def'];
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti">
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
          width: p.size, height: p.size,
        }} />
      ))}
    </div>
  );
}
