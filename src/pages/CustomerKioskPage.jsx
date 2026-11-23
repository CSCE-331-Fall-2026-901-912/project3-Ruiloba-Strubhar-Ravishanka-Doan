import React, { useEffect, useState } from 'react';
import KioskDrinkMenu from '../components/KioskDrinkMenu.jsx';
import useKioskOrder from '../hooks/useKioskOrder.js';
import KioskCustomizeModal from '../components/KioskCustomizeModal.jsx';
import KioskTicket from '../components/KioskTicket.jsx';
import KioskCheckoutModal from '../components/KioskCheckoutModal.jsx';
import RewardsAuthModal from '../components/RewardsAuthModal.jsx';
import RewardsBarAndInfo from '../components/RewardsBarAndInfo.jsx';

import {
  calculateDiscountAmount,
  calculateEarnedPoints,
  useRewards,
} from '../hooks/RewardsContext.jsx';
import './customer-kiosk.css';
import './high-contrast-customer-kiosk.css';
import './rewards.css';

// 1. Accepts 'isHighContrast' and 'setIsHighContrast' as shared incoming props instead of managing a duplicate local state
export default function CustomerKioskPage({ isHighContrast, setIsHighContrast, fontScale = 1, setFontScale }) {
  const order = useKioskOrder();
  const {
    user,
    points,
    usedPoints,
    selectedDiscounts,
    setSelectedDiscounts,
    hasDismissedEntryModal,
    setHasDismissedEntryModal,
    syncPoints,
  } = useRewards();

  const [drinks, setDrinks] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [category, setCategory] = useState('All drinks');
  const [selected, setSelected] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [weather, setWeather] = useState({ text: 'A lovely day for boba!', icon: '🧋', kind: 'mild' });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [entryAuthOpen, setEntryAuthOpen] = useState(false);

  // Show optional login / create-account popup when entering the customer kiosk
  useEffect(() => {
    if (!user && !hasDismissedEntryModal) {
      setEntryAuthOpen(true);
    }
  }, [user, hasDismissedEntryModal]);

  useEffect(() => {
    setFontScale?.(1);
  }, [setFontScale]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/me', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Account status could not be checked.');
        return response.json();
      })
      .then(data => setCustomerSignedIn(Boolean(data.authenticated)))
      .catch(err => {
        if (err.name !== 'AbortError') setAccountMessage(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingCustomer(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMenu() {
      try {
        const response = await fetch('/api/kiosk/menu', { signal: controller.signal });
        if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
        const data = await response.json();
        setDrinks(data.drinks ?? []);
        setToppings(data.toppings ?? []);
      } catch (err) {
        if (err.name !== 'AbortError') setError(`Could not load the database menu: ${err.message}`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadMenu();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadWeather = async (latitude, longitude) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Weather unavailable');
        const { current } = await response.json();
        if (!current || !Number.isFinite(current.temperature_2m)) throw new Error('Invalid weather data');
        const code = current.weather_code;
        const temp = current.temperature_2m;
        const rainy = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
        const kind = rainy ? 'rainy' : temp >= 85 ? 'hot' : temp <= 55 ? 'cold' : 'mild';
        const icons = { rainy: '🌧️', hot: '☀️', cold: '☕', mild: '🌤️' };
        setWeather({ text: `${Math.round(temp)}°F outside`, icon: icons[kind], kind });
      } catch (error) {
        if (error.name !== 'AbortError') setWeather({ text: 'A lovely day for boba!', icon: '🧋', kind: 'mild' });
      }
    };
    // Use the kiosk's local area by default; browser location can refine the recommendation.
    const fallback = () => loadWeather(30.62798, -96.33441);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => loadWeather(pos.coords.latitude, pos.coords.longitude),
        fallback,
        { timeout: 4000, maximumAge: 600000 }
      );
    } else fallback();
    return () => controller.abort();
  }, []);

  const recommendations = {
    hot: ['Mango Green Tea', 'Passion Fruit Green Tea', 'Rosehip Lemonade'],
    cold: ['Hot Chocolate', 'Kung Fu Milk Tea', 'Earl Grey Black Tea'],
    rainy: ['Kung Fu Milk Tea', 'Coconut Milk Tea', 'Hot Chocolate'],
    mild: ['Berry Lemonade', 'Mango Cream', 'Taro Slush'],
  };
  const recommendedDrink = (recommendations[weather.kind] || recommendations.mild)
    .map(name => drinks.find(drink => drink.item_name?.toLowerCase() === name.toLowerCase()))
    .find(Boolean) || drinks[0];

  const itemsWithUnitPrice = order.items.map(item => ({
    ...item,
    unitPrice: order.unitPrice(item),
  }));

  const discountAmount = user
    ? Math.min(order.subtotal, calculateDiscountAmount(itemsWithUnitPrice, selectedDiscounts, toppings))
    : 0;

  async function submitOrder(tip, payType) {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const earnedPoints = user ? calculateEarnedPoints(order.items) : 0;
      const spentPoints = user ? usedPoints : 0;

      const response = await fetch('/api/kiosk/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip,
          payType,
          discountAmount,
          rewardsMemberEmail: user?.email ?? null,
          pointsSpent: spentPoints,
          pointsEarned: earnedPoints,
          items: order.items.map(item => ({
            drinkId: item.drinkId,
            toppingIds: item.toppingIds,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save order');

      if (user) {
        const finalizedPoints = Math.max(0, Math.min(1000, points - spentPoints + earnedPoints));
        try {
          await syncPoints(finalizedPoints);
        } catch (syncErr) {
          console.error('Could not sync rewards points:', syncErr);
        }
        setSelectedDiscounts({});
      }

      const resolvedOrderId =
        data.orderId ??
        data.order_id ??
        data.orderid ??
        data.id ??
        data.order?.orderId ??
        data.order?.order_id ??
        data.order?.orderid ??
        data.order?.id;
      const adjustedTotal = Math.max(0, order.subtotal + order.tax - discountAmount + tip);
      setReceipt({
        ...data,
        orderId: resolvedOrderId,
        total: adjustedTotal,
        discountAmount,
        earnedPoints,
        spentPoints,
      });
      setCheckoutOpen(false);
      order.clear();
    } catch (err) {
      const errMsg = `Order not confirmed: ${err.message}. Please check before retrying.`;
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`pg-kiosk ${isHighContrast ? 'high-contrast' : ''}`}>
      <RewardsAuthModal
        isOpen={entryAuthOpen && !user}
        allowSkip={true}
        isHighContrast={isHighContrast}
        onClose={() => {
          setEntryAuthOpen(false);
          setHasDismissedEntryModal(true);
        }}
      />

      <header className="pg-hero" style={isHighContrast ? { backgroundColor: '#1e003a', borderBottom: '4px solid #ffffff' } : {}}>
        <div>
          <p className="pg-eyebrow" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>A LITTLE PICK-ME-UP</p>
          <h1 style={isHighContrast ? { color: '#ffffff', fontWeight: '950' } : {}}>Hi there, boba lover!</h1>
          <p style={isHighContrast ? { color: '#ffffff', fontWeight: '700' } : {}}>Choose your favorites. We'll make them fresh.</p>
        </div>
        <div className="pg-brand">
          <img src="/pearl-garden-cup.png" alt="Pearl Garden floral cup" />
          <strong style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Pearl<br />Garden</strong>
        </div>
        <div className="pg-weather">
          <span style={isHighContrast ? { color: '#ffffff', fontWeight: '700' } : {}}>{weather.text}</span>
          <span className="pg-cloud" aria-hidden="true">{weather.icon}</span>
          {recommendedDrink && (
            <button type="button" className="pg-weather-recommend" onClick={() => {
              setEditingItem(null);
              setSelected(recommendedDrink);
            }} aria-label={`Customize recommended drink ${recommendedDrink.item_name}`}>
              Try {recommendedDrink.item_name} <span aria-hidden="true">♡</span>
            </button>
          )}
        </div>
        <div className="pg-account">
          {checkingCustomer ? (
            <p role="status">Checking account…</p>
          ) : customerSignedIn ? (
            <>
              <p>Signed in · future orders will be saved to your history</p>
              <div className="pg-account-actions">
                <button type="button" onClick={openOrderHistory} disabled={accountBusy}>My orders</button>
                <button type="button" onClick={signOutCustomer} disabled={accountBusy}>Sign out</button>
              </div>
            </>
          ) : (
            <>
              <p>Order as a guest, or sign in to save orders to your history.</p>
              <GoogleSignInButton
                clientId={googleClientId}
                onCredential={signInWithGoogle}
                onError={setAccountMessage}
              />
              {accountBusy && <p role="status">Signing in…</p>}
            </>
          )}
          {accountMessage && <p className="pg-account-message" role="alert">{accountMessage}</p>}
        </div>
      </header>

      {error && (
        <div className="pg-alert" role="alert">
          {error}
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {receipt && (
        <div className="pg-receipt-overlay" role="presentation">
          <section className="pg-receipt-popup" role="dialog" aria-modal="true" aria-labelledby="pg-receipt-title" aria-describedby="pg-receipt-description">
            <div className="pg-receipt-decoration" aria-hidden="true">✦ ♥ ✦</div>
            <img className="pg-receipt-cup" src="/pearl-garden-cup.png" alt="" />
            <p className="pg-eyebrow">PEARL GARDEN · ORDER CONFIRMED</p>
            <h2 id="pg-receipt-title">Thank you for your order!</h2>
            <p className="pg-receipt-subtitle">Your little pick-me-up is on its way ♡</p>
            <div className="pg-receipt-number">
              <span>YOUR TICKET NUMBER</span>
              <strong>{receipt.orderId != null ? `#${receipt.orderId}` : 'Pending'}</strong>
            </div>
            <p id="pg-receipt-description" className="pg-receipt-summary">
              Order saved · {receipt.items?.length ?? 0} line item(s) · Total ${Number(receipt.total).toFixed(2)}
              {receipt.discountAmount > 0 ? ` (Saved $${Number(receipt.discountAmount).toFixed(2)})` : ''}
            </p>
            {user && (
              <p className="pg-receipt-summary" style={{ marginTop: '4px' }}>
                Rewards update: +{receipt.earnedPoints ?? 0} pts earned
                {receipt.spentPoints > 0 ? ` · −${receipt.spentPoints} pts redeemed` : ''}
              </p>
            )}
            <button className="pg-receipt-start" type="button" onClick={() => setReceipt(null)} autoFocus>Start Another Order</button>
          </section>
        </div>
      )}

      {/* Point Bar (0 - 1000) and Collapsible Discounts Box above Menu & Ticket */}
      <RewardsBarAndInfo isHighContrast={isHighContrast} />

      <div className="pg-layout">
        <section className="pg-menu-panel">
          <p className="pg-eyebrow" style={isHighContrast ? { color: '#ffb3df', fontWeight: '900' } : {}}>SIP SOMETHING LOVELY</p>
          <h2 style={isHighContrast ? { color: '#ffffff', fontWeight: '900' } : {}}>Pick your drink</h2>
          {loading ? (
            <p role="status">Loading menu from database…</p>
          ) : (
            <KioskDrinkMenu
              drinks={drinks}
              category={category}
              setCategory={setCategory}
              isHighContrast={isHighContrast}
              fontScale={fontScale}
              onSelect={drink => {
                setEditingItem(null);
                setSelected(drink);
              }}
            />
          )}
        </section>
        <KioskTicket
          order={order}
          discountAmount={discountAmount}
          submitting={submitting}
          isHighContrast={isHighContrast}
          onCheckout={() => setCheckoutOpen(true)}
          onEdit={item => {
            const drink = drinks.find(d => Number(d.itemid) === item.drinkId);
            if (drink) {
              setEditingItem(item);
              setSelected(drink);
            }
          }}
        />
      </div>

      <footer className="pg-footer">Need a hand? Our team is right over there <span aria-hidden="true">♥</span></footer>

      {selected && (
        <KioskCustomizeModal
          drink={selected}
          toppings={toppings}
          editingItem={editingItem}
          isHighContrast={isHighContrast}
          onClose={() => {
            setSelected(null);
            setEditingItem(null);
          }}
          onAdd={selection => {
            if (editingItem) {
              order.edit(editingItem.key, selection);
            } else {
              order.add(selection);
            }
            setSelected(null);
            setEditingItem(null);
            setReceipt(null);
          }}
        />
      )}

      {checkoutOpen && (
        <KioskCheckoutModal
          order={order}
          discountAmount={discountAmount}
          submitting={submitting}
          isHighContrast={isHighContrast}
          onClose={() => setCheckoutOpen(false)}
          onConfirm={submitOrder}
        />
      )}
      {history.open && (
        <CustomerOrderHistory
          orders={history.orders}
          loading={history.loading}
          error={history.error}
          onClose={() => setHistory(current => ({ ...current, open: false }))}
        />
      )}
    </main>
  );
}
