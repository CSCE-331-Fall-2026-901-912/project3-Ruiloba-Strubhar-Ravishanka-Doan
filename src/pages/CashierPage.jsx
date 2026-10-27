import React, { useState } from "react";
import DrinkMenu from "../components/DrinkMenu.jsx";
import OrderSummary from "../components/OrderSummary.jsx";
import PageIntro from "../components/PageIntro.jsx";
import { drinks } from "../data/shop.js";
import useOrder from "../hooks/useOrder.js";

export default function CashierPage() {
  const order = useOrder();
  const [category, setCategory] = useState("All drinks");
  const [message, setMessage] = useState("");
  const checkout = () => {
    setMessage(`Order placed! ${order.count} ${order.count === 1 ? "drink is" : "drinks are"} on the way.`);
    order.clear();
  };

  return (
    <main className="content-page">
      <PageIntro eyebrow="FRONT COUNTER · REGISTER 01" title="Let’s make it a good one." description="Tap a drink to add it to the guest’s ticket." />
      {message && <div className="success-message" role="status">{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}
      <div className="pos-layout">
        <section className="menu-section">
          <div className="menu-title"><div><p className="eyebrow">MADE FRESH, JUST FOR YOU</p><h2>Our menu</h2></div><span className="menu-counter">{drinks.length} drinks</span></div>
          <DrinkMenu add={order.add} selectedCategory={category} setSelectedCategory={setCategory} />
        </section>
        <OrderSummary order={order} onCheckout={checkout} />
      </div>
    </main>
  );
}
