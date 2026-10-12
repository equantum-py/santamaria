import type {
  CashMovement,
  CashMovementKind,
  CashSession,
  DemoActivity,
  DemoProduct,
  DemoState,
  FulfillmentMode,
  ItemDraft,
  OrderHistoryEntry,
  OrderStatus,
  PaymentMethod,
  Quote,
  QuoteStatus,
  SaleLine,
} from "./types";

export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export function assertPygAmount(amount: number, label = "El importe"): number {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new DomainError(`${label} debe ser un número entero de guaraníes igual o mayor a cero.`, "INVALID_PYG_AMOUNT");
  }
  return amount;
}

export function buildSaleLines(items: readonly ItemDraft[], catalog: readonly DemoProduct[]): SaleLine[] {
  if (!items.length) throw new DomainError("Agregá al menos un producto.", "EMPTY_ITEMS");
  const products = new Map(catalog.map((product) => [product.id, product]));
  return items.map((item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      throw new DomainError("La cantidad debe ser un entero entre 1 y 999.", "INVALID_QUANTITY");
    }
    const product = products.get(item.productId);
    if (!product || !product.active) throw new DomainError("El producto no está disponible en el catálogo de demostración.", "PRODUCT_NOT_FOUND");
    assertPygAmount(product.pricePyg, "El precio del producto");
    const lineTotalPyg = product.pricePyg * item.quantity;
    assertPygAmount(lineTotalPyg, "El total de la línea");
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      saleUnit: product.saleUnit,
      quantity: item.quantity,
      unitPricePyg: product.pricePyg,
      lineTotalPyg,
    };
  });
}

export function calculateTotals(lines: readonly SaleLine[], authorizedDiscountPyg = 0) {
  if (!lines.length) throw new DomainError("Agregá al menos un producto.", "EMPTY_ITEMS");
  const subtotalPyg = lines.reduce((sum, line) => sum + assertPygAmount(line.lineTotalPyg, "El total de la línea"), 0);
  assertPygAmount(subtotalPyg, "El subtotal");
  assertPygAmount(authorizedDiscountPyg, "El descuento autorizado");
  if (authorizedDiscountPyg > subtotalPyg) throw new DomainError("El descuento no puede superar el subtotal.", "DISCOUNT_EXCEEDS_SUBTOTAL");
  return { subtotalPyg, authorizedDiscountPyg, totalPyg: subtotalPyg - authorizedDiscountPyg };
}

export function calculateChange(totalPyg: number, receivedPyg: number): number {
  assertPygAmount(totalPyg, "El total");
  assertPygAmount(receivedPyg, "El importe recibido");
  if (receivedPyg < totalPyg) throw new DomainError("El importe recibido no alcanza para cubrir el total.", "INSUFFICIENT_CASH");
  return receivedPyg - totalPyg;
}

export function getExpectedCash(session: Pick<CashSession, "openingBalancePyg" | "movements">): number {
  const expected = session.movements.reduce((sum, movement) => sum + movement.cashEffectPyg, session.openingBalancePyg);
  if (!Number.isSafeInteger(expected) || expected < 0) throw new DomainError("El saldo esperado de caja no es válido.", "INVALID_EXPECTED_CASH");
  return expected;
}

export function openCashSession(
  state: DemoState,
  input: { operationId: string; cashierId: string; openingBalancePyg: number },
  now = new Date().toISOString(),
): DemoState {
  assertNewOperation(state, input.operationId);
  assertPygAmount(input.openingBalancePyg, "El saldo inicial");
  const operator = getDemoOperator(state, input.cashierId);
  if (state.cashSessions.some((session) => session.cashierId === input.cashierId && session.status === "open")) {
    throw new DomainError("Este cajero ya tiene una caja abierta.", "CASH_ALREADY_OPEN");
  }
  const nextNumber = state.counters.cash + 1;
  const session: CashSession = {
    id: `demo-cash-${nextNumber}`,
    number: `DEM-C-${String(nextNumber).padStart(4, "0")}`,
    cashierId: input.cashierId,
    cashierName: operator.displayName,
    openedAt: now,
    openingBalancePyg: input.openingBalancePyg,
    status: "open",
    movements: [],
    countedCashPyg: null,
    closedAt: null,
    differencePyg: null,
  };
  return {
    ...state,
    updatedAt: now,
    cashSessions: [...state.cashSessions, session],
    processedOperationIds: [...state.processedOperationIds, input.operationId],
    counters: { ...state.counters, cash: nextNumber },
    activities: addActivity(state.activities, { id: session.id, kind: "cash", title: "Caja abierta", detail: `${session.number} · ${operator.displayName}`, createdAt: now }),
  };
}

