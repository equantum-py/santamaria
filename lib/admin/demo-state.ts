import type { DemoCustomer, DemoOperator, DemoProduct, DemoState } from "./types";

export const DEMO_NOTICE = "Entorno de demostración — datos simulados";

export const demoCustomers: readonly DemoCustomer[] = [
  { id: "demo-customer-consumidor", displayName: "Consumidor final", kind: "consumer", isFictitious: true },
  { id: "demo-customer-ana", displayName: "Ana Benítez (cliente demo)", kind: "consumer", isFictitious: true },
  { id: "demo-customer-obras", displayName: "Obras del Sur (empresa demo)", kind: "business", isFictitious: true },
  { id: "demo-customer-mario", displayName: "Mario Rojas (cliente demo)", kind: "consumer", isFictitious: true },
];

export const demoOperators: readonly DemoOperator[] = [
  { id: "admin", displayName: "Laura Benítez", role: "Administración", isFictitious: true },
  { id: "gerencia", displayName: "Carlos Vera", role: "Gerencia", isFictitious: true },
  { id: "cajero", displayName: "Marta González", role: "Caja", isFictitious: true },
  { id: "ventas", displayName: "Diego Acosta", role: "Ventas", isFictitious: true },
  { id: "deposito", displayName: "Rubén Rojas", role: "Depósito", isFictitious: true },
  { id: "marketing", displayName: "Sofía Duarte", role: "Marketing", isFictitious: true },
  { id: "facturacion", displayName: "Ana Sosa", role: "Facturación", isFictitious: true },
];

export function seedAdminInventory(catalog: readonly DemoProduct[], now = new Date().toISOString()) {
  return catalog.map((product, index) => {
    const stockOnHand = product.availability === "consultar" ? 6 : product.availability === "pocas_unidades" ? 3 : 12 + ((index * 7) % 36);
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      saleUnit: product.saleUnit,
      pricePyg: product.pricePyg,
      stockOnHand,
      stockReserved: 0,
      minimumStock: product.availability === "pocas_unidades" ? 5 : 8,
      active: product.active,
      isFictitious: true as const,
      updatedAt: now,
    };
  });
}

export function createInitialDemoState(now = new Date().toISOString(), catalog: readonly DemoProduct[] = []): DemoState {
  return {
    schemaVersion: 3,
    environment: "demo",
    updatedAt: now,
    customers: demoCustomers.map((customer) => ({ ...customer })),
    suppliers: [],
    purchases: [],
    operators: demoOperators.map((operator) => ({ ...operator })),
    sales: [],
    cashSessions: [],
    orders: [],
    quotes: [],
    inventory: seedAdminInventory(catalog, now),
    inventoryMovements: [],
    activities: [],
    processedOperationIds: [],
    counters: { cash: 0, sale: 0, order: 0, quote: 0, movement: 0, inventoryMovement: 0, supplier: 0, purchase: 0, customer: 0 },
  };
}
