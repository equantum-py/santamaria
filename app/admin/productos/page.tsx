"use client";

import { useMemo, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoStateStore, useDemoState } from "@/lib/admin/client-state";
import { availableStock, updateAdminProduct } from "@/lib/admin/inventory";

const money = (value: number) => `Gs. ${value.toLocaleString("es-PY")}`;

export default function ProductsPage() {
  const state = useDemoState();
  const [selectedId, setSelectedId] = useState(state.inventory[0]?.productId ?? "");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const selected = state.inventory.find((item) => item.productId === selectedId) ?? state.inventory[0] ?? null;
  const [name, setName] = useState(selected?.name ?? "");
  const [price, setPrice] = useState(selected ? String(selected.pricePyg) : "");
  const [minimum, setMinimum] = useState(selected ? String(selected.minimumStock) : "");
  const [active, setActive] = useState(selected?.active ?? true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const categories = [...new Set(state.inventory.map((item) => item.categoryName))];
  const products = useMemo(() => {
    const needle = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return state.inventory.filter((item) => (!needle || `${item.name} ${item.sku}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(needle)) && (category === "all" || item.categoryId === category));
  }, [state.inventory, query, category]);

  function selectProduct(productId: string) {
    const item = state.inventory.find((record) => record.productId === productId);
    if (!item) return;
    setSelectedId(productId); setName(item.name); setPrice(String(item.pricePyg)); setMinimum(String(item.minimumStock)); setActive(item.active); setMessage(""); setError("");
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    if (!selected) return;
    try {
      demoStateStore.update((current) => updateAdminProduct(current, { operationId: `product-${crypto.randomUUID()}`, productId: selected.productId, name, pricePyg: Number(price), minimumStock: Number(minimum), active, actor: "Administración demo" }));
      setMessage("Producto actualizado en esta demostración.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar el producto."); }
  }

  return <AdminModuleFrame title="Productos">
    <section className="admin-module-heading"><div><p className="admin-eyebrow">GESTIÓN INTERNA · E03</p><h1>Productos</h1><p>Catálogo operativo ficticio para ensayar precios y disponibilidad.</p></div><span className="admin-badge-neutral">{state.inventory.length} SKU · demo</span></section>
    <section className="admin-demo-notice"><span className="admin-notice-icon">i</span><div><strong>Catálogo aislado del ecommerce público</strong><span>Estos cambios viven en el navegador de esta demo y no modifican el catálogo de la tienda ni sus precios reales.</span></div></section>
    <div className="admin-module-layout">
      <section className="admin-panel inventory-list-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">CATÁLOGO</p><h2>Productos demo</h2></div></div>
        <div className="order-list-tools"><label className="pos-search"><span className="sr-only">Buscar producto</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre o SKU" /></label><label className="sr-only" htmlFor="product-category">Categoría</label><select id="product-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((label) => { const item = state.inventory.find((product) => product.categoryName === label)!; return <option key={item.categoryId} value={item.categoryId}>{label}</option>; })}</select></div>
        <div className="admin-table-scroll"><table className="admin-table inventory-table"><thead><tr><th>PRODUCTO</th><th>PRECIO DEMO</th><th>DISPONIBLE</th><th>ESTADO</th></tr></thead><tbody>{products.map((item) => <tr key={item.productId} className={selected?.productId === item.productId ? "is-selected" : ""}><td><button className="order-select-button" type="button" onClick={() => selectProduct(item.productId)}>{item.name}<small>{item.sku} · {item.categoryName}</small></button></td><td>{money(item.pricePyg)}</td><td>{availableStock(item)} {item.saleUnit}</td><td><span className={`admin-status-pill ${item.active ? "status-ready" : "status-cancelled"}`}>{item.active ? "Activo" : "Pausado"}</span></td></tr>)}{products.length === 0 && <tr><td colSpan={4} className="orders-empty">No hay productos que coincidan.</td></tr>}</tbody></table></div>
      </section>
      <section className="admin-panel product-edit-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">FICHA DEMO</p><h2>{selected?.sku ?? "Seleccioná un producto"}</h2></div></div>
        {selected && <><p className="admin-panel-caption">Existencia: {selected.stockOnHand} · Reservado: {selected.stockReserved} · Disponible: {availableStock(selected)} {selected.saleUnit}</p><form className="admin-form-grid" onSubmit={save}>
          <label className="pos-field">Nombre demo<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
          <label className="pos-field">Precio demo (Gs.)<input type="number" min="1" step="1" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
          <label className="pos-field">Alerta cuando disponible sea menor o igual a<input type="number" min="0" max="999999" step="1" value={minimum} onChange={(event) => setMinimum(event.target.value)} required /></label>
          <label className="admin-toggle-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Disponible para nuevas operaciones demo</label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}{message && <p className="admin-form-success" role="status">{message}</p>}
          <button className="admin-primary-button" type="submit">Guardar cambios demo</button>
        </form></>}
      </section>
    </div>
  </AdminModuleFrame>;
}