export function addManualCashMovement(
  state: DemoState,
  input: { operationId: string; sessionId: string; kind: "manual_income" | "manual_expense"; amountPyg: number; label: string; note?: string },
  now = new Date().toISOString(),
): DemoState {
  assertNewOperation(state, input.operationId);
  assertPygAmount(input.amountPyg, "El importe del movimiento");
  if (input.amountPyg === 0) throw new DomainError("El importe del movimiento debe ser mayor a cero.", "ZERO_MOVEMENT");
  if (!input.label.trim()) throw new DomainError("Indicá el motivo del movimiento.", "MOVEMENT_LABEL_REQUIRED");
  const session = requireOpenSession(state, input.sessionId);
  const movementNumber = state.counters.movement + 1;
  const cashEffectPyg = input.kind === "manual_income" ? input.amountPyg : -input.amountPyg;
  const movement: CashMovement = {
    id: `demo-movement-${movementNumber}`,
    kind: input.kind,
    label: input.label.trim(),
    amountPyg: input.amountPyg,
    cashEffectPyg,
    paymentMethod: null,
    referenceId: null,
    createdAt: now,
    note: input.note?.trim() ?? "",
  };
  const nextSession = { ...session, movements: [...session.movements, movement] };
  const expectedCashPyg = getExpectedCash(session) + cashEffectPyg;
  if (input.kind === "manual_expense" && expectedCashPyg < 0) throw new DomainError("El egreso supera el efectivo disponible en caja.", "EXPENSE_EXCEEDS_CASH");
  assertPygAmount(expectedCashPyg, "El saldo esperado de caja");
  return {
    ...state,
    updatedAt: now,
    cashSessions: replaceSession(state.cashSessions, nextSession),
    processedOperationIds: [...state.processedOperationIds, input.operationId],
    counters: { ...state.counters, movement: movementNumber },
    activities: addActivity(state.activities, { id: movement.id, kind: "cash", title: input.kind === "manual_income" ? "Ingreso de caja" : "Egreso de caja", detail: `${movement.label} · Gs. ${input.amountPyg.toLocaleString("es-PY")}`, createdAt: now }),
  };
}

export function closeCashSession(
  state: DemoState,
  input: { sessionId: string; countedCashPyg: number },
  now = new Date().toISOString(),
): DemoState {
  assertPygAmount(input.countedCashPyg, "El efectivo contado");
  const session = requireOpenSession(state, input.sessionId);
  const expectedCashPyg = getExpectedCash(session);
  const differencePyg = input.countedCashPyg - expectedCashPyg;
  const closed: CashSession = {
    ...session,
    status: "closed",
    countedCashPyg: input.countedCashPyg,
    closedAt: now,
    differencePyg,
  };
  return {
    ...state,
    updatedAt: now,
    cashSessions: replaceSession(state.cashSessions, closed),
    activities: addActivity(state.activities, { id: `closed-${session.id}`, kind: "cash", title: "Caja cerrada", detail: `${session.number} · Diferencia Gs. ${differencePyg.toLocaleString("es-PY")}`, createdAt: now }),
  };
}

