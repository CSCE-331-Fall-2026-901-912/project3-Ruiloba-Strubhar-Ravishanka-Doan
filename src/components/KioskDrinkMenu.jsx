import React from 'react';
const money = value => `$${Number(value).toFixed(2)}`;

export default function KioskDrinkMenu({ drinks, category, setCategory, onSelect }) {
  const categories = ['All drinks', ...new Set(drinks.map(drink => drink.base_item_type).filter(Boolean))];
  const visible = category === 'All drinks' ? drinks : drinks.filter(drink => drink.base_item_type === category);
  return <>
    <div className="pg-categories" role="group" aria-label="Drink categories">
      {categories.map(name => <button key={name} type="button" className={name === category ? 'pg-category active' : 'pg-category'} onClick={() => setCategory(name)}>{name}</button>)}
    </div>
    {visible.length === 0 ? <p>No drinks in this category.</p> : <div className="pg-drinks">
      {visible.map(drink => <button key={drink.itemid} className="pg-drink" type="button" onClick={() => onSelect(drink)}>
        <img src="/pearl-garden-cup.png" alt="" loading="lazy" />
        <span className="pg-drink-copy"><strong>{drink.item_name}</strong><small>{drink.item_cal != null ? `${drink.item_cal} cal` : 'Freshly made'}</small><b>{money(drink.item_cost)}</b></span>
      </button>)}
    </div>}
  </>;
}
