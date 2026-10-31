import { useMemo, useState } from 'react';

const round = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const taxRate = 0.0825;

export default function useKioskOrder() {
  const [items, setItems] = useState([]);
  const [tip, setTip] = useState(0);

  const add = (selection) => {
    setItems(previous => {
      const key = `${selection.drink.itemid}:${selection.size}:${selection.topping?.itemid ?? 'none'}`;
      const found = previous.find(item => item.key === key);
      if (found) return previous.map(item => item.key === key ? { ...item, quantity: item.quantity + selection.quantity } : item);
      return [...previous, {
        key, drinkId: selection.drink.itemid, drinkName: selection.drink.item_name,
        drinkPrice: Number(selection.drink.item_cost), size: selection.size,
        toppingId: selection.topping?.itemid ?? null,
        toppingName: selection.topping?.item_name ?? 'No topping',
        toppingPrice: Number(selection.topping?.item_cost ?? 0), quantity: selection.quantity,
      }];
    });
  };
  const changeQuantity = (key, difference) => setItems(previous => previous.map(item => item.key === key ? { ...item, quantity: item.quantity + difference } : item).filter(item => item.quantity > 0));
  const remove = key => setItems(previous => previous.filter(item => item.key !== key));
  const clear = () => { setItems([]); setTip(0); };
  const subtotal = useMemo(() => round(items.reduce((sum, item) => sum + (item.drinkPrice + item.toppingPrice) * item.quantity, 0)), [items]);
  const tax = round(subtotal * taxRate);
  const total = round(subtotal + tax + tip);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, add, changeQuantity, remove, clear, tip, setTip, subtotal, tax, total, count };
}
