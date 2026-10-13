import { DomainError } from "./errors.ts";
import { updateOrderStatus } from "./domain.ts";
import type { DemoState } from "./types";

export function prepareWarehouseOrder(state: DemoState, input: { orderId: string; actor: string; quantities: Record<string, number>; note?: string }, now = new Date().toISOString()): DemoState {
  const order = state.orders.find((item) => item.id === input.orderId);
  if (!order || !["confirmed", "preparing"].includes(order.status)) throw new DomainError("El pedido no está disponible para preparación.", "INVALID_WAREHOUSE_ORDER");
  if (!input.actor.trim()) throw new DomainError("Indicá un responsable.", "WAREHOUSE_ACTOR_REQUIRED");
  const expected = new Map<string, number>();
  for (const line of order.lines) expected.set(line.productId, (expected.get(line.productId) ?? 0) + line.quantity);
  if (Object.keys(input.quantities).length !== expected.size || [...expected].some(([id, qty]) => input.quantities[id] !== qty)) {
    throw new DomainError("Confirmá exactamente las cantidades de todas las líneas del pedido.", "WAREHOUSE_QUANTITY_MISMATCH");
  }
  let next = state;
  if (order.status === "confirmed") next = updateOrderStatus(next, { orderId: order.id, status: "preparing", changedBy: input.actor, note: "Preparación iniciada" }, now);
  return updateOrderStatus(next, { orderId: order.id, status: "ready", changedBy: input.actor, note: input.note?.trim() || "Cantidades verificadas; pedido preparado" }, now);
}

export function completeDelivery(state: DemoState, input: { orderId: string; actor: string; action: "dispatch" | "deliver"; note: string }, now = new Date().toISOString()): DemoState {
  const order = state.orders.find((item) => item.id === input.orderId);
  if (!order) throw new DomainError("Pedido inexistente.", "ORDER_NOT_FOUND");
  if (!input.actor.trim() || !input.note.trim()) throw new DomainError("Indicá responsable y constancia de la operación.", "DELIVERY_DETAILS_REQUIRED");
  if (input.action === "dispatch") {
    if (order.fulfillmentMode !== "delivery" || order.status !== "ready") throw new DomainError("Solo se despachan envíos preparados.", "INVALID_DISPATCH");
    return updateOrderStatus(state, { orderId: order.id, status: "en_route", changedBy: input.actor, note: input.note }, now);
  }
  if (order.fulfillmentMode === "pickup" ? order.status !== "ready" : order.status !== "en_route") {
    throw new DomainError("La entrega requiere preparación y, para envíos, despacho previo.", "INVALID_DELIVERY");
  }
  return updateOrderStatus(state, { orderId: order.id, status: "delivered", changedBy: input.actor, note: input.note }, now);
}
