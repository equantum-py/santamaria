import type { DemoCustomer, DemoOperator, DemoState } from "./types";

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

export function createInitialDemoState(now = new Date().toISOString()): DemoState {
  return {
    schemaVersion: 1,
    environment: "demo",
    updatedAt: now,
    customers: demoCustomers.map((customer) => ({ ...customer })),
    operators: demoOperators.map((operator) => ({ ...operator })),
    sales: [],
    cashSessions: [],
    orders: [],
    quotes: [],
    activities: [],
    processedOperationIds: [],
    counters: { cash: 0, sale: 0, order: 0, quote: 0, movement: 0 },
  };
}
