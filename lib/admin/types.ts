export type PaymentMethod = "cash" | "card" | "transfer" | "qr";
export type Availability = "disponible" | "pocas_unidades" | "consultar";
export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "en_route" | "delivered" | "cancelled";
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type FulfillmentMode = "pickup" | "delivery";
export type OrderSource = "ecommerce_demo" | "counter" | "quote";

export interface DemoProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  pricePyg: number;
  saleUnit: string;
  availability: Availability;
  active: boolean;
  fictitiousPrice: boolean;
}

export interface DemoCustomer {
  id: string;
  displayName: string;
  kind: "consumer" | "business";
  isFictitious: true;
}

export interface DemoOperator {
  id: string;
  displayName: string;
  role: string;
  isFictitious: true;
}

export interface ItemDraft {
  productId: string;
  quantity: number;
}

export interface SaleLine {
  productId: string;
  sku: string;
  name: string;
  saleUnit: string;
  quantity: number;
  unitPricePyg: number;
  lineTotalPyg: number;
}

export interface Sale {
  id: string;
  number: string;
  operationId: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
  customerId: string | null;
  customerLabel: string;
  lines: SaleLine[];
  subtotalPyg: number;
  authorizedDiscountPyg: number;
  discountAuthorizedBy: string | null;
  totalPyg: number;
  paymentMethod: PaymentMethod;
  cashReceivedPyg: number | null;
  changePyg: number;
  status: "completed";
  cashSessionId: string;
  note: string;
  isFictitious: true;
}

export type CashMovementKind = "cash_sale" | "card_sale" | "transfer_sale" | "qr_sale" | "manual_income" | "manual_expense";

export interface CashMovement {
  id: string;
  kind: CashMovementKind;
  label: string;
  amountPyg: number;
  cashEffectPyg: number;
  paymentMethod: PaymentMethod | null;
  referenceId: string | null;
  createdAt: string;
  note: string;
}

export interface CashSession {
  id: string;
  number: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  openingBalancePyg: number;
  status: "open" | "closed";
  movements: CashMovement[];
  countedCashPyg: number | null;
  closedAt: string | null;
  differencePyg: number | null;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  note: string;
}

export interface DemoOrder {
  id: string;
  number: string;
  source: OrderSource;
  sourceQuoteId: string | null;
  customerId: string | null;
  customerLabel: string;
  lines: SaleLine[];
  totalPyg: number;
  fulfillmentMode: FulfillmentMode;
  status: OrderStatus;
  createdAt: string;
  responsible: string;
  deliveryNote: string;
  cancellationReason: string | null;
  history: OrderHistoryEntry[];
  isFictitious: true;
}

export interface Quote {
  id: string;
  number: string;
  customerId: string | null;
  customerLabel: string;
  lines: SaleLine[];
  subtotalPyg: number;
  authorizedDiscountPyg: number;
  discountAuthorizedBy: string | null;
  totalPyg: number;
  createdAt: string;
  validUntil: string;
  status: QuoteStatus;
  note: string;
  linkedOrderId: string | null;
  history: Array<{ status: QuoteStatus; changedAt: string; changedBy: string }>;
  isFictitious: true;
}

export interface DemoActivity {
  id: string;
  kind: "sale" | "cash" | "order" | "quote";
  title: string;
  detail: string;
  createdAt: string;
}

export interface DemoCounters {
  cash: number;
  sale: number;
  order: number;
  quote: number;
  movement: number;
}

export interface DemoState {
  schemaVersion: 1;
  environment: "demo";
  updatedAt: string;
  customers: DemoCustomer[];
  operators: DemoOperator[];
  sales: Sale[];
  cashSessions: CashSession[];
  orders: DemoOrder[];
  quotes: Quote[];
  activities: DemoActivity[];
  processedOperationIds: string[];
  counters: DemoCounters;
}
