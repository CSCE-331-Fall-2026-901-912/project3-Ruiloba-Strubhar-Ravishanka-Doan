import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import CashierPage from "./pages/CashierPage.jsx";
import CustomerKioskPage from "./pages/CustomerKioskPage.jsx";
import ManagerDashboardPage from "./pages/ManagerDashboardPage.jsx";
import PortalPage from "./pages/PortalPage.jsx";

const pages = {
  manager: ManagerDashboardPage,
  cashier: CashierPage,
  kiosk: CustomerKioskPage,
};

export default function App() {
  const [current, setCurrent] = useState("home");

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  const Page = pages[current] || PortalPage;

  return (
    <div className={`app app-${current}`}>
      <Header current={current} />
      <div className="page-shell">
        {current === "home" ? <PortalPage onNavigate={setCurrent} /> : <Page />}
      </div>
    </div>
  );
}
