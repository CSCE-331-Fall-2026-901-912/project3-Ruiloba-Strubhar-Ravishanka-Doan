import React from "react";
import { views } from "../data/shop.js";

export default function PortalPage({ onNavigate }) {
  return (
    <main>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <p className="eyebrow">YOUR LITTLE CORNER OF BOBA</p>
          <h1>Good things<br />are brewing<span>.</span></h1>
          <p>Welcome to Pearl Garden. Pick a view to jump into your day.</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="sun-shape" />
          <div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" />
          <div className="hero-cup"><div className="cup-lid" /><div className="cup-straw" /><div className="cup-tea">Pearl<br />Garden</div><div className="pearls">● ● ●<br /> ● ●</div></div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✦</span>
          <span className="art-caption">a little joy<br />in every sip</span>
        </div>
      </section>
      <section className="portal-section">
        <div className="section-heading">
          <div><p className="eyebrow">CHOOSE YOUR VIEW</p><h2>Where to today?</h2></div>
          <span className="section-note">Three ways to keep the good stuff moving.</span>
        </div>
        <div className="portal-grid">
          {views.map((view, index) => (
            <a
              className={`portal-card portal-${view.id}`}
              href={`#/${view.id}`}
              key={view.id}
              tabIndex={0}
              aria-label={`Open view: ${view.label}. ${view.description}`}
              onClick={(event) => { event.preventDefault(); onNavigate(view.id); }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  onNavigate(view.id);
                }
              }}
            >
              <div className="card-top"><span className="view-icon" aria-hidden="true">{view.icon}</span><span className="card-arrow" aria-hidden="true">↗</span></div>
              <p className="eyebrow">0{index + 1} / {view.id.toUpperCase()}</p>
              <h3>{view.label}</h3><p className="muted">{view.description}</p>
              <span className="text-link">Open view <span aria-hidden="true">→</span></span>
            </a>
          ))}
        </div>
      </section>
      <footer className="footer"><span>Made with a little extra sweetness <span className="pink" aria-hidden="true">♥</span></span><span>PEARL GARDEN · EST. 2026</span></footer>
    </main>
  );
}
