import { useState } from "react";

export default function useOrder() {
  const [cart, setCart] = useState([]);
  const add = (drink) => setCart((items) => {
    const found = items.find((item) => item.name === drink.name);
    return found
      ? items.map((item) => item.name === drink.name ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { ...drink, quantity: 1 }];
  });
  const adjust = (name, change) => setCart((items) => items.map((item) => item.name === name ? { ...item, quantity: item.quantity + change } : item).filter((item) => item.quantity > 0));
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { cart, add, adjust, count, total, clear: () => setCart([]) };
}
