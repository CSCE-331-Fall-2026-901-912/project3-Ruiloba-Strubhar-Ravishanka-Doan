import React from "react";
import { money } from "../data/shop.js";

// Added 'isHighContrast' property to sync layout variables
export default function OrderSummary({ order, onCheckout, checkoutLabel = "Charge guest", isHighContrast }) {
  return (
    <aside className="order-panel" style={isHighContrast ? { backgroundColor: '#1e003a', border: '4px solid #ffffff' } : {}}>
      <div className="order-heading">
        <div>
          <p className="eyebrow" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>YOUR ORDER</p>
          <h2 style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Current ticket</h2>
        </div>
        <span className="item-count" style={isHighContrast ? { backgroundColor: '#ffffff', color: '#120024', fontWeight: '900', border: '2px solid #ffb3df' } : {}}>{order.count}</span>
      </div>
      {order.cart.length === 0 ? (
        <div className="empty-order">
          <span aria-hidden="true">🧋</span>
          <strong style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Nothing brewing yet</strong>
          <p style={isHighContrast ? { color: '#ffffff', fontWeight: '700' } : {}}>Add a drink to start an order.</p>
        </div>
      ) : (
        <div className="order-items">
          {order.cart.map((item) => (
            <div className="order-item" key={item.name} style={isHighContrast ? { borderBottom: '3px solid #ffffff', paddingBottom: '12px' } : {}}>
              <span className="mini-drink" aria-hidden="true">{item.icon}</span>
              <span className="order-item-name">
                <strong style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{item.name}</strong>
                <small style={isHighContrast ? { color: '#ffffff', fontWeight: '700' } : {}}>{money(item.price)} each</small>
              </span>
              <div className="quantity">
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff', backgroundColor: '#120024' } : {}} type="button" onClick={() => order.adjust(item.name, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                <span style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{item.quantity}</span>
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff', backgroundColor: '#120024' } : {}} type="button" onClick={() => order.adjust(item.name, 1)} aria-label={`Add one ${item.name}`}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="order-totals" style={isHighContrast ? { borderTop: '3px solid #ffffff', paddingTop: '12px' } : {}}>
        <div><span style={isHighContrast ? { color: '#ffffff' } : {}}>Subtotal</span><span style={isHighContrast ? { color: '#ffffff' } : {}}>{money(order.total)}</span></div>
        <div><span style={isHighContrast ? { color: '#ffffff' } : {}}>Tax <small>(8.25%)</small></span><span style={isHighContrast ? { color: '#ffffff' } : {}}>{money(order.total * 0.0825)}</span></div>
        <div className="grand-total"><strong style={isHighContrast ? { color: '#ffffff' } : {}}>Total</strong><strong style={isHighContrast ? { color: '#ffb3df', fontSize: '1.5rem', fontWeight: '950' } : {}}>{money(order.total * 1.0825)}</strong></div>
      </div>
      <button
        className="button button-dark checkout-button"
        type="button"
        disabled={order.count === 0}
        style={isHighContrast ? { backgroundColor: '#ffffff', color: '#120024', border: '3px solid #ffb3df', fontWeight: '950', fontSize: '1.2rem', opacity: order.count === 0 ? 0.5 : 1 } : {}}
        onClick={onCheckout}
      >
        {checkoutLabel} <span aria-hidden="true">→</span>
      </button>
    </aside>
  );
}
