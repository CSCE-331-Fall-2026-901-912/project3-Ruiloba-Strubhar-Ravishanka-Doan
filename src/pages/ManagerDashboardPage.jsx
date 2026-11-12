import React, { useEffect, useState, useRef } from "react";

const colors = {
  white: "#ffffff",
  black: "#111111",
  pink: "#ffecf2",
  pinkDark: "#d6417a",
  purple: "#f3e8ff",
  purpleDark: "#6b21a8",
  blue: "#e0f2fe",
  blueDark: "#0369a1",
  mediumBlue: "#2563eb",
  darkerBlue: "#1e3a8a",
  grayBorder: "#e5e7eb",
  grayBg: "#f9fafb",
};

const todayDate = new Date().toISOString().slice(0, 10);
const monthAgoDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const emptyForm = {
  item_name: "",
  item_cal: "",
  item_cost: "",
  item_category: "base_drink",
  base_item_type: "",
};

const reportOptions = [
  { value: "sales-summary", label: "Sales Summary", endpoint: "sales-summary" },
  { value: "sales-by-day", label: "Sales by Day", endpoint: "sales-by-day" },
  { value: "top-items", label: "Top Selling Items", endpoint: "top-items" },
  { value: "payment-methods", label: "Payment Methods", endpoint: "payment-methods" },
  { value: "employee-performance", label: "Employee Performance", endpoint: "employee-performance" },
  { value: "inventory", label: "Inventory", endpoint: "inventory" },
];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function normalizeMenu(item) {
  const clean = {};
  Object.keys(item || {}).forEach((key) => {
    const lower = key.toLowerCase().trim();
    let value = item[key];
    if (lower === "item_cost" || lower === "item_cal") {
      value = value !== null && value !== undefined ? Number(value) : 0;
    }
    if (lower === "itemid") {
      value = value !== null && value !== undefined ? Number(value) : 0;
    }
    clean[lower] = value;
  });
  return clean;
}

