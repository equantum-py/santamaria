"use client";

import { useRef, useState } from "react";
import { AdminModuleFrame } from "../module-frame";
import { demoProfiles } from "../demo-data";
import { addManualCashMovement, closeCashSession, getExpectedCash, openCashSession } from "@/lib/admin/domain";
import { demoStateStore, useDemoProfile, useDemoState } from "@/lib/admin/client-state";

const money = (amount: number) => `Gs. ${amount.toLocaleString("es-PY")}`;
const paymentLabels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", qr: "QR" };
const movementLabels: Record<string, string> = { cash_sale: "Venta en efectivo", card_sale: "Venta con tarjeta", transfer_sale: "Venta por transferencia", qr_sale: "Venta por QR", manual_income: "Ingreso manual", manual_expense: "Egreso manual" };

export default function CashRegisterPage() {
  const state = useDemoState();
  const [profileId] = useDemoProfile();
  const [openingAmount, setOpeningAmount] = useState("100000");
  const [movementType, setMovementType] = useState<"manual_income" | "manual_expense">("manual_income");
  const [movementAmount, setMovementAmount] = useState("");
  const [reason, setReason] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const operationLock = useRef(false);
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const session = state.cashSessions.find((item) => item.cashierId === profileId && item.status === "open");
  const expected = session ? getExpectedCash(session) : 0;
  const counted = countedCash === "" ? null : Number(countedCash);
  const difference = counted === null || !Number.isSafeInteger(counted) ? null : counted - expected;
  const allSales = state.sales.filter((sale) => sale.cashierId === profileId);
  const sessionSales = session ? state.sales.filter((sale) => sale.cashSessionId === session.id) : [];
  const methodTotals = Object.keys(paymentLabels).map((method) => ({ method: method as keyof typeof paymentLabels, amount: sessionSales.filter((sale) => sale.paymentMethod === method).reduce((sum, sale) => sum + sale.totalPyg, 0) }));

  function perform(operation: () => void, success: string) {
    if (operationLock.current) return;
    operationLock.current = true;
    setError(""); setNotice(""); setBusy(true);
    try { operation(); setNotice(success); }
    catch (cause) { operationLock.current = false; setError(cause instanceof Error ? cause.message : "No se pudo registrar la operación."); }
    finally { setBusy(false); }
  }

  function openSession() {
    const amount = Number(openingAmount);
    perform(() => demoStateStore.update((current) => openCashSession(current, { operationId: `cash-open-${crypto.randomUUID()}`, cashierId: profileId, openingBalancePyg: amount })), "Caja abierta y guardada en la demo.");
    setCountedCash("");
  }

  function addMovement() {
    if (!session) return;
    const amount = Number(movementAmount);
    perform(() => demoStateStore.update((current) => addManualCashMovement(current, { operationId: `cash-movement-${crypto.randomUUID()}`, sessionId: session.id, kind: movementType, amountPyg: amount, label: reason })), "Movimiento registrado.");
    setMovementAmount(""); setReason("");
  }

  function closeSession() {
    if (!session || counted === null) return;
    perform(() => demoStateStore.update((current) => closeCashSession(current, { sessionId: session.id, countedCashPyg: counted })), "Caja cerrada. Las ventas quedan bloqueadas hasta la próxima apertura.");
  }

  return <AdminModuleFrame title="Caja">
    <section className="admin-module-heading"><div><p className="admin-eyebrow">OPERACIÓN COMERCIAL</p><h1>Caja</h1><p>Apertura, movimientos, arqueo y cierre de la sesión demo.</p></div><span className={`admin-session-pill ${session ? "is-open" : "is-closed"}`}><span />{session ? "Abierta" : "Cerrada"}</span></section>
    <section className="admin-demo-notice"><span className="admin-notice-icon">i</span><div><strong>Entorno de demostración</strong><span>Los movimientos son locales a este navegador y no representan cobros reales.</span></div></section>
    {notice && <p className="admin-form-success" role="status">{notice}</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}
    {!session ? <section className="admin-panel cash-open-panel"><div><p className="admin-panel-kicker">NUEVA SESIÓN</p><h2>Abrir caja</h2><p>Responsable: <strong>{profile.name}</strong></p></div><label className="pos-field">Saldo inicial (Gs.)<input type="number" min="0" step="1" inputMode="numeric" value={openingAmount} onChange={(event) => { operationLock.current = false; setOpeningAmount(event.target.value); }} /></label><button className="admin-primary-button" type="button" disabled={busy || !Number.isSafeInteger(Number(openingAmount)) || Number(openingAmount) < 0} onClick={openSession}>Abrir caja</button></section> : <>
      <section className="cash-summary-grid" aria-label="Resumen de caja">
        <article className="admin-panel"><span>Saldo inicial</span><strong>{money(session.openingBalancePyg)}</strong><small>{new Date(session.openedAt).toLocaleString("es-PY")}</small></article>
        <article className="admin-panel"><span>Efectivo esperado</span><strong>{money(expected)}</strong><small>Incluye solo movimientos en efectivo</small></article>
        <article className="admin-panel"><span>Ventas registradas</span><strong>{sessionSales.length}</strong><small>En esta sesión · {money(sessionSales.reduce((sum, sale) => sum + sale.totalPyg, 0))}</small></article>
        <article className="admin-panel"><span>Responsable</span><strong>{session.cashierName}</strong><small>{session.number}</small></article>
      </section>
      <section className="cash-operation-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">MOVIMIENTO MANUAL</p><h2>Ingreso o egreso</h2></div></div><div className="cash-manual-form"><label className="pos-field">Tipo<select value={movementType} onChange={(event) => { operationLock.current = false; setMovementType(event.target.value as typeof movementType); }}><option value="manual_income">Ingreso de efectivo</option><option value="manual_expense">Egreso de efectivo</option></select></label><label className="pos-field">Importe (Gs.)<input type="number" min="1" step="1" inputMode="numeric" value={movementAmount} onChange={(event) => { operationLock.current = false; setMovementAmount(event.target.value); }} placeholder="0" /></label><label className="pos-field cash-reason">Motivo<input value={reason} onChange={(event) => { operationLock.current = false; setReason(event.target.value); }} placeholder="Ej.: fondo de cambio" maxLength={120} /></label><button className="admin-secondary-button" type="button" disabled={busy || !Number.isSafeInteger(Number(movementAmount)) || Number(movementAmount) <= 0 || !reason.trim()} onClick={addMovement}>Registrar movimiento</button></div></section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">ARQUEO Y CIERRE</p><h2>Contar efectivo</h2></div></div><p className="cash-expected-line"><span>Saldo esperado</span><strong>{money(expected)}</strong></p><label className="pos-field">Saldo contado (Gs.)<input type="number" min="0" step="1" inputMode="numeric" value={countedCash} onChange={(event) => { operationLock.current = false; setCountedCash(event.target.value); }} placeholder="Ingresá el total contado" /></label><p className={`cash-difference ${difference !== null && difference < 0 ? "negative" : ""}`}><span>Diferencia</span><strong>{difference === null ? "—" : `${difference < 0 ? "−" : ""}${money(Math.abs(difference))}`}</strong></p><button className="admin-primary-button cash-close-button" type="button" disabled={busy || counted === null || !Number.isSafeInteger(counted) || counted < 0} onClick={closeSession}>Confirmar cierre de caja</button></section>
      </section>
      <section className="admin-panel cash-movements"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">DETALLE</p><h2>Movimientos de la sesión</h2><span className="admin-panel-caption">Los pagos electrónicos no cambian el efectivo disponible.</span></div></div>
        <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>FECHA</th><th>TIPO</th><th>DESCRIPCIÓN</th><th>MÉTODO</th><th>IMPORTE</th><th>EFECTO EN EFECTIVO</th></tr></thead><tbody>{session.movements.length ? session.movements.slice().reverse().map((movement) => <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}</td><td>{movementLabels[movement.kind]}</td><td>{movement.label}</td><td>{movement.paymentMethod ? paymentLabels[movement.paymentMethod] : "—"}</td><td>{money(movement.amountPyg)}</td><td>{movement.cashEffectPyg < 0 ? "−" : ""}{money(Math.abs(movement.cashEffectPyg))}</td></tr>) : <tr><td colSpan={6}>Todavía no hay movimientos en esta sesión.</td></tr>}</tbody></table></div>
        <div className="cash-method-totals">{methodTotals.map((item) => <div key={item.method}><span>Ventas · {paymentLabels[item.method]}</span><strong>{money(item.amount)}</strong></div>)}</div>
      </section>
    </>}
    <section className="admin-panel cash-history"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">HISTORIAL</p><h2>Sesiones anteriores</h2></div><span className="admin-badge-neutral">{allSales.length} ventas del perfil</span></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>SESIÓN</th><th>RESPONSABLE</th><th>APERTURA</th><th>CIERRE</th><th>ESTADO</th><th>DIFERENCIA</th></tr></thead><tbody>{state.cashSessions.filter((item) => item.cashierId === profileId && item.status === "closed").slice().reverse().map((item) => <tr key={item.id}><td>{item.number}</td><td>{item.cashierName}</td><td>{new Date(item.openedAt).toLocaleString("es-PY")}</td><td>{item.closedAt ? new Date(item.closedAt).toLocaleString("es-PY") : "—"}</td><td>Cerrada</td><td>{item.differencePyg === null ? "—" : `${item.differencePyg < 0 ? "−" : ""}${money(Math.abs(item.differencePyg))}`}</td></tr>)}{!state.cashSessions.some((item) => item.cashierId === profileId && item.status === "closed") && <tr><td colSpan={6}>Todavía no hay sesiones cerradas para este perfil.</td></tr>}</tbody></table></div>
      <div className="cash-history-details">{state.cashSessions.filter((item) => item.cashierId === profileId && item.status === "closed").slice().reverse().map((item) => {
        const sales = state.sales.filter((sale) => sale.cashSessionId === item.id);
        return <details key={item.id}><summary>{item.number} · {item.cashierName} · Cerrada {item.closedAt ? new Date(item.closedAt).toLocaleString("es-PY") : ""}</summary><div className="cash-history-detail-grid"><span>Apertura inicial<strong>{money(item.openingBalancePyg)}</strong></span><span>Efectivo contado<strong>{money(item.countedCashPyg ?? 0)}</strong></span><span>Diferencia<strong>{item.differencePyg === null ? "—" : `${item.differencePyg < 0 ? "−" : ""}${money(Math.abs(item.differencePyg))}`}</strong></span><span>Ventas en sesión<strong>{sales.length} · {money(sales.reduce((sum, sale) => sum + sale.totalPyg, 0))}</strong></span></div><h3>Movimientos de la sesión</h3><ul>{item.movements.map((movement) => <li key={movement.id}>{new Date(movement.createdAt).toLocaleString("es-PY")} · {movementLabels[movement.kind]} · {movement.label} · {money(movement.amountPyg)}</li>)}</ul></details>;
      })}</div>
    </section>
  </AdminModuleFrame>;
}
