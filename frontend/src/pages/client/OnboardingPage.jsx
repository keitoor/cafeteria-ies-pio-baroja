import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  { emoji: '☕', title: '¡Bienvenido a la Cafetería!', text: 'Pide tus bocadillos, bebidas y mucho más desde tu móvil sin hacer colas.' },
  { emoji: '🛒', title: 'Añade al carrito', text: 'Explora el catálogo, filtra por categoría y añade lo que quieras a tu pedido.' },
  { emoji: '💳', title: 'Paga con tarjeta', text: 'Pago seguro con tarjeta de crédito o débito. Sin efectivo, sin esperas.' },
  { emoji: '📱', title: 'Recoge con tu código QR', text: 'Recibirás un código único. Muéstralo en la cafetería y recoge tu pedido.' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const finish = () => {
    localStorage.setItem('cafe_onboarding_seen', '1');
    navigate('/login', { replace: true });
  };

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else finish();
  };

  const slide = SLIDES[step];

  return (
    <div className="onboarding">
      <div className="ob-progress">
        {SLIDES.map((_, i) => (
          <div key={i} className={`ob-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      <div className="ob-content">
        <div className="ob-emoji">{slide.emoji}</div>
        <h1 className="ob-title">{slide.title}</h1>
        <p className="ob-text">{slide.text}</p>
      </div>

      <div className="ob-actions">
        <button className="btn btn-primary" onClick={next}>
          {step < SLIDES.length - 1 ? 'Siguiente →' : '¡Empezar!'}
        </button>
        {step < SLIDES.length - 1 && (
          <button className="ob-skip" onClick={finish}>Saltar</button>
        )}
      </div>
    </div>
  );
}
