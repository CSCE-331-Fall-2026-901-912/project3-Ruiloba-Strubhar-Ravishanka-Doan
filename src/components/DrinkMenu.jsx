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
      <div
        className="drink-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((drink) => (
          <button
            className="drink-card"
            key={drink.name}
            type="button"
            aria-label={`${drink.name}, ${drink.note || ""}. Price: ${money(drink.price)}. Add to ticket.`}
            onClick={() => add(drink)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
              width: "100%",
              textAlign: "left",
            }}
          >
            <span className="drink-art" aria-hidden="true" style={{ flexShrink: 0 }}>
              {drink.icon}
            </span>
            <span
              className="drink-card-copy"
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minWidth: 0,
                overflowWrap: "break-word",
                wordBreak: "normal",
              }}
            >
              <strong>{drink.name}</strong>
              <small>{drink.note}</small>
              <b>{money(drink.price)}</b>
            </span>
            <span className="add-button" aria-hidden="true" style={{ flexShrink: 0 }}>
              +
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
