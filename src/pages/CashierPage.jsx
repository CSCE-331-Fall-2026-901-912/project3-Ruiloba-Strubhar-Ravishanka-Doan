import React, { useState, useEffect } from "react";
import useOrder from "../hooks/useOrder.js";

// COMPLETE EMOJI MATCHING MATRIX
const getDrinkEmoji = (name) => {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('oreo')) return "🍪";
  if (lower.includes('honey')) return "🍯";
  if (lower.includes('melon')) return "🍉";
  if (lower.includes('chocolate') || lower.includes('cocoa')) return "🍫";
  if (lower.includes('milk strike') || lower.includes('milk')) return "🥛";
  if (lower.includes('brown sugar') || lower.includes('classic')) return "🧋";
  if (lower.includes('strawberry') || lower.includes('berry')) return "🍓";
  if (lower.includes('matcha')) return "🫖";
  if (lower.includes('taro')) return "🍠";
  if (lower.includes('mango')) return "🥭";
  if (lower.includes('peach')) return "🍑";
  if (lower.includes('oolong')) return "🍃";
  if (lower.includes('lemonade') || lower.includes('citrus')) return "🍋";
  if (lower.includes('green tea') || lower.includes('black tea')) return "🍵";
  if (lower.includes('slush')) return "🍧";
  return "🥤";
};

