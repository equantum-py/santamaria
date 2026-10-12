"use client";

import { useMemo, useRef, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoProfiles } from "../demo-data";
import { demoProducts } from "@/lib/admin/catalog";
import { calculateChange, recordSale } from "@/lib/admin/domain";
import { useDemoProfile, useDemoState, demoStateStore } from "@/lib/admin/client-state";

const money = (amount: number) => `Gs. ${amount.toLocaleString("es-PY")}`;
const paymentLabels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", qr: "QR" } as const;
type Payment = keyof typeof paymentLabels;

export default function PointOfSalePage() {
  const state = useDemoState();
  const [profileId] = useDemoProfile();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState("demo-customer-consumidor");
  const [payment, setPayment] = useState<Payment>("cash");
  const [received, setReceived] = useState("");
  const [error, setError] = useState("");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitLock = useRef(false);
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const activeSession = state.cashSessions.find((session) => session.cashierId === profileId && session.status === "open");
  const categories = [...new Set(demoProducts.map((item) => item.categoryName))];
  const products = useMemo(() => {
    const normalized = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return demoProducts.filter((product) => {
      const matchesCategory = category === "all" || product.categoryName === category;
      const content = `${product.name} ${product.sku} ${product.categoryName}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return product.active && matchesCategory && (!normalized || content.includes(normalized));
    });
  }, [query, category]);
  const lines = demoProducts.filter((product) => cart[product.id]).map((product) => ({ product, quantity: cart[product.id] }));
  const total = lines.reduce((sum, line) => sum + line.product.pricePyg * line.quantity, 0);
  const receivedAmount = received === "" ? 0 : Number(received);
  const change = payment === "cash" && receivedAmount >= total ? receivedAmount - total : null;
  const lastSale = state.sales.find((sale) => sale.id === lastSaleId) ?? null;

  function add(productId: string) {
    submitLock.current = false;
    setCart((current) => ({ ...current, [productId]: Math.min(999, (current[productId] ?? 0) + 1) }));
    setError("");
    setLastSaleId(null);
  }

  function setQuantity(productId: string, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (!Number.isSafeInteger(quantity) || quantity < 1) delete next[productId];
      else next[productId] = Math.min(999, quantity);
      return next;
    });
  }

  function confirmSale() {
    if (submitLock.current) return;
    submitLock.current = true;
    let succeeded = false;
    setBusy(true);
    setError("");
    try {
      const operationId = `pos-${crypto.randomUUID()}`;
      demoStateStore.update((current) => recordSale(current, {
        operationId,
        cashierId: profileId,
        customerId,
        items: lines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        paymentMethod: payment,
        ...(payment === "cash" ? { cashReceivedPyg: receivedAmount } : {}),
      }, demoProducts));
      const sale = demoStateStore.getSnapshot().sales.at(-1);
      if (!sale) throw new Error("No se pudo confirmar la venta.");
      setLastSaleId(sale.id);
      succeeded = true;
      setCart({});
      setReceived("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la venta. Revisá la caja y el cobro.");
    } finally {
      setBusy(false);
      if (!succeeded) submitLock.current = false;
    }
  }

  return <AdminModuleFrame title="Punto de venta">
    <section className="admin-module-heading">
      <div><p className="admin-eyebrow">OPERACIÓN COMERCIAL</p><h1>Punto de venta</h1><p>Buscá productos y registrá una venta de demostración.</p></div>
      <div className={`admin-session-pill ${activeSession ? "is-open" : "is-closed"}`}><span />{activeSession ? `Caja abierta · ${activeSession.number}` : "Caja cerrada"}</div>
    </section>
    <section className="admin-demo-notice"><span className="admin-notice-icon">i</span><div><strong>Venta de demostración</strong><span>Los pagos son simulados. No se procesa dinero ni se modifica el inventario.</span></div></section>
    <div className="pos-layout">
      <section className="admin-panel pos-catalog" aria-label="Catálogo para venta">
        <div className="pos-tools">
          <label className="pos-search"><span className="sr-only">Buscar por nombre, SKU o categoría</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por producto, SKU o categoría" /></label>
          <label className="sr-only" htmlFor="pos-category">Filtrar categoría</label>
          <select id="pos-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <p className="pos-result-count">{products.length} productos disponibles</p>
        {products.length ? <div className="pos-product-list">{products.map((product) => <article className="pos-product-row" key={product.id}>
          <div className="pos-product-copy"><strong>{product.name}</strong><span>{product.sku} · {product.categoryName} · {product.saleUnit}</span><b>{money(product.pricePyg)}</b></div>
          <button className="admin-primary-button pos-add" type="button" onClick={() => add(product.id)} aria-label={`Agregar ${product.name}`}>Agregar</button>
        </article>)}</div> : <p className="pos-empty">No encontramos productos para esa búsqueda.</p>}
      </section>

      <aside className="admin-panel pos-checkout" aria-label="Carrito y cobro">
        <div className="pos-cart-heading"><div><p className="admin-panel-kicker">VENTA ACTUAL</p><h2>Carrito <span>{lines.reduce((sum, line) => sum + line.quantity, 0)}</span></h2></div><button className="admin-text-button" type="button" disabled={!lines.length} onClick={() => { setCart({}); setLastSaleId(null); }}>Vaciar</button></div>
        {lines.length ? <div className="pos-cart-lines">{lines.map(({ product, quantity }) => <div className="pos-cart-line" key={product.id}>
          <div className="pos-cart-product"><strong>{product.name}</strong><small>{money(product.pricePyg)} / {product.saleUnit}</small></div>
          <div className="pos-quantity"><button type="button" aria-label={`Restar ${product.name}`} onClick={() => setQuantity(product.id, quantity - 1)}>−</button><input aria-label={`Cantidad de ${product.name}`} type="number" min="1" max="999" value={quantity} onChange={(event) => setQuantity(product.id, Number(event.target.value))} /><button type="button" aria-label={`Sumar ${product.name}`} onClick={() => setQuantity(product.id, quantity + 1)}>+</button></div>
          <strong className="pos-line-total">{money(product.pricePyg * quantity)}</strong>
        </div>)}</div> : <p className="pos-cart-empty">Agregá productos para iniciar la venta.</p>}
        <div className="pos-total-row"><span>Total</span><strong>{money(total)}</strong></div>
        <label className="pos-field">Cliente<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}</select></label>
        <fieldset className="pos-payment"><legend>Medio de pago</legend><div className="pos-payment-options">{(Object.keys(paymentLabels) as Payment[]).map((method) => <button type="button" key={method} aria-pressed={payment === method} className={payment === method ? "selected" : ""} onClick={() => setPayment(method)}>{paymentLabels[method]}</button>)}</div></fieldset>
        {payment === "cash" ? <div className="pos-cash-fields"><label className="pos-field">Efectivo recibido (Gs.)<input type="number" min={total} step="1" inputMode="numeric" value={received} onChange={(event) => setReceived(event.target.value)} placeholder={total ? String(total) : "0"} /></label><div className="pos-change"><span>Vuelto</span><strong>{change === null ? "—" : money(change)}</strong></div></div> : <p className="pos-payment-note">Confirmación simulada; no se registra información financiera.</p>}
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        {!activeSession && <p className="admin-form-error">Abrí una caja para {profile.name} antes de cobrar. <a href="/admin/caja">Ir a Caja</a></p>}
        <button className="admin-primary-button pos-confirm" type="button" disabled={!activeSession || !lines.length || (payment === "cash" && (receivedAmount < total || !Number.isSafeInteger(receivedAmount))) || busy} onClick={confirmSale}>{busy ? "Registrando…" : "Confirmar venta"}</button>
        {lastSale && <div className="pos-sale-result" role="status"><strong>Venta registrada · {lastSale.number}</strong><span>{money(lastSale.totalPyg)} · {paymentLabels[lastSale.paymentMethod]}</span><button className="admin-secondary-button" type="button" onClick={() => window.print()}>Imprimir comprobante</button></div>}
      </aside>
    </div>
    {lastSale && <section className="admin-ticket" aria-label="Comprobante de demostración"><h2>SANTA MARÍA</h2><p>COMPROBANTE DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL</p><hr /><dl><div><dt>Número</dt><dd>{lastSale.number}</dd></div><div><dt>Fecha</dt><dd>{new Date(lastSale.createdAt).toLocaleString("es-PY")}</dd></div><div><dt>Cajero</dt><dd>{lastSale.cashierName}</dd></div><div><dt>Cliente</dt><dd>{lastSale.customerLabel}</dd></div></dl>{lastSale.lines.map((line) => <div className="ticket-line" key={line.productId}><span>{line.quantity} × {line.name} ({money(line.unitPricePyg)})</span><strong>{money(line.lineTotalPyg)}</strong></div>)}<hr /><div className="ticket-total"><span>Total · {paymentLabels[lastSale.paymentMethod]}</span><strong>{money(lastSale.totalPyg)}</strong></div>{lastSale.paymentMethod === "cash" && <p>Recibido {money(lastSale.cashReceivedPyg ?? 0)} · Vuelto {money(lastSale.changePyg)}</p>}<p className="ticket-warning">COMPROBANTE DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL</p></section>}
  </AdminModuleFrame>;
}
