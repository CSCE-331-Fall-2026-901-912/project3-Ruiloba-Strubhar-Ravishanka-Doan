import React, { useEffect, useState, useRef } from "react";
import Header from "./components/Header.jsx";
import CashierPage from "./pages/CashierPage.jsx";
import CustomerKioskPage from "./pages/CustomerKioskPage.jsx";
import ManagerDashboardPage from "./pages/ManagerDashboardPage.jsx";
import PortalPage from "./pages/PortalPage.jsx";
import PageMagnifier from "./components/PageMagnifier.jsx";

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

  const Page = pages[current] || PortalPage;

  return (
    <>
      <div className={`app app-${current}`}>
        {/* 2. Passed isHighContrast prop to the shared Persistent Header Bar */}
        <Header 
          current={current} 
          onNavigate={setCurrent} 
          isHighContrast={isHighContrast} 
        />

        {/* Main Content Area Canvas Wrapper */}
        <main
          ref={mainContentRef}
          className="page-shell"
          tabIndex={-1}
          style={{ outline: "none" }}
          role="main"
          aria-live="polite"
        >
          {current === "home" ? (
            <PortalPage onNavigate={setCurrent} />
          ) : (
            /* 3. Render dynamically routed child components with state tracking functions hook */
            <Page 
              isHighContrast={isHighContrast} 
              setIsHighContrast={setIsHighContrast} 
            />
          )}
        </main>
      </div>
      <PageMagnifier />
    </>
  );
}
