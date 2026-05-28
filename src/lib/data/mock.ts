import type { OrderStatus } from "@/lib/types";

export const salesSeries = [
  { day: "Lun", sales: 840, orders: 42 },
  { day: "Mar", sales: 1180, orders: 57 },
  { day: "Mer", sales: 960, orders: 49 },
  { day: "Jeu", sales: 1540, orders: 73 },
  { day: "Ven", sales: 1875, orders: 88 },
  { day: "Sam", sales: 2430, orders: 121 },
  { day: "Dim", sales: 1720, orders: 79 },
];

export const reportCategories = [
  { name: "Cuisine", value: 42 },
  { name: "Boissons", value: 28 },
  { name: "Desserts", value: 14 },
  { name: "Livraison", value: 16 },
];

export const serviceStats = [
  { label: "CA du jour", value: 2430, delta: "+18%" },
  { label: "Commandes", value: 121, delta: "+12%" },
  { label: "Occupation", value: 0.74, delta: "+9%" },
  { label: "Temps moyen", value: 18, delta: "-4 min" },
];

export const inventoryItems = [
  { name: "Pain burger", unit: "pcs", stock: 64, alert: 40, target: 120, category: "Cuisine" },
  { name: "Filet de boeuf", unit: "kg", stock: 12, alert: 10, target: 30, category: "Cuisine" },
  { name: "Tomates", unit: "kg", stock: 7, alert: 12, target: 35, category: "Legumes" },
  { name: "Jus saison", unit: "L", stock: 44, alert: 20, target: 60, category: "Boissons" },
  { name: "Serviettes", unit: "packs", stock: 9, alert: 6, target: 18, category: "Salle" },
];

export const stockMovements = [
  { time: "08:12", label: "Livraison maraicher", quantity: "+24 kg", status: "Entree" },
  { time: "11:46", label: "Preparation service midi", quantity: "-8 kg", status: "Sortie" },
  { time: "14:30", label: "Correction inventaire bar", quantity: "-3 L", status: "Ajustement" },
  { time: "17:05", label: "Reception boissons", quantity: "+36 L", status: "Entree" },
];

export const floorTables = [
  { id: "T1", seats: 2, x: 12, y: 18, status: "Libre" },
  { id: "T2", seats: 4, x: 38, y: 16, status: "Occupee" },
  { id: "T3", seats: 4, x: 68, y: 18, status: "Reservee" },
  { id: "T4", seats: 6, x: 18, y: 58, status: "Occupee" },
  { id: "T5", seats: 2, x: 50, y: 55, status: "Libre" },
  { id: "T6", seats: 8, x: 76, y: 58, status: "Reservee" },
];

export const reservations = [
  { time: "18:30", guest: "Amina M.", guests: 4, table: "T3", status: "Confirmee" },
  { time: "19:00", guest: "Patrick K.", guests: 2, table: "T5", status: "En attente" },
  { time: "20:15", guest: "Sarah L.", guests: 8, table: "T6", status: "Confirmee" },
  { time: "21:00", guest: "Client telephone", guests: 3, table: "T2", status: "A rappeler" },
];

export const kitchenOrders: Array<{
  id: string;
  table: string;
  status: OrderStatus;
  minutes: number;
  total: number;
  items: string[];
}> = [
  {
    id: "order_demo_101",
    table: "T4",
    status: "received",
    minutes: 6,
    total: 38.5,
    items: ["Signature burger x2", "Fresh juice x1"],
  },
  {
    id: "order_demo_102",
    table: "Livraison",
    status: "preparing",
    minutes: 14,
    total: 62,
    items: ["Plateau grill x1", "Jus saison x4"],
  },
  {
    id: "order_demo_103",
    table: "T2",
    status: "ready",
    minutes: 19,
    total: 27,
    items: ["Salade maison x2"],
  },
  {
    id: "order_demo_104",
    table: "T1",
    status: "served",
    minutes: 28,
    total: 45,
    items: ["Burger x1", "Dessert x2"],
  },
];

export const invoices = [
  { id: "FAC-2401", customer: "Table T4", amount: 38.5, method: "Mobile Money", status: "Payee" },
  { id: "FAC-2402", customer: "Patrick K.", amount: 62, method: "Carte", status: "En attente" },
  { id: "FAC-2403", customer: "Livraison", amount: 27, method: "Especes", status: "A encaisser" },
];

export const staffPerformance = [
  { name: "Demo", orders: 42, sales: 840 },
  { name: "Amina", orders: 36, sales: 760 },
  { name: "Chris", orders: 28, sales: 630 },
  { name: "Sarah", orders: 31, sales: 700 },
];

export const recipeLines = [
  { product: "Signature burger", ingredient: "Pain burger", quantity: "1 pc" },
  { product: "Signature burger", ingredient: "Filet de boeuf", quantity: "180 g" },
  { product: "Fresh juice", ingredient: "Jus saison", quantity: "35 cl" },
];

export const statusColumns: Array<{ id: OrderStatus; label: string }> = [
  { id: "received", label: "En attente" },
  { id: "preparing", label: "En preparation" },
  { id: "ready", label: "Pretes" },
  { id: "served", label: "Servies" },
];
