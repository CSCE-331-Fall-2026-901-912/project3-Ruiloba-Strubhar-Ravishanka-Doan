import React from 'react';

const money = value => `$${Number(value).toFixed(2)}`;

// Added 'isHighContrast' prop to systematically adjust component state themes
export default function KioskDrinkMenu({ drinks, category, setCategory, onSelect, isHighContrast }) {
  const categories = ['All drinks', ...new Set(drinks.map(drink => drink.base_item_type).filter(Boolean))];
  const visible = category === 'All drinks' ? drinks : drinks.filter(drink => drink.base_item_type === category);

  return <>
    <div className="pg-categories" role="group" aria-label="Drink categories">
      {categories.map(name => (
        <button
          key={name}
          type="button"
          className={name === category ? 'pg-category active' : 'pg-category'}
          style={isHighContrast ? {
            backgroundColor: name === category ? '#ffffff' : '#1e003a',
            color: name === category ? '#120024' : '#ffffff',
            border: name === category ? '3px solid #ffb3df' : '3px solid #ffffff',
            fontWeight: '900'
          } : {}}
          aria-pressed={name === category}
          onClick={() => setCategory(name)}
        >
          {name}
        </button>
      ))}
    </div>
    {visible.length === 0 ? <p role="status">No drinks in this category.</p> : <div className="pg-drinks">
      {visible.map(drink => (
        <button
          key={drink.itemid}
          className="pg-drink"
          type="button"
          style={isHighContrast ? {
            backgroundColor: '#1e003a',
            border: '3px solid #ffffff',
            padding: '12px'
          } : {}}
          onClick={() => onSelect(drink)}
          aria-label={`${drink.item_name}, ${drink.item_cal != null ? `${drink.item_cal} calories` : 'Freshly made'}, price ${money(drink.item_cost)}`}
        >
          <img src="/pearl-garden-cup.png" alt="" loading="lazy" />
          <span className="pg-drink-copy">
            <strong style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>{drink.item_name}</strong>
            <small style={isHighContrast ? { color: '#ffffff', textDecoration: 'underline', fontWeight: '700' } : {}}>
              {drink.item_cal != null ? `${drink.item_cal} cal` : 'Freshly made'}
            </small>
            <b style={isHighContrast ? { color: '#ffb3df', fontSize: '1.3rem', fontWeight: '900' } : {}}>{money(drink.item_cost)}</b>
          </span>
        </button>
      ))}
    </div>}
  </>;
}
