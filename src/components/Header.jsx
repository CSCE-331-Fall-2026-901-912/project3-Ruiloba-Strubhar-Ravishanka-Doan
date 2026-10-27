import React from "react";

export default function Header({ current }) {
  const brand = (
    <>
      <span className="brand-mark">b</span>
      <span>Boba Bloom<small>TEA HOUSE</small></span>
    </>
  );

  return (
    <header className="topbar">
      {current === "home"
        ? <a className="brand" href="/" aria-label="Boba Bloom home">{brand}</a>
        : <div className="brand">{brand}</div>}
      {current === "home" && <nav className="top-links" aria-label="Main navigation"><span className="active">Portal</span></nav>}
      <div className="open-status"><span /> Open today <span className="status-hours">· 10am–9pm</span></div>
    </header>
  );
}
