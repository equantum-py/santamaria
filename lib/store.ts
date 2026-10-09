import catalog from "@/content/catalog.json";
import deliveryData from "@/content/delivery-zones.json";

export type CatalogProduct = (typeof catalog.products)[number];
export type ProductCategory = (typeof catalog.categories)[number];
export type DeliveryZone = (typeof deliveryData.zones)[number];
export type PickupInfo = typeof deliveryData.pickup;
export type FulfillmentType = "delivery" | "pickup";
export type OrderStatus =
  | "recibido"
  | "en_preparacion"
  | "en_camino"
  | "listo_para_retirar"
  | "entregado"
  | "cancelado";

export type DemoOrder = {
  order_number: string;
  created_at: string;
  items: Array<{
    product_id: string;
    sku: string;
    name: string;
    presentation: string;
    price_pyg: number;
    quantity: number;
    is_bulky: boolean;
  }>;
  subtotal_pyg: number;
  fulfillment:
    | {
        type: "delivery";
        zone_id: string;
        zone_name: string;
        address: string;
        neighborhood: string;
        landmark: string;
        receiver_name: string;
        receiver_phone: string;
        eta: string;
      }
    | {
        type: "pickup";
        address: string;
        date: string;
        slot_id: string;
        slot_label: string;
        eta: string;
      };
  delivery_fee_pyg: number;
  total_pyg: number;
  customer: {
    name: string;
    phone: string;
    email: string;
    wants_invoice: boolean;
    ruc: string;
    business_name: string;
    whatsapp_updates: boolean;
  };
  payment: { method: "tarjeta" | "transferencia" | "efectivo"; status: "simulado_aprobado" };
  status: OrderStatus;
  status_history: Array<{ status: OrderStatus; at: string }>;
};

export const products = catalog.products as CatalogProduct[];
export const categories = [...catalog.categories].sort((a, b) => a.order - b.order) as ProductCategory[];
export const zones = deliveryData.zones as DeliveryZone[];
export const pickup = deliveryData.pickup;
export const fictitiousNotice = catalog._meta.notice;
export const availabilityLabels = catalog._meta.availability_values;

export function money(amount: number): string {
  return `Gs. ${new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function productMatchesSearch(product: CatalogProduct, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = normalizeText([
    product.name,
    product.brand,
    product.subcategory,
    product.category,
    ...product.search_terms,
  ].join(" "));
  return words.every((word) => haystack.includes(word));
}

export function calculateDelivery(subtotal: number, hasBulky: boolean, zoneId: string) {
  const zone = zones.find((candidate) => candidate.id === zoneId);
  if (!zone || !zone.available) return { available: false, fee: 0, eta: "", isFree: false };
  if (hasBulky) return { available: true, fee: zone.bulky_fee_pyg ?? 0, eta: zone.bulky_eta ?? "", isFree: false };
  if (subtotal >= (zone.free_delivery_from_pyg ?? Number.POSITIVE_INFINITY)) {
    return { available: true, fee: 0, eta: zone.standard_eta ?? "", isFree: true };
  }
  return { available: true, fee: zone.standard_fee_pyg ?? 0, eta: zone.standard_eta ?? "", isFree: false };
}

export function nextOrderNumber(orders: DemoOrder[]): string {
  const max = orders.reduce((highest, order) => {
    const numeric = Number(order.order_number.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);
  return `SM-${String(max + 1).padStart(5, "0")}`;
}

export function formatDateTime(value: string): { date: string; time: string } {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("es-PY", { timeZone: "America/Asuncion", day: "2-digit", month: "2-digit", year: "numeric" }).format(date),
    time: new Intl.DateTimeFormat("es-PY", { timeZone: "America/Asuncion", hour: "2-digit", minute: "2-digit" }).format(date),
  };
}