export function recordSale(
  state: DemoState,
  input: {
    operationId: string;
    cashierId: string;
    customerId?: string | null;
    customerLabel?: string;
    items: readonly ItemDraft[];
    authorizedDiscountPyg?: number;
    discountAuthorizedBy?: string | null;
    paymentMethod: PaymentMethod;
    cashReceivedPyg?: number;
    note?: string;
  },
  catalog: readonly DemoProduct[],
  now = new Date().toISOString(),
): DemoState {
  assertNewOperation(state, input.operationId);
  const cashier = getDemoOperator(state, input.cashierId);
  const session = state.cashSessions.find((item) => item.cashierId === input.cashierId && item.status === "open");
  if (!session) throw new DomainError("Abrí una caja para este cajero antes de registrar una venta.", "OPEN_CASH_REQUIRED");
  const lines = buildSaleLines(input.items, catalog);
  const totals = calculateTotals(lines, input.authorizedDiscountPyg ?? 0);
  const discountAuthorizedBy = input.authorizedDiscountPyg ? input.discountAuthorizedBy?.trim() : null;
  if (input.authorizedDiscountPyg && !discountAuthorizedBy) throw new DomainError("Indicá quién autorizó el descuento demostrativo.", "DISCOUNT_AUTHORIZER_REQUIRED");
  if (!["cash", "card", "transfer", "qr"].includes(input.paymentMethod)) throw new DomainError("Seleccioná un medio de pago válido para la demo.", "INVALID_PAYMENT_METHOD");
  const customerLabel = resolveDemoCustomerLabel(state, input.customerId ?? null, input.customerLabel);
  const cashReceivedPyg = input.paymentMethod === "cash" ? assertPygAmount(input.cashReceivedPyg ?? -1, "El importe recibido") : null;
  const changePyg = input.paymentMethod === "cash" ? calculateChange(totals.totalPyg, cashReceivedPyg!) : 0;
  const nextSaleNumber = state.counters.sale + 1;
  const saleId = `demo-sale-${nextSaleNumber}`;
  const sale = {
    id: saleId,
    number: `DEM-V-${String(nextSaleNumber).padStart(4, "0")}`,
    operationId: input.operationId,
    createdAt: now,
    cashierId: input.cashierId,
    cashierName: cashier.displayName,
    customerId: input.customerId ?? null,
    customerLabel,
    lines,
    ...totals,
    discountAuthorizedBy: discountAuthorizedBy || null,
    paymentMethod: input.paymentMethod,
    cashReceivedPyg,
    changePyg,
    status: "completed" as const,
    cashSessionId: session.id,
    note: input.note?.trim() ?? "",
    isFictitious: true as const,
  };
  const movementNumber = state.counters.movement + 1;
  const kindByPayment: Record<PaymentMethod, CashMovementKind> = {
    cash: "cash_sale", card: "card_sale", transfer: "transfer_sale", qr: "qr_sale",
  };
  const cashEffectPyg = input.paymentMethod === "cash" ? totals.totalPyg : 0;
  const movement: CashMovement = {
    id: `demo-movement-${movementNumber}`,
    kind: kindByPayment[input.paymentMethod],
    label: `Venta ${sale.number}`,
    amountPyg: totals.totalPyg,
    cashEffectPyg,
    paymentMethod: input.paymentMethod,
    referenceId: saleId,
    createdAt: now,
    note: input.paymentMethod === "cash" ? `Recibido Gs. ${cashReceivedPyg!.toLocaleString("es-PY")} · vuelto Gs. ${changePyg.toLocaleString("es-PY")}` : "Pago simulado; no se procesó ninguna transacción real.",
  };
  const updatedSession = { ...session, movements: [...session.movements, movement] };
  getExpectedCash(updatedSession);
  return {
    ...state,
    updatedAt: now,
    sales: [...state.sales, sale],
    cashSessions: replaceSession(state.cashSessions, updatedSession),
    processedOperationIds: [...state.processedOperationIds, input.operationId],
    counters: { ...state.counters, sale: nextSaleNumber, movement: movementNumber },
    activities: addActivity(state.activities, { id: saleId, kind: "sale", title: "Venta registrada", detail: `${sale.number} · Gs. ${sale.totalPyg.toLocaleString("es-PY")}`, createdAt: now }),
  };
}

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["en_route", "delivered", "cancelled"],
  en_route: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus, fulfillmentMode: FulfillmentMode): boolean {
  if (!ORDER_TRANSITIONS[from].includes(to)) return false;
  return !(fulfillmentMode === "pickup" && from === "ready" && to === "en_route");
}

