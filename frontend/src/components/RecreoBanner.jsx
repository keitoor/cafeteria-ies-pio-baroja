import { useEffect, useState } from 'react';

function pad(n) { return String(n).padStart(2, '0'); }

function isOpen(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const totalMins = h * 60 + m;
  return totalMins >= 8 * 60 + 30 && totalMins < 21 * 60;
}

export default function RecreoBanner() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const open = isOpen(now);
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const day = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="receso-banner" style={{
      background: open
        ? 'linear-gradient(135deg, var(--green), var(--green-dark))'
        : 'linear-gradient(135deg, #3a3a3a, #222)',
    }}>
      <div>
        <div className="receso-time">{time}</div>
        <div className="receso-label" style={{ textTransform: 'capitalize' }}>{day}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="receso-status" style={{
          background: open ? 'rgba(255,255,255,.2)' : 'rgba(255,100,100,.3)',
          color: 'white',
        }}>
          {open ? '✅ Abierto' : '❌ Cerrado'}
        </div>
        <div style={{ fontSize: 10, opacity: .7, marginTop: 4 }}>
          Horario: 08:30 – 21:00
        </div>
      </div>
    </div>
  );
}
