import assert from "node:assert/strict";
import test from "node:test";
import { addManualCashMovement, calculateChange, calculateTotals, closeCashSession, convertAcceptedQuoteToOrder, createOrder, createQuote, openCashSession, recordSale, updateOrderStatus, updateQuoteStatus } from "../../lib/admin/domain.ts";
import { createInitialDemoState } from "../../lib/admin/demo-state.ts";
import { DEMO_STORAGE_KEY, DemoStateStore, loadDemoState, resetDemoState, saveDemoState } from "../../lib/admin/persistence.ts";

const NOW = "2026-10-12T12:00:00.000Z";
const products = [
  { id: "p1", sku: "SM-FER-001", name: "Cemento demo", categoryId: "construccion", categoryName: "Construcción", pricePyg: 50000, saleUnit: "bolsa", availability: "disponible", active: true, fictitiousPrice: true },
  { id: "p2", sku: "SM-FER-002", name: "Cuchara demo", categoryId: "ferreteria", categoryName: "Ferretería", pricePyg: 35000, saleUnit: "unidad", availability: "consultar", active: true, fictitiousPrice: true },
];

function memoryStorage(initial = null) {
  const data = new Map(initial ? [[DEMO_STORAGE_KEY, initial]] : []);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function openedState() {
  return openCashSession(createInitialDemoState(NOW), { operationId: "open-cash-001", cashierId: "cajero", openingBalancePyg: 100000 }, NOW);
}

test("usa importes enteros, calcula totales y cambio con validaciones", () => {
  const lines = [{ lineTotalPyg: 100000 }, { lineTotalPyg: 25000 }];
  assert.deepEqual(calculateTotals(lines, 5000), { subtotalPyg: 125000, authorizedDiscountPyg: 5000, totalPyg: 120000 });
  assert.equal(calculateChange(120000, 150000), 30000);
  assert.throws(() => calculateChange(120000, 100000), { code: "INSUFFICIENT_CASH" });
  assert.throws(() => calculateTotals(lines, 130000), { code: "DISCOUNT_EXCEEDS_SUBTOTAL" });
  assert.throws(() => calculateTotals([{ lineTotalPyg: 1.5 }]), { code: "INVALID_PYG_AMOUNT" });
});

test("abre una caja por cajero, registra ingresos y egresos, y calcula arqueo", () => {
  const state = openedState();
  assert.throws(() => openCashSession(state, { operationId: "open-cash-002", cashierId: "cajero", openingBalancePyg: 0 }, NOW), { code: "CASH_ALREADY_OPEN" });
  const sessionId = state.cashSessions[0].id;
  const withIncome = addManualCashMovement(state, { operationId: "cash-in-001", sessionId, kind: "manual_income", amountPyg: 20000, label: "Fondo de cambio" }, NOW);
  const withExpense = addManualCashMovement(withIncome, { operationId: "cash-out-001", sessionId, kind: "manual_expense", amountPyg: 5000, label: "Compra menor" }, NOW);
  assert.throws(() => addManualCashMovement(withExpense, { operationId: "cash-out-too-much", sessionId, kind: "manual_expense", amountPyg: 200000, label: "Exceso" }, NOW), { code: "EXPENSE_EXCEEDS_CASH" });
  const closed = closeCashSession(withExpense, { sessionId, countedCashPyg: 112000 }, NOW);
  assert.equal(closed.cashSessions[0].status, "closed");
  assert.equal(closed.cashSessions[0].differencePyg, -3000);
  assert.throws(() => addManualCashMovement(closed, { operationId: "cash-in-002", sessionId, kind: "manual_income", amountPyg: 1000, label: "Luego del cierre" }, NOW), { code: "CASH_NOT_OPEN" });
});

test("registra una venta desde price actual, la refleja en caja y bloquea duplicados", () => {
  const state = openedState();
  const saleState = recordSale(state, {
    operationId: "pos-submit-001", cashierId: "cajero",
    items: [{ productId: "p1", quantity: 2 }], paymentMethod: "cash", cashReceivedPyg: 120000,
  }, products, NOW);
  const sale = saleState.sales[0];
  assert.equal(sale.lines[0].unitPricePyg, 50000);
  assert.equal(sale.totalPyg, 100000);
  assert.equal(sale.changePyg, 20000);
  assert.equal(saleState.cashSessions[0].movements[0].cashEffectPyg, 100000);
  assert.throws(() => recordSale(saleState, {
    operationId: "pos-submit-001", cashierId: "cajero",
    items: [{ productId: "p1", quantity: 2 }], paymentMethod: "cash", cashReceivedPyg: 120000,
  }, products, NOW), { code: "DUPLICATE_OPERATION" });
  assert.throws(() => recordSale(createInitialDemoState(NOW), {
    operationId: "pos-submit-002", cashierId: "cajero",
    items: [{ productId: "p1", quantity: 1 }], paymentMethod: "cash", cashReceivedPyg: 50000,
  }, products, NOW), { code: "OPEN_CASH_REQUIRED" });
});

test("pagos electrónicos se registran sin sumarse al efectivo contado", () => {
  const state = recordSale(openedState(), {
    operationId: "pos-submit-qr", cashierId: "cajero",
    items: [{ productId: "p2", quantity: 1 }], paymentMethod: "qr",
  }, products, NOW);
  assert.equal(state.cashSessions[0].movements[0].amountPyg, 35000);
  assert.equal(state.cashSessions[0].movements[0].cashEffectPyg, 0);
  const closed = closeCashSession(state, { sessionId: state.cashSessions[0].id, countedCashPyg: 100000 }, NOW);
  assert.equal(closed.cashSessions[0].differencePyg, 0);
});

test("presupuesto aceptado genera un pedido una sola vez y el pedido conserva historial", () => {
  const created = createQuote(createInitialDemoState(NOW), {
    operationId: "quote-create-001", customerId: "demo-customer-ana", items: [{ productId: "p1", quantity: 2 }], authorizedDiscountPyg: 5000, discountAuthorizedBy: "Gerencia demo", validUntil: "2026-10-20",
  }, products, NOW);
  const sentState = updateQuoteStatus(created.state, { quoteId: created.quote.id, status: "sent", changedBy: "Ventas demo" }, NOW);
  const acceptedState = updateQuoteStatus(sentState, { quoteId: created.quote.id, status: "accepted", changedBy: "Ventas demo" }, NOW);
  const converted = convertAcceptedQuoteToOrder(acceptedState, { quoteId: created.quote.id, fulfillmentMode: "pickup", responsibleOperatorId: "deposito" }, NOW);
  assert.equal(converted.order.totalPyg, created.quote.totalPyg);
  assert.equal(converted.state.quotes[0].linkedOrderId, converted.order.id);
  assert.throws(() => convertAcceptedQuoteToOrder(converted.state, { quoteId: created.quote.id, fulfillmentMode: "pickup", responsibleOperatorId: "deposito" }, NOW), { code: "QUOTE_ALREADY_CONVERTED" });
  const confirmed = updateOrderStatus(converted.state, { orderId: converted.order.id, status: "confirmed", changedBy: "Ventas demo" }, NOW);
  const preparing = updateOrderStatus(confirmed, { orderId: converted.order.id, status: "preparing", changedBy: "Depósito demo" }, NOW);
  assert.equal(preparing.orders[0].history.length, 3);
  assert.throws(() => updateOrderStatus(preparing, { orderId: converted.order.id, status: "delivered", changedBy: "Depósito demo" }, NOW), { code: "INVALID_ORDER_TRANSITION" });
});

test("retiro permite pasar de listo a entregado y una cancelación requiere motivo", () => {
  let state = createInitialDemoState(NOW);
  const quote = createQuote(state, { operationId: "quote-create-002", customerId: "demo-customer-ana", items: [{ productId: "p1", quantity: 1 }], validUntil: "2026-10-20" }, products, NOW);
  state = updateQuoteStatus(quote.state, { quoteId: quote.quote.id, status: "sent", changedBy: "Ventas" }, NOW);
  state = updateQuoteStatus(state, { quoteId: quote.quote.id, status: "accepted", changedBy: "Ventas" }, NOW);
  state = convertAcceptedQuoteToOrder(state, { quoteId: quote.quote.id, fulfillmentMode: "pickup", responsibleOperatorId: "deposito" }, NOW).state;
  for (const status of ["confirmed", "preparing", "ready"]) state = updateOrderStatus(state, { orderId: "demo-order-1", status, changedBy: "Equipo" }, NOW);
  assert.throws(() => updateOrderStatus(state, { orderId: "demo-order-1", status: "cancelled", changedBy: "Equipo" }, NOW), { code: "CANCELLATION_REASON_REQUIRED" });
  state = updateOrderStatus(state, { orderId: "demo-order-1", status: "delivered", changedBy: "Equipo" }, NOW);
  assert.equal(state.orders[0].status, "delivered");
});

test("crea pedidos demo con snapshots de precio y solo perfiles ficticios", () => {
  const created = createOrder(createInitialDemoState(NOW), {
    operationId: "order-create-001", source: "counter", customerId: "demo-customer-obras",
    items: [{ productId: "p1", quantity: 3 }], fulfillmentMode: "delivery", responsibleOperatorId: "deposito",
  }, products, NOW);
  assert.equal(created.order.totalPyg, 150000);
  assert.equal(created.order.responsible, "Rubén Rojas");
  assert.equal(created.order.lines[0].unitPricePyg, 50000);
  assert.throws(() => createOrder(createInitialDemoState(NOW), {
    operationId: "order-real-customer", source: "counter", customerLabel: "Persona no demo",
    items: [{ productId: "p1", quantity: 1 }], fulfillmentMode: "pickup",
  }, products, NOW), { code: "REAL_CUSTOMER_DATA_NOT_ALLOWED" });
});

test("persistencia local conserva estado, recupera datos dañados y permite reinicio", () => {
  const storage = memoryStorage();
  assert.equal(loadDemoState(storage, NOW).source, "fresh");
  const state = openCashSession(createInitialDemoState(NOW), { operationId: "open-cash-persist", cashierId: "cajero", openingBalancePyg: 50000 }, NOW);
  saveDemoState(storage, state);
  assert.equal(loadDemoState(storage, NOW).source, "saved");
  assert.equal(loadDemoState(storage, NOW).state.cashSessions.length, 1);
  storage.setItem(DEMO_STORAGE_KEY, "{bad json");
  assert.equal(loadDemoState(storage, NOW).source, "recovered");
  assert.equal(resetDemoState(storage, NOW).cashSessions.length, 0);
  const store = new DemoStateStore(storage, NOW);
  let notified = 0;
  const unsubscribe = store.subscribe(() => { notified += 1; });
  store.hydrate(NOW);
  store.reset(NOW);
  unsubscribe();
  assert.equal(notified, 2);
});
