"use client";

import { useMemo, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoStateStore, useDemoState } from "@/lib/admin/client-state";
import { adjustInventory, availableStock } from "@/lib/admin/inventory";

const money = (value: number) => `Gs. ${value.toLocaleString("es-PY")}`;
const movementLabels = { receipt: "Entrada", adjustment: "Ajuste", sale: "Venta POS", reservation: "Reserva", reservation_release: "Liberación", fulfillment: "Entrega" } as const;

export default function InventoryPage() {
  const state = useDemoState();
  const [selectedId, setSelectedId] = useState(state.inventory[0]?.productId ?? "");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = state.inventory.find((item) => item.productId === selectedId) ?? state.inventory[0] ?? null;
  const lowStock = state.inventory.filter((item) => availableStock(item) <= item.minimumStock);
  const emptyStock = state.inventory.filter((item) => availableStock(item) === 0);
  const totalAvailable = state.inventory.reduce((sum, item) => sum + availableStock(item), 0);
  const movements = useMemo(() => [...state.inventoryMovements].reverse().slice(0, 30), [state.inventoryMovements]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!selected) return;
    try {
      demoStateStore.update((current) => adjustInventory(current, { operationId: `stock-${crypto.randomUUID()}`, productId: selected.productId, quantity: Number(quantity), direction, reason, actor: "Depósito demo" }));
      setMessage(direction === "in" ? "Entrada de stock registrada en la demo." : "Ajuste de salida registrado en la demo."); setReason(""); setQuantity("1");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar el movimiento."); }
  }

  return <AdminModuleFrame title="Inventario">
    <section className="admin-module-heading"><div><p className="admin-eyebrow">GESTIÓN INTERNA · E03</p><h1>Inventario</h1><p>Existencias simuladas, reservas y movimientos de productos.</p></div><span className="admin-badge-neutral">Solo datos demo</span></section>
    <section className="admin-demo-notice"><span className="admin-notice-icon">i</span><div><strong>Stock simulado y local</strong><span>No cambia existencias reales ni sincroniza con la tienda pública. Los pedidos confirmados reservan; al entregar descuentan; al cancelar liberan.</span></div></section>
    <section className="admin-metrics inventory-metrics"><article className="admin-metric-card"><div className="admin-metric-top">Productos registrados</div><strong className="admin-metric-value">{state.inventory.length}</strong><div className="admin-metric-foot">SKU de la demo</div></article><article className="admin-metric-card"><div className="admin-metric-top">Unidades disponibles</div><strong className="admin-metric-value">{totalAvailable.toLocaleString("es-PY")}</strong><div className="admin-metric-foot">Después de reservas</div></article><article className="admin-metric-card"><div className="admin-metric-top">Bajo mínimo</div><strong className="admin-metric-value">{lowStock.length}</strong><div className="admin-metric-foot">Requieren revisión</div></article><article className="admin-metric-card"><div className="admin-metric-top">Sin disponibilidad</div><strong className="admin-metric-value">{emptyStock.length}</strong><div className="admin-metric-foot">Agotados o reservados</div></article></section>
    <div className="inventory-layout">
      <section className="admin-panel inventory-list-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">EXISTENCIAS</p><h2>Stock por producto</h2></div><span className="admin-badge-neutral">{lowStock.length} alertas</span></div>
        <div className="admin-table-scroll"><table className="admin-table inventory-table"><thead><tr><th>PRODUCTO</th><th>EN MANO</th><th>RESERVADO</th><th>DISPONIBLE</th><th>MÍNIMO</th><th>ESTADO</th></tr></thead><tbody>{state.inventory.map((item) => { const available = availableStock(item); const low = available <= item.minimumStock; return <tr key={item.productId} className={selected?.productId === item.productId ? "is-selected" : ""}><td><button className="order-select-button" type="button" onClick={() => setSelectedId(item.productId)}>{item.name}<small>{item.sku} · {item.saleUnit}</small></button></td><td>{item.stockOnHand}</td><td>{item.stockReserved}</td><td><strong>{available}</strong></td><td>{item.minimumStock}</td><td><span className={`admin-status-pill ${low ? "status-cancelled" : "status-ready"}`}>{low ? "Bajo" : "Normal"}</span></td></tr>; })}</tbody></table></div>
      </section>
      <section className="admin-panel stock-movement-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">MOVIMIENTO MANUAL</p><h2>Registrar stock</h2></div></div>
        {selected && <form className="admin-form-grid" onSubmit={submit}>
          <label className="pos-field">Producto<select value={selected.productId} onChange={(event) => setSelectedId(event.target.value)}>{state.inventory.map((item) => <option key={item.productId} value={item.productId}>{item.sku} · {item.name}</option>)}</select></label>
          <label className="pos-field">Tipo de movimiento<select value={direction} onChange={(event) => setDirection(event.target.value as "in" | "out")}><option value="in">Entrada de stock</option><option value="out">Ajuste de salida</option></select></label>
          <p className="admin-panel-caption">En mano: {selected.stockOnHand} · Reservado: {selected.stockReserved} · Disponible: {availableStock(selected)} {selected.saleUnit}</p>
          <label className="pos-field">Cantidad<input type="number" min="1" max="999999" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label className="pos-field">Motivo<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={200} placeholder="Ej.: recepción demo, ajuste por conteo" required /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}{message && <p className="admin-form-success" role="status">{message}</p>}
          <button className="admin-primary-button" type="submit">Registrar movimiento demo</button>
        </form>}
      </section>
    </div>
    <section className="admin-panel inventory-history-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">TRAZABILIDAD LOCAL</p><h2>Movimientos recientes</h2></div></div><div className="admin-table-scroll"><table className="admin-table inventory-history-table"><thead><tr><th>FECHA</th><th>SKU</th><th>MOVIMIENTO</th><th>CANTIDAD</th><th>MOTIVO</th><th>RESPONSABLE</th></tr></thead><tbody>{movements.map((movement) => { const product = state.inventory.find((item) => item.productId === movement.productId); const change = movement.onHandDelta || movement.reservedDelta; return <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleString("es-PY")}</td><td>{product?.sku ?? movement.productId}</td><td>{movementLabels[movement.kind]}</td><td>{change > 0 ? "+" : "−"}{movement.quantity}</td><td>{movement.reason}</td><td>{movement.actor}</td></tr>; })}{movements.length === 0 && <tr><td colSpan={6} className="orders-empty">Todavía no hay movimientos. Las entradas, ajustes, ventas y pedidos se registrarán aquí.</td></tr>}</tbody></table></div></section>
    <p className="admin-module-footnote">Todos los importes y existencias de este módulo son ficticios. Valor en inventario estimado: {money(state.inventory.reduce((sum, item) => sum + item.stockOnHand * item.pricePyg, 0))} (demostración).</p>
  </AdminModuleFrame>;
}
