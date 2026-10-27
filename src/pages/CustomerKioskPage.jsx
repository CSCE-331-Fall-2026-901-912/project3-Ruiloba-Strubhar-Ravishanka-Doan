import React, { useState } from "react";
import DrinkMenu from "../components/DrinkMenu.jsx";
import OrderSummary from "../components/OrderSummary.jsx";
import { drinks } from "../data/shop.js";
import useOrder from "../hooks/useOrder.js";

export default function CustomerKioskPage() {
  const order = useOrder();
  const [category, setCategory] = useState("All drinks");
  const [placed, setPlaced] = useState(false);
  const checkout = () => {
    setPlaced(true);
    order.clear();
  };

  return (
    <main className="kiosk-page">
      <div className="kiosk-welcome"><p className="eyebrow">A LITTLE PICK-ME-UP</p><h1>Hi there, boba lover<span>!</span></h1><p>Choose your favorites. We’ll make them fresh.</p><span className="kiosk-doodle" aria-hidden="true">✳</span></div>
      {placed && <div className="success-message kiosk-success" role="status">Thanks for your order! We’ll call your name when it’s ready.<button type="button" onClick={() => setPlaced(false)} aria-label="Dismiss message">×</button></div>}
      <div className="pos-layout kiosk-layout">
        <section className="menu-section">
          <div className="menu-title"><div><p className="eyebrow">SIP SOMETHING LOVELY</p><h2>Pick your drink</h2></div></div>
          <DrinkMenu add={(drink) => { setPlaced(false); order.add(drink); }} selectedCategory={category} setSelectedCategory={setCategory} />
        </section>
        <OrderSummary order={order} onCheckout={checkout} checkoutLabel="Place my order" />
      </div>
      <footer className="footer"><span>Need a hand? Our team is right over there <span className="pink">♥</span></span><a href="#/">Staff portal</a></footer>
    </main>
  );
}
