import assert from "node:assert/strict";
import test from "node:test";
import { createOrder, openCashSession, recordSale, updateOrderStatus } from "../../lib/admin/domain.ts";
import { createInitialDemoState } from "../../lib/admin/demo-state.ts";
import { adjustInventory, availableStock, updateAdminProduct } from "../../lib/admin/inventory.ts";
import { DEMO_STORAGE_KEY, loadDemoState } from "../../lib/admin/persistence.ts";

const NOW = "2026-10-12T12:00:00.000Z";
const products = [
  { id: "p1", sku: "SM-001", name: "Cemento demo", categoryId: "construccion", categoryName: "Construcción", pricePyg: 50000, saleUnit: "bolsa", availability: "disponible", active: true, fictitiousPrice: true },
  { id: "p2", sku: "SM-002", name: "Caño demo", categoryId: "sanitarios", categoryName: "Sanitarios", pricePyg: 35000, saleUnit: "unidad", availability: "disponible", active: true, fictitiousPrice: true },
];

function memoryStorage(value) {
  const values = new Map([[DEMO_STORAGE_KEY, value]]);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, next) => values.set(key, next), removeItem: (key) => values.delete(key) };
}

test("recibe stock, valida ajustes contra reservas y evita cantidades inválidas", () => {
  let state = createInitialDemoState(NOW, products);
  assert.equal(state.inventory.length, 2);
  const product = state.inventory[0];
  state = adjustInventory(state, { operationId: "in-1", productId: product.productId, quantity: 4, direction: "in", reason: "Recepción demo", actor: "Depósito" }, NOW);
  assert.equal(state.inventory[0].stockOnHand, product.stockOnHand + 4);
  assert.equal(state.inventoryMovements[0].kind, "receipt");
  assert.throws(() => adjustInventory(state, { operationId: "bad-out", productId: product.productId, quantity: 1.5, direction: "out", reason: "Conteo", actor: "Depósito" }, NOW), { code: "INVALID_STOCK_QUANTITY" });
});

test("reserva al confirmar, libera al cancelar y descuenta al entregar", () => {
  let state = createInitialDemoState(NOW, products);
  const initialStock = state.inventory[0].stockOnHand;
  const created = createOrder(state, { operationId: "order-stock-1", source: "counter", customerId: "demo-customer-ana", items: [{ productId: "p1", quantity: 2 }], fulfillmentMode: "pickup" }, products, NOW);
  state = updateOrderStatus(created.state, { orderId: created.order.id, status: "confirmed", changedBy: "Ventas" }, NOW);
  assert.equal(state.inventory[0].stockReserved, 2);
  assert.equal(availableStock(state.inventory[0]), state.inventory[0].stockOnHand - 2);
  state = updateOrderStatus(state, { orderId: created.order.id, status: "cancelled", cancellationReason: "Cancelación de prueba", changedBy: "Ventas" }, NOW);
  assert.equal(state.inventory[0].stockReserved, 0);

  const second = createOrder(state, { operationId: "order-stock-2", source: "counter", customerId: "demo-customer-ana", items: [{ productId: "p1", quantity: 3 }], fulfillmentMode: "pickup" }, products, NOW);
  state = updateOrderStatus(second.state, { orderId: second.order.id, status: "confirmed", changedBy: "Ventas" }, NOW);
  for (const status of ["preparing", "ready", "delivered"]) state = updateOrderStatus(state, { orderId: second.order.id, status, changedBy: "Depósito" }, NOW);
  assert.equal(state.inventory[0].stockOnHand, initialStock - 3);
  assert.equal(state.inventory[0].stockReserved, 0);
  assert.equal(state.inventoryMovements.filter((movement) => movement.referenceId === second.order.id).map((movement) => movement.kind).join(","), "reservation,fulfillment");
});

test("venta POS descuenta stock una sola vez y detiene ventas sin disponibilidad", () => {
  let state = createInitialDemoState(NOW, products);
  state = openCashSession(state, { operationId: "open-stock", cashierId: "cajero", openingBalancePyg: 100000 }, NOW);
  const sold = recordSale(state, { operationId: "sale-stock-1", cashierId: "cajero", items: [{ productId: "p1", quantity: 2 }], paymentMethod: "cash", cashReceivedPyg: 100000 }, products, NOW);
  assert.equal(sold.inventory[0].stockOnHand, 10);
  assert.equal(sold.inventoryMovements[0].kind, "sale");
  assert.throws(() => recordSale(sold, { operationId: "sale-stock-too-large", cashierId: "cajero", items: [{ productId: "p1", quantity: 999 }], paymentMethod: "cash", cashReceivedPyg: 50000000 }, products, NOW), { code: "INSUFFICIENT_STOCK" });
});

test("actualiza catálogo operativo demo sin tocar la fuente pública", () => {
  const state = createInitialDemoState(NOW, products);
  const changed = updateAdminProduct(state, { operationId: "product-1", productId: "p1", name: "Cemento editado demo", pricePyg: 62000, minimumStock: 12, active: false, actor: "Admin" }, NOW);
  assert.equal(changed.inventory[0].pricePyg, 62000);
  assert.equal(changed.inventory[0].active, false);
  assert.equal(products[0].pricePyg, 50000);
  assert.throws(() => updateAdminProduct(changed, { operationId: "product-2", productId: "p1", name: "", pricePyg: 1, minimumStock: 0, active: true, actor: "Admin" }, NOW), { code: "INVALID_PRODUCT_NAME" });
});

