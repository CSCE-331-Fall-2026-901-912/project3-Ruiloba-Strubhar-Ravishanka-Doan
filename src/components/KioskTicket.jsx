import React from 'react';
const money = amount => `$${Number(amount).toFixed(2)}`;
export default function KioskTicket({ order, onCheckout, submitting }) {
  return <aside className="pg-ticket">
    <p className="pg-eyebrow">YOUR ORDER</p><h2>Current ticket</h2>
    <div className="pg-ticket-items">
      {order.items.length === 0 ? <div className="pg-empty"><img src="/pearl-garden-cup.png" alt=""/><strong>Your order is empty</strong><span>Select a drink to get started!</span></div> : order.items.map(item => <div className="pg-ticket-item" key={item.key}>
        <div><strong>{item.drinkName}</strong><small>{item.size === 'M' ? 'Medium' : 'Large'} · {item.toppingName}</small><small>{money((item.drinkPrice + item.toppingPrice) * item.quantity)}</small></div>
        <div className="pg-ticket-actions"><button type="button" aria-label={`Decrease ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, -1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, 1)}>+</button><button type="button" aria-label={`Remove ${item.drinkName}`} onClick={() => order.remove(item.key)}>×</button></div>
      </div>)}
    </div>
    <div className="pg-totals"><div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div><div><span>Tax (8.25%)</span><strong>{money(order.tax)}</strong></div><div className="pg-grand-total"><span>Total before tip</span><strong>{money(order.subtotal + order.tax)}</strong></div></div>
    <button className="pg-primary" type="button" disabled={!order.items.length || submitting} onClick={onCheckout}>{submitting ? 'Processing…' : 'Checkout'}</button>
  </aside>;
}
