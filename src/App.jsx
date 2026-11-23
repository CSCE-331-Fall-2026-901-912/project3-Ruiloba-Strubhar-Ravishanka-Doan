import React, { useEffect, useState, useRef } from "react";
import Header from "./components/Header.jsx";
import CashierPage from "./pages/CashierPage.jsx";
import CustomerKioskPage from "./pages/CustomerKioskPage.jsx";
import ManagerDashboardPage from "./pages/ManagerDashboardPage.jsx";
import PortalPage from "./pages/PortalPage.jsx";
import PageMagnifier from "./components/PageMagnifier.jsx";
import FontSizeControl from "./components/FontSizeControl.jsx";
import { RewardsProvider } from "./hooks/RewardsContext.jsx";

const pages = {
  manager: ManagerDashboardPage,
  cashier: CashierPage,
  kiosk: CustomerKioskPage,
};

export default function App() {
  const [current, setCurrent] = useState("home");
  const mainContentRef = useRef(null);

  // 1. Lifted High-Contrast Theme State Engine up to the top level
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Font size scaling for impaired users
  const [fontScale, setFontScale] = useState(() => {
    const stored = Number(localStorage.getItem("fontScale"));
    return Number.isFinite(stored) && stored > 0 ? stored : 1;
  });

  useEffect(() => {
    localStorage.setItem("fontScale", String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  // Accessibility Focus Manager: Tracks transformations without changing scroll alignment
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.focus({ preventScroll: true });
    }
  }, [current]);

  // Reset Carol persona font size whenever the customer kiosk page is re-entered
  useEffect(() => {
    if (current === 'kiosk') {
      setFontScale(1);
    }
  }, [current]);

  const Page = pages[current] || PortalPage;

  return (
    <RewardsProvider>
      <div className={`app app-${current}`} style={{ zoom: String(fontScale) }}>
        {/* 2. Passed isHighContrast prop to the shared Persistent Header Bar */}
        <Header
          current={current}
          onNavigate={setCurrent}
          isHighContrast={isHighContrast}
        />

        {/* Main Content Area Canvas Wrapper (div so child pages own the single top-level <main>) */}
        <div
          ref={mainContentRef}
          className="page-shell"
          tabIndex={-1}
          style={{ outline: "none" }}
        >
          {current === "home" ? (
            <PortalPage onNavigate={setCurrent} />
          ) : (
            /* 3. Render dynamically routed child components with state tracking functions hook */
            <Page
              isHighContrast={isHighContrast}
              setIsHighContrast={setIsHighContrast}
              fontScale={fontScale}
              setFontScale={setFontScale}
            />
          )}
        </div>
      </div>
      <aside
        aria-label="Accessibility controls"
        className={`pg-a11y-controls ${isHighContrast ? "high-contrast" : ""}`}
      >
        {current === "kiosk" && (
          <button
            type="button"
            className="pg-contrast-toggle-btn"
            onClick={() => setIsHighContrast(!isHighContrast)}
            aria-pressed={isHighContrast}
          >
            <span style={{ display: isHighContrast ? "inline" : "none" }}>
              Standard Mode
            </span>
            <span style={{ display: isHighContrast ? "none" : "inline" }}>
              High Contrast Mode
            </span>
          </button>
        )}
        <PageMagnifier />
        <FontSizeControl scale={fontScale} onScaleChange={setFontScale} />
      </aside>
    </RewardsProvider>
  );
}
