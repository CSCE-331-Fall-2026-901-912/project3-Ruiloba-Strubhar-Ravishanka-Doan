import React from "react";
import { views } from "../data/shop.js";

export default function PortalPage() {
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
        <div className="section-heading">
          <div><p className="eyebrow">CHOOSE YOUR VIEW</p><h2>Where to today?</h2></div>
          <span className="section-note">Three ways to keep the good stuff moving.</span>
        </div>
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
