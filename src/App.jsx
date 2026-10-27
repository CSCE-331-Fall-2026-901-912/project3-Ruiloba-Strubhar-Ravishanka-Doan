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
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home");

  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash.replace(/^#\/?/, "").split("/")[0] || "home");
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  const current = Object.hasOwn(pages, route) ? route : "home";
  const Page = pages[current] || PortalPage;

  return (
    <div className={`app app-${current}`}>
      <Header current={current} />
      <div className="page-shell"><Page /></div>
    </div>
  );
}
