import { useEffect, useRef, useState } from 'react';

/**
 * Hook que detecta si un elemento entra en el viewport.
 * Usado para lazy-rendering de listas largas y animaciones
 * de entrada (fade-in cuando el elemento aparece en pantalla).
 *
 * @param {Object} options - opciones de IntersectionObserver
 * @returns {{ ref, isVisible }}
 */
export default function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(el); // Solo se activa una vez
      }
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
