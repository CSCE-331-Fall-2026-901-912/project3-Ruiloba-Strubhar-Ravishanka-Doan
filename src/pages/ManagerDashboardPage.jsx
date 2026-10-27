import React from "react";
import PageIntro from "../components/PageIntro.jsx";

function Metric({ label, value, change, tone = "" }) {
  return <article className={`metric-card ${tone}`}><p>{label}</p><strong>{value}</strong><span>{change}</span></article>;
}

export default function ManagerDashboardPage() {
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
