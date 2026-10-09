"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  availabilityLabels,
  calculateDelivery,
  categories,
  type CatalogProduct,
  type DemoOrder,
  formatDateTime,
  money,
  nextOrderNumber,
  pickup,
  productMatchesSearch,
  products,
  type OrderStatus,
  zones,
} from "@/lib/store";

type Screen = "store" | "cart" | "fulfillment" | "customer" | "payment" | "confirmation" | "tracking";
type SortOrder = "relevance" | "price_asc" | "price_desc" | "name_asc";
type CartState = Record<string, number>;

const CART_KEY = "santamaria-demo-cart";
const ORDERS_KEY = "santamaria-demo-orders";
const icons: Record<string, string> = {
  ferreteria: "🛠️",
  sanitarios: "🚿",
  construccion: "🧱",
  electricos: "💡",
};

const statusLabels: Record<OrderStatus, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  en_camino: "En camino",
  listo_para_retirar: "Listo para retirar",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function ProductVisual({ product, large = false }: { product: CatalogProduct; large?: boolean }) {
  return (
    <div className={large ? "product-visual product-visual-large" : "product-visual"} aria-label={"Imagen de muestra: " + product.name}>
      <span aria-hidden="true">{icons[product.category_id] || "📦"}</span>
      <small>Imagen de demostración</small>
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd }: {
  product: CatalogProduct;
  onOpen: (product: CatalogProduct) => void;
  onAdd: (product: CatalogProduct) => void;
}) {
  return (
    <article className="product-card">
      <button className="product-image-button" onClick={() => onOpen(product)} aria-label={"Ver " + product.name}>
        <ProductVisual product={product} />
        {product.is_bulky && <span className="product-tag">Voluminoso</span>}
      </button>
      <div className="product-info">
        <span className="product-category">{product.subcategory}</span>
        <button className="product-name" onClick={() => onOpen(product)}>{product.name}</button>
        <span className="product-unit">{product.presentation} · {availabilityLabels[product.availability]}</span>
        <div className="product-bottom">
          <div>
            <small>{product.availability === "consultar" ? "Consultar disponibilidad" : "Precio de demostración"}</small>
            <strong>{money(product.price_pyg)}</strong>
          </div>
          <button className="add-button" onClick={() => onAdd(product)} aria-label={"Agregar " + product.name + " al carrito"}>+</button>
        </div>
      </div>
    </article>
  );
}

function DemoBanner() {
  return <div className="demo-notice"><span className="demo-dot" /> Esta es una demostración. Precios, disponibilidad, entregas y pagos son ficticios: no se cobra ni se envía nada.</div>;
}

