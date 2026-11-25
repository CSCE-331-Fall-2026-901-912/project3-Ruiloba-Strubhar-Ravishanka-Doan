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

// Sanitize any corrupted saved order in localStorage/sessionStorage so useKioskOrder never crashes on mount
function sanitizeStoredKioskOrder() {
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      if (!store) continue;
      for (let i = store.length - 1; i >= 0; i -= 1) {
        const key = store.key(i);
        if (!key || !key.toLowerCase().includes('kiosk')) continue;
        const raw = store.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : null;
        if (list && list.some(entry => !entry || (!entry.drink && entry.drinkId == null && entry.itemid == null))) {
          store.removeItem(key);
        }
      }
    }
  } catch {
    // Ignore storage access errors
  }
}
sanitizeStoredKioskOrder();

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
  const [rewardsFeedback, setRewardsFeedback] = useState('');
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

  // Automatically keep applied discounts valid if items/toppings/sizes are removed or changed on the ticket
  useEffect(() => {
    if (!user) return;
    const totalDrinks = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalToppings = order.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const tCount = Array.isArray(item.toppingIds) ? item.toppingIds.length : 0;
      return sum + qty * tCount;
    }, 0);
    const largeDrinks = order.items.reduce(
      (sum, item) => sum + (item.size === 'L' ? Number(item.quantity) || 0 : 0),
      0
    );

    const curSizeUpgrade = Number(selectedDiscounts.size_upgrade) || 0;
    const curFreeTopping = Number(selectedDiscounts.free_topping) || 0;
    const curBogo = Number(selectedDiscounts.bogo_50) || 0;
    const curFreeDrink = Number(selectedDiscounts.free_drink) || 0;

    const nextSizeUpgrade = Math.min(curSizeUpgrade, largeDrinks);
    const nextFreeTopping = Math.min(curFreeTopping, totalToppings);
    const nextBogo = Math.min(curBogo, Math.floor(totalDrinks / 2));
    const nextFreeDrink = Math.min(curFreeDrink, totalDrinks);

    if (
      nextSizeUpgrade !== curSizeUpgrade ||
      nextFreeTopping !== curFreeTopping ||
      nextBogo !== curBogo ||
      nextFreeDrink !== curFreeDrink
    ) {
      const adjusted = {};
      if (nextSizeUpgrade > 0) adjusted.size_upgrade = nextSizeUpgrade;
      if (nextFreeTopping > 0) adjusted.free_topping = nextFreeTopping;
      if (nextBogo > 0) adjusted.bogo_50 = nextBogo;
      if (nextFreeDrink > 0) adjusted.free_drink = nextFreeDrink;
      setSelectedDiscounts(adjusted);
      setRewardsFeedback(
        'Some applied rewards were adjusted because your order items, sizes, or toppings changed.'
      );
    }
  }, [order.items, selectedDiscounts, setSelectedDiscounts, user]);

  function handleUpgradeDrinksToLarge(unitIds = []) {
    if (!Array.isArray(unitIds) || unitIds.length === 0) return;

    const upgradeCountByKey = new Map();
    for (const unitId of unitIds) {
      const sepIdx = String(unitId).lastIndexOf('::');
      const itemKey = sepIdx !== -1 ? String(unitId).slice(0, sepIdx) : String(unitId);
      upgradeCountByKey.set(itemKey, (upgradeCountByKey.get(itemKey) || 0) + 1);
    }

    for (const [itemKey, countToUpgrade] of upgradeCountByKey.entries()) {
      const targetItem = order.items.find(it => it.key === itemKey);
      if (!targetItem || targetItem.size === 'L') continue;

      const qty = Math.max(1, Number(targetItem.quantity) || 1);
      const upgradeQty = Math.min(qty, countToUpgrade);
      const remainingMediumQty = qty - upgradeQty;

      // Look up full drink record from menu (or reconstruct it) so `drink.itemid` is ALWAYS defined in makeItem!
      const drinkObj = targetItem.drink || drinks.find(d => Number(d.itemid) === Number(targetItem.drinkId)) || {
        itemid: targetItem.drinkId,
        item_name: targetItem.drinkName,
        item_cost: targetItem.basePrice,
      };

      const makePayload = (nextSize, nextQty) => ({
        drink: drinkObj,
        itemid: drinkObj.itemid,
        item_name: drinkObj.item_name,
        item_cost: drinkObj.item_cost,
        drinkId: targetItem.drinkId,
        drinkName: targetItem.drinkName,
        basePrice: targetItem.basePrice,
        size: nextSize,
        toppingIds: targetItem.toppingIds || [],
        toppingNames: targetItem.toppingNames || [],
        toppingsPrice: targetItem.toppingsPrice || 0,
        quantity: nextQty,
      });

      if (remainingMediumQty === 0) {
        order.edit(targetItem.key, makePayload('L', qty));
      } else {
        order.edit(targetItem.key, makePayload('M', remainingMediumQty));
        order.add(makePayload('L', upgradeQty));
      }
    }

    setRewardsFeedback(
      `Upgraded ${unitIds.length} drink${unitIds.length === 1 ? '' : 's'} to Large for your Free Size Upgrade reward.`
    );
  }

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
      setRewardsFeedback('');
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
            <button
              type="button"
              className="pg-weather-recommend"
              onClick={() => {
                setEditingItem(null);
                setSelected(recommendedDrink);
              }}
              aria-label={`Customize recommended drink ${recommendedDrink.item_name}`}
            >
              Try {recommendedDrink.item_name} <span aria-hidden="true">♡</span>
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="pg-alert" role="alert">
          {error}
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {rewardsFeedback && (
        <div
          className="pg-alert"
          role="status"
          aria-live="polite"
          style={
            isHighContrast
              ? {
                backgroundColor: '#1e003a',
                color: '#ffb3df',
                border: '3px solid #ffb3df',
                fontWeight: '900',
              }
              : {
                backgroundColor: '#fdf7fb',
                color: '#3a1530',
                border: '2px solid #572649',
                fontWeight: '800',
              }
          }
        >
          <span>{rewardsFeedback}</span>
          <button type="button" onClick={() => setRewardsFeedback('')}>Dismiss</button>
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
          toppings={toppings}
          submitting={submitting}
          isHighContrast={isHighContrast}
          onUpgradeDrinksToLarge={handleUpgradeDrinksToLarge}
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
    </main>
  );
}
