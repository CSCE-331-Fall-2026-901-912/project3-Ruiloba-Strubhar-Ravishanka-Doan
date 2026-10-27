import React from "react";
import { money } from "../data/shop.js";

export default function OrderSummary({ order, onCheckout, checkoutLabel = "Charge guest" }) {
  return (
    <aside className="order-panel">
      <div className="order-heading">
        <div><p className="eyebrow">YOUR ORDER</p><h2>Current ticket</h2></div>
        <span className="item-count">{order.count}</span>
      </div>
      {order.cart.length === 0 ? (
        <div className="empty-order"><span>🧋</span><strong>Nothing brewing yet</strong><p>Add a drink to start an order.</p></div>
      ) : (
        <div className="order-items">
          {order.cart.map((item) => (
            <div className="order-item" key={item.name}>
              <span className="mini-drink">{item.icon}</span>
              <span className="order-item-name"><strong>{item.name}</strong><small>{money(item.price)} each</small></span>
              <div className="quantity">
                <button type="button" onClick={() => order.adjust(item.name, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => order.adjust(item.name, 1)} aria-label={`Add one ${item.name}`}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="order-totals">
        <div><span>Subtotal</span><span>{money(order.total)}</span></div>
        <div><span>Tax <small>(8.25%)</small></span><span>{money(order.total * 0.0825)}</span></div>
        <div className="grand-total"><strong>Total</strong><strong>{money(order.total * 1.0825)}</strong></div>
      </div>
      <button className="button button-dark checkout-button" type="button" disabled={order.count === 0} onClick={onCheckout}>
        {checkoutLabel} <span>→</span>
      </button>
    </aside>
  );
}
