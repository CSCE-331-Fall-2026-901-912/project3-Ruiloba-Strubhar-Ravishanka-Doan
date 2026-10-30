import { useState } from "react";

export default function useOrder() {
  const [items, setItems] = useState([]);
  const [tip, setTip] = useState(0);

  const SALES_TAX_RATE = 0.0825; // tax rate 8.25% 

  const addDrink = (drink, size, topping) => {
    setItems((prevItems) => {
      // uniqueness signature checks identical drinks
      const existingIndex = prevItems.findIndex(
        (i) => i.drink_name === drink.item_name && i.size === size && i.topping === topping
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...prevItems,
        {
          id: drink.itemid,
          drink_name: drink.item_name,
          item_cost: parseFloat(drink.item_cost),
          size: size,
          topping: topping,
          quantity: 1,
        },
      ];
    });
  };

  const incrementQuantity = (index) => {
    const updated = [...items];
    updated[index].quantity += 1;
    setItems(updated);
  };

  const decrementQuantity = (index) => {
    const updated = [...items];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
    } else {
      updated.splice(index, 1);
    }
    setItems(updated);
  };

  const clear = () => {
    setItems([]);
    setTip(0);
  };

  // pricing calculations 
  const subtotal = items.reduce((acc, item) => acc + (item.item_cost * item.quantity), 0);
  const tax = subtotal * SALES_TAX_RATE;
  const total = subtotal + tax + tip;
  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    items,
    tip,
    setTip,
    addDrink,
    incrementQuantity,
    decrementQuantity,
    clear,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    count,
  };
}
