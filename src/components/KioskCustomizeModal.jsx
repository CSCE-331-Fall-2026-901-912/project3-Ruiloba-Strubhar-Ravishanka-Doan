import React, { useEffect, useRef, useState } from 'react';

export default function KioskCustomizeModal({ drink, toppings, onClose, onAdd, editingItem = null }) {
  const initialIds = editingItem?.toppingIds
    ? editingItem.toppingIds.map(String)
    : (editingItem?.toppingId != null ? [String(editingItem.toppingId)] : []);
  const [selectedToppingIds, setSelectedToppingIds] = useState(initialIds);
  const [size, setSize] = useState(editingItem?.size ?? 'M');
  const [quantity, setQuantity] = useState(editingItem?.quantity ?? 1);
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  const toggleTopping = id => setSelectedToppingIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]);
  const selectedToppings = toppings.filter(t => selectedToppingIds.includes(String(t.itemid)));
  const toppingPrice = selectedToppings.reduce((sum, item) => sum + Number(item.item_cost ?? 0), 0);
  const unit = Number(drink.item_cost) + toppingPrice + (size === 'L' ? 0.50 : 0);
  return <div className="pg-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="pg-modal" role="dialog" aria-modal="true" aria-labelledby="pg-customize-title">
      <button ref={closeRef} className="pg-close" type="button" onClick={onClose} aria-label="Close customization">×</button>
      <p className="pg-eyebrow">{editingItem ? 'EDIT YOUR DRINK' : 'MAKE IT YOURS'}</p>
      <h2 id="pg-customize-title">{drink.item_name}</h2>
      <p className="pg-muted">Base price ${Number(drink.item_cost).toFixed(2)}</p>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Toppings</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid #d5b5e4", borderRadius: "10px", padding: "12px" }}>
          {toppings.map(item => <label key={item.itemid} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}><input type="checkbox" checked={selectedToppingIds.includes(String(item.itemid))} onChange={() => toggleTopping(String(item.itemid))} /> {item.item_name} (+${Number(item.item_cost).toFixed(2)})</label>)}
        </div>
      </div>
      <fieldset className="pg-size"><legend>Size</legend>
        <label><input type="radio" name="pg-size" checked={size === 'M'} onChange={() => setSize('M')}/> Medium</label>
        <label><input type="radio" name="pg-size" checked={size === 'L'} onChange={() => setSize('L')}/> Large (+$0.50)</label>
      </fieldset>
      <div className="pg-quantity"><span>Quantity</span><div><button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(q => q + 1)} aria-label="Increase quantity">+</button></div></div>
      <button className="pg-primary" type="button" onClick={() => onAdd({ drink, toppings: selectedToppings, size, quantity })}>{editingItem ? 'Save changes' : 'Add to order'} · ${(unit * quantity).toFixed(2)}</button>
    </section>
  </div>;
}
