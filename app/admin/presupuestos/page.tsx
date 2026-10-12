"use client";

import { useMemo, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoProfiles } from "../demo-data";
import { demoProducts } from "@/lib/admin/catalog";
import { convertAcceptedQuoteToOrder, createQuote, editDraftQuote, operationalCatalog, updateQuoteStatus } from "@/lib/admin/domain";
import { demoStateStore, useDemoProfile, useDemoState } from "@/lib/admin/client-state";
import type { FulfillmentMode, QuoteStatus } from "@/lib/admin/types";

const money = (amount: number) => `Gs. ${amount.toLocaleString("es-PY")}`;
const statusLabels: Record<QuoteStatus, string> = { draft: "Borrador", sent: "Enviado", accepted: "Aceptado", rejected: "Rechazado", expired: "Vencido" };

function defaultValidity() {
  const date = new Date(); date.setDate(date.getDate() + 7); return date.toISOString().slice(0, 10);
}

export default function QuotesPage() {
  const state = useDemoState();
  const [profileId] = useDemoProfile();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("demo-customer-consumidor");
  const [productId, setProductId] = useState(demoProducts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<Record<string, number>>({});
  const [validUntil, setValidUntil] = useState(defaultValidity);
  const [discount, setDiscount] = useState("0");
  const [discountAuthorizer, setDiscountAuthorizer] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("pickup");
  const [responsibleId, setResponsibleId] = useState("deposito");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const quotes = useMemo(() => state.quotes.filter((quote) => {
    const needle = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const haystack = `${quote.number} ${quote.customerLabel}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return (!needle || haystack.includes(needle)) && (filter === "all" || quote.status === filter);
  }).slice().reverse(), [state.quotes, query, filter]);
  const selected = state.quotes.find((quote) => quote.id === selectedId) ?? null;
  const activeProducts = operationalCatalog(state, demoProducts).filter((product) => product.active);
  const cart = Object.entries(items).filter(([, amount]) => amount > 0).map(([id, amount]) => ({ product: activeProducts.find((product) => product.id === id), amount })).filter((entry): entry is { product: (typeof activeProducts)[number]; amount: number } => Boolean(entry.product));
  const subtotal = cart.reduce((sum, entry) => sum + entry.product.pricePyg * entry.amount, 0);
  const discountAmount = discount === "" ? 0 : Number(discount);

  function addItem() {
    const amount = Number(quantity);
    if (!productId || !Number.isSafeInteger(amount) || amount < 1 || amount > 999) { setError("Ingresá una cantidad entera entre 1 y 999."); return; }
    setItems((current) => ({ ...current, [productId]: Math.min(999, (current[productId] ?? 0) + amount) })); setError("");
  }

  function startEdit(quoteId: string) {
    const quote = state.quotes.find((item) => item.id === quoteId); if (!quote || quote.status !== "draft") return;
    setEditingId(quote.id); setSelectedId(quote.id); setCustomerId(quote.customerId ?? "demo-customer-consumidor");
    setItems(Object.fromEntries(quote.lines.map((line) => [line.productId, line.quantity])));
    setValidUntil(quote.validUntil); setDiscount(String(quote.authorizedDiscountPyg)); setDiscountAuthorizer(quote.discountAuthorizedBy ?? ""); setNote(quote.note); setSuccess(""); setError("");
    document.getElementById("quote-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearEditor() {
    setEditingId(null); setItems({}); setDiscount("0"); setDiscountAuthorizer(""); setNote(""); setValidUntil(defaultValidity()); setError("");
  }

  function saveQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    try {
      if (!cart.length) throw new Error("Agregá al menos un producto al presupuesto.");
      if (!Number.isSafeInteger(discountAmount) || discountAmount < 0 || discountAmount > subtotal) throw new Error("El descuento debe ser un importe entero y no superar el subtotal.");
      const operationId = `quote-${crypto.randomUUID()}`;
      if (editingId) {
        demoStateStore.update((current) => editDraftQuote(current, { operationId, quoteId: editingId, items: cart.map(({ product, amount }) => ({ productId: product.id, quantity: amount })), authorizedDiscountPyg: discountAmount, discountAuthorizedBy: discountAuthorizer, validUntil, note }, demoProducts));
        setSuccess("Presupuesto en borrador actualizado."); setSelectedId(editingId);
      } else {
        const customer = state.customers.find((item) => item.id === customerId);
        const created = createQuote(state, { operationId, customerId, customerLabel: customer?.displayName ?? "Consumidor final", items: cart.map(({ product, amount }) => ({ productId: product.id, quantity: amount })), authorizedDiscountPyg: discountAmount, discountAuthorizedBy: discountAuthorizer, validUntil, note }, demoProducts);
        demoStateStore.update(() => created.state); setSelectedId(created.quote.id); setSuccess(`Presupuesto ${created.quote.number} creado en la demo.`);
      }
      clearEditor();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar el presupuesto."); }
  }

  function changeStatus(status: QuoteStatus) {
    if (!selected) return;
    setError(""); setSuccess("");
    try { demoStateStore.update((current) => updateQuoteStatus(current, { quoteId: selected.id, status, changedBy: profile.name })); setSuccess(`Presupuesto ${selected.number}: ${statusLabels[status]}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar el presupuesto."); }
  }

  function convertToOrder() {
    if (!selected) return;
    setError(""); setSuccess("");
    try {
      const result = convertAcceptedQuoteToOrder(state, { quoteId: selected.id, fulfillmentMode, responsibleOperatorId: responsibleId });
      demoStateStore.update(() => result.state); setSuccess(`${selected.number} convertido al pedido ${result.order.number}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo convertir el presupuesto."); }
  }

  const statusActions: Partial<Record<QuoteStatus, QuoteStatus[]>> = { draft: ["sent", "rejected"], sent: ["accepted", "rejected"] };

  return <AdminModuleFrame title="Presupuestos">
    <section className="admin-module-heading"><div><p className="admin-eyebrow">OPERACIÓN COMERCIAL · E02-C</p><h1>Presupuestos</h1><p>Prepará propuestas, controlá su vigencia y convertí las aceptadas en pedidos.</p></div><span className="admin-badge-neutral">{state.quotes.length} presupuestos · demo</span></section>
    <section className="admin-demo-notice"><span className="admin-notice-icon">i</span><div><strong>Importes demostrativos</strong><span>Los precios vienen del catálogo demo. Los presupuestos aceptados no registran pagos.</span></div></section>
    <div className="quotes-layout">
      <section className="admin-panel quotes-list-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">SEGUIMIENTO COMERCIAL</p><h2>Presupuestos</h2></div></div>
        <div className="order-list-tools"><label className="pos-search"><span className="sr-only">Buscar presupuesto</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar número o cliente" /></label><label className="sr-only" htmlFor="quote-status-filter">Filtrar estado</label><select id="quote-status-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="admin-table-scroll"><table className="admin-table orders-table"><thead><tr><th>PRESUPUESTO</th><th>CLIENTE</th><th>VENCE</th><th>ESTADO</th><th>TOTAL</th></tr></thead><tbody>{quotes.map((quote) => <tr key={quote.id} className={selected?.id === quote.id ? "is-selected" : ""}><td><button className="order-select-button" type="button" onClick={() => { setSelectedId(quote.id); setSuccess(""); }}>{quote.number}<small>Creado {new Date(quote.createdAt).toLocaleDateString("es-PY")}</small></button></td><td>{quote.customerLabel}</td><td>{new Date(`${quote.validUntil}T00:00:00`).toLocaleDateString("es-PY")}</td><td><span className={`admin-status-pill status-${quote.status}`}>{statusLabels[quote.status]}</span></td><td>{money(quote.totalPyg)}</td></tr>)}{!quotes.length && <tr><td colSpan={5} className="orders-empty">{state.quotes.length ? "No hay presupuestos que coincidan con esos filtros." : "Todavía no hay presupuestos. Creá uno de demostración para comenzar."}</td></tr>}</tbody></table></div>
      </section>

      <section className="admin-panel quote-editor-panel" id="quote-editor"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">{editingId ? "EDICIÓN" : "NUEVO REGISTRO"}</p><h2>{editingId ? "Editar borrador" : "Crear presupuesto"}</h2><span className="admin-panel-caption">El precio actual del catálogo se guarda como referencia del presupuesto.</span></div>{editingId && <button className="admin-text-button" type="button" onClick={clearEditor}>Cancelar edición</button>}</div>
        <form className="admin-form-grid" onSubmit={saveQuote}>
          <label className="pos-field">Cliente demo<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}</select></label>
          <label className="pos-field">Vigente hasta<input aria-label="Vigente hasta" type="date" value={validUntil} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setValidUntil(event.target.value)} required /></label>
          <div className="order-item-adder"><label className="pos-field">Producto<select value={productId} onChange={(event) => setProductId(event.target.value)}>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.pricePyg)}</option>)}</select></label><label className="pos-field">Cantidad<input aria-label="Cantidad del producto" type="number" min="1" max="999" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><button className="admin-secondary-button" type="button" onClick={addItem}>Agregar línea</button></div>
          {cart.length > 0 && <div className="order-draft-lines">{cart.map(({ product, amount }) => <div key={product.id}><span>{amount} × {product.name}</span><strong>{money(product.pricePyg * amount)}</strong><button type="button" aria-label={`Quitar ${product.name}`} onClick={() => setItems((current) => { const next = { ...current }; delete next[product.id]; return next; })}>Quitar</button></div>)}<p>Subtotal <strong>{money(subtotal)}</strong></p></div>}
          <label className="pos-field">Descuento autorizado (Gs.)<input aria-label="Descuento autorizado (Gs.)" type="number" min="0" max={subtotal} step="1" value={discount} onChange={(event) => setDiscount(event.target.value)} /></label>
          {discountAmount > 0 && <label className="pos-field">Autorizado por<input value={discountAuthorizer} onChange={(event) => setDiscountAuthorizer(event.target.value)} maxLength={80} placeholder="Perfil responsable demo" required /></label>}
          <label className="pos-field">Observación<textarea rows={2} maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Condiciones o aclaraciones para el cliente" /></label>
          <p className="quote-total-preview">Total del presupuesto <strong>{money(Math.max(0, subtotal - (Number.isSafeInteger(discountAmount) ? discountAmount : 0)))}</strong></p>
          {error && <p className="admin-form-error" role="alert">{error}</p>}{success && <p className="admin-form-success" role="status">{success}</p>}
          <button className="admin-primary-button" type="submit" disabled={!cart.length}>{editingId ? "Guardar cambios" : "Crear presupuesto demo"}</button>
        </form>
      </section>

      {selected && <section className="admin-panel quote-detail-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">DETALLE DEL PRESUPUESTO</p><h2>{selected.number}</h2><span className={`admin-status-pill status-${selected.status}`}>{statusLabels[selected.status]}</span></div><button className="admin-secondary-button" type="button" onClick={() => window.print()}>Vista imprimible</button></div>
        <div className="order-facts"><div><span>Cliente</span><strong>{selected.customerLabel}</strong></div><div><span>Creado</span><strong>{new Date(selected.createdAt).toLocaleDateString("es-PY")}</strong></div><div><span>Vigencia</span><strong>{new Date(`${selected.validUntil}T00:00:00`).toLocaleDateString("es-PY")}</strong></div><div><span>Estado</span><strong>{selected.linkedOrderId ? `Pedido ${state.orders.find((order) => order.id === selected.linkedOrderId)?.number ?? "creado"}` : statusLabels[selected.status]}</strong></div></div>
        <div className="admin-document-print"><header><strong>SANTA MARÍA</strong><span>PRESUPUESTO DE DEMOSTRACIÓN · SIN VALIDEZ FISCAL</span></header><h3>{selected.number}</h3><p>Cliente: {selected.customerLabel}</p><p>Fecha: {new Date(selected.createdAt).toLocaleDateString("es-PY")} · Vigente hasta: {new Date(`${selected.validUntil}T00:00:00`).toLocaleDateString("es-PY")}</p><table className="admin-table"><thead><tr><th>PRODUCTO</th><th>CANT.</th><th>PRECIO UNITARIO</th><th>SUBTOTAL</th></tr></thead><tbody>{selected.lines.map((line) => <tr key={line.productId}><td>{line.name} · {line.sku}</td><td>{line.quantity} {line.saleUnit}</td><td>{money(line.unitPricePyg)}</td><td>{money(line.lineTotalPyg)}</td></tr>)}</tbody></table><dl><div><dt>Subtotal</dt><dd>{money(selected.subtotalPyg)}</dd></div>{selected.authorizedDiscountPyg > 0 && <div><dt>Descuento autorizado demo</dt><dd>− {money(selected.authorizedDiscountPyg)}</dd></div>}<div><dt>Total</dt><dd>{money(selected.totalPyg)}</dd></div></dl>{selected.note && <p>Observaciones: {selected.note}</p>}<strong className="quote-fiscal-note">DOCUMENTO DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL. No constituye una oferta comercial vigente.</strong></div>
        <div className="quote-actions"><div><h3>Acciones</h3>{(statusActions[selected.status] ?? []).map((status) => <button key={status} className="admin-secondary-button" type="button" onClick={() => changeStatus(status)}>{status === "sent" ? "Marcar enviado" : status === "accepted" ? "Aceptar" : "Rechazar"}</button>)}{selected.status === "draft" && <button className="admin-secondary-button" type="button" onClick={() => startEdit(selected.id)}>Editar borrador</button>}{selected.status === "sent" && selected.validUntil < new Date().toISOString().slice(0, 10) && <button className="admin-secondary-button" type="button" onClick={() => changeStatus("expired")}>Marcar vencido</button>}</div>
          {selected.status === "accepted" && !selected.linkedOrderId && <div className="quote-convert"><h3>Convertir a pedido</h3><p>Se creará un pedido con los mismos productos y total. No se registra ningún cobro.</p><label className="pos-field">Modalidad<select value={fulfillmentMode} onChange={(event) => setFulfillmentMode(event.target.value as FulfillmentMode)}><option value="pickup">Retiro en local</option><option value="delivery">Entrega</option></select></label><label className="pos-field">Responsable<select value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)}>{state.operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.displayName} · {operator.role}</option>)}</select></label><button className="admin-primary-button" type="button" onClick={convertToOrder}>Convertir una vez a pedido</button></div>}
          {selected.linkedOrderId && <p className="admin-form-success">Convertido a <a href="/admin/pedidos">pedido {state.orders.find((order) => order.id === selected.linkedOrderId)?.number ?? "demo"}</a>. La conversión no puede repetirse.</p>}
        </div>
        {error && <p className="admin-form-error" role="alert">{error}</p>}{success && <p className="admin-form-success" role="status">{success}</p>}
        <h3>Historial</h3><ol className="order-history">{selected.history.map((entry, index) => <li key={`${entry.changedAt}-${index}`}><span className="order-history-dot" /><div><strong>{statusLabels[entry.status]}</strong><small>{new Date(entry.changedAt).toLocaleString("es-PY")} · {entry.changedBy}</small></div></li>)}</ol>
      </section>}
    </div>
  </AdminModuleFrame>;
}
