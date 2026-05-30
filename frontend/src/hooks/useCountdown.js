import { useEffect, useState } from 'react';

/**
 * Cuenta atrás hasta una fecha futura. Devuelve un objeto con horas,
 * minutos, segundos y total de ms restantes. Se detiene automáticamente
 * cuando llega a cero.
 *
 * @param {Date|number} targetDate - momento al que contar
 * @returns {{ hours, minutes, seconds, totalMs, finished }}
 */
export default function useCountdown(targetDate) {
  const target = targetDate instanceof Date ? targetDate.getTime() : targetDate;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (now >= target) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [now, target]);

  const totalMs = Math.max(0, target - now);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  return {
    hours,
    minutes,
    seconds,
    totalMs,
    finished: totalMs === 0,
  };
}