function Header({ itemCount, query, setQuery, setScreen, goHome, selectCategory }: {
  itemCount: number;
  query: string;
  setQuery: (value: string) => void;
  setScreen: (screen: Screen) => void;
  goHome: () => void;
  selectCategory: (id: string) => void;
}) {
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) setScreen("store");
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="site-header">
      <div className="header-main">
        <button className="brand" onClick={goHome} aria-label="Materiales Santa María, inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-copy"><strong>SANTA MARÍA</strong><small>MATERIALES DE CONSTRUCCIÓN</small></span>
          <span className="demo-badge">Demo</span>
        </button>
        <form className="search-box" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué necesitás para tu obra? Ej.: cemento, caño, cable" aria-label="Buscar productos" />
          <button type="submit">Buscar</button>
        </form>
        <div className="header-actions">
          <button className="text-action" onClick={() => setScreen("tracking")}>Mi pedido</button>
          <button className="cart-button" onClick={() => setScreen("cart")} aria-label={itemCount + " en el carrito"}>
            <span aria-hidden="true">▱</span><span>Carrito</span><b>{itemCount}</b>
          </button>
        </div>
      </div>
      <nav className="category-nav" aria-label="Categorías principales">
        <div className="nav-inner">
          <button onClick={goHome}>Todo para tu obra</button>
          {categories.map((category) => <button key={category.id} onClick={() => { setQuery(""); selectCategory(category.id); }}>{category.name}</button>)}
          <button onClick={() => { setQuery(""); selectCategory("sanitarios"); window.setTimeout(() => document.getElementById("subcategory-plomeria")?.click(), 100); }}>Plomería</button>
        </div>
      </nav>
    </header>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("store");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("relevance");
  const [cart, setCart] = useState<CartState>({});
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [activeOrderNumber, setActiveOrderNumber] = useState("");
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<DemoOrder | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ brand: "", availability: "", minimum: "", maximum: "", smallOnly: false });
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [zoneId, setZoneId] = useState("limpio");
  const [address, setAddress] = useState({ street: "", number: "", neighborhood: "", landmark: "", receiverName: "", receiverPhone: "", mapLink: "" });
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", wantsInvoice: false, ruc: "", businessName: "", whatsappUpdates: false });
  const [paymentMethod, setPaymentMethod] = useState<"tarjeta" | "transferencia" | "efectivo">("transferencia");
  const [fieldError, setFieldError] = useState("");
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(CART_KEY);
      const storedOrders = window.localStorage.getItem(ORDERS_KEY);
      if (storedCart) setCart(JSON.parse(storedCart) as CartState);
      if (storedOrders) setOrders(JSON.parse(storedOrders) as DemoOrder[]);
    } catch {
      setToast("No pudimos recuperar los datos guardados en este navegador.");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* El carrito sigue activo durante esta sesión. */ }
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const cartProducts = useMemo(() => products.filter((product) => (cart[product.id] ?? 0) > 0), [cart]);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price_pyg * cart[product.id], 0);
  const hasBulky = cartProducts.some((product) => product.is_bulky);
  const selectedZone = zones.find((zone) => zone.id === zoneId && zone.available);
  const deliveryCalculation = selectedZone ? calculateDelivery(subtotal, hasBulky, zoneId) : { available: false, fee: 0, eta: "", isFree: false };
  const fulfillmentFee = fulfillmentType === "pickup" ? pickup.fee_pyg : deliveryCalculation.fee;
  const orderTotal = subtotal + fulfillmentFee;

  const filteredProducts = useMemo(() => {
    const minimum = filters.minimum ? Number(filters.minimum) : 0;
    const maximum = filters.maximum ? Number(filters.maximum) : Number.POSITIVE_INFINITY;
    let list = products.filter((product) => {
      const correctCategory = !categoryId || product.category_id === categoryId;
      const correctSubcategory = !subcategoryId || product.subcategory_id === subcategoryId;
      const correctSearch = productMatchesSearch(product, query);
      const correctBrand = !filters.brand || product.brand === filters.brand;
      const correctAvailability = !filters.availability || product.availability === filters.availability;
      const correctSize = !filters.smallOnly || !product.is_bulky;
      const correctPrice = product.price_pyg >= minimum && product.price_pyg <= maximum;
      return correctCategory && correctSubcategory && correctSearch && correctBrand && correctAvailability && correctSize && correctPrice;
    });
    if (sortOrder === "price_asc") list = [...list].sort((a, b) => a.price_pyg - b.price_pyg);
    if (sortOrder === "price_desc") list = [...list].sort((a, b) => b.price_pyg - a.price_pyg);
    if (sortOrder === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [categoryId, subcategoryId, query, sortOrder, filters]);

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const brands = [...new Set(products.filter((product) => !categoryId || product.category_id === categoryId).map((product) => product.brand))].sort();
  const selectedZoneDetails = zones.find((zone) => zone.id === zoneId);
  const deliveryText = fulfillmentType === "pickup" ? "Retiro en el local" : selectedZoneDetails?.name || "Elegí una zona";
  const estimatedDelivery = fulfillmentType === "pickup" ? pickup.ready_eta : deliveryCalculation.eta;

  function showToast(message: string) {
    setToast(message);
  }

  function changeScreen(next: Screen) {
    setFieldError("");
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setCategoryId("");
    setSubcategoryId("");
    setQuery("");
    setFilters({ brand: "", availability: "", minimum: "", maximum: "", smallOnly: false });
    changeScreen("store");
  }

  function selectCategory(id: string) {
    setCategoryId(id);
    setSubcategoryId("");
    setQuery("");
    changeScreen("store");
    window.setTimeout(() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function addToCart(product: CatalogProduct, quantity = 1) {
    setCart((current) => ({ ...current, [product.id]: Math.min(999, (current[product.id] ?? 0) + quantity) }));
    setSelectedProduct(null);
    setDetailQuantity(1);
    showToast("Agregaste " + quantity + " × " + product.name + " al carrito.");
  }

  function updateQuantity(productId: string, amount: number) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[productId] ?? 0) + amount;
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(999, quantity);
      return next;
    });
  }

  function resetFilters() {
    setFilters({ brand: "", availability: "", minimum: "", maximum: "", smallOnly: false });
    setSubcategoryId("");
  }

  function continueToCustomer() {
    if (fulfillmentType === "delivery") {
      if (!zoneId || !selectedZone) {
        setFieldError("Elegí una zona disponible.");
        return;
      }
      if (!address.street.trim() || !address.number.trim()) {
        setFieldError("Necesitamos la calle y una referencia para llegar a tu obra.");
        return;
      }
    } else if (!pickupDate || !pickupSlot) {
      setFieldError("Elegí el día y el horario de retiro.");
      return;
    }
    changeScreen("customer");
  }

  function continueToPayment() {
    if (!customer.name.trim()) return setFieldError("Escribí tu nombre y apellido.");
    if (!customer.phone.trim()) return setFieldError("Escribí un teléfono para coordinar.");
    const digits = customer.phone.replace(/\D/g, "");
    const paraguayNumber = digits.startsWith("595") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
    if (!/^9\d{8}$/.test(paraguayNumber)) return setFieldError("Revisá el número. Ej.: 0981 123 456");
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return setFieldError("Revisá el correo.");
    if (customer.wantsInvoice && !customer.ruc.trim()) return setFieldError("Escribí el RUC o la cédula para la factura.");
    if (customer.wantsInvoice && !customer.businessName.trim()) return setFieldError("Escribí la razón social.");
    changeScreen("payment");
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processingRef.current || cartProducts.length === 0) return;
    processingRef.current = true;
    setProcessing(true);
    setFieldError("");
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const createdAt = new Date().toISOString();
    const orderNumber = nextOrderNumber(orders);
    const items = cartProducts.map((product) => ({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      presentation: product.presentation,
      price_pyg: product.price_pyg,
      quantity: cart[product.id],
      is_bulky: product.is_bulky,
    }));
    const fulfillment: DemoOrder["fulfillment"] = fulfillmentType === "delivery"
      ? {
          type: "delivery",
          zone_id: zoneId,
          zone_name: selectedZoneDetails?.name || "",
          address: [address.street, address.number, address.neighborhood].filter(Boolean).join(", "),
          neighborhood: address.neighborhood,
          landmark: address.landmark,
          receiver_name: address.receiverName || customer.name,
          receiver_phone: address.receiverPhone || customer.phone,
          map_link: address.mapLink,
          eta: estimatedDelivery,
        }
      : {
          type: "pickup",
          address: pickup.address,
          date: pickupDate,
          slot_id: pickupSlot,
          slot_label: pickup.time_slots.find((slot) => slot.id === pickupSlot)?.label || "",
          eta: pickup.ready_eta,
        };
    const order: DemoOrder = {
      order_number: orderNumber,
      created_at: createdAt,
      items,
      subtotal_pyg: subtotal,
      fulfillment,
      delivery_fee_pyg: fulfillmentFee,
      total_pyg: orderTotal,
      customer,
      payment: { method: paymentMethod, status: "simulado_aprobado" },
      status: "recibido",
      status_history: [{ status: "recibido", at: createdAt }],
    };
    const nextOrders = [...orders, order];
    setOrders(nextOrders);
    setCart({});
    setActiveOrderNumber(orderNumber);
    setTrackingQuery(orderNumber);
    setTrackingOrder(order);
    setScreen("confirmation");
    try {
      window.localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
      window.localStorage.setItem(CART_KEY, JSON.stringify({}));
    } catch {
      showToast("El pedido quedó disponible solo durante esta sesión.");
    }
    processingRef.current = false;
    setProcessing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function searchOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = trackingQuery.replace(/\D/g, "").replace(/^595/, "");
    const found = orders.find((order) => order.order_number.replace(/\D/g, "") === normalized);
    if (found) {
      setTrackingOrder(found);
      setTrackingQuery(found.order_number);
      setFieldError("");
    } else {
      setTrackingOrder(null);
      setFieldError("No encontramos ese pedido. Revisá el número.");
    }
  }

  function advanceDemoStatus() {
    if (!trackingOrder || trackingOrder.status === "cancelado" || trackingOrder.status === "entregado") return;
    const flow: OrderStatus[] = trackingOrder.fulfillment.type === "pickup"
      ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"]
      : ["recibido", "en_preparacion", "en_camino", "entregado"];
    const nextStatus = flow[Math.min(flow.indexOf(trackingOrder.status) + 1, flow.length - 1)];
    const updated = { ...trackingOrder, status: nextStatus, status_history: [...trackingOrder.status_history, { status: nextStatus, at: new Date().toISOString() }] };
    const nextOrders = orders.map((order) => order.order_number === updated.order_number ? updated : order);
    setOrders(nextOrders);
    setTrackingOrder(updated);
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
  }

  function cancelDemoOrder() {
    if (!trackingOrder || trackingOrder.status === "entregado" || trackingOrder.status === "cancelado") return;
    const updated = { ...trackingOrder, status: "cancelado" as const, status_history: [...trackingOrder.status_history, { status: "cancelado" as const, at: new Date().toISOString() }] };
    const nextOrders = orders.map((order) => order.order_number === updated.order_number ? updated : order);
    setOrders(nextOrders);
    setTrackingOrder(updated);
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
  }

  function pickupDateLimits() {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date();
    end.setDate(end.getDate() + pickup.days_ahead);
    const toLocalDate = (date: Date) => {
      const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return adjusted.toISOString().slice(0, 10);
    };
    return { min: toLocalDate(start), max: toLocalDate(end) };
  }

  function invalidPickupDay(value: string) {
    return pickup.closed_weekdays.includes(new Date(value + "T12:00:00").getDay());
  }

  const featuredProducts = categories.flatMap((category) => products.filter((product) => product.category_id === category.id && product.availability === "disponible").slice(0, 2));
  const relatedProducts = selectedProduct
    ? [
        ...products.filter((product) => product.id !== selectedProduct.id && product.subcategory_id === selectedProduct.subcategory_id),
        ...products.filter((product) => product.id !== selectedProduct.id && product.category_id === selectedProduct.category_id && product.subcategory_id !== selectedProduct.subcategory_id),
      ].slice(0, 4)
    : [];
  const storefrontProducts = !categoryId && !query.trim() ? featuredProducts : filteredProducts;

  return (
    <main className="app-shell">
      <Header itemCount={itemCount} query={query} setQuery={setQuery} setScreen={changeScreen} goHome={goHome} selectCategory={selectCategory} />

      {screen === "store" && (
        <>
          <section className="hero wrap">
            <div className="hero-copy">
              <p className="eyebrow"><span /> TODO PARA TU OBRA · LÍMPIO, PARAGUAY</p>
              <h1>Lo que tu obra necesita, <em>sin vueltas.</em></h1>
              <p className="hero-text">Ferretería, sanitarios, materiales de construcción y eléctricos en un solo lugar.</p>
              <button className="button button-yellow" onClick={() => selectCategory("construccion")}>Ver materiales de construcción <span>→</span></button>
              <div className="hero-note"><span>✓</span> Elegí los productos y armá tu pedido en línea.</div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-grid" /><div className="art-sun" />
              <div className="art-card art-card-one"><span>🧱</span><small>OBRA GRUESA</small></div>
              <div className="art-card art-card-two"><span>🚿</span><small>SANITARIOS</small></div>
              <div className="art-card art-card-three"><span>⚡</span><small>ELÉCTRICOS</small></div>
            </div>
          </section>

          <section className="category-section wrap">
            <div className="section-heading"><div><p className="eyebrow">ENCONTRÁ LO QUE BUSCÁS</p><h2>Comprá por categoría</h2></div><span className="subtle">4 categorías para tu obra</span></div>
            <div className="category-grid">
              {categories.map((category, index) => (
                <button className={"category-card tone-" + index} id={"category-" + category.id} key={category.id} onClick={() => selectCategory(category.id)}>
                  <span className="category-number">0{index + 1}</span><span className="category-emoji">{icons[category.id]}</span><strong>{category.name}</strong><span className="category-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          <section className="catalog-section wrap" id="catalogo">
            <div className="section-heading catalog-heading">
              <div><p className="eyebrow">{query ? "RESULTADOS DE BÚSQUEDA" : selectedCategory ? selectedCategory.name : "SELECCIÓN PARA TU OBRA"}</p><h2>{query ? "Resultados para “" + query + "”" : selectedCategory?.name || "Lo más pedido"}</h2></div>
              {(selectedCategory || query) && <button className="clear-filter" onClick={goHome}>Ver todo ×</button>}
            </div>
            {selectedCategory && (
              <div className="subcategory-row" aria-label="Subcategorías">
                <button className={!subcategoryId ? "chip active" : "chip"} onClick={() => setSubcategoryId("")}>Todas</button>
                {selectedCategory.subcategories.map((subcategory) => <button id={"subcategory-" + subcategory.id} key={subcategory.id} className={subcategoryId === subcategory.id ? "chip active" : "chip"} onClick={() => setSubcategoryId(subcategory.id)}>{subcategory.name}</button>)}
              </div>
            )}
            <div className="catalog-tools">
              <span>{storefrontProducts.length} productos{query ? " encontrados" : ""}</span>
              <button className="filter-toggle" onClick={() => setFiltersOpen(true)}>☷ Filtrar</button>
              <label className="sort-control">Ordenar por
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
                  <option value="relevance">Más relevantes</option><option value="price_asc">Menor precio</option><option value="price_desc">Mayor precio</option><option value="name_asc">Nombre (A–Z)</option>
                </select>
              </label>
            </div>
            <div className="catalog-layout">
              <aside className="filter-panel">
                <div className="filter-title"><strong>Filtros</strong><button onClick={resetFilters}>Limpiar</button></div>
                <label>Subcategoría<select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Todas</option>{(selectedCategory?.subcategories || categories.flatMap((category) => category.subcategories)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label>Marca<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Todas</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label>
                <fieldset><legend>Precio</legend><div className="price-fields"><input inputMode="numeric" aria-label="Precio mínimo" placeholder="Desde Gs." value={filters.minimum} onChange={(event) => setFilters({ ...filters, minimum: event.target.value.replace(/\D/g, "") })} /><input inputMode="numeric" aria-label="Precio máximo" placeholder="Hasta Gs." value={filters.maximum} onChange={(event) => setFilters({ ...filters, maximum: event.target.value.replace(/\D/g, "") })} /></div></fieldset>
                <label>Disponibilidad<select value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })}><option value="">Todas</option><option value="disponible">Disponible</option><option value="pocas_unidades">Pocas unidades</option><option value="consultar">Consultar disponibilidad</option></select></label>
                <label className="checkbox-line"><input type="checkbox" checked={filters.smallOnly} onChange={(event) => setFilters({ ...filters, smallOnly: event.target.checked })} /> Solo productos chicos</label>
                <button className="button button-brand filter-apply" onClick={() => setFiltersOpen(false)}>Ver resultados</button>
              </aside>
              {storefrontProducts.length ? <div className="product-grid">{storefrontProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={(item) => { setSelectedProduct(item); setDetailQuantity(1); }} onAdd={addToCart} />)}</div> : (
                <div className="empty-results"><span>⌕</span><h3>{query ? "No encontramos “" + query + "”" : "No hay productos con estos filtros."}</h3><p>{query ? "Revisá cómo lo escribiste o buscá por categoría. Si no está en la web, preguntanos: capaz lo tenemos en el local." : "Probá quitando alguno."}</p><div className="empty-categories">{categories.map((category) => <button key={category.id} onClick={() => selectCategory(category.id)}>{category.name}</button>)}</div></div>
              )}
            </div>
            {!query && !categoryId && (
              <div className="benefit-grid">
                <div className="benefit-card"><span>🚚</span><div><strong>Te lo llevamos a la obra</strong><p>Elegí tu zona y recibí en tu obra (servicio de demostración).</p></div></div>
                <div className="benefit-card"><span>⌂</span><div><strong>O retiralo en el local</strong><p>Pedí por la web y pasá a buscar en Limpio (servicio de demostración).</p></div></div>
                <div className="benefit-card"><span>◎</span><div><strong>Te asesoramos</strong><p>¿No sabés qué llevar? Consultanos y te ayudamos a elegir.</p></div></div>
              </div>
            )}
          </section>
        </>
      )}

      {screen === "cart" && (
        <section className="flow-page wrap">
          <Breadcrumbs items={["Inicio", "Tu carrito"]} goHome={goHome} />
          <div className="flow-title"><div><p className="eyebrow">REVISÁ TU PEDIDO</p><h1>Tu carrito</h1></div><span className="step-pill">Paso 1 de 4</span></div>
          {cartProducts.length === 0 ? <div className="empty-cart"><span>▱</span><h2>Tu carrito está vacío</h2><p>Buscá lo que necesitás para tu obra y agregalo acá.</p><button className="button button-brand" onClick={goHome}>Ir al inicio</button></div> : (
            <div className="checkout-layout">
              <div className="cart-lines">
                {cartProducts.map((product) => <div className="cart-line" key={product.id}>
                  <div className="cart-thumb">{icons[product.category_id]}</div>
                  <div className="cart-product"><span>{product.subcategory}{product.is_bulky ? " · Voluminoso" : ""}</span><strong>{product.name}</strong><small>{product.presentation} · {money(product.price_pyg)} c/u</small></div>
                  <QuantityControl value={cart[product.id]} onChange={(change) => updateQuantity(product.id, change)} />
                  <div className="line-total">{money(product.price_pyg * cart[product.id])}<button onClick={() => setCart((current) => { const next = { ...current }; delete next[product.id]; return next; })}>Quitar</button></div>
                </div>)}
                {hasBulky && <div className="notice-box">Tu carrito tiene productos voluminosos. La entrega se hace en camión y puede tardar un poco más (plazos de demostración).</div>}
                <button className="back-link" onClick={goHome}>← Seguir comprando</button>
              </div>
              <OrderSummary subtotal={subtotal} deliveryFee={null} total={null} itemCount={itemCount} onContinue={() => changeScreen("fulfillment")} continueLabel="Continuar con la compra" />
            </div>
          )}
        </section>
      )}

      {screen === "fulfillment" && (
        <section className="flow-page wrap">
          <Breadcrumbs items={["Inicio", "Carrito", "Entrega o retiro"]} goHome={goHome} />
          <div className="flow-title"><div><p className="eyebrow">PASO 2 DE 4</p><h1>¿Cómo querés recibir tu pedido?</h1></div><span className="step-pill">Entrega</span></div>
          <div className="checkout-layout">
            <div className="form-column">
              <div className="form-card">
                <div className="choice-grid">
                  <button className={fulfillmentType === "delivery" ? "choice selected" : "choice"} onClick={() => { setFulfillmentType("delivery"); setFieldError(""); }}><span>🚚</span><b>Entrega en obra</b><small>Te lo llevamos a la dirección que nos indiques.</small></button>
                  <button className={fulfillmentType === "pickup" ? "choice selected" : "choice"} onClick={() => { setFulfillmentType("pickup"); setFieldError(""); }}><span>⌂</span><b>Retiro en el local</b><small>Pasás a buscar tu pedido en Santa María, Limpio. Sin costo.</small></button>
                </div>
                {fulfillmentType === "delivery" ? (
                  <div className="form-stack">
                    <label className="form-field">Zona o ciudad<select value={zoneId} onChange={(event) => setZoneId(event.target.value)}><option value="">Elegí tu zona</option>{zones.map((zone) => <option key={zone.id} value={zone.id} disabled={!zone.available}>{zone.name}{zone.available ? "" : " · " + zone.unavailable_message}</option>)}</select></label>
                    <div className="form-grid"><label className="form-field">Calle<input required value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} placeholder="Nombre de la calle" /></label><label className="form-field">Número o referencia<input required value={address.number} onChange={(event) => setAddress({ ...address, number: event.target.value })} placeholder="N.º de casa o entre calles" /></label></div>
                    <div className="form-grid"><label className="form-field">Barrio<input value={address.neighborhood} onChange={(event) => setAddress({ ...address, neighborhood: event.target.value })} placeholder="Tu barrio" /></label><label className="form-field">Punto de referencia<input value={address.landmark} onChange={(event) => setAddress({ ...address, landmark: event.target.value })} placeholder="Ej.: portón verde, frente a la escuela" /></label></div>
                    <label className="form-field">Ubicación (opcional)<input type="url" value={address.mapLink} onChange={(event) => setAddress({ ...address, mapLink: event.target.value })} placeholder="Pegá el enlace del mapa" /></label>
                    <div className="form-grid"><label className="form-field">Nombre de quien recibe (opcional)<input value={address.receiverName} onChange={(event) => setAddress({ ...address, receiverName: event.target.value })} placeholder={customer.name || "Si recibe otra persona"} /></label><label className="form-field">Teléfono de quien recibe (opcional)<input value={address.receiverPhone} onChange={(event) => setAddress({ ...address, receiverPhone: event.target.value })} placeholder={customer.phone || "Teléfono"} /></label></div>
                    {selectedZoneDetails && selectedZoneDetails.available && <div className="delivery-estimate"><div><span>{deliveryCalculation.isFree ? "¡Entrega sin costo!" : "Costo de entrega"}</span><strong>{money(deliveryCalculation.fee)}</strong></div><div><span>Plazo estimado</span><strong>{deliveryCalculation.eta}</strong></div><small>Costo y plazo de demostración (ficticios).</small></div>}
                  </div>
                ) : (
                  <div className="form-stack">
                    <div className="pickup-address"><b>Dirección del local</b><span>{pickup.address}</span><small>Dirección pendiente de confirmar · Limpio, Paraguay</small></div>
                    <div className="form-grid"><label className="form-field">Día de retiro<input type="date" min={pickupDateLimits().min} max={pickupDateLimits().max} value={pickupDate} onChange={(event) => { if (invalidPickupDay(event.target.value)) { setPickupDate(""); setFieldError("Los domingos el local permanece cerrado en esta demostración."); } else { setPickupDate(event.target.value); setFieldError(""); } }} /></label><label className="form-field">Horario<select value={pickupSlot} onChange={(event) => setPickupSlot(event.target.value)}><option value="">Elegí un horario</option>{pickup.time_slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}</select></label></div>
                    <p className="form-note">Te avisamos cuando esté listo. Horarios ficticios de demostración.</p>
                  </div>
                )}
                {fieldError && <p className="field-error" role="alert">{fieldError}</p>}
              </div>
              <div className="form-actions"><button className="button button-outline" onClick={() => changeScreen("cart")}>← Volver al carrito</button><button className="button button-yellow" onClick={continueToCustomer}>Continuar <span>→</span></button></div>
            </div>
            <OrderSummary subtotal={subtotal} deliveryFee={fulfillmentFee} total={orderTotal} itemCount={itemCount} deliveryLabel={deliveryText} />
          </div>
        </section>
      )}

      {screen === "customer" && (
        <section className="flow-page wrap">
          <Breadcrumbs items={["Inicio", "Entrega", "Tus datos"]} goHome={goHome} />
          <div className="flow-title"><div><p className="eyebrow">PASO 3 DE 4</p><h1>Tus datos</h1><p>Los usamos solo para identificar este pedido de demostración.</p></div><span className="step-pill">Cliente</span></div>
          <div className="checkout-layout">
            <div className="form-column">
              <div className="form-card form-stack">
                <div className="form-grid"><label className="form-field">Nombre y apellido<input autoComplete="name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Cómo te llamás" /></label><label className="form-field">Teléfono o WhatsApp<input autoComplete="tel" inputMode="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="0981 123 456" /></label></div>
                <label className="form-field">Correo electrónico (opcional)<input type="email" autoComplete="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="tu@correo.com" /></label>
                <label className="checkbox-line"><input type="checkbox" checked={customer.wantsInvoice} onChange={(event) => setCustomer({ ...customer, wantsInvoice: event.target.checked })} /> Necesito factura con RUC</label>
                {customer.wantsInvoice && <div className="form-grid"><label className="form-field">RUC o cédula<input value={customer.ruc} onChange={(event) => setCustomer({ ...customer, ruc: event.target.value })} /></label><label className="form-field">Razón social<input value={customer.businessName} onChange={(event) => setCustomer({ ...customer, businessName: event.target.value })} /></label></div>}
                <label className="checkbox-line"><input type="checkbox" checked={customer.whatsappUpdates} onChange={(event) => setCustomer({ ...customer, whatsappUpdates: event.target.checked })} /> Quiero recibir novedades del pedido por WhatsApp (en la demo no se envían mensajes).</label>
                {fieldError && <p className="field-error" role="alert">{fieldError}</p>}
              </div>
              <div className="form-actions"><button className="button button-outline" onClick={() => changeScreen("fulfillment")}>← Volver</button><button className="button button-yellow" onClick={continueToPayment}>Ir al pago <span>→</span></button></div>
            </div>
            <OrderSummary subtotal={subtotal} deliveryFee={fulfillmentFee} total={orderTotal} itemCount={itemCount} deliveryLabel={deliveryText} />
          </div>
        </section>
      )}

      {screen === "payment" && (
        <section className="flow-page wrap">
          <Breadcrumbs items={["Inicio", "Entrega", "Tus datos", "Pago"]} goHome={goHome} />
          <div className="flow-title"><div><p className="eyebrow">PASO 4 DE 4</p><h1>Confirmá tu compra</h1></div><span className="step-pill">Pago de demo</span></div>
          <div className="checkout-layout">
            <form className="form-column" onSubmit={placeOrder}>
              <div className="demo-warning payment-banner"><b>Pago simulado: es una demostración y no se cobra nada.</b></div>
              <div className="form-card">
                <h2>Medio de pago</h2>
                <div className="payment-options">
                  <label><input type="radio" name="payment" checked={paymentMethod === "transferencia"} onChange={() => setPaymentMethod("transferencia")} /><span>Transferencia bancaria (simulado)</span></label>
                  <label><input type="radio" name="payment" checked={paymentMethod === "tarjeta"} onChange={() => setPaymentMethod("tarjeta")} /><span>Tarjeta de crédito o débito (simulado)</span></label>
                  <label><input type="radio" name="payment" checked={paymentMethod === "efectivo"} onChange={() => setPaymentMethod("efectivo")} /><span>Efectivo al recibir o al retirar (simulado)</span></label>
                </div>
                {paymentMethod === "tarjeta" && <p className="notice-box">En la demo no se cargan datos de tarjeta.</p>}
              </div>
              <div className="form-card review-card"><h2>Resumen de tu pedido</h2>{cartProducts.map((product) => <p key={product.id}>{cart[product.id]} × {product.name} · {money(product.price_pyg * cart[product.id])}</p>)}<p><b>Entrega:</b> {deliveryText}</p><p><b>Cliente:</b> {customer.name} · {customer.phone}</p><p><b>Pago:</b> {paymentMethod}</p><p><b>Total:</b> {money(orderTotal)}</p><button type="button" className="back-link" onClick={() => changeScreen("customer")}>Cambiar datos</button></div>
              {fieldError && <p className="field-error" role="alert">{fieldError}</p>}
              <div className="form-actions"><button className="button button-outline" type="button" onClick={() => changeScreen("customer")}>← Volver</button><button className="button button-yellow" type="submit" disabled={processing || !cartProducts.length}>{processing ? "Procesando tu pedido…" : "Confirmar pedido"}</button></div>
            </form>
            <OrderSummary subtotal={subtotal} deliveryFee={fulfillmentFee} total={orderTotal} itemCount={itemCount} deliveryLabel={deliveryText} />
          </div>
        </section>
      )}

      {screen === "confirmation" && (
        <section className="flow-page wrap confirmation-page">
          <div className="success-mark">✓</div><p className="eyebrow">PEDIDO DE DEMOSTRACIÓN</p><h1>¡Gracias! Recibimos tu pedido</h1>
          <p>Recordá: es una demostración, no se cobró nada.</p>
          <div className="order-code"><span>NÚMERO DE PEDIDO</span><strong>{activeOrderNumber}</strong><button onClick={async () => { await navigator.clipboard?.writeText(activeOrderNumber); showToast("Número de pedido copiado."); }}>Copiar número</button></div>
          {orders.find((order) => order.order_number === activeOrderNumber) && <div className="confirmation-summary"><span>Total</span><strong>{money(orders.find((order) => order.order_number === activeOrderNumber)?.total_pyg || 0)}</strong><span>{deliveryText}</span></div>}
          <div className="notice-box">{fulfillmentType === "pickup" ? "Vamos a preparar tu pedido y te avisamos cuando esté listo para retirar." : "Vamos a preparar tu pedido y te avisamos cuando salga para tu obra."}</div>
          <div className="hero-actions"><button className="button button-yellow" onClick={() => { setTrackingQuery(activeOrderNumber); const order = orders.find((item) => item.order_number === activeOrderNumber) || null; setTrackingOrder(order); changeScreen("tracking"); }}>Seguir mi pedido →</button><button className="button button-outline" onClick={goHome}>Volver al inicio</button></div>
        </section>
      )}

      {screen === "tracking" && (
        <section className="flow-page wrap tracking-page">
          <Breadcrumbs items={["Inicio", "Mi pedido"]} goHome={goHome} />
          <div className="tracking-card"><p className="eyebrow">SEGUIMIENTO DE DEMOSTRACIÓN</p><h1>Seguí tu pedido</h1>
            <form className="tracking-search" onSubmit={searchOrder}><label>Número de pedido<input value={trackingQuery} onChange={(event) => setTrackingQuery(event.target.value)} placeholder="Ej.: SM-00001" /></label><button className="button button-yellow">Buscar pedido</button></form>
            {fieldError && <p className="field-error" role="alert">{fieldError}</p>}
            {trackingOrder && <div className="tracking-result">
              <div className="tracking-order"><span>Pedido</span><b>{trackingOrder.order_number}</b><small>{statusLabels[trackingOrder.status]}</small></div>
              {trackingOrder.status === "cancelado" ? <div className="notice-box">Este pedido fue cancelado. Si tenés dudas, escribinos.</div> : (
                <ol className="timeline">{(trackingOrder.fulfillment.type === "pickup" ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"] : ["recibido", "en_preparacion", "en_camino", "entregado"]).map((status) => {
                  const historyEntry = trackingOrder.status_history.find((entry) => entry.status === status);
                  const currentIndex = (trackingOrder.fulfillment.type === "pickup" ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"] : ["recibido", "en_preparacion", "en_camino", "entregado"]).indexOf(trackingOrder.status);
                  const stepIndex = (trackingOrder.fulfillment.type === "pickup" ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"] : ["recibido", "en_preparacion", "en_camino", "entregado"]).indexOf(status);
                  const date = historyEntry ? formatDateTime(historyEntry.at) : null;
                  return <li className={stepIndex <= currentIndex ? "done" : ""} key={status}><i>{stepIndex <= currentIndex ? "✓" : stepIndex + 1}</i><div><b>{statusLabels[status as OrderStatus]}</b><small>{historyEntry && date ? "Actualizado el " + date.date + " a las " + date.time : "Pendiente"}</small></div></li>;
                })}</ol>
              )}
              <div className="tracking-order-summary"><h3>Resumen del pedido</h3>{trackingOrder.items.map((item) => <p key={item.product_id}>{item.quantity} × {item.name} <span>{money(item.price_pyg * item.quantity)}</span></p>)}<p><b>Total</b><b>{money(trackingOrder.total_pyg)}</b></p><small>{trackingOrder.fulfillment.type === "pickup" ? "Retiro en local: " + trackingOrder.fulfillment.date + " · " + trackingOrder.fulfillment.slot_label : "Entrega en " + trackingOrder.fulfillment.zone_name + " · " + trackingOrder.fulfillment.address}</small></div>
              {trackingOrder.status !== "entregado" && trackingOrder.status !== "cancelado" && <div className="tracking-demo-controls"><button className="button button-outline advance-status" onClick={advanceDemoStatus}>Avanzar estado de demostración</button><button className="text-link" onClick={cancelDemoOrder}>Cancelar pedido de demostración</button></div>}
            </div>}
            <p className="form-note">El estado lo actualiza el equipo de Santa María desde su panel. En esta demo, es simulado.</p>
          </div>
        </section>
      )}

      <footer className="site-footer"><div className="wrap footer-main"><div className="brand footer-brand"><span className="brand-mark"><i /><i /><i /></span><span className="brand-copy"><strong>SANTA MARÍA</strong><small>MATERIALES DE CONSTRUCCIÓN</small></span></div><p>Todo para tu obra, en Limpio.</p><div className="footer-meta"><span>Dirección y horarios pendientes de confirmar</span><span>WhatsApp pendiente de confirmar</span></div></div><div className="footer-bottom">© 2026 Materiales Santa María. Demo de presentación.</div></footer>
      <DemoBanner />

      {filtersOpen && <div className="filter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><div className="mobile-filter-sheet"><div className="drawer-head"><h2>Filtros</h2><button className="icon-button" onClick={() => setFiltersOpen(false)}>×</button></div><label>Subcategoría<select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Todas</option>{(selectedCategory?.subcategories || categories.flatMap((category) => category.subcategories)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Marca<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Todas</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label><fieldset><legend>Precio</legend><div className="price-fields"><input inputMode="numeric" aria-label="Precio mínimo" placeholder="Desde Gs." value={filters.minimum} onChange={(event) => setFilters({ ...filters, minimum: event.target.value.replace(/\D/g, "") })} /><input inputMode="numeric" aria-label="Precio máximo" placeholder="Hasta Gs." value={filters.maximum} onChange={(event) => setFilters({ ...filters, maximum: event.target.value.replace(/\D/g, "") })} /></div></fieldset><label>Disponibilidad<select value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })}><option value="">Todas</option><option value="disponible">Disponible</option><option value="pocas_unidades">Pocas unidades</option><option value="consultar">Consultar disponibilidad</option></select></label><label className="checkbox-line"><input type="checkbox" checked={filters.smallOnly} onChange={(event) => setFilters({ ...filters, smallOnly: event.target.checked })} /> Solo productos chicos</label><button className="text-link" onClick={resetFilters}>Limpiar filtros</button><button className="button button-brand button-block" onClick={() => setFiltersOpen(false)}>Ver resultados</button></div></div>}

      {selectedProduct && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title"><button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Cerrar">×</button><ProductVisual product={selectedProduct} large /><div className="modal-copy"><p className="eyebrow">{selectedProduct.category} · {selectedProduct.subcategory}</p><h2 id="product-title">{selectedProduct.name}</h2><p><b>Marca:</b> {selectedProduct.brand}</p><p><b>Código:</b> {selectedProduct.sku}</p><p><b>Presentación:</b> {selectedProduct.presentation}</p><p><b>Disponibilidad:</b> {selectedProduct.availability === "disponible" ? "Disponible" : selectedProduct.availability === "pocas_unidades" ? "Pocas unidades" : "Consultar disponibilidad"}</p>{selectedProduct.availability === "consultar" && <div className="notice-box">Te confirmamos la disponibilidad después de recibir tu pedido.</div>}{selectedProduct.is_bulky && <div className="notice-box">Producto voluminoso: se entrega en camión en tu obra o se retira coordinado en el local.</div>}<small className="price-label">PRECIO DE DEMOSTRACIÓN</small><strong className="modal-price">{money(selectedProduct.price_pyg)}</strong><QuantityControl value={detailQuantity} onChange={(change) => setDetailQuantity((current) => Math.max(1, Math.min(999, current + change)))} /><button className="button button-yellow button-block" onClick={() => addToCart(selectedProduct, detailQuantity)}>Agregar al carrito</button><div className="related-products"><b>También te puede servir</b><div>{relatedProducts.map((product) => <button key={product.id} onClick={() => { setSelectedProduct(product); setDetailQuantity(1); }}>{product.name}</button>)}</div></div></div></section></div>}
      {toast && <div className="toast" role="status">{toast}<button onClick={() => changeScreen("cart")}>Ir al carrito</button></div>}
    </main>
  );
}

function QuantityControl({ value, onChange }: { value: number; onChange: (amount: number) => void }) {
  return <div className="quantity-control"><button onClick={() => onChange(-1)} aria-label="Quitar una unidad">−</button><b>{value}</b><button onClick={() => onChange(1)} aria-label="Agregar una unidad">+</button></div>;
}

function Breadcrumbs({ items, goHome }: { items: string[]; goHome: () => void }) {
  return <div className="breadcrumbs"><button onClick={goHome}>Inicio</button>{items.slice(1).map((item, index) => <span key={item}><i>/</i>{index === items.length - 2 ? <b>{item}</b> : <button onClick={goHome}>{item}</button>}</span>)}</div>;
}

function OrderSummary({ subtotal, deliveryFee, total, itemCount, deliveryLabel, onContinue, continueLabel }: {
  subtotal: number;
  deliveryFee: number | null;
  total: number | null;
  itemCount: number;
  deliveryLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  return <aside className="summary-card"><h2>Resumen de tu pedido</h2><div className="summary-row"><span>Productos ({itemCount})</span><b>{money(subtotal)}</b></div>{deliveryFee === null ? <div className="summary-row"><span>Entrega</span><span>Se calcula en el siguiente paso</span></div> : <div className="summary-row"><span>{deliveryLabel || "Entrega"}</span><b>{money(deliveryFee)}</b></div>}{total !== null && <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>}<p className="summary-disclaimer">Valores de demostración. No se efectuará ningún cobro.</p>{onContinue && <button className="button button-yellow button-block" onClick={onContinue} disabled={!itemCount}>{continueLabel}</button>}</aside>;
}
