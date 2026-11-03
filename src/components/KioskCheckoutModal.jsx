import React, { useState } from 'react';

const money = amount => `$${Number(amount).toFixed(2)}`;

export default function KioskCheckoutModal({ order, onClose, onConfirm, submitting }) {
  const [tipOption, setTipOption] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const tip = tipOption === 'custom' ? Number(customTip || 0) : Math.round(order.subtotal * tipOption) / 100;
  const valid = Number.isFinite(tip) && tip >= 0 && tip <= 1000;

  const pressKey = key => {
    if (submitting) return;
    setCustomTip(current => {
      if (key === 'clear') return '';
      if (key === 'backspace') return current.slice(0, -1);
      if (key === '.') return current.includes('.') ? current : `${current || '0'}.`;
      const decimals = current.split('.')[1];
      if (decimals !== undefined && decimals.length >= 2) return current;
      const next = current === '0' ? key : current + key;
      return Number(next) > 1000 ? current : next;
    });
  };

  return <div className="pg-modal-backdrop"><section className="pg-modal" role="dialog" aria-modal="true" aria-labelledby="pg-checkout-title">
    <button className="pg-close" type="button" onClick={onClose} disabled={submitting} aria-label="Close checkout">×</button>
    <p className="pg-eyebrow">ALMOST THERE</p><h2 id="pg-checkout-title">Review your order</h2>
    <p>{order.count} drink{order.count === 1 ? '' : 's'} · Subtotal {money(order.subtotal)} · Tax {money(order.tax)}</p>
    <h3>Add a tip</h3>
    <div className="pg-tip-options">
      {[0, 0.1, 0.15, 0.2].map(value => <button className={tipOption === value ? 'active' : ''} type="button" key={value} disabled={submitting} onClick={() => setTipOption(value)}>{Math.round(value * 100)}%</button>)}
      <button type="button" className={tipOption === 'custom' ? 'active' : ''} disabled={submitting} onClick={() => setTipOption('custom')}>Custom</button>
    </div>
    {tipOption === 'custom' && <div className="pg-tip-custom">
      <span className="pg-tip-label">Custom tip ($)</span>
      <output className="pg-tip-display" aria-live="polite">${customTip || '0.00'}</output>
      <div className="pg-tip-numpad" aria-label="Custom tip number pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '.', '⌫'].map(key => <button
          key={key} type="button" disabled={submitting}
          className={key === 'Clear' ? 'pg-tip-key-clear' : key === '⌫' ? 'pg-tip-key-delete' : ''}
          aria-label={key === '⌫' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key}
          onClick={() => pressKey(key === 'Clear' ? 'clear' : key === '⌫' ? 'backspace' : key)}
        >{key}</button>)}
      </div>
    </div>}
    <div className="pg-checkout-total"><span>Total</span><strong>{valid ? money(order.subtotal + order.tax + tip) : 'Invalid tip'}</strong></div>
    <button type="button" className="pg-primary" disabled={!valid || submitting} onClick={() => onConfirm(Math.round(tip * 100) / 100)}>{submitting ? 'Saving order…' : 'Place order'}</button>
  </section></div>;
}
