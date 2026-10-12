"use client";

import { useMemo, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoProfiles } from "../demo-data";
import { demoProducts } from "@/lib/admin/catalog";
import { addOrderObservation, assignOrderResponsible, canTransitionOrder, createOrder, updateOrderStatus } from "@/lib/admin/domain";
import { demoStateStore, useDemoProfile, useDemoState } from "@/lib/admin/client-state";
import type { DemoOrder, FulfillmentMode, OrderStatus } from "@/lib/admin/types";

const money = (amount: number) => `Gs. ${amount.toLocaleString("es-PY")}`;
const statusLabels: Record<OrderStatus, string> = { new: "Nuevo", confirmed: "Confirmado", preparing: "Preparando", ready: "Listo", en_route: "En camino", delivered: "Entregado", cancelled: "Cancelado" };
const sourceLabels = { ecommerce_demo: "Ecommerce demo", counter: "Mostrador", quote: "Presupuesto" } as const;
const fulfillmentLabels: Record<FulfillmentMode, string> = { pickup: "Retiro en local", delivery: "Entrega" };

export default function OrdersPage() {
  const state = useDemoState();
  const [profileId] = useDemoProfile();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerId, setCustomerId] = useState("demo-customer-consumidor");
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("pickup");
  const [source, setSource] = useState<"counter" | "ecommerce_demo">("counter");
  const [responsibleId, setResponsibleId] = useState("deposito");
  const [productId, setProductId] = useState(demoProducts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<Record<string, number>>({});
  const [deliveryNote, setDeliveryNote] = useState("");
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [newObservation, setNewObservation] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const orders = useMemo(() => state.orders.filter((order) => {
    const needle = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const haystack = `${order.number} ${order.customerLabel} ${order.responsible} ${sourceLabels[order.source]} ${order.lines.map((line) => `${line.name} ${line.sku}`).join(" ")}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return (!needle || haystack.includes(needle)) && (filter === "all" || order.status === filter);
  }).slice().reverse(), [state.orders, query, filter]);
  const selected = orders.find((order) => order.id === selectedId) ?? state.orders.find((order) => order.id === selectedId) ?? null;
  const activeProducts = demoProducts.filter((item) => item.active);
  const cart = Object.entries(items).filter(([, amount]) => amount > 0).map(([id, amount]) => ({ product: activeProducts.find((item) => item.id === id), amount })).filter((entry): entry is { product: (typeof activeProducts)[number]; amount: number } => Boolean(entry.product));
  const total = cart.reduce((sum, entry) => sum + entry.product.pricePyg * entry.amount, 0);
  const operators = state.operators;
  const transitionOptions = selected ? (["confirmed", "preparing", "ready", "en_route", "delivered", "cancelled"] as OrderStatus[]).filter((status) => canTransitionOrder(selected.status, status, selected.fulfillmentMode)) : [];

  function addItem() {
    const amount = Number(quantity);
    if (!productId || !Number.isSafeInteger(amount) || amount < 1 || amount > 999) { setError("Ingresá una cantidad entera entre 1 y 999."); return; }
    setItems((current) => ({ ...current, [productId]: Math.min(999, (current[productId] ?? 0) + amount) }));
    setError("");
  }

  function saveOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    try {
      const result = createOrder(state, { operationId: `order-${crypto.randomUUID()}`, source, customerId, items: cart.map(({ product, amount }) => ({ productId: product.id, quantity: amount })), fulfillmentMode, responsibleOperatorId: responsibleId, deliveryNote }, demoProducts);
      demoStateStore.update(() => result.state);
      setSelectedId(result.order.id); setItems({}); setDeliveryNote(""); setSuccess(`Pedido ${result.order.number} creado en la demo.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear el pedido."); }
  }

  function saveStatus() {
    if (!selected || !nextStatus) return;
    setError(""); setSuccess("");
    try {
      demoStateStore.update((current) => updateOrderStatus(current, { orderId: selected.id, status: nextStatus, changedBy: profile.name, note: statusNote, ...(nextStatus === "cancelled" ? { cancellationReason: cancelReason } : {}) }));
      setSuccess(`Pedido ${selected.number}: ${statusLabels[nextStatus]}.`); setNextStatus(""); setStatusNote(""); setCancelReason("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar el estado."); }
  }

  function saveObservation() {
    if (!selected) return;
    try { demoStateStore.update((current) => addOrderObservation(current, { orderId: selected.id, changedBy: profile.name, note: newObservation })); setNewObservation(""); setSuccess("Observación guardada en el historial."); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la observación."); }
  }

  function saveResponsible() {
    if (!selected || !assignTo) return;
    try { demoStateStore.update((current) => assignOrderResponsible(current, { orderId: selected.id, responsibleOperatorId: assignTo })); setSuccess("Responsable actualizado."); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo asignar el responsable."); }
  }

  return <AdminModuleFrame title="Pedidos">
    <section className="admin-module-heading"><div><p className="admin-eyebrow">OPERACIÓN COMERCIAL · E02-C</p><h1>Pedidos</h1><p>Gestioná pedidos de demostración y consultá cada cambio de estado.</p></div><span className="admin-badge-neutral">{state.orders.length} pedidos · demo</span></section>
    <section className="admin-demo-notice"><span className="admin-notice-icon">i</span><div><strong>Operaciones simuladas</strong><span>No se conecta con pedidos reales ni modifica inventario.</span></div></section>
    <div className="orders-layout">
      <section className="admin-panel orders-list-panel">
        <div className="admin-panel-heading"><div><p className="admin-panel-kicker">SEGUIMIENTO</p><h2>Todos los pedidos</h2></div></div>
        <div className="order-list-tools"><label className="pos-search"><span className="sr-only">Buscar pedido</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar número, cliente o responsable" /></label><label className="sr-only" htmlFor="order-status-filter">Filtrar estado</label><select id="order-status-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="admin-table-scroll"><table className="admin-table orders-table"><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>ESTADO</th><th>ENTREGA</th><th>TOTAL</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className={selected?.id === order.id ? "is-selected" : ""}><td><button className="order-select-button" type="button" onClick={() => { setSelectedId(order.id); setNextStatus(""); }}>{order.number}<small>{sourceLabels[order.source]} · {new Date(order.createdAt).toLocaleDateString("es-PY")}</small></button></td><td>{order.customerLabel}</td><td><span className={`admin-status-pill status-${order.status}`}>{statusLabels[order.status]}</span></td><td>{fulfillmentLabels[order.fulfillmentMode]}</td><td>{money(order.totalPyg)}</td></tr>)}{!orders.length && <tr><td colSpan={5} className="orders-empty">{state.orders.length ? "No hay pedidos que coincidan con esos filtros." : "Todavía no hay pedidos. Creá uno de demostración o convertí un presupuesto aceptado."}</td></tr>}</tbody></table></div>
      </section>

      <section className="admin-panel order-create-panel">
        <div className="admin-panel-heading"><div><p className="admin-panel-kicker">NUEVO REGISTRO</p><h2>Crear pedido demo</h2><span className="admin-panel-caption">El total se calcula con los precios actuales del catálogo demo.</span></div></div>
        <form className="admin-form-grid" onSubmit={saveOrder}>
          <label className="pos-field">Cliente<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}</select></label>
          <label className="pos-field">Origen<select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="counter">Mostrador</option><option value="ecommerce_demo">Ecommerce demo</option></select></label>
          <label className="pos-field">Modalidad<select value={fulfillmentMode} onChange={(event) => setFulfillmentMode(event.target.value as FulfillmentMode)}><option value="pickup">Retiro en local</option><option value="delivery">Entrega</option></select></label>
          <label className="pos-field">Responsable<select value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)}>{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.displayName} · {operator.role}</option>)}</select></label>
          <div className="order-item-adder"><label className="pos-field">Producto<select value={productId} onChange={(event) => setProductId(event.target.value)}>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.pricePyg)}</option>)}</select></label><label className="pos-field">Cantidad<input type="number" min="1" max="999" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><button className="admin-secondary-button" type="button" onClick={addItem}>Agregar línea</button></div>
          {cart.length > 0 && <div className="order-draft-lines" aria-label="Productos del pedido">{cart.map(({ product, amount }) => <div key={product.id}><span>{amount} × {product.name}</span><strong>{money(product.pricePyg * amount)}</strong><button type="button" aria-label={`Quitar ${product.name}`} onClick={() => setItems((current) => { const next = { ...current }; delete next[product.id]; return next; })}>Quitar</button></div>)}<p>Total estimado <strong>{money(total)}</strong></p></div>}
          <label className="pos-field">Observación de entrega<textarea rows={2} maxLength={240} value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} placeholder="Indicaciones para preparar o entregar" /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}{success && <p className="admin-form-success" role="status">{success}</p>}
          <button className="admin-primary-button" type="submit" disabled={!cart.length}>Crear pedido de demostración</button>
        </form>
      </section>

      {selected && <section className="admin-panel order-detail-panel">
        <div className="admin-panel-heading"><div><p className="admin-panel-kicker">DETALLE DEL PEDIDO</p><h2>{selected.number}</h2><span className={`admin-status-pill status-${selected.status}`}>{statusLabels[selected.status]}</span></div><span className="admin-badge-neutral">{sourceLabels[selected.source]}</span></div>
        <div className="order-facts"><div><span>Cliente</span><strong>{selected.customerLabel}</strong></div><div><span>Modalidad</span><strong>{fulfillmentLabels[selected.fulfillmentMode]}</strong></div><div><span>Responsable</span><strong>{selected.responsible}</strong></div><div><span>Total</span><strong>{money(selected.totalPyg)}</strong></div></div>
        <h3>Productos</h3><ul className="order-detail-lines">{selected.lines.map((line) => <li key={line.productId}><span>{line.quantity} × {line.name}<small>{money(line.unitPricePyg)} / {line.saleUnit}</small></span><strong>{money(line.lineTotalPyg)}</strong></li>)}</ul>
        {selected.deliveryNote && <p className="order-note"><strong>Indicaciones:</strong> {selected.deliveryNote}</p>}
        <div className="order-action-grid"><div><h3>Actualizar estado</h3><label className="pos-field">Nuevo estado<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus | "")}><option value="">Elegí un estado permitido</option>{transitionOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>{nextStatus === "cancelled" && <label className="pos-field">Motivo de cancelación<input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} maxLength={200} /></label>}<label className="pos-field">Nota del cambio<input value={statusNote} onChange={(event) => setStatusNote(event.target.value)} maxLength={240} /></label><button className="admin-secondary-button" type="button" disabled={!nextStatus || (nextStatus === "cancelled" && !cancelReason.trim())} onClick={saveStatus}>Guardar estado</button></div>
          <div><h3>Responsable</h3><label className="pos-field">Asignar a<select value={assignTo} onChange={(event) => setAssignTo(event.target.value)}><option value="">Elegí una persona demo</option>{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.displayName} · {operator.role}</option>)}</select></label><button className="admin-secondary-button" type="button" disabled={!assignTo} onClick={saveResponsible}>Actualizar responsable</button></div></div>
        <div className="order-observation"><h3>Agregar observación</h3><label className="pos-field"><span className="sr-only">Observación del pedido</span><textarea rows={2} maxLength={500} value={newObservation} onChange={(event) => setNewObservation(event.target.value)} placeholder="La observación quedará en el historial." /></label><button className="admin-secondary-button" type="button" disabled={!newObservation.trim()} onClick={saveObservation}>Guardar observación</button></div>
        <h3>Historial</h3><ol className="order-history">{selected.history.map((entry, index) => <li key={`${entry.changedAt}-${index}`}><span className="order-history-dot" /><div><strong>{statusLabels[entry.status]}</strong><small>{new Date(entry.changedAt).toLocaleString("es-PY")} · {entry.changedBy}</small>{entry.note && <p>{entry.note}</p>}</div></li>)}</ol>
      </section>}
    </div>
  </AdminModuleFrame>;
}
