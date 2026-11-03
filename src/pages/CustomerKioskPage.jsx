import React, { useEffect, useState } from 'react';
import KioskDrinkMenu from '../components/KioskDrinkMenu.jsx';
import KioskCustomizeModal from '../components/KioskCustomizeModal.jsx';
import KioskTicket from '../components/KioskTicket.jsx';
import KioskCheckoutModal from '../components/KioskCheckoutModal.jsx';
import useKioskOrder from '../hooks/useKioskOrder.js';
//import cup from '../assets/pearl-garden-cup.png';
import './customer-kiosk.css';

export default function CustomerKioskPage() {
  const order = useKioskOrder();
  const [drinks, setDrinks] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [category, setCategory] = useState('All drinks');
  const [selected, setSelected] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [weather, setWeather] = useState({ text: 'A lovely day for boba!', icon: '🧋' });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMenu() {
      try {
        const response = await fetch('/api/kiosk/menu', { signal: controller.signal });
        if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
        const data = await response.json();
        setDrinks(data.drinks ?? []);
        setToppings(data.toppings ?? []);
      } catch (err) { if (err.name !== 'AbortError') setError(`Could not load the database menu: ${err.message}`); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadMenu();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadWeather() {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.6280&longitude=-96.3344&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago', {signal: controller.signal});
        if (!response.ok) throw new Error('Weather unavailable');
        const {current} = await response.json();
        const code = current.weather_code, temp = current.temperature_2m;
        const result = [95,96,99].includes(code) ? {text:'Stormy skies? Cozy up with milk tea!',icon:'⛈️'} : [51,53,55,61,63,65,80,81,82].includes(code) ? {text:'Rainy day? Milk tea sounds lovely!',icon:'🌧️'} : temp >= 85 ? {text:'Hot outside? Try an icy fruit tea!',icon:'☀️'} : temp <= 55 ? {text:'Chilly day? Warm up with milk tea!',icon:'☕'} : [2,3,45,48].includes(code) ? {text:'Cloudy skies, sweet sips!',icon:'☁️'} : {text:'Lovely weather for a little boba!',icon:'🧋'};
        setWeather(result);
      } catch (error) { if (error.name !== 'AbortError') setWeather({text:'A lovely day for boba!',icon:'🧋'}); }
    }
    loadWeather();
    return () => controller.abort();
  }, []);

  async function submitOrder(tip) {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/kiosk/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip, items: order.items.map(item => ({ drinkId: item.drinkId, toppingIds: item.toppingIds, size: item.size, quantity: item.quantity })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save order');
      setReceipt(data);
      setCheckoutOpen(false);
      order.clear();
    } catch (err) { setError(`Order not confirmed: ${err.message}. Please check before retrying.`); }
    finally { setSubmitting(false); }
  }

  return <main className="pg-kiosk">
    <header className="pg-hero">
      <div><p className="pg-eyebrow">A LITTLE PICK-ME-UP</p><h1>Hi there, boba lover!</h1><p>Choose your favorites. We'll make them fresh.</p></div>
      <div className="pg-brand"><img src="/pearl-garden-cup.png" alt="Pearl Garden floral cup"/><strong>Pearl<br/>Garden</strong></div>
      <div className="pg-weather"><span>{weather.text}</span><span className="pg-cloud" aria-hidden="true">{weather.icon}</span></div>
    </header>
    {error && <div className="pg-alert" role="alert">{error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}
    {receipt && (
      <div className="pg-receipt-overlay" role="presentation">
        <section className="pg-receipt-popup" role="dialog" aria-modal="true" aria-labelledby="pg-receipt-title" aria-describedby="pg-receipt-description">
          <div className="pg-receipt-decoration" aria-hidden="true">✦ ♥ ✦</div>
          <img className="pg-receipt-cup" src="/pearl-garden-cup.png" alt="" />
          <p className="pg-eyebrow">PEARL GARDEN · ORDER CONFIRMED</p>
          <h2 id="pg-receipt-title">Thank you for your order!</h2>
          <p className="pg-receipt-subtitle">Your little pick-me-up is on its way ♡</p>
          <div className="pg-receipt-number"><span>YOUR TICKET NUMBER</span><strong>#{receipt.orderId}</strong></div>
          <p id="pg-receipt-description" className="pg-receipt-summary">
            Order saved · {receipt.items?.length ?? 0} line item(s) · Total ${Number(receipt.total).toFixed(2)}
          </p>
          <button className="pg-receipt-start" type="button" onClick={() => setReceipt(null)} autoFocus>Start another order</button>
        </section>
      </div>
    )}
    <div className="pg-layout">
      <section className="pg-menu-panel"><p className="pg-eyebrow">SIP SOMETHING LOVELY</p><h2>Pick your drink</h2>
        {loading ? <p role="status">Loading menu from database…</p> : <KioskDrinkMenu drinks={drinks} category={category} setCategory={setCategory} onSelect={drink => { setEditingItem(null); setSelected(drink); }}/>}
      </section>
      <KioskTicket order={order} submitting={submitting} onCheckout={() => setCheckoutOpen(true)} onEdit={item => { const drink = drinks.find(d => Number(d.itemid) === item.drinkId); if (drink) { setEditingItem(item); setSelected(drink); } }}/>
    </div>
    <footer className="pg-footer">Need a hand? Our team is right over there <span>♥</span></footer>
    {selected && <KioskCustomizeModal drink={selected} toppings={toppings} editingItem={editingItem} onClose={() => { setSelected(null); setEditingItem(null); }} onAdd={selection => { if (editingItem) order.edit(editingItem.key, selection); else order.add(selection); setSelected(null); setEditingItem(null); setReceipt(null); }}/>} 
    {checkoutOpen && <KioskCheckoutModal order={order} submitting={submitting} onClose={() => setCheckoutOpen(false)} onConfirm={submitOrder}/>}
  </main>;
}
