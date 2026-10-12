import assert from "node:assert/strict";
import test from "node:test";
import { addOrderObservation, assignOrderResponsible, createOrder, createQuote, editDraftQuote, updateOrderStatus, updateQuoteStatus, convertAcceptedQuoteToOrder } from "../../lib/admin/domain.ts";
import { createInitialDemoState } from "../../lib/admin/demo-state.ts";

const NOW = "2026-10-12T12:00:00.000Z";
const products = [
  { id: "p1", sku: "SM-DEMO-001", name: "Cemento demo", categoryId: "construccion", categoryName: "Construcción", pricePyg: 50000, saleUnit: "bolsa", availability: "disponible", active: true, fictitiousPrice: true },
  { id: "p2", sku: "SM-DEMO-002", name: "Codo PVC demo", categoryId: "sanitarios", categoryName: "Sanitarios", pricePyg: 12000, saleUnit: "unidad", availability: "disponible", active: true, fictitiousPrice: true },
];

test("pedido permite asignar responsable, agregar observación y avanzar por transiciones válidas", () => {
  const created = createOrder(createInitialDemoState(NOW), { operationId: "order-e02c-1", source: "counter", customerId: "demo-customer-ana", items: [{ productId: "p1", quantity: 2 }], fulfillmentMode: "delivery", responsibleOperatorId: "deposito" }, products, NOW);
  let state = assignOrderResponsible(created.state, { orderId: created.order.id, responsibleOperatorId: "gerencia" }, NOW);
  state = addOrderObservation(state, { orderId: created.order.id, changedBy: "Ventas demo", note: "Confirmar disponibilidad antes de preparar" }, NOW);
  state = updateOrderStatus(state, { orderId: created.order.id, status: "confirmed", changedBy: "Ventas demo" }, NOW);
  assert.equal(state.orders[0].responsible, "Carlos Vera");
  assert.match(state.orders[0].history[1].note, /Confirmar disponibilidad/);
  assert.equal(state.orders[0].status, "confirmed");
  assert.throws(() => addOrderObservation(state, { orderId: created.order.id, changedBy: "Ventas", note: "   " }, NOW), { code: "ORDER_NOTE_REQUIRED" });
  assert.throws(() => assignOrderResponsible(state, { orderId: created.order.id, responsibleOperatorId: "unknown" }, NOW), { code: "DEMO_OPERATOR_NOT_FOUND" });
});

test("presupuesto demo se puede editar solo en borrador y recalcula desde el catálogo", () => {
  const created = createQuote(createInitialDemoState(NOW), { operationId: "quote-e02c-1", customerId: "demo-customer-ana", customerLabel: "Ana Benítez (cliente demo)", items: [{ productId: "p1", quantity: 1 }], validUntil: "2026-10-20" }, products, NOW);
  const edited = editDraftQuote(created.state, { operationId: "quote-e02c-edit-1", quoteId: created.quote.id, items: [{ productId: "p1", quantity: 2 }, { productId: "p2", quantity: 1 }], validUntil: "2026-10-25", note: "Entrega a coordinar" }, products, NOW);
  assert.equal(edited.quotes[0].subtotalPyg, 112000);
  assert.equal(edited.quotes[0].totalPyg, 112000);
  assert.equal(edited.quotes[0].lines[0].unitPricePyg, 50000);
  assert.equal(edited.quotes[0].note, "Entrega a coordinar");
  const sent = updateQuoteStatus(edited, { quoteId: created.quote.id, status: "sent", changedBy: "Ventas demo" }, NOW);
  assert.throws(() => editDraftQuote(sent, { operationId: "quote-e02c-edit-2", quoteId: created.quote.id, items: [{ productId: "p1", quantity: 1 }], validUntil: "2026-10-25" }, products, NOW), { code: "QUOTE_NOT_EDITABLE" });
});

test("presupuesto aceptado se convierte una vez en pedido sin crear una venta ni un cobro", () => {
  const created = createQuote(createInitialDemoState(NOW), { operationId: "quote-e02c-flow", customerId: "demo-customer-obras", customerLabel: "Obras del Sur (empresa demo)", items: [{ productId: "p1", quantity: 3 }], validUntil: "2026-10-20" }, products, NOW);
  const sent = updateQuoteStatus(created.state, { quoteId: created.quote.id, status: "sent", changedBy: "Ventas demo" }, NOW);
  const accepted = updateQuoteStatus(sent, { quoteId: created.quote.id, status: "accepted", changedBy: "Gerencia demo" }, NOW);
  const result = convertAcceptedQuoteToOrder(accepted, { quoteId: created.quote.id, fulfillmentMode: "pickup", responsibleOperatorId: "deposito" }, NOW);
  assert.equal(result.order.totalPyg, 150000);
  assert.equal(result.order.sourceQuoteId, created.quote.id);
  assert.equal(result.order.status, "new");
  assert.equal(result.state.sales.length, 0);
  assert.equal(result.state.cashSessions.length, 0);
  assert.throws(() => convertAcceptedQuoteToOrder(result.state, { quoteId: created.quote.id, fulfillmentMode: "pickup", responsibleOperatorId: "deposito" }, NOW), { code: "QUOTE_ALREADY_CONVERTED" });
});