export function transitionOrder(
  order: DemoState["orders"][number],
  input: { status: OrderStatus; changedBy: string; note?: string; cancellationReason?: string },
  now = new Date().toISOString(),
) {
  if (!canTransitionOrder(order.status, input.status, order.fulfillmentMode)) {
    throw new DomainError(`No se permite pasar el pedido de ${order.status} a ${input.status}.`, "INVALID_ORDER_TRANSITION");
  }
  const cancellationReason = input.status === "cancelled" ? input.cancellationReason?.trim() : null;
  if (input.status === "cancelled" && !cancellationReason) throw new DomainError("Indicá el motivo de cancelación.", "CANCELLATION_REASON_REQUIRED");
  const history: OrderHistoryEntry = { status: input.status, changedAt: now, changedBy: input.changedBy, note: input.note?.trim() ?? "" };
  return { ...order, status: input.status, cancellationReason: cancellationReason ?? null, history: [...order.history, history] };
}

export function updateOrderStatus(
  state: DemoState,
  input: { orderId: string; status: OrderStatus; changedBy: string; note?: string; cancellationReason?: string },
  now = new Date().toISOString(),
): DemoState {
  const index = state.orders.findIndex((order) => order.id === input.orderId);
  if (index < 0) throw new DomainError("No se encontró el pedido.", "ORDER_NOT_FOUND");
  const updatedOrder = transitionOrder(state.orders[index], input, now);
  const orders = [...state.orders];
  orders[index] = updatedOrder;
  return {
    ...state,
    updatedAt: now,
    orders,
    activities: addActivity(state.activities, { id: `${updatedOrder.id}-${updatedOrder.history.length}`, kind: "order", title: "Estado de pedido actualizado", detail: `${updatedOrder.number} · ${updatedOrder.status}`, createdAt: now }),
  };
}

export function transitionQuote(
  quote: Quote,
  input: { status: QuoteStatus; changedBy: string },
  now = new Date().toISOString(),
): Quote {
  const allowed: Record<QuoteStatus, readonly QuoteStatus[]> = {
    draft: ["sent", "rejected"], sent: ["accepted", "rejected", "expired"], accepted: [], rejected: [], expired: [],
  };
  if (!allowed[quote.status].includes(input.status)) throw new DomainError(`No se permite pasar el presupuesto de ${quote.status} a ${input.status}.`, "INVALID_QUOTE_TRANSITION");
  if (input.status === "expired" && now.slice(0, 10) <= quote.validUntil) throw new DomainError("El presupuesto todavía está dentro de su vigencia.", "QUOTE_NOT_EXPIRED");
  return { ...quote, status: input.status, history: [...quote.history, { status: input.status, changedAt: now, changedBy: input.changedBy }] };
}

export function updateQuoteStatus(
  state: DemoState,
  input: { quoteId: string; status: QuoteStatus; changedBy: string },
  now = new Date().toISOString(),
): DemoState {
  const index = state.quotes.findIndex((quote) => quote.id === input.quoteId);
  if (index < 0) throw new DomainError("No se encontró el presupuesto.", "QUOTE_NOT_FOUND");
  const updatedQuote = transitionQuote(state.quotes[index], input, now);
  const quotes = [...state.quotes];
  quotes[index] = updatedQuote;
  return {
    ...state,
    updatedAt: now,
    quotes,
    activities: addActivity(state.activities, { id: `${updatedQuote.id}-${updatedQuote.history.length}`, kind: "quote", title: "Estado de presupuesto actualizado", detail: `${updatedQuote.number} · ${updatedQuote.status}`, createdAt: now }),
  };
}

