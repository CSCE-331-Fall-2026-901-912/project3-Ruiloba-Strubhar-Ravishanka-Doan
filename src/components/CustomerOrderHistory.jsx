import { useEffect, useRef } from 'react';

const money = amount => `$${Number(amount || 0).toFixed(2)}`;

export default function CustomerOrderHistory({ orders, loading, error, onClose }) {
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, []);

  return (
    <div className="pg-modal-backdrop">
      <section
        ref={modalRef}
        className="pg-modal pg-account-history"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pg-order-history-title"
      >
        <button ref={closeRef} className="pg-close" type="button" onClick={onClose} aria-label="Close order history">×</button>
        <p className="pg-eyebrow">YOUR PEARL GARDEN ORDERS</p>
        <h2 id="pg-order-history-title">Order history</h2>
        {loading ? (
          <p role="status">Loading your orders…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : orders.length === 0 ? (
          <p>No orders are linked to this account yet. Future orders placed while signed in will appear here.</p>
        ) : (
          <ol className="pg-account-history-list">
            {orders.map(order => (
              <li key={order.orderid}>
                <div className="pg-account-order-heading">
                  <strong>Order #{order.orderid}</strong>
                  <strong>{money(order.total)}</strong>
                </div>
                <time dateTime={order.ordered_at}>
                  {new Date(order.ordered_at).toLocaleString()}
                </time>
                <ul>
                  {(order.items || []).map((item, index) => (
                    <li key={`${order.orderid}-${index}`}>
                      {item.quantity} × {item.drinkName} ({item.size}) · {item.topping}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
