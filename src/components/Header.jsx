import React from "react";

export default function Header({ current }) {
  const brand = (
    <>
      {/* FIXED: Added inline color style configuration to the 'P' logo brand mark */}
      <span
        className="brand-mark"
        style={{
          fontSize: "35px",
          fontWeight: "bold",
          color: "#fff", // 🎨 
          backgroundColor: "#276ab3", // 🎨 ADDED BACKGROUND COLOR (Standard Blue)
          padding: "4px 14px",       // 📏 Added padding to give the background some breathing room
          borderRadius: "50%",          // 🔄 Perfect circle transformation
          display: "inline-flex",       // 🌟 Flex context activation
          alignItems: "center",         // 🌟 Vertically center lines
          justifyContent: "center",     // 🌟 Horizontally center characters
          marginRight: "5px",          // Spacing buffer to the right
          boxSizing: "border-box"

        }}
      >
        P
      </span>

      <span style={{ display: "flex", flexDirection: "column" }}>
        <h1 style={{ margin: 0, padding: 0, fontSize: "30px", fontWeight: "700", lineHeight: "1.1", color: "inherit" }}>
          Pearl Garden 🧋
        </h1>

        <small style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px", opacity: 0.8 }}>
          Squad_12 TEA HOUSE
        </small>
      </span>
    </>
  );

  return (
    <header className="topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px" }}>
      {current === "home"
        ? <a className="brand" href="/" aria-label="Pearl Garden home" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>{brand}</a>
        : <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>{brand}</div>}


      <div className="open-status" style={{ fontSize: "18px", fontWeight: "500", display: "flex", alignItems: "center" }}>
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4caf50", marginRight: "6px" }} />
        Open
        <span className="status-hours" style={{ fontSize: "18px", fontWeight: "600", marginLeft: "4px" }}>· 24 HR</span>
      </div>
    </header>
  );
}