test("migra estado v1 conservando ventas y pedidos y escribe esquema v2", () => {
  const legacy = createInitialDemoState(NOW);
  const { schemaVersion, inventory, inventoryMovements, ...rest } = legacy;
  const v1 = { ...rest, schemaVersion: 1, counters: { cash: 0, sale: 0, order: 0, quote: 0, movement: 0 } };
  const storage = memoryStorage(JSON.stringify(v1));
  const loaded = loadDemoState(storage, NOW, products);
  assert.equal(loaded.source, "migrated");
  assert.equal(loaded.state.schemaVersion, 2);
  assert.equal(loaded.state.inventory.length, 2);
  assert.equal(loaded.state.counters.inventoryMovement, 0);
  assert.equal(loaded.state.sales.length, 0);
  assert.equal(v1.orders.length, loaded.state.orders.length);
});


test("POS no consume unidades reservadas, y conserva venta y caja si falla", () => {
  let state = createInitialDemoState(NOW, products);
  const order = createOrder(state, { operationId: "reserve-pos", source: "counter", items: [{ productId: "p1", quantity: 10 }], fulfillmentMode: "pickup" }, products, NOW);
  state = updateOrderStatus(order.state, { orderId: order.order.id, status: "confirmed", changedBy: "Ventas" }, NOW);
  state = openCashSession(state, { operationId: "open-reserved", cashierId: "cajero", openingBalancePyg: 100000 }, NOW);
  const before = JSON.stringify(state);
  assert.equal(availableStock(state.inventory[0]), 2);
  assert.throws(() => recordSale(state, { operationId: "reserved-sale", cashierId: "cajero", items: [{ productId: "p1", quantity: 3 }], paymentMethod: "card" }, products, NOW), { code: "INSUFFICIENT_STOCK" });
  assert.equal(JSON.stringify(state), before);
  const sold = recordSale(state, { operationId: "allowed-sale", cashierId: "cajero", items: [{ productId: "p1", quantity: 2 }], paymentMethod: "card" }, products, NOW);
  assert.equal(sold.inventory[0].stockReserved, 10);
  assert.equal(availableStock(sold.inventory[0]), 0);
  assert.equal(sold.sales.length, 1);
  assert.equal(sold.cashSessions[0].movements.length, 1);
  assert.equal(sold.cashSessions[0].movements[0].cashEffectPyg, 0);
  assert.throws(() => recordSale(sold, { operationId: "allowed-sale", cashierId: "cajero", items: [{ productId: "p1", quantity: 2 }], paymentMethod: "card" }, products, NOW), { code: "DUPLICATE_OPERATION" });
});

test("migración v1 conserva ventas, caja, pedidos y reservas sin descontar ventas históricas", () => {
  let legacy = createInitialDemoState(NOW, products);
  legacy = openCashSession(legacy, { operationId: "legacy-open", cashierId: "cajero", openingBalancePyg: 100000 }, NOW);
  legacy = recordSale(legacy, { operationId: "legacy-sale", cashierId: "cajero", items: [{ productId: "p2", quantity: 1 }], paymentMethod: "card" }, products, NOW);
  const pending = createOrder(legacy, { operationId: "legacy-pending", source: "counter", items: [{ productId: "p1", quantity: 3 }], fulfillmentMode: "pickup" }, products, NOW);
  legacy = updateOrderStatus(pending.state, { orderId: pending.order.id, status: "confirmed", changedBy: "Ventas" }, NOW);
  const done = createOrder(legacy, { operationId: "legacy-done", source: "counter", items: [{ productId: "p2", quantity: 1 }], fulfillmentMode: "pickup" }, products, NOW);
  legacy = updateOrderStatus(done.state, { orderId: done.order.id, status: "confirmed", changedBy: "Ventas" }, NOW);
  for (const status of ["preparing", "ready", "delivered"]) legacy = updateOrderStatus(legacy, { orderId: done.order.id, status, changedBy: "Depósito" }, NOW);
  const { schemaVersion, inventory, inventoryMovements, ...rest } = legacy;
  const v1 = { ...rest, schemaVersion: 1, counters: { cash: rest.counters.cash, sale: rest.counters.sale, order: rest.counters.order, quote: rest.counters.quote, movement: rest.counters.movement } };
  const storage = memoryStorage(JSON.stringify(v1));
  const loaded = loadDemoState(storage, NOW, products);
  assert.equal(loaded.source, "migrated");
  assert.deepEqual(loaded.state.sales, v1.sales);
  assert.deepEqual(loaded.state.cashSessions, v1.cashSessions);
  assert.deepEqual(loaded.state.orders, v1.orders);
  assert.deepEqual(loaded.state.processedOperationIds, v1.processedOperationIds);
  assert.equal(loaded.state.inventory[0].stockReserved, 3);
  assert.equal(loaded.state.inventory[1].stockReserved, 0);
  assert.equal(loaded.state.inventory[1].stockOnHand, createInitialDemoState(NOW, products).inventory[1].stockOnHand);
  assert.equal(loaded.state.inventoryMovements.length, 0);
});
