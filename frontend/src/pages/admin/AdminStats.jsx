import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import useApi from '../../hooks/useApi';
import { LoadingState } from '../../components/UIStates';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({ label, value, suffix = '', icon, color = 'var(--green)' }) {
  return (
    <div className="admin-stat">
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={{ color }}>{value}{suffix}</div>
    </div>
  );
});

// ── SVG Bar Chart ──────────────────────────────────────────────────────────────
const BarChart = memo(function BarChart({ series, title }) {
  const maxVal = useMemo(() => Math.max(...series.map(s => s.revenue), 1), [series]);
  const W = 320, H = 140, PAD = 30;
  const barW = (W - PAD * 2) / series.length - 4;

  return (
    <div className="admin-order" style={{ overflowX: 'auto' }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>📊 {title}</div>
      <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', maxWidth: W }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line key={pct}
            x1={PAD} y1={PAD + (1 - pct) * H}
            x2={W - PAD} y2={PAD + (1 - pct) * H}
            stroke="#333" strokeWidth="0.5" strokeDasharray="3,3"
          />
        ))}
        {/* Bars */}
        {series.map((s, i) => {
          const x = PAD + i * ((W - PAD * 2) / series.length) + 2;
          const barH = s.revenue > 0 ? (s.revenue / maxVal) * H : 2;
          const y = PAD + H - barH;
          return (
            <g key={s.date}>
              <rect x={x} y={y} width={barW} height={barH}
                fill="var(--green)" rx="3" opacity="0.85" />
              {s.revenue > 0 && (
                <text x={x + barW/2} y={y - 4} textAnchor="middle"
                  fontSize="8" fill="var(--green)" fontFamily="DM Mono">
                  {s.revenue.toFixed(0)}€
                </text>
              )}
              <text x={x + barW/2} y={PAD + H + 14} textAnchor="middle"
                fontSize="8" fill="#666" fontFamily="DM Mono">
                {s.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#888', marginTop: 4 }}>
        Total: {series.reduce((s,b) => s+b.orders, 0)} pedidos · {series.reduce((s,b) => s+b.revenue, 0).toFixed(2)} €
      </div>
    </div>
  );
});

// ── SVG Pie Chart ──────────────────────────────────────────────────────────────
const PieChart = memo(function PieChart({ data, title }) {
  const COLORS = ['#1D9E75', '#f0a050', '#5b8def', '#ff6b9d', '#ffd700', '#a855f7'];
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumAngle = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = cumAngle;
    cumAngle += pct * 2 * Math.PI;
    return { ...d, pct, startAngle, endAngle: cumAngle, color: COLORS[i % COLORS.length] };
  });

  const R = 60, CX = 80, CY = 70;
  const arc = (start, end) => {
    const x1 = CX + R * Math.cos(start - Math.PI/2);
    const y1 = CY + R * Math.sin(start - Math.PI/2);
    const x2 = CX + R * Math.cos(end - Math.PI/2);
    const y2 = CY + R * Math.sin(end - Math.PI/2);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="admin-order">
      <div style={{ fontWeight: 700, marginBottom: 12 }}>🥧 {title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <svg viewBox={`0 0 ${CX*2} ${CY*2}`} style={{ width: 140, flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={arc(s.startAngle, s.endAngle)} fill={s.color} opacity="0.9" />
          ))}
          <circle cx={CX} cy={CY} r={R * 0.5} fill="#1a1a1a" />
          <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">
            {total}
          </text>
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: '#ccc' }}>{s.label}</span>
              <span style={{ fontFamily: 'DM Mono', color: s.color, fontWeight: 700 }}>
                {s.value} ({(s.pct * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Top products list ──────────────────────────────────────────────────────────
const TopProductsList = memo(function TopProductsList({ products }) {
  if (!products?.length) return (
    <div className="admin-order">
      <div style={{ fontWeight: 700, marginBottom: 14 }}>🏆 Top productos</div>
      <div style={{ fontSize: 13, color: '#888' }}>Sin datos aún.</div>
    </div>
  );
  const max = products[0]?.units_sold || 1;
  return (
    <div className="admin-order">
      <div style={{ fontWeight: 700, marginBottom: 14 }}>🏆 Top productos</div>
      {products.map((p, i) => (
        <div key={p.product_id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>{p.emoji}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{p.name}</span>
            <span style={{ fontFamily: 'DM Mono', color: 'var(--green)', fontWeight: 700, fontSize: 13 }}>#{i+1}</span>
          </div>
          {/* Progress bar */}
          <div style={{ background: '#2a2a2a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(p.units_sold/max)*100}%`, height: '100%', background: 'var(--green)', borderRadius: 4, transition: 'width .5s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            {p.units_sold} uds · {p.revenue.toFixed(2)} €
          </div>
        </div>
      ))}
    </div>
  );
});

// ── Date filter ────────────────────────────────────────────────────────────────
function DateFilter({ days, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {[7, 14, 30].map(d => (
        <button key={d} onClick={() => onChange(d)} style={{
          padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: days === d ? 'var(--green)' : '#2a2a2a',
          color: days === d ? 'white' : '#888',
          border: `1px solid ${days === d ? 'var(--green)' : '#333'}`,
          transition: 'all .15s',
        }}>
          {d} días
        </button>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminStats() {
  const [days, setDays] = useState(7);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: summary, refetch: refetchSummary } = useApi(() => api.stats.summary(), []);
  const { data: sales, refetch: refetchSales, loading: salesLoading } = useApi(() => api.stats.sales({ days }), [days]);
  const { data: topProducts, refetch: refetchTop } = useApi(() => api.stats.topProducts(), []);

  // Auto-refresh cada 30 segundos
  const refetchAll = useCallback(() => {
    refetchSummary(); refetchSales(); refetchTop();
    setLastUpdate(new Date());
  }, [refetchSummary, refetchSales, refetchTop]);

  useEffect(() => {
    const t = setInterval(refetchAll, 30000);
    return () => clearInterval(t);
  }, [refetchAll]);

  // Datos para el gráfico de tarta de estados
  const orderStatusData = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Pendientes', value: summary.pending_orders },
      { label: 'Hoy completados', value: summary.today_orders },
    ].filter(d => d.value > 0);
  }, [summary]);

  if (!summary) return <LoadingState />;

  return (
    <div>
      {/* Botón refresh + última actualización */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: '#888' }}>
          Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <button onClick={refetchAll} style={{
          background: '#2a2a2a', color: 'var(--green)', border: '1px solid var(--green)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          🔄 Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="admin-stat-grid">
        <StatCard icon="📦" label="Pedidos hoy" value={summary.today_orders} />
        <StatCard icon="💰" label="Facturación" value={summary.today_revenue.toFixed(2)} suffix="€" />
        <StatCard icon="🎫" label="Ticket medio" value={summary.avg_ticket.toFixed(2)} suffix="€" />
        <StatCard icon="⏳" label="Pendientes" value={summary.pending_orders} color="#ffa04d" />
      </div>

      {/* Filtro de período */}
      <DateFilter days={days} onChange={setDays} />

      {/* Gráfica de barras */}
      {salesLoading ? <LoadingState /> : sales && <BarChart series={sales.series} title={`Ventas últimos ${days} días`} />}

      {/* Gráfica de tarta */}
      {orderStatusData.length > 0 && <PieChart data={orderStatusData} title="Estado de pedidos hoy" />}

      {/* Top productos */}
      <TopProductsList products={topProducts ?? []} />
    </div>
  );
}
