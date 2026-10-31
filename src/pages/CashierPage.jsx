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
  const [selectedTopping, setSelectedTopping] = useState("None");

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
        const type = d.base_item_type ? String(d.base_item_type).toLowerCase().replace(/\\s+/g, '') : "";
        const match = categoryFilter.toLowerCase().replace(/\\s+/g, '');
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
    setSelectedTopping(item.topping);
  };

  return (
    <main className="content-page" style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {/* Visual Notification System Banner */}
      {message && (
        <div className="success-message" style={{ background: "#d4edda", color: "#155724", padding: "15px", marginBottom: "20px", borderRadius: "5px", position: "relative" }}>
          <span>{message}</span>
          <button onClick={() => setMessage("")} style={{ position: "absolute", right: "15px", background: "none", border: "none", fontSize: "26px", cursor: "pointer" }}>×</button>
        </div>
      )}

      <div className="pos-layout" style={{ display: "flex", gap: "30px" }}>

        {/* LEFT COLUMN: FILTER CONTROLS & DRIVE DRINK BUTTON SELECTION GRID */}
        <section className="menu-section" style={{ flex: "2" }}>
          <h2>Front Counter Register Menu</h2>

          {/* Subheading Group 1: Category Mapping Selectors */}
          <div className="filter-group-row" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            {["All Drinks", "Milk Tea", "Green Tea", "Lemonade", "Slush", "Milk Strike", "Black Tea", "Regular Menu", "Seasonal Menu"].map((type) => (
              <button
                key={type}
                onClick={() => setCategoryFilter(type)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "20px",
                  border: "1px solid black",
                  background: categoryFilter === type ? "#1E221D" : "#fff",
                  color: categoryFilter === type ? "#fff" : "#000",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Subheading Group 2: Sorting and Stock Condition Toggles */}
          <div className="filter-group-row" style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
            <button
              onClick={() => setSortFilter(sortFilter === "Alphabetical" ? "Reverse Alphabetical" : "Alphabetical")}
              style={{ padding: "8px 12px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", borderRadius: "4px" }}
            >
              Sort: {sortFilter === "Alphabetical" ? "A-Z Order" : "Z-A Order"}
            </button>
            <button
              onClick={() => setAvailabilityFilter(availabilityFilter === "All" ? "Available Only" : "All")}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                background: availabilityFilter === "Available Only" ? "#dc3545" : "#fff",
                color: availabilityFilter === "Available Only" ? "#fff" : "#000",
                fontWeight: availabilityFilter === "Available Only" ? "bold" : "normal"
              }}
            >
              {availabilityFilter === "Available Only" ? "Showing In-Stock Only" : "Showing All Menu Items"}
            </button>
          </div>

          {/* Itemized Grid Layout Mapping */}
          <div className="drinks-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
            {getFilteredDrinks().map((drink) => {
              const isSeasonal = drink.item_category ? String(drink.item_category).toLowerCase().includes("seasonal") : false;
              const isOutOfStock = drink.inventory_count !== undefined && Number(drink.inventory_count) <= 0;

              const handleSelectDrink = () => {
                setEditingIndex(null);
                setActiveCustomization(drink);
                setSelectedSize("M");
                setSelectedTopping("None");
              };

              return (
                <button
                  key={drink.itemid || Math.random()}
                  onClick={handleSelectDrink}
                  disabled={isOutOfStock}
                  style={{
                    padding: "20px 15px 40px 15px",
                    borderRadius: "20px",
                    border: "1px solid black",
                    background: isOutOfStock ? "#e0e0e0" : isSeasonal ? "#C9A0DC" : "#D1E5F4",
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    textAlign: "center",
                    minHeight: "160px",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative"
                  }}
                >
                  {/* RESTORED DRINK ICON COMPONENT BOX */}
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    flexShrink: 0 // Prevents the icon box from getting squished
                  }}>
                    {getDrinkEmoji(drink.item_name)}
                  </div>

                  <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <strong style={{ fontSize: "15px", color: "black", display: "block" }}>{drink.item_name || "Unnamed Drink"}</strong>
                    <div style={{ marginTop: "4px", fontSize: "14px", color: "#333", fontWeight: "600" }}>${parseFloat(drink.item_cost || 0).toFixed(2)}</div>
                    {isOutOfStock && <small style={{ color: "red", fontWeight: "bold" }}><br />OUT OF STOCK</small>}
                  </div>

                  {/* Plus Icon Action Overlay Button */}
                  {!isOutOfStock && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDrink();
                      }}
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: "#5D6B59",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        boxShadow: "0px 2px 5px rgba(0,0,0,0.15)"
                      }}
                    >
                      +
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: REAL-TIME TICKET RECEIPT & COST CALCULATIONS */}
        <section className="order-summary-pane" style={{ flex: "1", borderLeft: "1px solid #ccc", paddingLeft: "20px", background: "#f9f9f9", borderRadius: "8px", padding: "15px" }}>
          <h3>Current Ticket ({order.count} drinks)</h3>

          <div className="ticket-items-list" style={{ minHeight: "220px", marginBottom: "20px" }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleEditItemClick(item, idx)}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "16px 10px",
                  borderBottom: "1px solid #F5F5F2",
                  cursor: "pointer",
                  borderRadius: "8px",
                  transition: "background-color 0.2s"
                }}
              >
                {/* INLINE DRINK EMOJI BOX */}
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#F5F5F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                  {getDrinkEmoji(item.drink_name)}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "600" }}>{item.drink_name || item.item_name}</h4>
                  <span style={{ fontSize: "12px", color: "#888" }}>${parseFloat(item.item_cost || 0).toFixed(2)} each · Size: {item.size}</span>
                  {item.topping !== "None" && <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>+ Topping: {item.topping}</div>}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #EBEAE6", borderRadius: "20px", padding: "4px 8px", height: "28px" }} onClick={(e) => e.stopPropagation()}>
                  <button style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => order.decrementQuantity(idx)}>-</button>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{item.quantity}</span>
                  <button style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => order.incrementQuantity(idx)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="pricing-breakdown" style={{ borderTop: "2px solid #ccc", paddingTop: "12px", lineHeight: "1.8" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span><span>${order.subtotal.toFixed(2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax:</span><span>${order.tax.toFixed(2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Tip Added:</span>
              <span style={{ fontWeight: "600" }}>${order.tip.toFixed(2)}</span>
            </div>

            <button onClick={() => setShowTipModal(true)} style={{ width: "100%", margin: "8px 0", padding: "10px", background: "#E6DCFA", border: "1px solid #A594CD", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
              Modify Tip Options
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", borderTop: "1px solid #ccc", paddingTop: "8px", marginTop: "4px" }}>
              <span>Total:</span><span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={order.items.length === 0} style={{ width: "100%", padding: "14px", background: order.items.length === 0 ? "#6c757d" : "#28a745", color: "#fff", border: "none", borderRadius: "5px", fontSize: "16px", fontWeight: "bold", cursor: order.items.length === 0 ? "not-allowed" : "pointer", marginTop: "15px" }}>
            Place Guest Order
          </button>
        </section>
      </div>

      {/* POPUP MODAL A: COMPONENT & DIMENSIONS CUSTOMIZATION ENGINE */}
      {activeCustomization && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "25px", borderRadius: "8px", width: "340px", boxShadow: "0px 4px 15px rgba(0,0,0,0.2)" }}>
            <h3>{editingIndex !== null ? `Edit: ${activeCustomization.item_name}` : `Customize: ${activeCustomization.item_name}`}</h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}><strong>Select Dimensions (Size)</strong></label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setSelectedSize("M")} style={{ flex: 1, padding: "12px", background: selectedSize === "M" ? "#1E221D" : "#fff", color: selectedSize === "M" ? "#fff" : "#000", border: "1px solid #EBEAE6", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>Medium (M)</button>
                <button onClick={() => setSelectedSize("L")} style={{ flex: 1, padding: "12px", background: selectedSize === "L" ? "#1E221D" : "#fff", color: selectedSize === "L" ? "#fff" : "#000", border: "1px solid #EBEAE6", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>Large (L) (+$0.50)</button>
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}><strong>Select Standard Topping Addon</strong></label>
              <select value={selectedTopping} onChange={(e) => setSelectedTopping(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", border: "1px solid #EBEAE6", backgroundColor: "#fff" }}>
                <option value="None">No Topping Addon</option>
                {toppingsList.map((top) => (
                  <option key={top.itemid || Math.random()} value={top.item_name}>{top.item_name} (+${parseFloat(top.item_cost || 0).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setActiveCustomization(null); setEditingIndex(null); }} style={{ padding: "10px 15px", background: "#F0EFEA", color: "#111", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => {
                  const toppingObj = toppingsList.find(t => t.item_name === selectedTopping);
                  const basePrice = parseFloat(activeCustomization.item_cost || 0);
                  const toppingPrice = toppingObj ? parseFloat(toppingObj.item_cost || 0) : 0.0;
                  const sizeSurcharge = selectedSize === "L" ? 0.50 : 0.0;
                  const combinedCost = basePrice + toppingPrice + sizeSurcharge;

                  if (editingIndex !== null) {
                    const originalQuantity = order.items[editingIndex].quantity;
                    order.items[editingIndex] = {
                      id: activeCustomization.itemid,
                      drink_name: activeCustomization.item_name,
                      item_cost: combinedCost,
                      size: selectedSize,
                      topping: selectedTopping,
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
                      selectedTopping
                    );
                  }

                  setActiveCustomization(null);
                  setEditingIndex(null);
                }}
                style={{ padding: "10px 15px", background: "#1E221D", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
              >
                {editingIndex !== null ? "Update Item" : "Add To Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTipModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "25px", borderRadius: "8px", width: "360px", boxShadow: "0px 4px 15px rgba(0,0,0,0.2)" }}>
            <h3>Select Tip Amount</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
              {[0.05, 0.10, 0.15, 0.20].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    order.setTip(parseFloat((order.subtotal * rate).toFixed(2)));
                    setShowTipModal(false);
                  }}
                  style={{ padding: "12px 5px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
                >
                  {rate * 100}%<br />${(order.subtotal * rate).toFixed(2)}
                </button>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #ccc", paddingTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "6px" }}><strong>Enter Custom Dollar Amount:</strong></label>
              <input
                type="text"
                readOnly
                value={keypadInput ? `$${keypadInput}` : "$0.00"}
                style={{ width: "100%", padding: "12px", fontSize: "20px", fontWeight: "bold", textAlign: "right", marginBottom: "15px", boxSizing: "border-box", border: "1px solid #EBEAE6", borderRadius: "8px", background: "#F5F5F2" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "15px" }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "Clear"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleKeypadPress(btn)}
                    style={{ padding: "12px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", background: btn === "Clear" ? "#f8d7da" : "#F5F5F2", border: "none", borderRadius: "8px" }}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setKeypadInput(""); setShowTipModal(false); }} style={{ padding: "10px 15px", background: "#F0EFEA", border: "none", borderRadius: "8px", cursor: "pointer" }}>Close</button>
              <button onClick={applyCustomKeypadTip} disabled={!keypadInput} style={{ padding: "10px 15px", background: "#1E221D", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: !keypadInput ? "not-allowed" : "pointer" }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
