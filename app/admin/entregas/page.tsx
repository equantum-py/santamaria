"use client";
import { useMemo, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoStateStore, useDemoProfile, useDemoState } from "@/lib/admin/client-state";
import { demoProfiles } from "../demo-data";
import { completeDelivery, prepareWarehouseOrder } from "@/lib/admin/fulfillment";
import type { DemoOrder } from "@/lib/admin/types";

export default function DeliveryPage() {
  const state = useDemoState();
  const [profileId] = useDemoProfile();
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const orders = useMemo(() => state.orders.filter((order) => ["ready", "en_route", "delivered"].includes(order.status) && (order.number + " " + order.customerLabel).toLowerCase().includes(query.toLowerCase())).slice().reverse(), [state.orders, query]);
  const selected: DemoOrder | undefined = state.orders.find((order) => order.id === selectedId);
  function perform(action: "prepare" | "dispatch" | "deliver") {
    if (!selected) return;
    setError(""); setMessage("");
    try {
      if (action === "prepare") {
        const checked: Record<string, number> = {};
        for (const line of selected.lines) checked[line.productId] = Number(quantities[line.productId] ?? "");
        demoStateStore.update((current) => prepareWarehouseOrder(current, { orderId: selected.id, actor: profile.name, quantities: checked, note }));
      } else {
        demoStateStore.update((current) => completeDelivery(current, { orderId: selected.id, actor: profile.name, action, note }));
      }
      setMessage("Operación demostrativa registrada correctamente."); setNote(""); setQuantities({});
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la operación."); }
  }
  return <AdminModuleFrame title="Entregas">
    <section className="admin-module-heading"><div><p className="admin-eyebrow">OPERACIÓN COMERCIAL · E04 · DEMO</p><h1>Entregas</h1><p>Registrá despachos y entregas de pedidos preparados.</p></div><span className="admin-badge-neutral">{orders.length} pedidos · datos simulados</span></section>
    <section className="admin-panel" style={{padding:24}}>
      <label htmlFor="e04-search">Buscar por pedido o cliente</label>
      <input id="e04-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Número o cliente" style={{display:"block",width:"100%",maxWidth:480,padding:12,margin:"10px 0 20px",border:"1px solid #ddd",borderRadius:8}} />
      <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>MODALIDAD</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>{order.number}</td><td>{order.customerLabel}</td><td>{order.fulfillmentMode === "pickup" ? "Retiro" : "Envío"}</td><td>{order.status}</td><td><button type="button" onClick={() => {setSelectedId(order.id);setQuantities({});setNote("");setError("");setMessage("");}}>Ver pedido</button></td></tr>)}</tbody></table></div>
      {!orders.length && <p>No hay pedidos para mostrar.</p>}
    </section>
    {selected && <section className="admin-panel" style={{padding:24,marginTop:20}}>
      <h2>{selected.number} · {selected.customerLabel}</h2><p>Estado: {selected.status} · Responsable: {selected.responsible}</p>
      <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>PRODUCTO</th><th>SOLICITADO</th></tr></thead><tbody>{selected.lines.map((line) => <tr key={line.productId}><td>{line.name}</td><td>{line.quantity} {line.saleUnit}</td></tr>)}</tbody></table></div>
      <label htmlFor="e04-note">Observación / constancia</label><textarea id="e04-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} style={{display:"block",width:"100%",maxWidth:620,margin:"8px 0 16px",padding:12,border:"1px solid #ddd",borderRadius:8}} />
      {selected.fulfillmentMode === "delivery" && selected.status === "ready" && <button type="button" onClick={() => perform("dispatch")}>Confirmar despacho</button>}{((selected.fulfillmentMode === "pickup" && selected.status === "ready") || (selected.fulfillmentMode === "delivery" && selected.status === "en_route")) && <button type="button" onClick={() => perform("deliver")}>Confirmar entrega</button>}
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <h3>Historial</h3><ul>{selected.history.map((entry,index) => <li key={index}>{entry.status} · {entry.changedBy} · {entry.note || "Sin observación"}</li>)}</ul>
    </section>}
  </AdminModuleFrame>;
}
