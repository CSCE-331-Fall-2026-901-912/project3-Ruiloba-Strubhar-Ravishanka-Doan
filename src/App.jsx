import React, { useEffect, useState } from "react";

const views = [
  { id: "manager", label: "Manager dashboard", icon: "▦", description: "Sales, popular drinks, and shop pulse." },
  { id: "cashier", label: "Cashier screen", icon: "▣", description: "Build an order and check out a guest." },
  { id: "kiosk", label: "Customer kiosk", icon: "◉", description: "A friendly self-serve ordering experience." },
];

const drinks = [
  { name: "Brown Sugar Milk Tea", category: "Milk tea", price: 5.75, icon: "🧋", note: "Brown sugar · fresh milk" },
  { name: "Strawberry Matcha", category: "Matcha", price: 6.25, icon: "🍵", note: "Ceremonial matcha · strawberry" },
  { name: "Taro Cloud", category: "Milk tea", price: 5.75, icon: "🥤", note: "Taro · creamy oat milk" },
  { name: "Mango Green Tea", category: "Fruit tea", price: 5.25, icon: "🍹", note: "Jasmine green tea · mango" },
  { name: "Classic Milk Tea", category: "Milk tea", price: 5.25, icon: "🧋", note: "House black tea · your choice of milk" },
  { name: "Peach Oolong", category: "Fruit tea", price: 5.50, icon: "🍑", note: "Toasty oolong · juicy peach" },
];

const money = (value) => `$${value.toFixed(2)}`;

function Header({ current }) {
  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label="Boba Bloom home">
        <span className="brand-mark">b</span>
        <span>Boba Bloom<small>TEA HOUSE</small></span>
      </a>
      <nav className="top-links" aria-label="Main navigation">
        <a className={current === "home" ? "active" : ""} href="#/">Portal</a>
        {views.map((view) => (
          <a className={current === view.id ? "active" : ""} href={`#/${view.id}`} key={view.id}>{view.label}</a>
        ))}
      </nav>
      <div className="open-status"><span /> Open today <span className="status-hours">· 10am–9pm</span></div>
    </header>
  );
}

function PageIntro({ eyebrow, title, description, children }) {
  return (
    <div className="page-intro">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>
      {children}
    </div>
  );
}

function Hub() {
  return (
    <>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <p className="eyebrow">YOUR LITTLE CORNER OF BOBA</p>
          <h1>Good things<br />are brewing<span>.</span></h1>
          <p>Welcome to Boba Bloom. Pick a view to jump into your day.</p>
          <a className="button button-dark" href="#/manager">Head to the dashboard <span>→</span></a>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="sun-shape" />
          <div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" />
          <div className="hero-cup"><div className="cup-lid" /><div className="cup-straw" /><div className="cup-tea">Boba<br />Bloom</div><div className="pearls">● ● ●<br /> ● ●</div></div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✦</span>
          <span className="art-caption">a little joy<br />in every sip</span>
        </div>
      </section>
      <section className="portal-section">
        <div className="section-heading"><div><p className="eyebrow">CHOOSE YOUR VIEW</p><h2>Where to today?</h2></div><span className="section-note">Three ways to keep the good stuff moving.</span></div>
        <div className="portal-grid">
          {views.map((view, index) => (
            <a className={`portal-card portal-${view.id}`} href={`#/${view.id}`} key={view.id}>
              <div className="card-top"><span className="view-icon">{view.icon}</span><span className="card-arrow">↗</span></div>
              <p className="eyebrow">0{index + 1} / {view.id.toUpperCase()}</p>
              <h3>{view.label}</h3><p className="muted">{view.description}</p>
              <span className="text-link">Open view <span>→</span></span>
            </a>
          ))}
        </div>
      </section>
      <footer className="footer"><span>Made with a little extra sweetness <span className="pink">♥</span></span><span>BOBA BLOOM · EST. 2026</span></footer>
    </>
  );
}

function Metric({ label, value, change, tone = "" }) {
  return <article className={`metric-card ${tone}`}><p>{label}</p><strong>{value}</strong><span>{change}</span></article>;
}

function Manager() {
  const bars = [38, 55, 45, 70, 57, 84, 64, 77, 52, 94, 72, 88];
  return (
    <main className="content-page">
      <PageIntro eyebrow="TUESDAY, OCTOBER 27" title="Shop at a glance" description="Here’s how the tea house is doing today.">
        <button className="button button-light" type="button">Today <span>⌄</span></button>
      </PageIntro>
      <section className="metrics-grid" aria-label="Shop metrics">
        <Metric label="Today's sales" value="$1,284.50" change="↑ 12.8% from yesterday" />
        <Metric label="Orders today" value="86" change="↑ 8 orders from yesterday" />
        <Metric label="Average order" value="$14.94" change="↑ $1.20 from last week" />
        <Metric label="Team on shift" value="4 / 5" change="1 shift starts at 12:00" tone="metric-peach" />
      </section>
      <div className="dashboard-grid">
        <section className="panel sales-panel">
          <div className="panel-heading"><div><p className="eyebrow">THE BIG PICTURE</p><h2>Sales this week</h2></div><span className="legend"><i /> This week</span></div>
          <div className="sales-total">$8,462.80 <span>↑ 9.4%</span></div>
          <div className="chart" role="img" aria-label="Bar chart showing sales over the last twelve days">
            {bars.map((height, index) => <div className="bar-column" key={index}><span className={`bar ${index === 9 ? "bar-highlight" : ""}`} style={{ height: `${height}%` }} />{index % 2 === 0 && <small>{["M", "T", "W", "T", "F", "S"][Math.floor(index / 2)]}</small>}</div>)}
          </div>
        </section>
        <section className="panel popular-panel">
          <div className="panel-heading"><div><p className="eyebrow">GUEST FAVORITES</p><h2>Top drinks</h2></div><span className="view-all">This week</span></div>
          <ol className="top-drinks">
            {[["01", "Brown Sugar Milk Tea", "124 cups", "🧋"], ["02", "Strawberry Matcha", "98 cups", "🍵"], ["03", "Taro Cloud", "76 cups", "🥤"]].map(([rank, name, sold, icon]) => <li key={rank}><span className="rank">{rank}</span><span className="mini-drink">{icon}</span><span className="drink-info"><strong>{name}</strong><small>{sold}</small></span><span className="list-chevron">↗</span></li>)}
          </ol>
        </section>
      </div>
      <section className="inventory-alert"><span className="alert-icon">!</span><div><strong>Heads up: 2 items are running low</strong><p>Brown sugar syrup and large cups need a restock soon.</p></div><button type="button" className="text-link">View inventory <span>→</span></button></section>
    </main>
  );
}

