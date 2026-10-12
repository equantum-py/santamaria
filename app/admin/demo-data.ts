export type DemoProfile = {
  id: string;
  name: string;
  role: string;
  initials: string;
  allowedModules: string[];
};

export type AdminModule = {
  id: string;
  label: string;
  group: "Inicio" | "Operación comercial" | "Gestión interna" | "Administración" | "Marketing";
  stage: string;
  icon: string;
};

export const demoProfiles: DemoProfile[] = [
  { id: "admin", name: "Laura Benítez", role: "Administradora general", initials: "LB", allowedModules: ["dashboard", "pos", "caja", "pedidos", "presupuestos", "productos", "inventario", "deposito", "compras", "proveedores", "facturacion", "clientes", "reportes", "usuarios", "promociones", "marketing", "configuracion"] },
  { id: "gerencia", name: "Carlos Vera", role: "Gerencia", initials: "CV", allowedModules: ["dashboard", "pos", "caja", "pedidos", "productos", "inventario", "presupuestos", "reportes"] },
  { id: "cajero", name: "Marta González", role: "Cajera", initials: "MG", allowedModules: ["pos", "caja"] },
  { id: "ventas", name: "Diego Acosta", role: "Ventas", initials: "DA", allowedModules: ["dashboard", "pedidos", "presupuestos", "clientes"] },
  { id: "deposito", name: "Rubén Rojas", role: "Depósito", initials: "RR", allowedModules: ["dashboard", "pedidos", "inventario", "deposito", "compras", "proveedores"] },
  { id: "marketing", name: "Sofía Duarte", role: "Marketing", initials: "SD", allowedModules: ["dashboard", "promociones", "marketing", "reportes"] },
  { id: "facturacion", name: "Ana Sosa", role: "Facturación", initials: "AS", allowedModules: ["dashboard", "facturacion", "clientes", "reportes"] },
];

export const adminModules: AdminModule[] = [
  { id: "dashboard", label: "Resumen", group: "Inicio", stage: "Etapa 01", icon: "dashboard" },
  { id: "pos", label: "Punto de venta", group: "Operación comercial", stage: "Etapa 02", icon: "pos" },
  { id: "caja", label: "Caja", group: "Operación comercial", stage: "Etapa 02", icon: "cash" },
  { id: "pedidos", label: "Pedidos", group: "Operación comercial", stage: "Etapa 02", icon: "orders" },
  { id: "presupuestos", label: "Presupuestos", group: "Operación comercial", stage: "Etapa 02", icon: "quote" },
  { id: "productos", label: "Productos", group: "Gestión interna", stage: "Etapa 03", icon: "products" },
  { id: "inventario", label: "Inventario", group: "Gestión interna", stage: "Etapa 03", icon: "inventory" },
  { id: "deposito", label: "Depósito", group: "Gestión interna", stage: "Etapa 03", icon: "warehouse" },
  { id: "compras", label: "Compras", group: "Gestión interna", stage: "Etapa 03", icon: "purchase" },
  { id: "proveedores", label: "Proveedores", group: "Gestión interna", stage: "Etapa 03", icon: "supplier" },
  { id: "facturacion", label: "Facturación", group: "Administración", stage: "Etapa 04", icon: "invoice" },
  { id: "clientes", label: "Clientes", group: "Administración", stage: "Etapa 04", icon: "customers" },
  { id: "reportes", label: "Reportes", group: "Administración", stage: "Etapa 04", icon: "reports" },
  { id: "usuarios", label: "Usuarios", group: "Administración", stage: "Etapa 04", icon: "users" },
  { id: "promociones", label: "Promociones", group: "Marketing", stage: "Etapa 05", icon: "promo" },
  { id: "marketing", label: "Campañas", group: "Marketing", stage: "Etapa 05", icon: "campaign" },
  { id: "configuracion", label: "Configuración", group: "Administración", stage: "Etapa 04", icon: "settings" },
];

export const dashboardMetrics = [
  { id: "today", label: "Ventas de hoy", value: "Gs. 8.450.000", change: "+12,8%", note: "vs. día anterior", icon: "cash", tone: "amber" },
  { id: "month", label: "Ventas del mes", value: "Gs. 164.800.000", change: "+8,4%", note: "vs. mes anterior", icon: "chart", tone: "green" },
  { id: "orders", label: "Pedidos pendientes", value: "18", change: "6 para preparar", note: "requieren atención", icon: "orders", tone: "blue" },
  { id: "stock", label: "Stock bajo", value: "7 productos", change: "Ver alertas", note: "en 3 categorías", icon: "inventory", tone: "red" },
] as const;

export const salesSeries = {
  week: { label: "Últimos 7 días", total: "Gs. 42.360.000", points: [42, 56, 48, 75, 60, 88, 72], labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] },
  month: { label: "Este mes", total: "Gs. 164.800.000", points: [35, 48, 43, 58, 51, 68, 61, 77, 66, 88, 73, 94], labels: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23"] },
};

export const bestSellingProducts = [
  { name: "Cemento Portland compuesto", detail: "Construcción · Bolsa 50 kg", sold: 86, amount: "Gs. 5.332.000", stock: "Disponible" },
  { name: "Caño PVC soldable 25 mm", detail: "Sanitarios · Unidad", sold: 54, amount: "Gs. 2.052.000", stock: "Disponible" },
  { name: "Cuchara de albañil 8 pulgadas", detail: "Ferretería · Unidad", sold: 42, amount: "Gs. 1.470.000", stock: "Stock bajo" },
  { name: "Cable unipolar 2,5 mm²", detail: "Eléctricos · Metro", sold: 31, amount: "Gs. 1.240.000", stock: "Disponible" },
];

export const recentActivity = [
  { id: "a1", title: "Pedido preparado", detail: "Pedido DEM-1048 · Retiro en local", time: "Hace 8 min", icon: "check", tone: "green" },
  { id: "a2", title: "Stock actualizado", detail: "Caño PVC desagüe 100 mm · +24 unidades", time: "Hace 25 min", icon: "inventory", tone: "blue" },
  { id: "a3", title: "Presupuesto creado", detail: "Presupuesto DEM-P-203 · En borrador", time: "Hace 42 min", icon: "quote", tone: "amber" },
  { id: "a4", title: "Caja abierta", detail: "Turno mañana · Caja 01", time: "Hace 1 h", icon: "cash", tone: "terra" },
];

export const paymentSummary = [
  { name: "Efectivo", amount: "Gs. 3.280.000", percent: 39, color: "brown" },
  { name: "Tarjeta / QR", amount: "Gs. 3.040.000", percent: 36, color: "yellow" },
  { name: "Transferencia", amount: "Gs. 2.130.000", percent: 25, color: "terra" },
];

export const dashboardTasks = [
  { label: "Pedidos completados hoy", count: "32", tone: "green" },
  { label: "Pedidos por confirmar", count: "08", tone: "amber" },
  { label: "Presupuestos pendientes", count: "12", tone: "blue" },
  { label: "Alertas de inventario", count: "07", tone: "red" },
];
