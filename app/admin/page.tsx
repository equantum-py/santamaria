"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemoProfile, useDemoState } from "@/lib/admin/client-state";
import { availableStock } from "@/lib/admin/inventory";
import {
  adminModules,
  dashboardMetrics,
  dashboardTasks,
  demoProfiles,
} from "./demo-data";

type IconName = string;

const iconPaths: Record<IconName, string> = {
  dashboard: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M18 6 6 18",
  chevron: "m9 18 6-6-6-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.2-4.2",
  pos: "M3 4h18v16H3zM7 8h10M7 12h4m-4 4h10",
  cash: "M3 6h18v13H3zM3 9h18M7 14h4",
  orders: "M5 3h14v18H5zM8 8h8M8 12h8M8 16h5",
  quote: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h4",
  products: "M4 7h16v14H4zM3 7l2-4h14l2 4M9 11v2m6-2v2",
  inventory: "M3 7 12 3l9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10",
  warehouse: "m3 10 9-7 9 7v11H3zM8 21v-7h8v7M8 10h.01M12 10h.01M16 10h.01",
  purchase: "M4 4h16v17H4zM8 8h8M8 12h8M8 16h4M7 2v4m10-4v4",
  supplier: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m7-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a4 4 0 0 1 0 7m1 4h1a4 4 0 0 1 4 4v2",
  invoice: "M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8M8 12h8M8 16h5",
  customers: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m7-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1a4 4 0 1 0 0-8",
  reports: "M4 19V5m0 14h17M8 15l3-4 3 2 5-7",
  users: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m7-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-4h5m-2.5-2.5v5",
  promo: "m12 3 2.3 5.1 5.6.6-4.2 3.8 1.2 5.5-4.9-2.8-4.9 2.8 1.2-5.5-4.2-3.8 5.6-.6L12 3Z",
  campaign: "M3 11v2h4l10 5V6L7 11H3Zm4 2 2 7h4l-2.3-5.8M19 9l2-2m-2 10 2 2",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6",
  info: "M12 11v5m0-8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  check: "m5 12 4 4L19 6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chart: "M4 19V5m0 14h17M8 15l3-4 3 2 5-7",
  trend: "M4 16l5-5 4 3 7-8m-6 0h6v6",
  calendar: "M4 5h16v16H4zM8 3v4m8-4v4M4 10h16",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
  stock: "M4 7h16v14H4zM3 7l2-4h14l2 4M9 11v2m6-2v2",
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name] ?? iconPaths.dashboard} />
    </svg>
  );
}

function formatDate() {
  return new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Asuncion",
  }).format(new Date());
}

