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

  async function submitOrder(tip) {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/kiosk/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip, items: order.items.map(item => ({ drinkId: item.drinkId, toppingId: item.toppingId, size: item.size, quantity: item.quantity })) }),
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
      <div className="pg-weather"><span>Maybe a drink for<br/>a rainy day</span><span className="pg-cloud" aria-hidden="true">🌧️</span></div>
    </header>
    {error && <div className="pg-alert" role="alert">{error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}
    {receipt && <section className="pg-receipt" role="status"><h2>Thank you! Your ticket is #{receipt.orderId}</h2><p>Order saved · {receipt.items?.length ?? 0} line item(s) · Total ${Number(receipt.total).toFixed(2)}</p><button type="button" onClick={() => setReceipt(null)}>Start another order</button></section>}
    <div className="pg-layout">
      <section className="pg-menu-panel"><p className="pg-eyebrow">SIP SOMETHING LOVELY</p><h2>Pick your drink</h2>
        {loading ? <p role="status">Loading menu from database…</p> : <KioskDrinkMenu drinks={drinks} category={category} setCategory={setCategory} onSelect={setSelected}/>}
      </section>
      <KioskTicket order={order} submitting={submitting} onCheckout={() => setCheckoutOpen(true)}/>
    </div>
    <footer className="pg-footer">Need a hand? Our team is right over there <span>♥</span></footer>
    {selected && <KioskCustomizeModal drink={selected} toppings={toppings} onClose={() => setSelected(null)} onAdd={selection => { order.add(selection); setSelected(null); setReceipt(null); }}/>} 
    {checkoutOpen && <KioskCheckoutModal order={order} submitting={submitting} onClose={() => setCheckoutOpen(false)} onConfirm={submitOrder}/>}
  </main>;
}
