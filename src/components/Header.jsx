import React from "react";

export default function Header({ current }) {
  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label="Boba Bloom home">
        <span className="brand-mark">b</span>
        <span>Boba Bloom<small>TEA HOUSE</small></span>
      </a>
      <nav className="top-links" aria-label="Main navigation">
        <a className={current === "home" ? "active" : ""} href="#/">Portal</a>
      </nav>
      <div className="open-status"><span /> Open today <span className="status-hours">· 10am–9pm</span></div>
    </header>
  );
}
