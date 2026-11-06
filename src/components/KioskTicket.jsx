import React from 'react';

const money = amount => `$${Number(amount).toFixed(2)}`;

export default function KioskTicket({ order, onCheckout, onEdit, submitting, isHighContrast }) {
  return (
    <aside className="pg-ticket" style={isHighContrast ? { backgroundColor: '#1e003a', border: '4px solid #ffffff' } : {}}>
      <p className="pg-eyebrow" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>YOUR ORDER</p>
      <h2 style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Current ticket</h2>

      <div className="pg-ticket-items">
        {order.items.length === 0 ? (
          <div className="pg-empty">
            <img src="/pearl-garden-cup.png" alt="" />
            <strong style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Your order is empty</strong>
            <span style={isHighContrast ? { color: '#ffffff', fontWeight: '700' } : {}}>Select a drink to get started!</span>
          </div>
        ) : order.items.map(item => (
          <div className="pg-ticket-item pg-ticket-item-neat" key={item.key}>
            <div className="pg-ticket-item-heading">
              <strong title={item.drinkName} style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{item.drinkName}</strong>
              <button
                type="button"
                className="pg-edit-button"
                title="Edit drink"
                style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff', backgroundColor: '#120024' } : {}}
                aria-label={`Edit ${item.drinkName}`}
                onClick={() => onEdit(item)}
              >✎</button>
            </div>

            {/* Structurally split the string into distinct fields for independent color targets */}
            <small className="pg-ticket-item-detail" style={{ display: 'block' }}>
              <span className="pg-item-size" style={isHighContrast ? { color: '#ffffff', fontWeight: '800' } : {}}>
                {item.size === 'M' ? 'Medium' : 'Large (+$0.50)'}
              </span>
              {item.toppingNames?.length > 0 && (
                <>
                  <span className="pg-item-divider" style={isHighContrast ? { color: '#ffffff' } : {}}> · </span>
                  <span className="pg-item-toppings" style={isHighContrast ? { color: '#ffb3df', fontWeight: '800' } : {}}>
                    {item.toppingNames.join(', ')}
                  </span>
                </>
              )}
            </small>

            <div className="pg-ticket-item-bottom">
              <strong className="pg-ticket-line-price" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>
                {money(order.unitPrice(item) * item.quantity)}
              </strong>
              <div className="pg-ticket-actions">
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff' } : {}} type="button" aria-label={`Decrease ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, -1)}>−</button>
                <span style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{item.quantity}</span>
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff' } : {}} type="button" aria-label={`Increase ${item.drinkName}`} onClick={() => order.changeQuantity(item.key, 1)}>+</button>
                <button style={isHighContrast ? { border: '2px solid #ffffff', color: '#ffffff' } : {}} type="button" aria-label={`Remove ${item.drinkName}`} onClick={() => order.remove(item.key)}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pg-totals" style={isHighContrast ? { borderTop: '3px solid #ffffff', paddingTop: '12px' } : {}}>
        <div><span style={isHighContrast ? { color: '#ffffff' } : {}}>Subtotal</span><strong style={isHighContrast ? { color: '#ffffff' } : {}}>{money(order.subtotal)}</strong></div>
        <div><span style={isHighContrast ? { color: '#ffffff' } : {}}>Tax (8.25%)</span><strong style={isHighContrast ? { color: '#ffffff' } : {}}>{money(order.tax)}</strong></div>
        <div className="pg-grand-total"><span style={isHighContrast ? { color: '#ffffff' } : {}}>Total Before Tip</span><strong style={isHighContrast ? { color: '#ffb3df', fontSize: '1.4rem' } : {}}>{money(order.subtotal + order.tax)}</strong></div>
      </div>
      <button className="pg-primary" type="button" disabled={!order.items.length || submitting} style={isHighContrast ? { backgroundColor: '#ffffff', color: '#120024', border: '3px solid #ffb3df', fontWeight: '950', fontSize: '1.2rem' } : {}} onClick={onCheckout}>
        {submitting ? 'Processing…' : 'Checkout'}
      </button>
    </aside>
  );
}
