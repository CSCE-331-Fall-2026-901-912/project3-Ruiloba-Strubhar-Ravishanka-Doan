import React from "react";
import { drinks, money } from "../data/shop.js";

const categories = ["All drinks", "Milk tea", "Fruit tea", "Matcha"];

export default function DrinkMenu({ add, selectedCategory, setSelectedCategory }) {
  const filtered = selectedCategory === "All drinks" ? drinks : drinks.filter((drink) => drink.category === selectedCategory);

  return (
    <div className="menu-area">
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
