import { useCallback, useRef } from 'react';

/**
 * Encapsula la animación de "emoji volando hacia el icono del carrito"
 * al añadir un producto. Expone un ref que se debe asignar al icono del
 * carrito y una función `fly(emoji, sourceEl)` que dispara la animación.
 */
export default function useFlyToCart() {
  const targetRef = useRef(null);

  const fly = useCallback((emoji, sourceEl) => {
    if (!sourceEl || !targetRef.current) return;
    const from = sourceEl.getBoundingClientRect();
    const to = targetRef.current.getBoundingClientRect();

    const node = document.createElement('div');
    node.className = 'fly-emoji';
    node.textContent = emoji;
    node.style.left = `${from.left}px`;
    node.style.top = `${from.top}px`;
    document.body.appendChild(node);

    requestAnimationFrame(() => {
      node.style.left = `${to.left}px`;
      node.style.top = `${to.top}px`;
      node.style.opacity = '0';
      node.style.transform = 'scale(.4)';
    });

    setTimeout(() => node.remove(), 800);
  }, []);

  return { targetRef, fly };
}