export function createQuote(
  state: DemoState,
  input: { operationId: string; customerId?: string | null; customerLabel: string; items: readonly ItemDraft[]; authorizedDiscountPyg?: number; discountAuthorizedBy?: string | null; validUntil: string; note?: string },
  catalog: readonly DemoProduct[],
  now = new Date().toISOString(),
): { state: DemoState; quote: Quote } {
  assertNewOperation(state, input.operationId);
  const expiryDate = /^\d{4}-\d{2}-\d{2}$/.test(input.validUntil) ? new Date(`${input.validUntil}T00:00:00.000Z`) : null;
  if (!expiryDate || Number.isNaN(expiryDate.getTime()) || expiryDate.toISOString().slice(0, 10) !== input.validUntil || input.validUntil < now.slice(0, 10)) {
    throw new DomainError("La fecha de vigencia debe ser hoy o una fecha posterior.", "INVALID_QUOTE_EXPIRY");
  }
  const lines = buildSaleLines(input.items, catalog);
  const totals = calculateTotals(lines, input.authorizedDiscountPyg ?? 0);
  const discountAuthorizedBy = input.authorizedDiscountPyg ? input.discountAuthorizedBy?.trim() : null;
  if (input.authorizedDiscountPyg && !discountAuthorizedBy) throw new DomainError("Indicá quién autorizó el descuento demostrativo.", "DISCOUNT_AUTHORIZER_REQUIRED");
  const customerLabel = resolveDemoCustomerLabel(state, input.customerId ?? null, input.customerLabel);
  const number = state.counters.quote + 1;
  const quote: Quote = {
    id: `demo-quote-${number}`,
    number: `DEM-P-${String(number).padStart(4, "0")}`,
    customerId: input.customerId ?? null,
    customerLabel,
    lines,
    ...totals,
    discountAuthorizedBy: discountAuthorizedBy || null,
    createdAt: now,
    validUntil: input.validUntil,
    status: "draft",
    note: input.note?.trim() ?? "",
    linkedOrderId: null,
    history: [{ status: "draft", changedAt: now, changedBy: "Sistema demo" }],
    isFictitious: true,
  };
  return {
    quote,
    state: {
      ...state,
      updatedAt: now,
      quotes: [...state.quotes, quote],
      processedOperationIds: [...state.processedOperationIds, input.operationId],
      counters: { ...state.counters, quote: number },
      activities: addActivity(state.activities, { id: quote.id, kind: "quote", title: "Presupuesto creado", detail: `${quote.number} · ${quote.customerLabel}`, createdAt: now }),
    },
  };
}

export function createOrder(
  state: DemoState,
  input: {
    operationId: string;
    source: "ecommerce_demo" | "counter";
    customerId?: string | null;
    customerLabel?: string;
    items: readonly ItemDraft[];
    fulfillmentMode: FulfillmentMode;
    responsibleOperatorId?: string | null;
    deliveryNote?: string;
  },
  catalog: readonly DemoProduct[],
  now = new Date().toISOString(),
) {
  assertNewOperation(state, input.operationId);
  if (input.source !== "ecommerce_demo" && input.source !== "counter") throw new DomainError("El origen del pedido no es válido.", "INVALID_ORDER_SOURCE");
  const lines = buildSaleLines(input.items, catalog);
  const totals = calculateTotals(lines);
  const customerLabel = resolveDemoCustomerLabel(state, input.customerId ?? null, input.customerLabel);
  const responsible = input.responsibleOperatorId ? getDemoOperator(state, input.responsibleOperatorId).displayName : "Pendiente de asignación";
  const number = state.counters.order + 1;
  const order = {
    id: `demo-order-${number}`,
    number: `DEM-PED-${String(number).padStart(4, "0")}`,
    source: input.source,
    sourceQuoteId: null,
    customerId: input.customerId ?? null,
    customerLabel,
    lines,
    totalPyg: totals.totalPyg,
    fulfillmentMode: input.fulfillmentMode,
    status: "new" as const,
    createdAt: now,
    responsible,
    deliveryNote: input.deliveryNote?.trim() ?? "",
    cancellationReason: null,
    history: [{ status: "new" as const, changedAt: now, changedBy: "Sistema demo", note: "Pedido creado en entorno de demostración." }],
    isFictitious: true as const,
  };
  return {
    state: {
      ...state,
      updatedAt: now,
      orders: [...state.orders, order],
      processedOperationIds: [...state.processedOperationIds, input.operationId],
      counters: { ...state.counters, order: number },
      activities: addActivity(state.activities, { id: order.id, kind: "order", title: "Pedido demo creado", detail: `${order.number} · ${customerLabel}`, createdAt: now }),
    },
    order,
  };
}

