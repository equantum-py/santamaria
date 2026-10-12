import type { AdminProductRecord, DemoState, InventoryMovement, InventoryMovementKind, SaleLine } from "./types";
import { DomainError } from "./errors.ts";

export function availableStock(product: Pick<AdminProductRecord, "stockOnHand" | "stockReserved">) {
  return product.stockOnHand - product.stockReserved;
}

export function updateAdminProduct(
  state: DemoState,
  input: { operationId: string; productId: string; name: string; pricePyg: number; minimumStock: number; active: boolean; actor: string },
  now = new Date().toISOString(),
): DemoState {
  if (state.processedOperationIds.includes(input.operationId)) throw new DomainError("Esta operación ya fue procesada.", "DUPLICATE_OPERATION");
  const index = state.inventory.findIndex((product) => product.productId === input.productId);
  if (index < 0) throw new DomainError("No se encontró el producto demo.", "PRODUCT_NOT_FOUND");
  const name = input.name.trim();
  if (!name || name.length > 120) throw new DomainError("El nombre debe tener entre 1 y 120 caracteres.", "INVALID_PRODUCT_NAME");
  if (!Number.isSafeInteger(input.pricePyg) || input.pricePyg <= 0) throw new DomainError("El precio demo debe ser un entero mayor que cero.", "INVALID_PYG_AMOUNT");
  if (!Number.isSafeInteger(input.minimumStock) || input.minimumStock < 0 || input.minimumStock > 999999) throw new DomainError("El mínimo de stock debe ser un entero igual o mayor a cero.", "INVALID_MINIMUM_STOCK");
  const inventory = [...state.inventory];
  inventory[index] = { ...inventory[index], name, pricePyg: input.pricePyg, minimumStock: input.minimumStock, active: input.active, updatedAt: now };
  return {
    ...state,
    updatedAt: now,
    inventory,
    processedOperationIds: [...state.processedOperationIds, input.operationId],
    activities: [...state.activities, { id: `product-${input.operationId}`, kind: "inventory", title: "Producto demo actualizado", detail: `${inventory[index].sku} · ${name}`, createdAt: now }],
  };
}

export function adjustInventory(
  state: DemoState,
  input: { operationId: string; productId: string; quantity: number; direction: "in" | "out"; reason: string; actor: string },
  now = new Date().toISOString(),
): DemoState {
  if (state.processedOperationIds.includes(input.operationId)) throw new DomainError("Esta operación ya fue procesada.", "DUPLICATE_OPERATION");
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 999999) throw new DomainError("La cantidad debe ser un entero positivo.", "INVALID_STOCK_QUANTITY");
  const reason = input.reason.trim();
  if (!reason || reason.length > 200) throw new DomainError("Indicá el motivo del movimiento (hasta 200 caracteres).", "STOCK_REASON_REQUIRED");
  const next = applyInventoryMovement(state, {
    productId: input.productId,
    kind: input.direction === "in" ? "receipt" : "adjustment",
    quantity: input.direction === "in" ? input.quantity : -input.quantity,
    referenceId: input.operationId,
    reason,
    actor: input.actor,
  }, now);
  return { ...next, processedOperationIds: [...next.processedOperationIds, input.operationId] };
}

export function applyInventoryMovement(
  state: DemoState,
  input: { productId: string; kind: InventoryMovementKind; quantity: number; referenceId: string | null; reason: string; actor: string },
  now = new Date().toISOString(),
): DemoState {
  const index = state.inventory.findIndex((product) => product.productId === input.productId);
  if (index < 0) {
    if (!state.inventory.length) return state;
    throw new DomainError("El producto no forma parte del inventario demo.", "INVENTORY_PRODUCT_NOT_FOUND");
  }
  if (!Number.isSafeInteger(input.quantity) || input.quantity === 0) throw new DomainError("El movimiento de stock debe ser un entero distinto de cero.", "INVALID_STOCK_QUANTITY");
  const product = state.inventory[index];
  const isReservation = input.kind === "reservation" || input.kind === "reservation_release";
  const onHandDelta = isReservation ? 0 : input.quantity;
  const reservedDelta = input.kind === "reservation" ? input.quantity : input.kind === "reservation_release" ? -input.quantity : input.kind === "fulfillment" ? input.quantity : 0;
  const stockOnHand = product.stockOnHand + onHandDelta;
  const stockReserved = product.stockReserved + reservedDelta;
  if (stockOnHand < 0) throw new DomainError(`No hay suficiente existencia de ${product.name}.`, "INSUFFICIENT_STOCK");
  if (stockReserved < 0) throw new DomainError(`La reserva de ${product.name} no puede quedar negativa.`, "INVALID_STOCK_RESERVATION");
  if (stockReserved > stockOnHand) throw new DomainError(`No hay suficiente stock disponible de ${product.name}.`, "INSUFFICIENT_STOCK");
  const movementNumber = state.counters.inventoryMovement + 1;
  const movement: InventoryMovement = {
    id: `demo-stock-move-${movementNumber}`,
    productId: product.productId,
    kind: input.kind,
    quantity: Math.abs(input.quantity),
    onHandDelta,
    reservedDelta,
    referenceId: input.referenceId,
    reason: input.reason,
    actor: input.actor,
    createdAt: now,
    isFictitious: true,
  };
  const inventory = [...state.inventory];
  inventory[index] = { ...product, stockOnHand, stockReserved, updatedAt: now };
  return {
    ...state,
    updatedAt: now,
    inventory,
    inventoryMovements: [...state.inventoryMovements, movement],
    counters: { ...state.counters, inventoryMovement: movementNumber },
    activities: [...state.activities, { id: movement.id, kind: "inventory", title: "Movimiento de inventario", detail: `${product.sku} · ${input.reason}`, createdAt: now }],
  };
}

export function applyStockToSale(state: DemoState, lines: readonly SaleLine[], saleId: string, actor: string, now: string) {
  return lines.reduce((current, line) => applyInventoryMovement(current, {
    productId: line.productId, kind: "sale", quantity: -line.quantity, referenceId: saleId, reason: `Venta ${saleId}`, actor,
  }, now), state);
}

export function reserveOrderStock(state: DemoState, lines: readonly SaleLine[], orderId: string, actor: string, now: string) {
  return lines.reduce((current, line) => applyInventoryMovement(current, {
    productId: line.productId, kind: "reservation", quantity: line.quantity, referenceId: orderId, reason: `Reserva del pedido ${orderId}`, actor,
  }, now), state);
}

export function releaseOrderStock(state: DemoState, lines: readonly SaleLine[], orderId: string, actor: string, now: string) {
  return lines.reduce((current, line) => applyInventoryMovement(current, {
    productId: line.productId, kind: "reservation_release", quantity: line.quantity, referenceId: orderId, reason: `Liberación del pedido cancelado ${orderId}`, actor,
  }, now), state);
}

export function fulfillOrderStock(state: DemoState, lines: readonly SaleLine[], orderId: string, actor: string, now: string) {
  return lines.reduce((current, line) => applyInventoryMovement(current, {
    productId: line.productId, kind: "fulfillment", quantity: -line.quantity, referenceId: orderId, reason: `Entrega del pedido ${orderId}`, actor,
  }, now), state);
}
