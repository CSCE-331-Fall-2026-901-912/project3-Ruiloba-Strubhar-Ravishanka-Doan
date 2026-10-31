import React from "react";

export default function Header({ current }) {
  const brand = (
    <>
      <span className="brand-mark">P</span>
      <span>Pearl Garden<small>Squad_12 TEA HOUSE</small></span>
    </>
  );

  return (
    <header className="topbar">
      {current === "home"
        ? <a className="brand" href="/" aria-label="Pearl Garden home">{brand}</a>
        : <div className="brand">{brand}</div>}

      <div className="open-status"><span /> Open<span className="status-hours">· 24 HR</span></div>
    </header>
  );
}
