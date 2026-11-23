import React, { useEffect, useState } from "react";
import GoogleTranslateAPI from "./GoogleTranslateAPI.jsx";
import RewardsAuthModal from "./RewardsAuthModal.jsx";
import { useRewards } from "../hooks/RewardsContext.jsx";

export default function Header({ current, isHighContrast }) {
  const { user, logout } = useRewards();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Reset Google Translate cookie to English when starting on the hub page
  useEffect(() => {
    if (current === "home") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;

      const select = document.querySelector(".goog-te-combo");
      if (select && select.value !== "en" && select.value !== "") {
        select.value = "en";
        select.dispatchEvent(new Event("change"));
      }
    }
  }, [current]);

  return (
    <>
      <header
        className="topbar"
        style={isHighContrast ? {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          backgroundColor: "#1e003a",
          borderBottom: "4px solid #ffffff"
        } : {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          backgroundColor: "#572649"
        }}
      >
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff" }}>
          <span
            className="brand-mark notranslate"
            aria-hidden="true"
            style={isHighContrast ? {
              fontSize: "35px",
              fontWeight: "900",
              color: "#120024",
              backgroundColor: "#ffffff",
              padding: "4px 14px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "5px",
              boxSizing: "border-box",
              border: "3px solid #ffb3df"
            } : {
              fontSize: "35px",
              fontWeight: "bold",
              color: "#fff",
              backgroundColor: "#276ab3",
              padding: "4px 14px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "5px",
              boxSizing: "border-box"
            }}
          >
            P
          </span>

          <span style={{ display: "flex", flexDirection: "column" }}>
            <span
              className="notranslate"
              style={isHighContrast ? {
                margin: 0, padding: 0, fontSize: "30px", fontWeight: "950", lineHeight: "1.1", color: "#ffffff"
              } : {
                margin: 0, padding: 0, fontSize: "30px", fontWeight: "700", lineHeight: "1.1", color: "#fff"
              }}
            >
              Pearl Garden <span aria-hidden="true">🧋</span>
            </span>
            <small style={isHighContrast ? {
              fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px", color: "#ffb3df", fontWeight: "900"
            } : {
              fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px", color: "#fff"
            }}>
              Squad_12 TEA HOUSE
            </small>
          </span>
        </div>

        {/* Right side container: holds Translate dropdown, Open status, and Login/Logout at far right */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <GoogleTranslateAPI isHighContrast={isHighContrast} />
          </div>

          <div className="open-status" style={{ fontSize: "18px", fontWeight: "500", display: "flex", alignItems: "center", color: "#fff" }}>
            <span aria-hidden="true" style={isHighContrast ? {
              display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#00ff00", marginRight: "8px", border: "2px solid #ffffff"
            } : {
              display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4caf50", marginRight: "6px"
            }} />
            <span style={isHighContrast ? { fontWeight: "900" } : {}}>Open</span>
            <span className="status-hours" style={isHighContrast ? { fontSize: "18px", fontWeight: "900", marginLeft: "6px", color: "#ffb3df" } : { fontSize: "18px", fontWeight: "600", marginLeft: "4px", color: "#fff" }}>
              · 24 HR
            </span>
          </div>

          {user ? (
            <button
              type="button"
              className="pg-header-auth-btn"
              onClick={logout}
              aria-label={`Logout from ${user.email}`}
              style={isHighContrast ? {
                backgroundColor: "#ffffff",
                color: "#120024",
                border: "3px solid #ffb3df",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                fontWeight: "950",
                cursor: "pointer"
              } : {
                backgroundColor: "#ffffff",
                color: "#572649",
                border: "2px solid #ffffff",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              className="pg-header-auth-btn"
              onClick={() => setAuthModalOpen(true)}
              aria-label="Login to Pearl Garden Rewards"
              style={isHighContrast ? {
                backgroundColor: "#120024",
                color: "#ffffff",
                border: "3px solid #ffffff",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                fontWeight: "900",
                cursor: "pointer"
              } : {
                backgroundColor: "#276ab3",
                color: "#ffffff",
                border: "2px solid #ffffff",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <RewardsAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        allowSkip={false}
        isHighContrast={isHighContrast}
      />
    </>
  );
}
