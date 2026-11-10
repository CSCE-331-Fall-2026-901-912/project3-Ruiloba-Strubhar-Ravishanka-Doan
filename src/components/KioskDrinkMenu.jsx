import React from 'react';

const money = value => `$${Number(value).toFixed(2)}`;

// Match the drink's liquid color to its flavor while keeping the Pearl Garden cup shape.
const drinkColors = {
  1: '#b98b60', 2: '#eee0c7', 3: '#e7b73c', 4: '#b8a477',
  5: '#70452f', 6: '#d8b56c', 7: '#b5a578', 8: '#efae32',
  9: '#d77e94', 10: '#b74f7d', 11: '#f5a46d', 12: '#e87e9c',
  13: '#7b635a', 14: '#aa8ac8', 15: '#9d5963', 16: '#65504d',
  17: '#a54d70', 18: '#a77445', 26: '#f1b24e', 27: '#e69c48',
  28: '#8e5b40', 29: '#e5a73f'
};
function DrinkCup({ drink }) {
  const color = drinkColors[Number(drink.itemid)] || '#c49bd0';
  return <svg className="pg-colored-cup" viewBox="0 0 70 110" width="62" height="105" aria-hidden="true" focusable="false">
    <path d="M13 27 H57 L52 98 Q35 104 18 98 Z" fill="#fff9fc" stroke="#765c81" strokeWidth="2.5" />
    <path d="M17 39 H53 L49 94 Q35 99 21 94 Z" fill={color} />
    <path d="M13 27 H57 L52 98 Q35 104 18 98 Z" fill="none" stroke="#765c81" strokeWidth="2.5" />
    <path d="M9 25 Q35 19 61 25 L60 31 H10 Z" fill="#f5dceb" stroke="#765c81" strokeWidth="2" />
    <path d="M38 25 L44 5" stroke="#765c81" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 46 L22 85" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity=".35" />
    <circle cx="28" cy="88" r="4" fill="#49334b" opacity=".75" />
    <circle cx="38" cy="91" r="4" fill="#49334b" opacity=".75" />
    <circle cx="45" cy="86" r="4" fill="#49334b" opacity=".75" />
    <path d="M29 62 Q35 56 41 62 Q35 69 29 62" fill="#fff9fc" opacity=".85" />
  </svg>;
}

// Added 'isHighContrast' prop to systematically adjust component state themes
export default function KioskDrinkMenu({ drinks, category, setCategory, onSelect, isHighContrast, fontScale = 1 }) {
  const categories = ['All drinks', ...new Set(drinks.map(drink => drink.base_item_type).filter(Boolean))];
  const visible = category === 'All drinks' ? drinks : drinks.filter(drink => drink.base_item_type === category);
  const drinkGridStyle = fontScale >= 1.3
    ? { gridTemplateColumns: '1fr' }
    : fontScale >= 1.1
      ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
      : undefined;

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
    {visible.length === 0 ? <p role="status">No drinks in this category.</p> : <div className={fontScale > 1 ? 'pg-drinks pg-drinks--zoomed' : 'pg-drinks'} style={drinkGridStyle}>
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
          <DrinkCup drink={drink} />
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
