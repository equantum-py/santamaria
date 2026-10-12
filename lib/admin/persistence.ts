import { createInitialDemoState } from "./demo-state.ts";
import type { DemoProduct, DemoState } from "./types";

export const DEMO_STORAGE_KEY = "santamaria-admin-demo:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult = { state: DemoState; source: "saved" | "migrated" | "fresh" | "recovered" | "unavailable" };

export class DemoPersistenceError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DemoPersistenceError";
    this.cause = cause;
  }
}

export function loadDemoState(storage: StorageLike | null, now = new Date().toISOString(), catalog: readonly DemoProduct[] = []): LoadResult {
  if (!storage) return { state: createInitialDemoState(now, catalog), source: "unavailable" };
  let raw: string | null;
  try {
    raw = storage.getItem(DEMO_STORAGE_KEY);
  } catch (cause) {
    throw new DemoPersistenceError("No se pudieron leer los datos locales de la demo.", cause);
  }
  if (raw === null) return { state: createInitialDemoState(now, catalog), source: "fresh" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isDemoState(parsed)) return { state: parsed, source: "saved" };
    if (isLegacyDemoState(parsed)) {
      const migrated: DemoState = { ...parsed, schemaVersion: 2, inventory: createInitialDemoState(now, catalog).inventory, inventoryMovements: [], counters: { ...parsed.counters, inventoryMovement: 0 } };
      return { state: migrated, source: "migrated" };
    }
    return { state: createInitialDemoState(now, catalog), source: "recovered" };
  } catch {
    return { state: createInitialDemoState(now, catalog), source: "recovered" };
  }
}

export function saveDemoState(storage: StorageLike | null, state: DemoState): void {
  if (!storage) throw new DemoPersistenceError("El almacenamiento local no está disponible en este entorno.");
  if (!isDemoState(state)) throw new DemoPersistenceError("El estado de demostración no pasó la validación.");
  try {
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (cause) {
    throw new DemoPersistenceError("No se pudieron guardar los datos locales de la demo.", cause);
  }
}

export function resetDemoState(storage: StorageLike | null, now = new Date().toISOString(), catalog: readonly DemoProduct[] = []): DemoState {
  const freshState = createInitialDemoState(now, catalog);
  saveDemoState(storage, freshState);
  return freshState;
}

export class DemoStateStore {
  private currentState: DemoState;
  private listeners = new Set<(state: DemoState) => void>();
  private readonly storage: StorageLike | null;
  private readonly catalog: readonly DemoProduct[];
  private hydrated = false;

  constructor(storage: StorageLike | null, now = new Date().toISOString(), catalog: readonly DemoProduct[] = []) {
    this.storage = storage;
    this.catalog = catalog;
    this.currentState = createInitialDemoState(now, catalog);
  }

  getSnapshot = () => this.currentState;

  subscribe = (listener: (state: DemoState) => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  hydrate(now = new Date().toISOString()): LoadResult {
    const result = loadDemoState(this.storage, now, this.catalog);
    if (result.source === "migrated") saveDemoState(this.storage, result.state);
    this.currentState = result.state;
    this.hydrated = true;
    this.notify();
    return result;
  }

  update(updater: (current: DemoState) => DemoState): DemoState {
    if (!this.hydrated) throw new DemoPersistenceError("Cargá primero el estado local de la demo antes de modificarlo.");
    const next = updater(this.currentState);
    saveDemoState(this.storage, next);
    this.currentState = next;
    this.notify();
    return next;
  }

  reset(now = new Date().toISOString()): DemoState {
    const next = resetDemoState(this.storage, now, this.catalog);
    this.currentState = next;
    this.hydrated = true;
    this.notify();
    return next;
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoState>;
  const counters = state.counters;
  return state.schemaVersion === 2 && state.environment === "demo" && typeof state.updatedAt === "string"
    && Array.isArray(state.customers) && Array.isArray(state.operators) && Array.isArray(state.sales) && Array.isArray(state.cashSessions)
    && Array.isArray(state.orders) && Array.isArray(state.quotes) && Array.isArray(state.inventory) && Array.isArray(state.inventoryMovements) && Array.isArray(state.activities)
    && Array.isArray(state.processedOperationIds) && Boolean(counters)
    && [counters?.cash, counters?.sale, counters?.order, counters?.quote, counters?.movement, counters?.inventoryMovement].every((n) => Number.isSafeInteger(n) && n! >= 0);
}

function isLegacyDemoState(value: unknown): value is Omit<DemoState, "schemaVersion" | "inventory" | "inventoryMovements" | "counters"> & { schemaVersion: 1; counters: Omit<DemoState["counters"], "inventoryMovement"> } {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  const counters = state.counters as Record<string, unknown> | undefined;
  return state.schemaVersion === 1 && state.environment === "demo" && typeof state.updatedAt === "string"
    && Array.isArray(state.customers) && Array.isArray(state.operators) && Array.isArray(state.sales) && Array.isArray(state.cashSessions)
    && Array.isArray(state.orders) && Array.isArray(state.quotes) && Array.isArray(state.activities)
    && Array.isArray(state.processedOperationIds) && Boolean(counters)
    && [counters?.cash, counters?.sale, counters?.order, counters?.quote, counters?.movement].every((n) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0);
}
