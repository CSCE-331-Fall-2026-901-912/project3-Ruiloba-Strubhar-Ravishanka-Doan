import React, { useState } from 'react';
const money = amount => `$${Number(amount).toFixed(2)}`;
export default function KioskCheckoutModal({ order, onClose, onConfirm, submitting }) {
  const [tipOption, setTipOption] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const tip = tipOption === 'custom' ? Number(customTip || 0) : Math.round(order.subtotal * tipOption) / 100;
  const valid = Number.isFinite(tip) && tip >= 0 && tip <= 1000;
  return <div className="pg-modal-backdrop"><section className="pg-modal" role="dialog" aria-modal="true" aria-labelledby="pg-checkout-title">
    <button className="pg-close" type="button" onClick={onClose} disabled={submitting} aria-label="Close checkout">×</button>
    <p className="pg-eyebrow">ALMOST THERE</p><h2 id="pg-checkout-title">Review your order</h2>
    <p>{order.count} drink{order.count === 1 ? '' : 's'} · Subtotal {money(order.subtotal)} · Tax {money(order.tax)}</p>
    <h3>Add a tip</h3><div className="pg-tip-options">{[0, 0.1, 0.15, 0.2].map(value => <button className={tipOption === value ? 'active' : ''} type="button" key={value} onClick={() => setTipOption(value)}>{Math.round(value * 100)}%</button>)}<button type="button" className={tipOption === 'custom' ? 'active' : ''} onClick={() => setTipOption('custom')}>Custom</button></div>
    {tipOption === 'custom' && <label className="pg-field">Custom tip ($)<input type="number" min="0" max="1000" step="0.01" value={customTip} onChange={e => setCustomTip(e.target.value)} /></label>}
    <div className="pg-checkout-total"><span>Total</span><strong>{valid ? money(order.subtotal + order.tax + tip) : 'Invalid tip'}</strong></div>
    <button type="button" className="pg-primary" disabled={!valid || submitting} onClick={() => onConfirm(Math.round(tip * 100) / 100)}>{submitting ? 'Saving order…' : 'Place order'}</button>
  </section></div>;
}