export function convertAcceptedQuoteToOrder(
  state: DemoState,
  input: { quoteId: string; fulfillmentMode: FulfillmentMode; responsibleOperatorId: string },
  now = new Date().toISOString(),
) {
  const quoteIndex = state.quotes.findIndex((item) => item.id === input.quoteId);
  const quote = state.quotes[quoteIndex];
  if (!quote) throw new DomainError("No se encontró el presupuesto.", "QUOTE_NOT_FOUND");
  if (quote.status !== "accepted") throw new DomainError("Solo se puede convertir un presupuesto aceptado.", "QUOTE_NOT_ACCEPTED");
  if (quote.linkedOrderId) throw new DomainError("Este presupuesto ya fue convertido en pedido.", "QUOTE_ALREADY_CONVERTED");
  const responsible = getDemoOperator(state, input.responsibleOperatorId).displayName;
  const next = state.counters.order + 1;
  const order = {
    id: `demo-order-${next}`,
    number: `DEM-PED-${String(next).padStart(4, "0")}`,
    source: "quote" as const,
    sourceQuoteId: quote.id,
    customerId: quote.customerId,
    customerLabel: quote.customerLabel,
    lines: quote.lines,
    totalPyg: quote.totalPyg,
    fulfillmentMode: input.fulfillmentMode,
    status: "new" as const,
    createdAt: now,
    responsible,
    deliveryNote: "",
    cancellationReason: null,
    history: [{ status: "new" as const, changedAt: now, changedBy: responsible, note: "Pedido creado desde presupuesto aceptado." }],
    isFictitious: true as const,
  };
  const updatedQuote = { ...quote, linkedOrderId: order.id };
  const quotes = [...state.quotes];
  quotes[quoteIndex] = updatedQuote;
  return {
    state: {
      ...state,
      updatedAt: now,
      quotes,
      orders: [...state.orders, order],
      counters: { ...state.counters, order: next },
      activities: addActivity(state.activities, { id: order.id, kind: "order", title: "Pedido creado desde presupuesto", detail: `${order.number} · ${quote.number}`, createdAt: now }),
    },
    order,
  };
}

function requireOpenSession(state: DemoState, id: string): CashSession {
  const session = state.cashSessions.find((item) => item.id === id);
  if (!session || session.status !== "open") throw new DomainError("La caja no está abierta.", "CASH_NOT_OPEN");
  return session;
}

function replaceSession(sessions: CashSession[], updated: CashSession) {
  return sessions.map((session) => session.id === updated.id ? updated : session);
}

function addActivity(activities: DemoActivity[], activity: DemoActivity) {
  return [activity, ...activities].slice(0, 100);
}

function assertNewOperation(state: DemoState, operationId: string) {
  if (!operationId.trim()) throw new DomainError("La operación necesita un identificador único.", "OPERATION_ID_REQUIRED");
  if (state.processedOperationIds.includes(operationId)) throw new DomainError("Esta operación ya fue registrada.", "DUPLICATE_OPERATION");
}

function resolveDemoCustomerLabel(state: DemoState, customerId: string | null, requestedLabel?: string): string {
  if (customerId) {
    const customer = state.customers.find((item) => item.id === customerId && item.isFictitious);
    if (!customer) throw new DomainError("Elegí un cliente ficticio disponible en la demo.", "DEMO_CUSTOMER_NOT_FOUND");
    return customer.displayName;
  }
  const label = requestedLabel?.trim();
  if (!label || label === "Consumidor final") return "Consumidor final";
  const customer = state.customers.find((item) => item.displayName === label && item.isFictitious);
  if (!customer) throw new DomainError("Usá Consumidor final o seleccioná un cliente ficticio.", "REAL_CUSTOMER_DATA_NOT_ALLOWED");
  return customer.displayName;
}

function getDemoOperator(state: DemoState, operatorId: string) {
  const operator = state.operators.find((item) => item.id === operatorId && item.isFictitious);
  if (!operator) throw new DomainError("Elegí un perfil de demostración disponible.", "DEMO_OPERATOR_NOT_FOUND");
  return operator;
}
