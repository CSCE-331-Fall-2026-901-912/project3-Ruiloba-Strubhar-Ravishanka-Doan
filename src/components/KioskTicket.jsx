import React from 'react';

const money = amount => `$${Number(amount).toFixed(2)}`;

export default function KioskTicket({ order, onCheckout, onEdit, submitting }) {
  return (
    <aside className="pg-ticket">
      <p className="pg-eyebrow">YOUR ORDER</p>
      <h2>Current ticket</h2>

      <div className="pg-ticket-items">
        {order.items.length === 0 ? (
          <div className="pg-empty">
            <img src="/pearl-garden-cup.png" alt="" />
            <strong>Your order is empty</strong>
            <span>Select a drink to get started!</span>
          </div>
        ) : order.items.map(item => (
          <div className="pg-ticket-item pg-ticket-item-neat" key={item.key}>
            <div className="pg-ticket-item-heading">
              <strong title={item.drinkName}>{item.drinkName}</strong>
              <button
                type="button"
                className="pg-edit-button"
                title="Edit drink"
                aria-label={`Edit ${item.drinkName}`}
                onClick={() => onEdit(item)}
              >✎</button>
            </div>

            <small className="pg-ticket-item-detail">
              {item.size === 'M' ? 'Medium' : 'Large (+$0.50)'} · {item.toppingName}
            </small>

            <div className="pg-ticket-item-bottom">
              <strong className="pg-ticket-line-price">
                {money(order.unitPrice(item) * item.quantity)}
              </strong>
              <div className="pg-ticket-actions">
                <button type="button" aria-label={`Decrease ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, -1)}>−</button>
                <span>{item.quantity}</span>
                <button type="button" aria-label={`Increase ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, 1)}>+</button>
                <button type="button" aria-label={`Remove ${item.drinkName}`} onClick={() => order.remove(item.key)}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pg-totals">
        <div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>
        <div><span>Tax (8.25%)</span><strong>{money(order.tax)}</strong></div>
        <div className="pg-grand-total"><span>Total before tip</span><strong>{money(order.subtotal + order.tax)}</strong></div>
      </div>
      <button className="pg-primary" type="button" disabled={!order.items.length || submitting} onClick={onCheckout}>
        {submitting ? 'Processing…' : 'Checkout'}
      </button>
    </aside>
  );
}
