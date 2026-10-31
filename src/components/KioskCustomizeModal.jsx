import React, { useEffect, useRef, useState } from 'react';

export default function KioskCustomizeModal({ drink, toppings, onClose, onAdd }) {
  const [toppingId, setToppingId] = useState('');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  const topping = toppings.find(t => String(t.itemid) === toppingId) ?? null;
  const unit = Number(drink.item_cost) + Number(topping?.item_cost ?? 0);
  return <div className="pg-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="pg-modal" role="dialog" aria-modal="true" aria-labelledby="pg-customize-title">
      <button ref={closeRef} className="pg-close" type="button" onClick={onClose} aria-label="Close customization">×</button>
      <p className="pg-eyebrow">MAKE IT YOURS</p>
      <h2 id="pg-customize-title">{drink.item_name}</h2>
      <p className="pg-muted">Base price ${Number(drink.item_cost).toFixed(2)}</p>
      <label className="pg-field">Topping
        <select value={toppingId} onChange={event => setToppingId(event.target.value)}>
          <option value="">No topping (+$0.00)</option>
          {toppings.map(item => <option key={item.itemid} value={item.itemid}>{item.item_name} (+${Number(item.item_cost).toFixed(2)})</option>)}
        </select>
      </label>
      <fieldset className="pg-size"><legend>Size</legend>
        <label><input type="radio" name="pg-size" checked={size === 'M'} onChange={() => setSize('M')}/> Medium</label>
        <label><input type="radio" name="pg-size" checked={size === 'L'} onChange={() => setSize('L')}/> Large</label>
      </fieldset>
      <div className="pg-quantity"><span>Quantity</span><div><button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(q => q + 1)} aria-label="Increase quantity">+</button></div></div>
      <button className="pg-primary" type="button" onClick={() => onAdd({ drink, topping, size, quantity })}>Add to order · ${(unit * quantity).toFixed(2)}</button>
      
    </section>
  </div>;
}