function useOrder() {
  const [cart, setCart] = useState([]);
  const add = (drink) => setCart((items) => {
    const found = items.find((item) => item.name === drink.name);
    return found
      ? items.map((item) => item.name === drink.name ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { ...drink, quantity: 1 }];
  });
  const adjust = (name, change) => setCart((items) => items.map((item) => item.name === name ? { ...item, quantity: item.quantity + change } : item).filter((item) => item.quantity > 0));
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { cart, add, adjust, count, total, clear: () => setCart([]) };
}

function DrinkMenu({ add, selectedCategory, setSelectedCategory }) {
  const categories = ["All drinks", "Milk tea", "Fruit tea", "Matcha"];
  const filtered = selectedCategory === "All drinks" ? drinks : drinks.filter((drink) => drink.category === selectedCategory);
  return (
    <div className="menu-area">
      <div className="category-row">{categories.map((category) => <button key={category} className={`category-chip ${category === selectedCategory ? "selected" : ""}`} type="button" onClick={() => setSelectedCategory(category)}>{category}</button>)}</div>
      <div className="drink-grid">{filtered.map((drink) => <button className="drink-card" key={drink.name} type="button" onClick={() => add(drink)}><span className="drink-art">{drink.icon}</span><span className="drink-card-copy"><strong>{drink.name}</strong><small>{drink.note}</small><b>{money(drink.price)}</b></span><span className="add-button" aria-label={`Add ${drink.name}`}>+</span></button>)}</div>
    </div>
  );
}

function OrderSummary({ order, onCheckout, checkoutLabel = "Charge guest" }) {
  return (
    <aside className="order-panel">
      <div className="order-heading"><div><p className="eyebrow">YOUR ORDER</p><h2>Current ticket</h2></div><span className="item-count">{order.count}</span></div>
      {order.cart.length === 0 ? <div className="empty-order"><span>🧋</span><strong>Nothing brewing yet</strong><p>Add a drink to start an order.</p></div> : <div className="order-items">{order.cart.map((item) => <div className="order-item" key={item.name}><span className="mini-drink">{item.icon}</span><span className="order-item-name"><strong>{item.name}</strong><small>{money(item.price)} each</small></span><div className="quantity"><button type="button" onClick={() => order.adjust(item.name, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => order.adjust(item.name, 1)} aria-label={`Add one ${item.name}`}>+</button></div></div>)}</div>}
      <div className="order-totals"><div><span>Subtotal</span><span>{money(order.total)}</span></div><div><span>Tax <small>(8.25%)</small></span><span>{money(order.total * 0.0825)}</span></div><div className="grand-total"><strong>Total</strong><strong>{money(order.total * 1.0825)}</strong></div></div>
      <button className="button button-dark checkout-button" type="button" disabled={order.count === 0} onClick={onCheckout}>{checkoutLabel} <span>→</span></button>
    </aside>
  );
}

function Cashier() {
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
        <section className="menu-section"><div className="menu-title"><div><p className="eyebrow">MADE FRESH, JUST FOR YOU</p><h2>Our menu</h2></div><span className="menu-counter">{drinks.length} drinks</span></div><DrinkMenu add={order.add} selectedCategory={category} setSelectedCategory={setCategory} /></section>
        <OrderSummary order={order} onCheckout={checkout} />
      </div>
    </main>
  );
}

function Kiosk() {
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
        <section className="menu-section"><div className="menu-title"><div><p className="eyebrow">SIP SOMETHING LOVELY</p><h2>Pick your drink</h2></div></div><DrinkMenu add={(drink) => { setPlaced(false); order.add(drink); }} selectedCategory={category} setSelectedCategory={setCategory} /></section>
        <OrderSummary order={order} onCheckout={checkout} checkoutLabel="Place my order" />
      </div>
      <footer className="footer"><span>Need a hand? Our team is right over there <span className="pink">♥</span></span><a href="#/">Staff portal</a></footer>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home");
  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home");
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);
  const current = views.some((view) => view.id === route) ? route : "home";
  return <div className={`app app-${current}`}><Header current={current} /><div className="page-shell">{current === "manager" ? <Manager /> : current === "cashier" ? <Cashier /> : current === "kiosk" ? <Kiosk /> : <Hub />}</div></div>;
}
