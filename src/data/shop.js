export const views = [
  { id: "manager", label: "Manager dashboard", icon: "▦", description: "Sales, popular drinks, and shop pulse." },
  { id: "cashier", label: "Cashier screen", icon: "▣", description: "Build an order and check out a guest." },
  { id: "kiosk", label: "Customer kiosk", icon: "◉", description: "A friendly self-serve ordering experience." },
];

export const drinks = [
  { name: "Brown Sugar Milk Tea", category: "Milk tea", price: 5.75, icon: "🧋", note: "Brown sugar · fresh milk" },
  { name: "Strawberry Matcha", category: "Matcha", price: 6.25, icon: "🍵", note: "Ceremonial matcha · strawberry" },
  { name: "Taro Cloud", category: "Milk tea", price: 5.75, icon: "🥤", note: "Taro · creamy oat milk" },
  { name: "Mango Green Tea", category: "Fruit tea", price: 5.25, icon: "🍹", note: "Jasmine green tea · mango" },
  { name: "Classic Milk Tea", category: "Milk tea", price: 5.25, icon: "🧋", note: "House black tea · your choice of milk" },
  { name: "Peach Oolong", category: "Fruit tea", price: 5.5, icon: "🍑", note: "Toasty oolong · juicy peach" },
];

export const money = (value) => `$${value.toFixed(2)}`;