export default function CashierPage() {
  const order = useOrder();

  // Data State
  const [drinksList, setDrinksList] = useState([]);
  const [toppingsList, setToppingsList] = useState([]);

  // Filtering System State - Aligned with your button layout strings
  const [categoryFilter, setCategoryFilter] = useState("All Drinks");
  const [sortFilter, setSortFilter] = useState("Alphabetical");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  // Interface System States
  const [message, setMessage] = useState("");
  const [activeCustomization, setActiveCustomization] = useState(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Custom Customization Option Flags
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedToppings, setSelectedToppings] = useState([]);

  // On-screen Numerical Keyboard Buffers
  const [keypadInput, setKeypadInput] = useState("");

  // 1. Fetch live PostgreSQL dataset rows on load
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => {
        if (!res.ok) throw new Error("Server channel returned error response parameters.");
        return res.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data)) {
          console.warn("Received empty or malformed dataset format array block.");
          return;
        }

        const normalizedData = data.map((item) => {
          if (!item || typeof item !== "object") return {};
          const cleanObj = {};
          Object.keys(item).forEach((key) => {
            if (key) {
              const lowerKey = key.toLowerCase().trim();
              let value = item[key];
              if (lowerKey === "item_cost" || lowerKey === "item_cal" || lowerKey === "inventory_count") {
                value = value !== null && value !== undefined ? parseFloat(value) : 0;
              }
              if (lowerKey === "itemid") {
                value = value !== null && value !== undefined ? parseInt(value, 10) : 0;
              }
              cleanObj[lowerKey] = value;
            }
          });
          return cleanObj;
        });

        // Catch everything that isn't explicitly a topping!
        const drinks = normalizedData.filter((item) => {
          const category = item.item_category ? String(item.item_category).toLowerCase().trim() : "";
          return category !== "topping";
        });

        const toppings = normalizedData.filter((item) => {
          const category = item.item_category ? String(item.item_category).toLowerCase().trim() : "";
          return category === "topping";
        });

        setDrinksList(drinks);
        setToppingsList(toppings);
      })
      .catch((err) => console.error("Database connection configuration breakdown:", err));
  }, []);

  // 2. Reactive Data Filtering Evaluation Matrix (Synchronized with layout buttons)
  const getFilteredDrinks = () => {
    let output = [...drinksList];

    if (categoryFilter === "Seasonal Menu") {
      output = output.filter((d) => {
        const cat = d.item_category ? String(d.item_category).toLowerCase().trim() : "";
        return cat === "seasonal_drink";
      });
    } else if (categoryFilter === "Regular Menu") {
      output = output.filter((d) => {
        const cat = d.item_category ? String(d.item_category).toLowerCase().trim() : "";
        return cat === "base_drink";
      });
    } else if (categoryFilter !== "All Drinks") {
      output = output.filter((d) => {
        const type = d.base_item_type ? String(d.base_item_type).toLowerCase().replace(/\s+/g, '') : "";
        const match = categoryFilter.toLowerCase().replace(/\s+/g, '');
        return type === match;
      });
    }

    if (availabilityFilter === "Available Only") {
      output = output.filter((d) => {
        const count = d.inventory_count !== undefined && d.inventory_count !== null ? Number(d.inventory_count) : 1;
        return count > 0;
      });
    }

    if (sortFilter === "Alphabetical") {
      output.sort((a, b) => String(a.item_name || '').localeCompare(String(b.item_name || '')));
    } else if (sortFilter === "Reverse Alphabetical") {
      output.sort((a, b) => String(b.item_name || '').localeCompare(String(b.item_name || '')));
    }

    return output;
  };

  // 3. Finalize Order & Process Database Pipeline Execution 
  const handleCheckout = async () => {
    if (order.items.length === 0) return;

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          tip: order.tip,
          total: order.total,
        }),
      });

      if (response.ok) {
        setMessage(`Order placed successfully! ${order.count} ${order.count === 1 ? "drink is" : "drinks are"} on the way.`);
        order.clear();

        // Scroll the entire window/page back to the top cleanly
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Server failed to accept ticket parameters.");
      }
    } catch (err) {
      console.error(err);
      alert("Network exception encountered clearing payment routing.");
    }
  };

  // Numerical Keypad Input Logic
  const handleKeypadPress = (val) => {
    if (val === "Clear") {
      setKeypadInput("");
    } else if (val === ".") {
      if (!keypadInput.includes(".")) setKeypadInput(keypadInput + ".");
    } else {
      setKeypadInput(keypadInput + val);
    }
  };

  const applyCustomKeypadTip = () => {
    const parsedTip = parseFloat(keypadInput);
    if (!isNaN(parsedTip) && parsedTip >= 0) {
      order.setTip(parsedTip);
    }
    setKeypadInput("");
    setShowTipModal(false);
  };

  const handleEditItemClick = (item, idx) => {
    const originalDrink = drinksList.find(d => String(d.item_name).toLowerCase() === String(item.drink_name).toLowerCase()) || {
      itemid: item.id,
      item_name: item.drink_name,
      item_cost: item.item_cost
    };
    setEditingIndex(idx);
    setActiveCustomization(originalDrink);
    setSelectedSize(item.size);
    setSelectedToppings(Array.isArray(item.toppings) ? item.toppings : (item.topping && item.topping !== "None" ? String(item.topping).split(",").map(value => value.trim()).filter(Boolean) : []));
  };

  // Color Palette Definitions (Specified Aesthetics)
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
    grayBg: "#f9fafb"
  };

  return (
    <main className="content-page" style={{ padding: "24px", fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: colors.white, minHeight: "100vh", color: colors.black }}>

      {/* Visual Notification System Banner */}
      {message && (
        <div
          className="success-message"
          style={{
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
            padding: "16px",
            marginBottom: "24px",
            borderRadius: "12px",
            position: "relative",
            fontSize: "18px",
            fontWeight: "500",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>✨ {message}</span>
          <button onClick={() => setMessage("")} style={{ background: "none", border: "none", fontSize: "22px", color: "#065f46", cursor: "pointer", padding: "0 4px" }}>×</button>
        </div>
      )}

      <div className="pos-layout" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px", alignItems: "flex-start" }}>

        {/* LEFT COLUMN: FILTER CONTROLS & DRIVE DRINK BUTTON SELECTION GRID */}
        <section className="menu-section" style={{ backgroundColor: colors.white }}>
          <header style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", backgroundColor: colors.pink }}>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: "700", color: colors.black, textAlign: "center" }}>
              Cashier Counter
            </h1>

            <p style={{ margin: 0, color: "#666", fontSize: "14px", textAlign: "center" }}>
              Select menu items to customize and add to order ticket.
            </p>

          </header>

          {/* Subheading Group 1: Category Mapping Selectors */}
          <div className="filter-group-row" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {["All Drinks", "Milk Tea", "Green Tea", "Lemonade", "Slush", "Milk Strike", "Black Tea", "Regular Menu", "Seasonal Menu"].map((type) => {
              const isSelected = categoryFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setCategoryFilter(type)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: isSelected ? "1px solid transparent" : `1px solid ${colors.grayBorder}`,
                    background: isSelected ? colors.purpleDark : colors.purple,
                    color: isSelected ? colors.white : colors.purpleDark,
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out"
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Subheading Group 2: Sorting and Stock Condition Toggles */}
          <div className="filter-group-row" style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
            <button
              onClick={() => setSortFilter(sortFilter === "Alphabetical" ? "Reverse Alphabetical" : "Alphabetical")}
              style={{
                padding: "8px 14px",
                border: `1px solid ${colors.grayBorder}`,
                background: sortFilter === "Reverse Alphabetical" ? colors.pinkDark : colors.pink,
                color: sortFilter === "Reverse Alphabetical" ? colors.white : colors.pinkDark,
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                borderRadius: "20px",
                transition: "all 0.15s ease-in-out"
              }}
            >
              ⇅ Sort: {sortFilter === "Alphabetical" ? "A-Z Order" : "Z-A Order"}
            </button>

            <button
              onClick={() => setAvailabilityFilter(availabilityFilter === "All" ? "Available Only" : "All")}
              style={{
                padding: "8px 14px",
                border: `1px solid ${colors.grayBorder}`,
                borderRadius: "20px",
                cursor: "pointer",
                background: availabilityFilter === "Available Only" ? colors.blueDark : colors.blue,
                color: availabilityFilter === "Available Only" ? colors.white : colors.blueDark,
                fontWeight: "600",
                fontSize: "13px",
                transition: "all 0.15s ease-in-out"
              }}
            >
              📋 {availabilityFilter === "Available Only" ? "Showing In-Stock Only" : "Showing All Menu Items"}
            </button>
          </div>

          {/* Itemized Grid Layout Mapping */}
          <div className="drinks-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
            {getFilteredDrinks().map((drink) => {
              const isSeasonal = drink.item_category ? String(drink.item_category).toLowerCase().includes("seasonal") : false;
              const isOutOfStock = drink.inventory_count !== undefined && Number(drink.inventory_count) <= 0;

              const handleSelectDrink = () => {
                setEditingIndex(null);
                setActiveCustomization(drink);
                setSelectedSize("M");
                setSelectedToppings([]);
              };

              // Determine visual background based on status
              let cardBg = colors.blue; // Regular drinks have light blue background color
              let borderStyle = `1px solid ${colors.grayBorder}`;
              if (isOutOfStock) {
                cardBg = "#f3f4f6";
              } else if (isSeasonal) {
                cardBg = colors.pink;
                borderStyle = `1px solid ${colors.pinkDark}20`;
              }

              return (
                <button
                  key={drink.itemid || Math.random()}
                  onClick={handleSelectDrink}
                  disabled={isOutOfStock}
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    border: borderStyle,
                    background: cardBg,
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    textAlign: "left",
                    minHeight: "140px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    transition: "transform 0.1s ease, box-shadow 0.1s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                  onMouseEnter={(e) => { if (!isOutOfStock) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { if (!isOutOfStock) e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: "flex", gap: "12px", width: "100%", alignItems: "flex-start" }}>
                    {/* RESTORED DRINK ICON COMPONENT BOX */}
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      backgroundColor: isOutOfStock ? "#e5e7eb" : "rgba(255, 255, 255, 0.8)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0
                    }}>
                      {getDrinkEmoji(drink.item_name)}
                    </div>

                    <div style={{ flexGrow: 1, overflow: "hidden" }}>
                      <strong style={{ fontSize: "15px", color: isOutOfStock ? "#9ca3af" : colors.black, display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>
                        {drink.item_name || "Unnamed Drink"}
                      </strong>
                      <div style={{ marginTop: "4px", fontSize: "14px", color: isOutOfStock ? "#9ca3af" : "#4b5563", fontWeight: "600" }}>
                        ${parseFloat(drink.item_cost || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px" }}>
                    <div>
                      {isOutOfStock ? (
                        <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>OUT OF STOCK</span>
                      ) : isSeasonal ? (
                        <span style={{ color: colors.pinkDark, fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>SEASONAL</span>
                      ) : (
                        <span style={{ color: "#4b5563", fontSize: "11px", fontWeight: "500" }}>Regular</span>
                      )}
                    </div>

                    {/* Plus Icon Action Overlay Button matches medium blue */}
                    {!isOutOfStock && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDrink();
                        }}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: colors.mediumBlue,
                          color: colors.white,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: "bold"
                        }}
                      >
                        +
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: REAL-TIME TICKET RECEIPT & COST CALCULATIONS */}
        <section className="order-summary-pane" style={{ border: `1px solid ${colors.grayBorder}`, background: colors.purple, borderRadius: "16px", padding: "20px", position: "sticky", top: "24px", display: "flex", flexDirection: "column" }}>
          <header style={{ borderBottom: `1px solid ${colors.grayBorder}`, paddingBottom: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "700" }}>
                Current Ticket
              </h3>
              <span style={{ fontSize: "16px", color: "#4b5563", fontWeight: "500" }}>
                {order.count} {order.count === 1 ? 'drink' : 'drinks'} selected
              </span>
            </div>

          </header>

          <div className="ticket-items-list" style={{ flexGrow: 1, paddingRight: "4px" }}>
            {order.items.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: "#6b21a8", opacity: 0.6 }}>
                <span style={{ fontSize: "36px", marginBottom: "8px" }}>🧋</span>
                <span style={{ fontSize: "16px", fontWeight: "500" }}>Ticket is empty</span>
              </div>
            ) : (
              order.items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleEditItemClick(item, idx)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "14px",
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.grayBorder}`,
                    marginBottom: "8px",
                    cursor: "pointer",
                    borderRadius: "12px",
                    transition: "all 0.15s ease"
                  }}
                >
                  {/* INLINE DRINK EMOJI BOX */}
                  <div style={{ width: "44px", height: "44px", borderRadius: "8px", backgroundColor: colors.grayBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0, border: `1px solid ${colors.grayBorder}` }}>
                    {getDrinkEmoji(item.drink_name)}
                  </div>

                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.drink_name || item.item_name}</h4>
                    <div style={{ fontSize: "15px", color: "#4b5563" }}>${parseFloat(item.item_cost || 0).toFixed(2)} · {item.size}</div>
                    {item.topping !== "None" && <div style={{ fontSize: "14px", color: colors.purpleDark, marginTop: "4px", fontWeight: "500" }}>+ {item.topping}</div>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", alignSelf: "center" }} onClick={(e) => e.stopPropagation()}>
                    {/* MINUS BUTTON (BIGGER) */}
                    <button
                      style={{
                        border: "none",
                        background: colors.blue,
                        color: colors.blueDark,
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "18px"
                      }}
                      onClick={() => order.decrementQuantity(idx)}
                    >
                      -
                    </button>

                    <span style={{ fontSize: "16px", fontWeight: "600", minWidth: "18px", textAlign: "center" }}>{item.quantity}</span>

                    {/* PLUS BUTTON (BIGGER) */}
                    <button
                      style={{
                        border: "none",
                        background: colors.blue,
                        color: colors.blueDark,
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "18px"
                      }}
                      onClick={() => order.incrementQuantity(idx)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pricing-breakdown" style={{ borderTop: `1px solid ${colors.grayBorder}`, paddingTop: "16px", marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "6px", color: "#4b5563" }}>
              <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "6px", color: "#4b5563" }}>
              <span>Tax</span><span>${order.tax.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", marginBottom: "12px", color: "#4b5563" }}>
              <span>Tip</span><span style={{ fontWeight: "600", color: colors.black }}>${order.tip.toFixed(2)}</span>
            </div>

            <button onClick={() => setShowTipModal(true)} style={{ width: "100%", padding: "10px", background: colors.white, border: `1px solid ${colors.grayBorder}`, borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: colors.purpleDark, marginBottom: "16px" }}>
              ✏️ Modify Tip Options
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "22px", fontWeight: "700", borderTop: `1px solid ${colors.grayBorder}`, paddingTop: "12px", marginBottom: "16px" }}>
              <span>Total</span><span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={order.items.length === 0} style={{ width: "100%", padding: "14px", background: order.items.length === 0 ? "#cbd5e1" : colors.darkerBlue, color: colors.white, border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: order.items.length === 0 ? "not-allowed" : "pointer" }}>
            Place Customer Order
          </button>
        </section>
      </div>

      {/* POPUP MODAL A: COMPONENT & DIMENSIONS CUSTOMIZATION ENGINE */}
      {activeCustomization && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div className="modal-content" style={{ background: colors.white, padding: "24px", borderRadius: "16px", width: "360px", boxShadow: "0px 10px 25px rgba(0,0,0,0.1)", border: `1px solid ${colors.grayBorder}` }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700" }}>{editingIndex !== null ? `Edit: ${activeCustomization.item_name}` : `Customize: ${activeCustomization.item_name}`}</h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Select Size</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setSelectedSize("M")} style={{ flex: 1, padding: "12px", background: selectedSize === "M" ? colors.black : colors.white, color: selectedSize === "M" ? colors.white : colors.black, border: `1px solid ${colors.grayBorder}`, borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Medium</button>
                <button onClick={() => setSelectedSize("L")} style={{ flex: 1, padding: "12px", background: selectedSize === "L" ? colors.black : colors.white, color: selectedSize === "L" ? colors.white : colors.black, border: `1px solid ${colors.grayBorder}`, borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Large (+$0.50)</button>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Select Toppings</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", border: `1px solid ${colors.grayBorder}`, borderRadius: "10px", padding: "12px" }}>
                {toppingsList.map((top) => (
                  <label key={top.itemid || Math.random()} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input type="checkbox" checked={selectedToppings.includes(top.item_name)} onChange={() => setSelectedToppings(prev => prev.includes(top.item_name) ? prev.filter(value => value !== top.item_name) : [...prev, top.item_name])} />
                    {top.item_name} (+${parseFloat(top.item_cost || 0).toFixed(2)})
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => { setActiveCustomization(null); setEditingIndex(null); }} style={{ padding: "10px 16px", background: colors.grayBg, color: colors.black, border: `1px solid ${colors.grayBorder}`, borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "14px" }}>Cancel</button>
              <button
                onClick={() => {
                   const uniqueToppings = [...new Set(selectedToppings)].sort();
                   const toppingLabel = uniqueToppings.join(', ') || 'None';
                   const basePrice = parseFloat(activeCustomization.item_cost || 0);
                   const toppingPrice = uniqueToppings.reduce((sum, name) => {
                     const toppingObj = toppingsList.find(t => t.item_name === name);
                     return sum + (toppingObj ? parseFloat(toppingObj.item_cost || 0) : 0);
                   }, 0);
                   const sizeSurcharge = selectedSize === "L" ? 0.50 : 0.0;
                   const combinedCost = basePrice + toppingPrice + sizeSurcharge;

                   if (editingIndex !== null) {
                     const originalQuantity = order.items[editingIndex].quantity;
                     order.items[editingIndex] = {
                       id: activeCustomization.itemid,
                       drink_name: activeCustomization.item_name,
                       item_cost: combinedCost,
                       size: selectedSize,
                       topping: toppingLabel,
                       toppings: uniqueToppings,
                       quantity: originalQuantity
                     };
                     order.setTip(order.tip);
                   } else {
                     order.addDrink(
                       {
                         itemid: activeCustomization.itemid,
                         item_name: activeCustomization.item_name,
                         drink_name: activeCustomization.item_name,
                         item_cost: combinedCost
                       },
                       selectedSize,
                       uniqueToppings
                     );
                   }

                  setActiveCustomization(null);
                  setEditingIndex(null);
                }}
                style={{ padding: "10px 16px", background: colors.purpleDark, color: colors.white, border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
              >
                {editingIndex !== null ? "Update Item" : "Add To Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL B: TIP INTERFACE SETTINGS */}
      {showTipModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div className="modal-content" style={{ background: colors.white, padding: "24px", borderRadius: "16px", width: "360px", boxShadow: "0px 10px 25px rgba(0,0,0,0.1)", border: `1px solid ${colors.grayBorder}` }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700" }}>Select Tip Amount</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
              {[0.05, 0.10, 0.15, 0.20].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    order.setTip(parseFloat((order.subtotal * rate).toFixed(2)));
                    setShowTipModal(false);
                  }}
                  style={{ padding: "10px 4px", fontSize: "13px", fontWeight: "600", cursor: "pointer", border: `1px solid ${colors.grayBorder}`, borderRadius: "10px", background: colors.purple, color: colors.purpleDark }}
                >
                  {rate * 100}%<br /><span style={{ fontSize: "11px", opacity: 0.8 }}>${(order.subtotal * rate).toFixed(2)}</span>
                </button>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${colors.grayBorder}`, paddingTop: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>Enter Custom Dollar Amount</label>
              <input
                type="text"
                readOnly
                value={keypadInput ? `$${keypadInput}` : "$0.00"}
                style={{ width: "100%", padding: "12px", fontSize: "20px", fontWeight: "700", textAlign: "right", marginBottom: "16px", boxSizing: "border-box", border: `1px solid ${colors.grayBorder}`, borderRadius: "10px", background: colors.grayBg }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "Clear"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleKeypadPress(btn)}
                    style={{ padding: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", background: btn === "Clear" ? colors.pink : colors.grayBg, color: btn === "Clear" ? colors.pinkDark : colors.black, border: `1px solid ${colors.grayBorder}`, borderRadius: "10px" }}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => { setKeypadInput(""); setShowTipModal(false); }} style={{ padding: "10px 16px", background: colors.white, border: `1px solid ${colors.grayBorder}`, borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>Close</button>
              <button onClick={applyCustomKeypadTip} disabled={!keypadInput} style={{ padding: "10px 16px", background: colors.black, color: colors.white, border: "none", borderRadius: "8px", fontWeight: "600", cursor: !keypadInput ? "not-allowed" : "pointer", fontSize: "14px" }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}