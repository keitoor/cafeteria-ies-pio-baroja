import { isMockMode } from '../services/api';

export default function MockBanner() {
  if (!isMockMode) return null;
  return (
    <div className="mock-banner">
      ⚠ Modo demo activo · Datos en localStorage · Sin backend real
    </div>
  );
}