export default function ManagerDashboardPage() {
  const [activeTab, setActiveTab] = useState("menu");
  const [message, setMessage] = useState("");

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [reportType, setReportType] = useState("sales-summary");
  const [startDate, setStartDate] = useState(monthAgoDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [topLimit, setTopLimit] = useState(10);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const formCloseRef = useRef(null);

  const loadMenu = async () => {
    setMenuLoading(true);
    setMenuError("");
    try {
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to load menu items");
      const data = await response.json();
      setMenuItems(Array.isArray(data) ? data.map(normalizeMenu) : []);
    } catch (err) {
      setMenuError(err.message || "Failed to load menu items");
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    setEmployeesError("");
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to load employees");
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setEmployeesError(err.message || "Failed to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };
  useEffect(() => {
    if (showAdd || editingItem) {
      formCloseRef.current?.focus();
    }
  }, [showAdd, editingItem]);

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowAdd(false);
    setEditingItem(null);
  };

  const submitAdd = async (event) => {
    event.preventDefault();
    if (!form.item_name.trim()) {
      setMenuError("Item name is required");
      return;
    }
    setSaving(true);
    setMenuError("");
    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: form.item_name.trim(),
          item_cal: Number(form.item_cal) || 0,
          item_cost: Number(form.item_cost) || 0,
          item_category: form.item_category,
          base_item_type: form.base_item_type.trim() || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to add menu item");
      resetForm();
      setMessage("Menu item added.");
      await loadMenu();
    } catch (err) {
      setMenuError(err.message || "Failed to add menu item");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setShowAdd(false);
    setForm({
      item_name: item.item_name || "",
      item_cal: item.item_cal ?? "",
      item_cost: item.item_cost ?? "",
      item_category: item.item_category || "base_drink",
      base_item_type: item.base_item_type || "",
    });
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingItem) return;
    if (!form.item_name.trim()) {
      setMenuError("Item name is required");
      return;
    }
    setSaving(true);
    setMenuError("");
    try {
      const response = await fetch(`/api/menu/${editingItem.itemid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: form.item_name.trim(),
          item_cal: Number(form.item_cal) || 0,
          item_cost: Number(form.item_cost) || 0,
          item_category: form.item_category,
          base_item_type: form.base_item_type.trim() || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to update menu item");
      resetForm();
      setMessage("Menu item updated.");
      await loadMenu();
    } catch (err) {
      setMenuError(err.message || "Failed to update menu item");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.item_name}?`)) return;
    try {
      const response = await fetch(`/api/menu/${item.itemid}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete menu item");
      setMessage("Menu item deleted.");
      await loadMenu();
    } catch (err) {
      setMenuError(err.message || "Failed to delete menu item");
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    setReportError("");
    setReportData(null);
    const option = reportOptions.find((item) => item.value === reportType);
    try {
      if (reportType !== "inventory" && (!startDate || !endDate || startDate > endDate)) {
        throw new Error("Please select a valid date range (start date must be before or equal to end date).");
      }
      const params = new URLSearchParams();
      if (reportType !== "inventory") {
        params.set("start", startDate);
        params.set("end", endDate);
      }
      if (reportType === "top-items") {
        params.set("limit", String(topLimit));
      }
      const url = `/api/reports/${option.endpoint}${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReportData({ type: reportType, payload: data });
    } catch (err) {
      setReportError(err.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const filteredMenu = menuItems.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      String(item.item_name || "").toLowerCase().includes(query) ||
      String(item.item_category || "").toLowerCase().includes(query) ||
      String(item.base_item_type || "").toLowerCase().includes(query)
    );
  });

  const filteredEmployees = employees.filter((employee) => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      String(employee.first_name || "").toLowerCase().includes(query) ||
      String(employee.last_name || "").toLowerCase().includes(query) ||
      String(employee.role || "").toLowerCase().includes(query) ||
      String(employee.email || "").toLowerCase().includes(query) ||
      String(employee.user_name || "").toLowerCase().includes(query)
    );
  });
  const salesByDay = reportData?.type === "sales-by-day" ? reportData.payload : [];
  const maxDayRevenue = Math.max(1, ...salesByDay.map((row) => Number(row.revenue) || 0));
  const daysWithoutOrders = salesByDay.filter((row) => Number(row.orders) === 0).length;

  const topItems = reportData?.type === "top-items" ? reportData.payload : [];
  const maxTopQuantity = Math.max(1, ...topItems.map((row) => Number(row.quantity) || 0));

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${colors.grayBorder}`,
    fontSize: "14px",
    boxSizing: "border-box",
    background: colors.white,
  };

  const buttonStyle = (background, color, border = "none") => ({
    padding: "10px 16px",
    borderRadius: "10px",
    border,
    background,
    color,
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  });

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: colors.white,
    border: `1px solid ${colors.grayBorder}`,
    borderRadius: "12px",
    overflow: "hidden",
  };

  const thStyle = {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: "700",
    color: colors.black,
    background: colors.grayBg,
    borderBottom: `1px solid ${colors.grayBorder}`,
  };

  const tdStyle = {
    padding: "12px 14px",
    fontSize: "13px",
    borderBottom: `1px solid ${colors.grayBorder}`,
    verticalAlign: "middle",
  };

  return (
    <main
      style={{
        padding: "24px",
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: colors.white,
        minHeight: "100vh",
        color: colors.black,
      }}
    >
      {message && (
        <div
          style={{
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
            padding: "16px",
            marginBottom: "24px",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            style={{ background: "none", border: "none", fontSize: "22px", color: "#065f46", cursor: "pointer", padding: "0 4px" }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: colors.purpleDark }}>
            MANAGER DASHBOARD
          </p>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "34px", fontWeight: "700", color: colors.black }}>Manager Dashboard</h1>
          <p style={{ margin: 0, color: "#4b5563", fontSize: "15px" }}>Manage menu items and prices, then generate day-to-day reports.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }} role="tablist" aria-label="Dashboard sections">
          {[
            { value: "menu", label: "Menu Management" },
            { value: "reports", label: "Reports" },
            { value: "employees", label: "Employees" },
          ].map((tab) => {
          const selected = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={selected}
              onClick={() => handleTabChange(tab.value)}
              style={buttonStyle(selected ? colors.purpleDark : colors.purple, selected ? colors.white : colors.purpleDark, `1px solid ${colors.grayBorder}`)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "menu" && (
        <section role="tabpanel" aria-label="Menu Management section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <input
              type="text"
              placeholder="Search menu items"
              aria-label="Search menu items"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ ...inputStyle, maxWidth: "320px" }}
            />
            <button
              onClick={() => { setShowAdd(true); setEditingItem(null); setForm(emptyForm); }}
              style={buttonStyle(colors.mediumBlue, colors.white)}
            >
              Add Menu Item
            </button>
          </div>

          {menuError && (
            <div style={{ color: "#b91c1c", marginBottom: "12px", fontWeight: "600" }} aria-live="assertive">{menuError}</div>
          )}

          {menuLoading ? (
            <p style={{ color: "#4b5563" }}>Loading menu...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Calories</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.map((item) => (
                    <tr key={item.itemid}>
                      <td style={tdStyle}>{item.itemid}</td>
                      <td style={tdStyle}>{item.item_name}</td>
                      <td style={tdStyle}>{item.item_category}</td>
                      <td style={tdStyle}>{item.base_item_type || "-"}</td>
                      <td style={tdStyle}>{item.item_cal}</td>
                      <td style={tdStyle}>{money(item.item_cost)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button onClick={() => startEdit(item)} style={buttonStyle(colors.purple, colors.purpleDark, `1px solid ${colors.grayBorder}`)} aria-label={`Edit ${item.item_name}`}>
                            Edit
                          </button>
                          <button onClick={() => deleteItem(item)} style={buttonStyle(colors.pink, colors.pinkDark, `1px solid ${colors.grayBorder}`)} aria-label={`Delete ${item.item_name}`}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMenu.length === 0 && (
                    <tr>
                      <td style={tdStyle} colSpan={7}>No menu items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "employees" && (
        <section role="tabpanel" aria-label="Employees section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <input
              type="text"
              placeholder="Search employees"
              aria-label="Search employees"
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              style={{ ...inputStyle, maxWidth: "320px" }}
            />
            <button onClick={loadEmployees} style={buttonStyle(colors.mediumBlue, colors.white)}>
              Refresh
            </button>
          </div>

          {employeesError && (
            <div style={{ color: "#b91c1c", marginBottom: "12px", fontWeight: "600" }} aria-live="assertive">{employeesError}</div>
          )}

          {employeesLoading ? (
            <p style={{ color: "#4b5563" }}>Loading employees...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>First Name</th>
                    <th style={thStyle}>Last Name</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Username</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td style={tdStyle}>{employee.id}</td>
                      <td style={tdStyle}>{employee.first_name}</td>
                      <td style={tdStyle}>{employee.last_name}</td>
                      <td style={tdStyle}>{employee.role}</td>
                      <td style={tdStyle}>{employee.phone_number || "-"}</td>
                      <td style={tdStyle}>{employee.email || "-"}</td>
                      <td style={tdStyle}>{employee.user_name || "-"}</td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td style={tdStyle} colSpan={7}>No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "reports" && (
        <section role="tabpanel" aria-label="Reports section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px", alignItems: "end" }}>
            <div>
              <label htmlFor="report-select" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Report</label>
              <select id="report-select" value={reportType} onChange={(event) => setReportType(event.target.value)} style={inputStyle}>
                {reportOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {reportType !== "inventory" && (
              <>
                <div>
                  <label htmlFor="start-date" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Start Date</label>
                  <input id="start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="end-date" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>End Date</label>
                  <input id="end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} style={inputStyle} />
                </div>
              </>
            )}
            {reportType === "top-items" && (
              <div>
                <label htmlFor="top-limit" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Limit</label>
                <input id="top-limit" type="number" min="1" max="50" value={topLimit} onChange={(event) => setTopLimit(Number(event.target.value) || 10)} style={inputStyle} />
              </div>
            )}
            <div>
              <button onClick={generateReport} disabled={reportLoading} style={buttonStyle(colors.darkerBlue, colors.white)}>
                {reportLoading ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>

          {reportError && (
            <div style={{ color: "#b91c1c", marginBottom: "12px", fontWeight: "600" }} aria-live="assertive">{reportError}</div>
          )}

          {!reportLoading && !reportError && reportData?.type === "sales-summary" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                {[
                  ["Total Orders", reportData.payload.totalOrders],
                  ["Total Revenue", money(reportData.payload.totalRevenue)],
                  ["Item Revenue", money(reportData.payload.itemRevenue)],
                  ["Tax", money(reportData.payload.tax)],
                  ["Tips", money(reportData.payload.tips)],
                  ["Average Order", money(reportData.payload.averageOrder)],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${colors.grayBorder}`, background: colors.grayBg }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "11px", fontWeight: "700", color: "#6b7280" }}>{label}</p>
                    <strong style={{ fontSize: "22px", color: colors.black }}>{value}</strong>
                  </div>
                ))}
              </div>
              <p style={{ color: "#4b5563", fontSize: "13px" }}>
                Range: {reportData.payload.startDate} to {reportData.payload.endDate}
              </p>
            </div>
          )}

          {!reportLoading && !reportError && reportData?.type === "sales-by-day" && (
            <div>
              <p role="status" style={{ padding: "12px 16px", background: colors.purple, color: colors.purpleDark, borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginBottom: "18px" }}>
                {salesByDay.length === 0
                  ? "No dates found in this range."
                  : daysWithoutOrders === 0
                    ? `Orders were recorded on all ${salesByDay.length} days in this range.`
                    : `${daysWithoutOrders} of ${salesByDay.length} days had no orders. Those dates are shown below with $0.00 revenue.`}
              </p>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "700", color: colors.black }}>Revenue by Day</p>
                <div role="region" aria-label="Scrollable daily revenue chart" tabIndex={0} style={{ overflowX: "auto", paddingBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "180px", minWidth: `${Math.max(0, salesByDay.length * 48)}px`, padding: "8px 0", borderBottom: `1px solid ${colors.grayBorder}` }}>
                    {salesByDay.map((row) => (
                      <div key={row.date} style={{ flex: "1 0 42px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "4px", minWidth: "42px" }}>
                        <div
                          style={{ width: "100%", height: `${Number(row.revenue) > 0 ? Math.max(4, (Number(row.revenue) / maxDayRevenue) * 150) : 0}px`, background: Number(row.orders) === 0 ? colors.grayBorder : colors.purpleDark, borderRadius: "6px 6px 0 0" }}
                          title={`${row.date}: ${row.orders} orders, ${money(row.revenue)}`}
                        />
                        <small style={{ fontSize: "10px", color: "#4b5563", whiteSpace: "nowrap" }}>{String(row.date).slice(5, 10)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div role="region" aria-label="Scrollable daily sales report" tabIndex={0} style={{ overflow: "auto", maxHeight: "420px", border: `1px solid ${colors.grayBorder}`, borderRadius: "12px" }}>
                <table style={{ ...tableStyle, border: "none", borderRadius: 0 }}>
                  <thead>
                    <tr>
                      {['Date', 'Orders', 'Revenue', 'Item Revenue'].map((heading) => (
                        <th key={heading} scope="col" style={{ ...thStyle, position: "sticky", top: 0, zIndex: 1 }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesByDay.map((row) => (
                      <tr key={row.date} style={Number(row.orders) === 0 ? { background: "#faf5ff" } : {}}>
                        <td style={tdStyle}>{String(row.date).slice(0, 10)}</td>
                        <td style={tdStyle}>{Number(row.orders) === 0 ? <span style={{ color: colors.purpleDark, fontWeight: "700" }}>0 · No orders</span> : row.orders}</td>
                        <td style={tdStyle}>{money(row.revenue)}</td>
                        <td style={tdStyle}>{money(row.itemRevenue)}</td>
                      </tr>
                    ))}
                    {salesByDay.length === 0 && <tr><td style={tdStyle} colSpan={4}>No dates found for this range.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!reportLoading && !reportError && reportData?.type === "top-items" && (
            <div>
              <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {topItems.map((row, index) => (
                  <div key={index}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600" }}>{row.name}</span>
                      <span style={{ color: "#4b5563" }}>{row.quantity} sold · {money(row.revenue)}</span>
                    </div>
                    <div style={{ height: "10px", background: colors.grayBg, borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ width: `${(Number(row.quantity) / maxTopQuantity) * 100}%`, height: "100%", background: colors.mediumBlue, borderRadius: "999px" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Item</th>
                      <th style={thStyle}>Quantity</th>
                      <th style={thStyle}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((row, index) => (
                      <tr key={index}>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>{row.quantity}</td>
                        <td style={tdStyle}>{money(row.revenue)}</td>
                      </tr>
                    ))}
                    {topItems.length === 0 && (
                      <tr>
                        <td style={tdStyle} colSpan={3}>No item data for this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!reportLoading && !reportError && reportData?.type === "payment-methods" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Payment Method</th>
                    <th style={thStyle}>Orders</th>
                    <th style={thStyle}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                   {reportData.payload
                     .filter((row) => !['kiosk', 'counter'].includes(String(row.payType).toLowerCase()))
                     .map((row, index) => (
                       <tr key={index}>
                         <td style={tdStyle}>{row.payType}</td>
                         <td style={tdStyle}>{row.orders}</td>
                         <td style={tdStyle}>{money(row.revenue)}</td>
                       </tr>
                     ))}
                   {reportData.payload.filter((row) => !['kiosk', 'counter'].includes(String(row.payType).toLowerCase())).length === 0 && (
                     <tr>
                       <td style={tdStyle} colSpan={3}>No payment data for this range.</td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          )}

          {!reportLoading && !reportError && reportData?.type === "employee-performance" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Orders</th>
                    <th style={thStyle}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.payload.map((row, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{row.server}</td>
                      <td style={tdStyle}>{row.orders}</td>
                      <td style={tdStyle}>{money(row.revenue)}</td>
                    </tr>
                  ))}
                  {reportData.payload.length === 0 && (
                    <tr>
                      <td style={tdStyle} colSpan={3}>No employee data for this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!reportLoading && !reportError && reportData?.type === "inventory" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Supply</th>
                    <th style={thStyle}>Quantity</th>
                    <th style={thStyle}>Units</th>
                    <th style={thStyle}>Cost</th>
                    <th style={thStyle}>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.payload.map((row, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>{row.qty}</td>
                      <td style={tdStyle}>{row.units}</td>
                      <td style={tdStyle}>{money(row.cost)}</td>
                      <td style={tdStyle}>{row.recordedAt ? String(row.recordedAt).slice(0, 10) : "-"}</td>
                    </tr>
                  ))}
                  {reportData.payload.length === 0 && (
                    <tr>
                      <td style={tdStyle} colSpan={5}>No inventory data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {(showAdd || editingItem) && (
        <div
          style={{
            position: "fixed",
             inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <form
            onSubmit={editingItem ? submitEdit : submitAdd}
            role="dialog"
            aria-modal="true"
            aria-label={editingItem ? `Edit ${editingItem.item_name}` : "Add Menu Item"}
            style={{
              background: colors.white,
              padding: "24px",
              borderRadius: "16px",
              width: "min(420px, 92vw)",
              maxWidth: "92vw",
              maxHeight: "90vh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
              boxShadow: "0px 10px 25px rgba(0,0,0,0.1)",
              border: `1px solid ${colors.grayBorder}`,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}>
                {editingItem ? `Edit ${editingItem.item_name}` : "Add Menu Item"}
              </h3>
              <button
                ref={formCloseRef}
                type="button"
                onClick={resetForm}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.black }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div>
              <label htmlFor="menu-item-name" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Item name</label>
              <input
                id="menu-item-name"
                type="text"
                placeholder="Item name"
                aria-label="Item name"
                value={form.item_name}
                onChange={(event) => setForm({ ...form, item_name: event.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="menu-item-calories" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Calories</label>
              <input
                id="menu-item-calories"
                type="number"
                placeholder="Calories"
                aria-label="Calories"
                value={form.item_cal}
                onChange={(event) => setForm({ ...form, item_cal: event.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="menu-item-price" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Price</label>
              <input
                id="menu-item-price"
                type="number"
                step="0.01"
                placeholder="Price"
                aria-label="Price"
                value={form.item_cost}
                onChange={(event) => setForm({ ...form, item_cost: event.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="menu-item-category" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Category</label>
              <select
                id="menu-item-category"
                value={form.item_category}
                aria-label="Category"
                onChange={(event) => setForm({ ...form, item_category: event.target.value })}
                style={inputStyle}
              >
                <option value="base_drink">base_drink</option>
                <option value="seasonal_drink">seasonal_drink</option>
                <option value="topping">topping</option>
              </select>
            </div>
            <div>
              <label htmlFor="menu-item-base-type" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Base item type</label>
              <input
                id="menu-item-base-type"
                type="text"
                placeholder="Base item type (optional)"
                aria-label="Base item type"
                value={form.base_item_type}
                onChange={(event) => setForm({ ...form, base_item_type: event.target.value })}
                style={inputStyle}
              />
            </div>
            {menuError && <div style={{ color: "#b91c1c", fontWeight: "600" }} aria-live="assertive">{menuError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button type="button" onClick={resetForm} style={buttonStyle(colors.grayBg, colors.black, `1px solid ${colors.grayBorder}`)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={buttonStyle(colors.purpleDark, colors.white)}>
                {saving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
