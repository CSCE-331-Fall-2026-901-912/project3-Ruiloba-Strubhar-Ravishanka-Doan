import { useMemo, useState } from 'react';
const round = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const makeItem = ({drink,toppings,size,quantity}) => {
  const drinkId = Number(drink.itemid);
  const selected = Array.isArray(toppings) ? toppings : (toppings ? [toppings] : []);
  const toppingIds = selected.map(t => Number(t.itemid)).filter(Number.isSafeInteger).sort((a,b) => a-b);
  const toppingNames = selected.map(t => t.item_name);
  const toppingPrice = selected.reduce((sum,t) => sum + Number(t.item_cost ?? 0), 0);
  return {key: `${drinkId}:${size}:${toppingIds.join(',') || 'none'}`, drinkId, drinkName: drink.item_name, drinkPrice: Number(drink.item_cost), toppingIds, toppingNames, toppingPrice: Number(toppingPrice), size, quantity: Number(quantity)};
};
const merge = list => { const result = []; for (const item of list) { const found = result.find(other => other.key === item.key); if (found) found.quantity += item.quantity; else result.push({...item}); } return result; };
export default function useKioskOrder() {
  const [items,setItems] = useState([]);
  const add = selection => setItems(prev => merge([...prev,makeItem(selection)]));
  const edit = (key,selection) => setItems(prev => merge(prev.map(item => item.key === key ? makeItem(selection) : item)));
  const changeQuantity = (key,diff) => setItems(prev => prev.map(item => item.key === key ? {...item,quantity:item.quantity+diff} : item).filter(item => item.quantity > 0));
  const remove = key => setItems(prev => prev.filter(item => item.key !== key));
  const clear = () => setItems([]);
  const unitPrice = item => round(item.drinkPrice + item.toppingPrice + (item.size === 'L' ? 0.50 : 0));
  const subtotal = useMemo(() => round(items.reduce((sum,item) => sum + unitPrice(item)*item.quantity,0)),[items]);
  const tax = round(subtotal*0.0825), total = round(subtotal+tax), count = items.reduce((sum,item) => sum+item.quantity,0);
  return {items,add,edit,changeQuantity,remove,clear,unitPrice,subtotal,tax,total,count};
}
