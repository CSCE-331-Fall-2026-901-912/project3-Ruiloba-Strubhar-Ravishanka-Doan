import React, { useEffect, useRef, useState } from 'react';

export default function KioskCustomizeModal({ drink, toppings, onClose, onAdd, editingItem = null }) {
  const initialIds = editingItem?.toppingIds
    ? editingItem.toppingIds.map(String)
    : (editingItem?.toppingId != null ? [String(editingItem.toppingId)] : []);
  const [selectedToppingIds, setSelectedToppingIds] = useState(initialIds);
  const [size, setSize] = useState(editingItem?.size ?? 'M');
  const [quantity, setQuantity] = useState(editingItem?.quantity ?? 1);

  const modalRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleModalKeyDown = (event) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  const toggleTopping = (id) => {
    const isChecked = selectedToppingIds.includes(id);
    if (isChecked) {
      setSelectedToppingIds(prev => prev.filter(value => value !== id));
    } else {
      setSelectedToppingIds(prev => [...prev, id]);
    }
  };

  const selectedToppings = toppings.filter(t => selectedToppingIds.includes(String(t.itemid)));
  const toppingPrice = selectedToppings.reduce((sum, item) => sum + Number(item.item_cost ?? 0), 0);
  const unit = Number(drink.item_cost) + toppingPrice + (size === 'L' ? 0.50 : 0);

  return (
    <div className="pg-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        ref={modalRef}
        onKeyDown={handleModalKeyDown}
        className="pg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pg-customize-title"
      >
        <button ref={closeRef} className="pg-close" type="button" onClick={onClose} aria-label="Close customization">×</button>
        <p className="pg-eyebrow">{editingItem ? 'EDIT YOUR DRINK' : 'MAKE IT YOURS'}</p>
        <h2 id="pg-customize-title">{drink.item_name}</h2>
        <p className="pg-muted">Base price ${Number(drink.item_cost).toFixed(2)}</p>

        <div style={{ marginBottom: "20px" }}>
          <span id="pg-toppings-label" className="pg-label-heading" style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Toppings</span>
          <div role="group" aria-labelledby="pg-toppings-label" className="pg-toppings-list-box" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-y", border: "1px solid #d5b5e4", borderRadius: "10px", padding: "12px" }}>
            {toppings.map(item => {
              const itemIdStr = String(item.itemid);
              return (
                <label key={item.itemid} className="pg-customize-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedToppingIds.includes(itemIdStr)}
                    onChange={() => toggleTopping(itemIdStr)}
                    aria-label={`${item.item_name} (+${Number(item.item_cost).toFixed(2)})`}
                  />
                  <span>{item.item_name} (+${Number(item.item_cost).toFixed(2)})</span>
                </label>
              );
            })}
          </div>
        </div>

        <fieldset className="pg-size" style={{ border: "none", padding: 0, margin: "0 0 24px 0" }}>
          <legend style={{ fontWeight: "600", fontSize: "14px", marginBottom: "10px" }}>Size</legend>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setSize('M')}
              className={size === 'M' ? 'active' : ''}
              aria-pressed={size === 'M'}
              aria-label="Medium"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: size === 'M' ? "2px solid #b78bc6" : "1px solid #d5b5e4",
                background: size === 'M' ? "#c49bd0" : "#fff",
                color: size === 'M' ? "#fff" : "#392c53",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => setSize('L')}
              className={size === 'L' ? 'active' : ''}
              aria-pressed={size === 'L'}
              aria-label="Large (+$0.50)"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: size === 'L' ? "2px solid #b78bc6" : "1px solid #d5b5e4",
                background: size === 'L' ? "#c49bd0" : "#fff",
                color: size === 'L' ? "#fff" : "#392c53",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Large (+$0.50)
            </button>
          </div>
        </fieldset>

        <div className="pg-quantity">
          <span>Quantity</span>
          <div>
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
          </div>
        </div>

        <button
          className="pg-primary"
          type="button"
          onClick={() => onAdd({ drink, toppings: selectedToppings, size, quantity })}
          aria-label={`${editingItem ? 'Save changes' : 'Add to order'}. Total price is $${(unit * quantity).toFixed(2)}`}
        >
          {editingItem ? 'Save changes' : 'Add to order'} · ${(unit * quantity).toFixed(2)}
        </button>
      </section>
    </div>
  );
}