export default function AdminDashboard() {
  const [profileId, setProfileId] = useDemoProfile();
  const state = useDemoState();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [menuOpen, setMenuOpen] = useState(false);
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const visibleModules = adminModules.filter((item) => profile.allowedModules.includes(item.id));
  const now = new Date();
  const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const todayKey = dayKey(now);
  const todaySales = state.sales.filter((sale) => dayKey(new Date(sale.createdAt)) === todayKey);
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.totalPyg, 0);
  const monthKey = todayKey.slice(0, 7);
  const monthSales = state.sales.filter((sale) => dayKey(new Date(sale.createdAt)).slice(0, 7) === monthKey);
  const monthTotal = monthSales.reduce((sum, sale) => sum + sale.totalPyg, 0);
  const periodStart = new Date(now);
  if (period === "week") periodStart.setDate(periodStart.getDate() - 6);
  else periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);
  const dayCount = period === "week" ? 7 : now.getDate();
  const labels = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(periodStart);
    date.setDate(date.getDate() + index);
    return date.toLocaleDateString("es-PY", { day: "numeric", month: "short", timeZone: "America/Asuncion" });
  });
  const pointsData = labels.map((_, index) => {
    const date = new Date(periodStart);
    date.setDate(date.getDate() + index);
    const key = dayKey(date);
    return state.sales.filter((sale) => dayKey(new Date(sale.createdAt)) === key).reduce((sum, sale) => sum + sale.totalPyg, 0);
  });
  const periodTotal = pointsData.reduce((sum, amount) => sum + amount, 0);
  const peak = Math.max(1, ...pointsData);
  const points = pointsData.map((value, index) => `${(index / Math.max(1, pointsData.length - 1)) * 620 + 10},${205 - (value / peak) * 155}`).join(" ");
  const productSales = new Map<string, { name: string; detail: string; sold: number; amount: number }>();
  for (const sale of state.sales) for (const line of sale.lines) {
    const item = productSales.get(line.productId) ?? { name: line.name, detail: line.sku, sold: 0, amount: 0 };
    item.sold += line.quantity;
    item.amount += line.lineTotalPyg;
    productSales.set(line.productId, item);
  }
  const topProducts = [...productSales.values()].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const groups = [...new Set(visibleModules.map((item) => item.group))];
  const liveSalesTotal = state.sales.reduce((sum, sale) => sum + sale.totalPyg, 0);
  const livePaymentSummary = (["cash", "card", "transfer", "qr"] as const).map((method) => {
    const amount = state.sales.filter((sale) => sale.paymentMethod === method).reduce((sum, sale) => sum + sale.totalPyg, 0);
    const labels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", qr: "QR" };
    const colors = { cash: "brown", card: "yellow", transfer: "terra", qr: "terra" };
    return { name: labels[method], amount: `Gs. ${amount.toLocaleString("es-PY")}`, percent: liveSalesTotal ? Math.round((amount / liveSalesTotal) * 100) : 0, color: colors[method] };
  });
  const liveRecentActivity = state.activities.slice().reverse().slice(0, 4).map((item) => ({ id: item.id, title: item.title, detail: item.detail, time: new Date(item.createdAt).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" }), tone: item.kind === "sale" ? "green" : item.kind === "inventory" ? "blue" : "amber", icon: item.kind === "sale" ? "cash" : item.kind === "inventory" ? "inventory" : "clock" }));
  const demoLowStockCount = state.inventory.filter((product) => availableStock(product) <= product.minimumStock).length;
  const demoOutOfStockCount = state.inventory.filter((product) => availableStock(product) === 0).length;

  if (!profile.allowedModules.includes("dashboard")) {
    return <div className="sm-admin"><header className="admin-topbar admin-module-topbar"><div className="admin-breadcrumb"><span>Santa María</span><strong>Perfil de demostración</strong></div><label className="sr-only" htmlFor="admin-demo-profile">Cambiar perfil de demostración</label><select id="admin-demo-profile" className="admin-profile-select" value={profileId} onChange={(event) => setProfileId(event.target.value)}>{demoProfiles.map((item) => <option value={item.id} key={item.id}>{item.role}</option>)}</select></header><main className="admin-content"><section className="admin-panel admin-access-note"><h1>Este perfil no tiene el resumen habilitado</h1><p>El perfil Cajera puede operar desde Punto de venta y Caja.</p><div className="admin-module-links"><Link href="/admin/pos">Punto de venta</Link><Link href="/admin/caja">Caja</Link></div><p>El selector solo organiza las vistas de esta demo; no representa autenticación ni control de acceso real.</p></section></main></div>;
  }

  return (
    <div className={`sm-admin ${menuOpen ? "sm-admin-menu-open" : ""}`}>
      {menuOpen && <button className="admin-scrim" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <aside className="admin-sidebar" aria-label="Navegación administrativa">
        <div className="admin-brand">
          <div className="admin-brand-mark" aria-hidden="true"><i /><i /><i /></div>
          <div className="admin-brand-copy"><strong>SANTA MARÍA</strong><span>GESTIÓN COMERCIAL</span></div>
          <button className="admin-close-menu" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}><Icon name="close" /></button>
        </div>

        <div className="admin-demo-label"><span className="admin-demo-dot" /> ENTORNO DE DEMOSTRACIÓN</div>
        <nav className="admin-nav">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group}>
              <p className="admin-nav-heading">{group}</p>
              {visibleModules.filter((item) => item.group === group).map((item) => (
                item.id === "dashboard" ? (
                  <Link key={item.id} href="/admin" className="admin-nav-item active" aria-current="page" onClick={() => setMenuOpen(false)}>
                    <Icon name={item.icon} /><span>{item.label}</span><span className="admin-nav-current">Ahora</span>
                  </Link>
                ) : ["pos", "caja", "pedidos", "presupuestos", "productos", "inventario", "deposito", "entregas", "compras", "proveedores", "clientes"].includes(item.id) ? (
                  <Link key={item.id} href={`/admin/${item.id}`} className="admin-nav-item" onClick={() => setMenuOpen(false)}><Icon name={item.icon} /><span>{item.label}</span><span className="admin-nav-stage">{["compras", "proveedores", "clientes"].includes(item.id) ? "E05" : ["deposito", "entregas"].includes(item.id) ? "E04" : ["productos", "inventario"].includes(item.id) ? "E03" : "E02"}</span></Link>
                ) : (
                  <button key={item.id} className="admin-nav-item admin-nav-disabled" type="button" disabled title={`Disponible en ${item.stage}`}>
                    <Icon name={item.icon} /><span>{item.label}</span><span className="admin-nav-stage">{item.stage.replace("Etapa ", "E")}</span>
                  </button>
                )
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-help-card">
            <span className="admin-help-icon"><Icon name="check" size={17} /></span>
            <div><strong>Base administrativa</strong><small>Etapa 01 completada</small></div>
          </div>
          <div className="admin-sidebar-profile">
            <span className="admin-avatar">{profile.initials}</span>
            <span className="admin-profile-copy"><strong>{profile.name}</strong><small>{profile.role}</small></span>
            <span className="admin-online" aria-label="Perfil de demostración activo" />
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
            <div className="admin-breadcrumb"><span>Santa María</span><Icon name="chevron" size={15} /><strong>Resumen</strong></div>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-top-demo"><span className="admin-demo-dot" /> Datos simulados</span>
            <label className="admin-profile-select-label" htmlFor="admin-demo-profile">Perfil demo</label>
            <select id="admin-demo-profile" className="admin-profile-select" value={profileId} onChange={(event) => setProfileId(event.target.value)} aria-label="Cambiar perfil de demostración">
              {demoProfiles.map((item) => <option value={item.id} key={item.id}>{item.role}</option>)}
            </select>
            <span className="admin-top-avatar" aria-hidden="true">{profile.initials}</span>
          </div>
        </header>

        <main className="admin-content" id="admin-main">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">PANEL DE CONTROL</p>
              <h1>Buen día, {profile.name.split(" ")[0]}</h1>
              <p className="admin-subheading">Este es el resumen de actividad de tu negocio.</p>
            </div>
            <div className="admin-date-chip"><Icon name="calendar" size={17} /><span>{formatDate()}</span></div>
          </div>

          <section className="admin-demo-notice" aria-label="Aviso de demostración">
            <span className="admin-notice-icon"><Icon name="info" size={19} /></span>
            <div><strong>Estás viendo una demo.</strong><span>Todos los importes, pedidos y movimientos de este panel son datos simulados.</span></div>
            <span className="admin-notice-tag">SIN OPERACIONES REALES</span>
          </section>

          <section className="admin-metrics" aria-label="Indicadores del negocio">
            {dashboardMetrics.map((originalMetric) => {
              const metric = originalMetric.id === "today"
                ? { ...originalMetric, label: "Ventas de hoy", value: `Gs. ${todayTotal.toLocaleString("es-PY")}`, change: String(todaySales.length), note: "ventas de hoy · demo" }
                : originalMetric.id === "month"
                  ? { ...originalMetric, value: `Gs. ${monthTotal.toLocaleString("es-PY")}`, change: String(monthSales.length), note: "ventas del mes · demo" }
                  : originalMetric.id === "stock"
                    ? { ...originalMetric, value: `${demoLowStockCount} productos`, change: `${demoOutOfStockCount} sin stock`, note: `${state.inventory.length} SKU de esta demo` }
                    : { ...originalMetric, value: String(state.orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length), change: `${state.orders.filter((order) => order.status === "preparing").length} para preparar`, note: "pedidos de esta demo" };
              return (
              <article className="admin-metric-card" key={metric.id}>
                <div className="admin-metric-top"><span>{metric.label}</span><span className={`admin-metric-icon ${metric.tone}`}><Icon name={metric.icon} size={18} /></span></div>
                <strong className="admin-metric-value">{metric.value}</strong>
                <div className="admin-metric-foot"><span className={metric.id === "stock" || metric.id === "orders" ? "admin-metric-link" : "admin-metric-change"}>{metric.change}</span><span>{metric.note}</span></div>
              </article>
            );})}
          </section>

          <section className="admin-insight-grid" aria-label="Resumen de ventas y cobros">
            <article className="admin-panel admin-sales-panel">
              <div className="admin-panel-heading">
                <div><p className="admin-panel-kicker">VENTAS</p><h2>Rendimiento de ventas</h2><span className="admin-panel-caption">Total registrado en el período</span></div>
                <label className="admin-period-select"><span className="sr-only">Período del gráfico</span><select value={period} onChange={(event) => setPeriod(event.target.value as "week" | "month")}><option value="week">Últimos 7 días</option><option value="month">Este mes</option></select></label>
              </div>
              <div className="admin-chart-summary"><strong>{`Gs. ${periodTotal.toLocaleString("es-PY")}`}</strong><span><Icon name="trend" size={15} /> Ventas registradas</span></div>
              <div className="admin-chart-wrap">
                <svg className="admin-chart" viewBox="0 0 640 240" role="img" aria-label={`Gráfico de ventas registradas: ${period === "week" ? "últimos 7 días" : "este mes"}`} preserveAspectRatio="none">
                  <defs><linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#925246" stopOpacity=".18" /><stop offset="100%" stopColor="#925246" stopOpacity="0" /></linearGradient></defs>
                  {[40, 90, 140, 190].map((y) => <line key={y} x1="8" x2="632" y1={y} y2={y} className="admin-chart-grid" />)}
                  <polygon points={`10,205 ${points} 630,205`} fill="url(#salesArea)" />
                  <polyline points={points} className="admin-chart-line" />
                  {pointsData.map((value, index) => <circle key={index} cx={(index / Math.max(1, pointsData.length - 1)) * 620 + 10} cy={205 - (value / peak) * 155} r="3.5" className="admin-chart-point" />)}
                </svg>
              </div>
              <div className="admin-chart-labels">{labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
            </article>

            <article className="admin-panel admin-payments-panel">
              <div className="admin-panel-heading"><div><p className="admin-panel-kicker">RESUMEN DE CAJA</p><h2>Medios de pago</h2><span className="admin-panel-caption">Ventas POS guardadas · datos simulados</span></div><button className="admin-icon-button" type="button" aria-label="Más opciones" disabled><span>···</span></button></div>
              <div className="admin-payments-total"><strong>Gs. {liveSalesTotal.toLocaleString("es-PY")}</strong><span>{state.sales.length} ventas · esta demo</span></div>
              <div className="admin-payment-list">{livePaymentSummary.map((payment) => <div className="admin-payment-row" key={payment.name}><div className="admin-payment-info"><span>{payment.name}</span><strong>{payment.amount}</strong></div><div className="admin-payment-track"><span className={payment.color} style={{ width: `${payment.percent}%` }} /></div><small>{payment.percent}%</small></div>)}</div>
            </article>
          </section>

          <section className="admin-lower-grid" aria-label="Actividad del negocio">
            <article className="admin-panel admin-products-panel">
              <div className="admin-panel-heading"><div><p className="admin-panel-kicker">CATÁLOGO</p><h2>Productos más vendidos</h2><span className="admin-panel-caption">Ventas POS registradas · demo</span></div><span className="admin-badge-neutral">{topProducts.length} productos</span></div>
              <div className="admin-table-scroll">
                <table className="admin-table"><thead><tr><th>PRODUCTO</th><th>UNIDADES</th><th>VENTA</th></tr></thead><tbody>{topProducts.map((item) => <tr key={item.name}><td><strong>{item.name}</strong><small>{item.detail}</small></td><td>{item.sold}</td><td>{`Gs. ${item.amount.toLocaleString("es-PY")}`}</td></tr>)}</tbody></table>{topProducts.length === 0 && <p className="admin-activity-empty">Todavía no hay productos vendidos en esta demo.</p>}
              </div>
            </article>

            <article className="admin-panel admin-activity-panel">
              <div className="admin-panel-heading"><div><p className="admin-panel-kicker">MOVIMIENTOS</p><h2>Actividad reciente</h2><span className="admin-panel-caption">{liveRecentActivity.length ? "Operaciones guardadas en esta demo" : "Sin operaciones POS registradas"}</span></div><Link className="admin-text-button" href="/admin/caja">Ver Caja <Icon name="arrow" size={15} /></Link></div>
              <div className="admin-activity-list">{(liveRecentActivity.length ? liveRecentActivity : []).map((activity) => <div className="admin-activity-item" key={activity.id}><span className={`admin-activity-icon ${activity.tone}`}><Icon name={activity.icon} size={17} /></span><div><strong>{activity.title}</strong><small>{activity.detail}</small></div><time>{activity.time}</time></div>)}{!liveRecentActivity.length && <div className="admin-activity-empty">Las ventas y movimientos confirmados aparecerán aquí.</div>}</div>
            </article>
          </section>

          <section className="admin-bottom-grid" aria-label="Pendientes y perfil actual">
            <article className="admin-panel admin-tasks-panel">
              <div className="admin-panel-heading"><div><p className="admin-panel-kicker">PARA HOY</p><h2>Atención prioritaria</h2><span className="admin-panel-caption">Pendientes registrados en la demo</span></div><span className="admin-badge-neutral">Demo</span></div>
              <div className="admin-task-list">{dashboardTasks.map((task) => {
                const liveCount = task.label === "Alertas de inventario" ? demoLowStockCount : task.label === "Pedidos completados hoy"
                  ? state.orders.filter((order) => order.status === "delivered").length
                  : task.label === "Pedidos por confirmar"
                    ? state.orders.filter((order) => order.status === "new").length
                    : task.label === "Presupuestos pendientes"
                      ? state.quotes.filter((quote) => ["draft", "sent"].includes(quote.status)).length
                      : null;
                const liveLabel = task.label === "Pedidos completados hoy" ? "Pedidos entregados" : task.label;
                return <div className="admin-task-row" key={task.label}><span className={`admin-task-dot ${task.tone}`} /><span>{liveLabel}</span><strong>{liveCount === null ? task.count : String(liveCount).padStart(2, "0")}</strong><Icon name="chevron" size={16} /></div>;
              })}</div>
            </article>
            <article className="admin-panel admin-profile-panel">
              <p className="admin-panel-kicker">PERFIL ACTIVO</p><div className="admin-profile-large"><span className="admin-avatar">{profile.initials}</span><div><h2>{profile.role}</h2><p>{profile.name}</p></div></div>
              <p className="admin-profile-demo-warning"><Icon name="info" size={16} /> El selector solo cambia la vista de esta demo. No aplica permisos ni reemplaza la autenticación.</p>
              <div className="admin-permission-summary"><span>Módulos visibles</span><strong>{visibleModules.length}</strong></div>
            </article>
          </section>

          <footer className="admin-footer"><span>Santa María Admin <b>·</b> Demo funcional, sin conexión con operaciones reales</span><span>Demo integrada · E03</span></footer>
        </main>
      </div>
    </div>
  );
}
