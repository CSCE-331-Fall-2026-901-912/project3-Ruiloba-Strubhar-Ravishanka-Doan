import React, { useEffect, useRef, useState } from 'react';

const money = amount => `$${Number(amount).toFixed(2)}`;

export default function KioskCheckoutModal({ order, onClose, onConfirm, submitting }) {
  const [tipOption, setTipOption] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [payType, setPayType] = useState('');

  const modalRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();

    const handleKey = event => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [onClose, submitting]);

  const handleModalKeyDown = (event) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  };

  const tip = tipOption === 'custom' ? Number(customTip || 0) : Math.round(order.subtotal * tipOption * 100) / 100;
  const valid = Number.isFinite(tip) && tip >= 0 && tip <= 1000;

  const pressKey = key => {
    if (submitting) return;
    setCustomTip(current => {
      let updatedValue = current;
      if (key === 'clear') {
        updatedValue = '';
      } else if (key === 'backspace') {
        updatedValue = current.slice(0, -1);
      } else if (key === '.') {
        updatedValue = current.includes('.') ? current : `${current || '0'}.`;
      } else {
        const decimals = current.split('.')[1];
        if (decimals !== undefined && decimals.length >= 2) return current;
        const next = current === '0' ? key : current + key;
        if (Number(next) > 1000) {
          return current;
        }
        updatedValue = next;
      }
      return updatedValue;
    });
  };

  return (
    <div
      className="pg-modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        ref={modalRef}
        onKeyDown={handleModalKeyDown}
        className="pg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pg-checkout-title"
      >
        <button ref={closeRef} className="pg-close" type="button" onClick={onClose} disabled={submitting} aria-label="Close checkout">×</button>
        <p className="pg-eyebrow">ALMOST THERE</p>
        <h2 id="pg-checkout-title">Review your Order</h2>
        <p>{order.count} drink{order.count === 1 ? '' : 's'} · Subtotal {money(order.subtotal)} · Tax {money(order.tax)}</p>
        <h3 id="pg-tip-heading">Add a tip</h3>
        <div className="pg-tip-options" role="group" aria-labelledby="pg-tip-heading">
          {[0, 0.1, 0.15, 0.2].map(value => (
            <button
              className={tipOption === value ? 'active' : ''}
              type="button"
              key={value}
              aria-pressed={tipOption === value}
              disabled={submitting}
              onClick={() => setTipOption(value)}
            >
              {Math.round(value * 100)}%
            </button>
          ))}
          <button
            type="button"
            className={tipOption === 'custom' ? 'active' : ''}
            aria-pressed={tipOption === 'custom'}
            disabled={submitting}
            onClick={() => setTipOption('custom')}
          >
            Custom
          </button>
        </div>
        {tipOption === 'custom' && (
          <div className="pg-tip-custom">
            <span id="pg-custom-tip-label" className="pg-tip-label">Custom tip ($)</span>
            <output className="pg-tip-display" aria-labelledby="pg-custom-tip-label">${customTip || '0.00'}</output>
            <div className="pg-tip-numpad" role="group" aria-label="Custom tip number pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '.', '⌫'].map(key => (
                <button
                  key={key}
                  type="button"
                  disabled={submitting}
                  className={tipOption === 'custom' && key === 'Clear' ? 'pg-tip-key-clear active' : key === 'Clear' ? 'pg-tip-key-clear' : key === '⌫' ? 'pg-tip-key-delete' : ''}
                  aria-label={key === '⌫' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key}
                  onClick={() => pressKey(key === 'Clear' ? 'clear' : key === '⌫' ? 'backspace' : key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}
        <fieldset className="pg-payment-fieldset" disabled={submitting}>
          <legend>How would you like to pay?</legend>
          <div className="pg-payment-options">
            {[['mobile', '📱', 'Mobile'], ['cash', '💵', 'Cash'], ['card', '💳', 'Card']].map(([value, symbol, label]) => (
              <button
                key={value}
                type="button"
                className={`pg-payment-choice ${payType === value ? 'selected' : ''}`}
                aria-pressed={payType === value}
                onClick={() => setPayType(value)}
              >
                <span aria-hidden="true">{symbol}</span><strong>{label}</strong>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="pg-checkout-total" aria-live="polite">
          <span>Total</span>
          <strong>{valid ? money(order.subtotal + order.tax + tip) : 'Invalid tip'}</strong>
        </div>
        <button
          type="button"
          className="pg-primary"
          disabled={!valid || !payType || submitting}
          onClick={() => onConfirm(Math.round(tip * 100) / 100, payType)}
        >
          {submitting ? 'Saving order…' : 'Place order'}
        </button>
      </section>
    </div>
  );
}
