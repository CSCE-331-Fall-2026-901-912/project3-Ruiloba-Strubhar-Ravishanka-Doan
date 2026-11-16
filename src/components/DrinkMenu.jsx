import React, { useState } from "react";
import { drinks, money } from "../data/shop.js";

const categories = ["All drinks", "Milk tea", "Fruit tea", "Matcha"];

export default function DrinkMenu({ add, selectedCategory, setSelectedCategory }) {
  const [search, setSearch] = useState("");
  const categoryDrinks = selectedCategory === "All drinks" ? drinks : drinks.filter((drink) => drink.category === selectedCategory);
  const filtered = categoryDrinks.filter((drink) => drink.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="menu-area">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a drink..." aria-label="Search drinks"
          style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, border: "1px solid #c8b8ce", font: "inherit" }} />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #c8b8ce", background: "transparent", cursor: "pointer" }}>×</button>}
      </div>
      <div className="category-row" role="group" aria-label="Menu categories">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-chip ${category === selectedCategory ? "selected" : ""}`}
            type="button"
            aria-pressed={category === selectedCategory}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p role="status">No drinks match your search.</p>}
      <div className="drink-grid">
        {filtered.map((drink) => (
          <button
            className="drink-card"
            key={drink.name}
            type="button"
            aria-label={`${drink.name}, ${drink.note || ""}. Price: ${money(drink.price)}. Add to ticket.`}
            onClick={() => add(drink)}
          >
            <span className="drink-art" aria-hidden="true">{drink.icon}</span>
            <span className="drink-card-copy">
              <strong>{drink.name}</strong>
              <small>{drink.note}</small>
              <b>{money(drink.price)}</b>
            </span>
            <span className="add-button" aria-hidden="true">+</span>
          </button>
        ))}
      </div>
    </div>
  );
}
