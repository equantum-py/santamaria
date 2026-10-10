"use client";

import { FormEvent, KeyboardEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateDelivery,
  categories,
  type CatalogProduct,
  type ProductCategory,
  type DemoOrder,
  formatDateTime,
  money,
  nextOrderNumber,
  pickup,
  products,
  type OrderStatus,
  zones,
} from "@/lib/store";
import { productPhoto } from "@/lib/media";
import { bankPromotions, partners, promoBanners } from "@/lib/promotions";
import { searchProducts, suggestCategories } from "@/lib/search";

type Screen = "store" | "cart" | "fulfillment" | "customer" | "payment" | "confirmation" | "tracking";
type SortOrder = "relevance" | "price_asc" | "price_desc" | "name_asc";
type CartState = Record<string, number>;

const CART_KEY = "santamaria-demo-cart";
const ORDERS_KEY = "santamaria-demo-orders";
const WHATSAPP_URL = "https://wa.me/595983564690";
const WHATSAPP_LABEL = "0983 564 690";
function formatPickupDate(value: string) {
  const date = new Date(value + "T12:00:00");
  return new Intl.DateTimeFormat("es-PY", {
    timeZone: "America/Asuncion",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

const statusLabels: Record<OrderStatus, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  en_camino: "En camino",
  listo_para_retirar: "Listo para retirar",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

type IconName =
  | "search" | "cart" | "truck" | "store" | "chat" | "package" | "menu" | "home" | "grid" | "arrow" | "check" | "close"
  | "ferreteria" | "sanitarios" | "construccion" | "electricos" | "bank" | "handshake" | "shield" | "plus";

const iconPaths: Record<IconName, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.2-4.2",
  cart: "M3 4h2l2.4 11h10.2L20 8H6.3M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  truck: "M2 6h11v10H2zM13 10h4l3 3v3h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  store: "M3 9l1.5-5h15L21 9M3 9h18M3 9v1.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9M5 13v7h14v-7M10 20v-4h4v4",
  chat: "M4 5h16v11H9l-5 4V5Zm4 5h.01M12 10h.01M16 10h.01",
  package: "M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v0M3 7.5 12 12l9-4.5M12 12v9",
  menu: "M4 7h16M4 12h16M4 17h16",
  home: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 5 5 9-10",
  close: "M6 6l12 12M18 6 6 18",
  ferreteria: "M14 4a4 4 0 0 0-4.6 5.4L3.5 15.3a1.8 1.8 0 0 0 2.6 2.6l5.9-5.9A4 4 0 0 0 17.4 7.4l-2.4 2.4-2.2-.6-.6-2.2L14.6 4.6 14 4Z",
  sanitarios: "M7 3h4v4H7zM9 7v3M4 10h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-2ZM9 18l-1 3m7-3 1 3",
  construccion: "M3 6h8v5H3zM13 6h8v5h-8zM3 13h4v5H3zM9 13h8v5H9zM19 13h2v5h-2z",
  electricos: "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
  bank: "M3 9 12 4l9 5M4 9h16M6 9v8m4-8v8m4-8v8m4-8v8M3 20h18",
  handshake: "M3 8l4-3 5 3 5-3 4 3v6l-4 3-3-2M3 8v6l5 4 3-2M8 11l3 2 3-2",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4",
  plus: "M12 5v14M5 12h14",
};

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  );
}

function categoryIcon(categoryId: string): IconName {
  return (["ferreteria", "sanitarios", "construccion", "electricos"] as const).find((id) => id === categoryId) ?? "grid";
}

// Ventanas (ficha, menú, filtros): el foco entra al abrir, Tab queda adentro, Esc cierra y el foco vuelve.
function useDialog(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => [...(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
    focusable()[0]?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("dialog-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("dialog-open");
      previous?.focus?.();
    };
  }, [open, ref]);
}

// Fotos livianas: las locales pasan por el optimizador de Next y el celular baja la medida que necesita.
function photoSources(src: string, sizes: string) {
  if (!src.startsWith("/")) return { src };
  const url = (width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  return { src: url(640), srcSet: [256, 384, 640, 828].map((width) => `${url(width)} ${width}w`).join(", "), sizes };
}

function PhotoFallback({ product, large = false }: { product: CatalogProduct; large?: boolean }) {
  return (
    <div className={"image-fallback fallback-" + product.category_id}>
      <span className="fallback-icon"><Icon name={categoryIcon(product.category_id)} size={large ? 52 : 34} /></span>
      <span className="fallback-text">{product.subcategory}</span>
      <small>Foto pendiente</small>
    </div>
  );
}

function ProductVisual({ product, large = false }: { product: CatalogProduct; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const photo = productPhoto(product);
  return (
    <div className={large ? "product-visual product-visual-large" : "product-visual"}>
      {photo && !failed
        ? <img {...photoSources(photo.src, large ? "(max-width: 680px) 100vw, 450px" : "(max-width: 680px) 70vw, 300px")} alt={product.name} width={large ? 640 : 320} height={large ? 640 : 320} loading={large ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <PhotoFallback product={product} large={large} />}
    </div>
  );
}

function CartThumb({ product }: { product: CatalogProduct }) {
  const [failed, setFailed] = useState(false);
  const photo = productPhoto(product);
  return photo && !failed
    ? <img {...photoSources(photo.src, "96px")} alt="" width={96} height={96} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <div className={"image-fallback fallback-" + product.category_id}><Icon name={categoryIcon(product.category_id)} size={26} /></div>;
}

function ProductCard({ product, onOpen, onAdd, inCart = 0 }: {
  product: CatalogProduct;
  onOpen: (product: CatalogProduct) => void;
  onAdd: (product: CatalogProduct) => void;
  inCart?: number;
}) {
  return (
    <article className="product-card" aria-label={product.name}>
      <button className="product-media" onClick={() => onOpen(product)} tabIndex={-1} aria-hidden="true">
        <ProductVisual product={product} />
      </button>
      <div className="product-info">
        <div className="product-meta">
          <span className="product-category">{product.subcategory}</span>
          {product.is_bulky && <span className="product-chip"><Icon name="truck" size={14} /> Voluminoso</span>}
        </div>
        <button className="product-name" onClick={() => onOpen(product)} title={product.name} aria-label={"Ver ficha de " + product.name}>{product.name}</button>
        <span className="product-unit">{product.presentation}</span>
        <div className="product-buy">
          <div className="product-price">
            <strong>{money(product.price_pyg)}</strong>
            <small>Precio de muestra · Consultar stock</small>
          </div>
          <button className="button button-yellow add-button" onClick={() => onAdd(product)} aria-label={"Agregar " + product.name + " al carrito" + (inCart ? ", ya tenés " + inCart : "")}><Icon name="cart" size={18} /> Agregar{inCart > 0 && <span className="in-cart-badge" aria-hidden="true">{inCart}</span>}</button>
        </div>
      </div>
    </article>
  );
}

function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-inner">
        <span className="top-bar-demo"><span className="demo-dot" /> Demo: precios de muestra, stock y entregas por confirmar</span>
        <span className="top-bar-links">
          <span><Icon name="store" size={15} /> Limpio, Paraguay</span>
          <a href={WHATSAPP_URL}><Icon name="chat" size={15} /> WhatsApp {WHATSAPP_LABEL}</a>
        </span>
      </div>
    </div>
  );
}

function SearchSuggestions({ text, onPick, onAdd, onCategory, onSeeAll, listRef }: {
  text: string;
  onPick: (product: CatalogProduct) => void;
  onAdd: (product: CatalogProduct) => void;
  onCategory: (categoryId: string, subcategoryId?: string) => void;
  onSeeAll: () => void;
  listRef: RefObject<HTMLDivElement | null>;
}) {
  const results = useMemo(() => searchProducts(text), [text]);
  const categoryMatches = useMemo(() => suggestCategories(text), [text]);
  const shown = results.slice(0, 5);
  return (
    <div className="search-suggest" id="search-suggest" ref={listRef} onMouseDown={(event) => event.preventDefault()}>
      {shown.length ? (
        <>
          <p className="suggest-title">{results.length === 1 ? "1 producto" : results.length + " productos"}</p>
          <ul className="suggest-list">
            {shown.map(({ product }) => (
              <li key={product.id}>
                <button type="button" className="suggest-open" onClick={() => onPick(product)} aria-label={product.name + ", " + money(product.price_pyg) + ". Ver ficha"}>
                  <span className="suggest-thumb"><CartThumb product={product} /></span>
                  <span className="suggest-copy"><b>{product.name}</b><small>{product.subcategory} · <strong>{money(product.price_pyg)}</strong></small></span>
                </button>
                <button type="button" className="suggest-add" onClick={() => onAdd(product)} aria-label={"Agregar " + product.name + " al carrito"}><Icon name="plus" size={20} /></button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="suggest-empty">
          <p><b>No encontramos “{text.trim()}”.</b> Probá con otra palabra o mirá estas categorías:</p>
          <div className="suggest-chips">{categories.map((category) => <button type="button" key={category.id} className="chip" onClick={() => onCategory(category.id)}>{category.name}</button>)}</div>
          <a className="button button-brand" href={WHATSAPP_URL + "?text=" + encodeURIComponent("Hola, busco: " + text.trim())}><Icon name="chat" size={18} /> Consultar por WhatsApp</a>
        </div>
      )}
      {categoryMatches.length > 0 && (
        <div className="suggest-categories">
          <p className="suggest-title">Categorías</p>
          <div className="suggest-chips">{categoryMatches.map((item) => <button type="button" key={item.label} className="chip" onClick={() => onCategory(item.categoryId, item.subcategoryId)}>{item.label} <small>{item.detail}</small></button>)}</div>
        </div>
      )}
      {results.length > shown.length && <button type="button" className="suggest-all" onClick={onSeeAll}>Ver los {results.length} resultados <Icon name="arrow" size={18} /></button>}
    </div>
  );
}

function Header({ itemCount, query, setQuery, setScreen, goHome, selectCategory, selectSubcategory, onOpenProduct, onAdd }: {
  itemCount: number;
  query: string;
  setQuery: (value: string) => void;
  setScreen: (screen: Screen) => void;
  goHome: () => void;
  selectCategory: (id: string) => void;
  selectSubcategory: (categoryId: string, subcategoryId: string) => void;
  onOpenProduct: (product: CatalogProduct) => void;
  onAdd: (product: CatalogProduct) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useDialog(drawerRef, menuOpen, () => setMenuOpen(false));

  useEffect(() => setDraft(query), [query]);

  // Cierra las sugerencias al tocar fuera del buscador (con el dedo no siempre hay un "blur" confiable).
  useEffect(() => {
    if (!suggestOpen) return;
    const onPointerDown = (event: PointerEvent) => { if (!formRef.current?.contains(event.target as Node)) setSuggestOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [suggestOpen]);

  const showSuggestions = suggestOpen && draft.trim().length >= 2;

  function runSearch(value: string) {
    setSuggestOpen(false);
    setQuery(value.trim());
    if (value.trim()) setScreen("store");
    inputRef.current?.blur();
    window.setTimeout(() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }), 60);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(draft);
  }

  function moveFocus(event: KeyboardEvent<HTMLElement>) {
    const items = [...(suggestRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? [])];
    if (event.key === "Escape") {
      setSuggestOpen(false);
      inputRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") (items[index + 1] ?? items[0])?.focus();
    else if (index <= 0) inputRef.current?.focus();
    else items[index - 1]?.focus();
  }

  return (
    <header className="site-header">
      <TopBar />
      <div className="header-main">
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir categorías" aria-expanded={menuOpen}><Icon name="menu" /></button>
        <button className="brand" onClick={goHome} aria-label="Materiales Santa María, inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-copy"><strong>SANTA MARÍA</strong><small>MATERIALES DE CONSTRUCCIÓN</small></span>
        </button>
        <form
          className={showSuggestions ? "search-box suggesting" : "search-box"}
          onSubmit={submitSearch}
          role="search"
          ref={formRef}
          onKeyDown={moveFocus}
          onBlur={(event) => { if (event.relatedTarget && !formRef.current?.contains(event.relatedTarget as Node)) setSuggestOpen(false); }}
        >
          <Icon name="search" size={20} />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setSuggestOpen(true); }}
            onFocus={() => setSuggestOpen(true)}
            placeholder="¿Qué necesitás para tu obra?"
            aria-label="Buscar productos"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? "search-suggest" : undefined}
            aria-describedby="search-help"
          />
          <span id="search-help" className="sr-only">Escribí al menos dos letras para ver sugerencias. Usá las flechas para recorrerlas.</span>
          <button type="submit">Buscar</button>
          {showSuggestions && (
            <SearchSuggestions
              text={draft}
              listRef={suggestRef}
              onPick={(product) => { setSuggestOpen(false); onOpenProduct(product); }}
              onAdd={onAdd}
              onCategory={(categoryId, subcategoryId) => { setSuggestOpen(false); setDraft(""); setQuery(""); if (subcategoryId) selectSubcategory(categoryId, subcategoryId); else selectCategory(categoryId); }}
              onSeeAll={() => runSearch(draft)}
            />
          )}
        </form>
        <div className="header-actions">
          <a className="header-link header-whatsapp" href={WHATSAPP_URL} aria-label="Consultanos por WhatsApp"><Icon name="chat" /><span><small>¿Te asesoramos?</small>WhatsApp</span></a>
          <button className="header-link" onClick={() => setScreen("tracking")} aria-label="Mi pedido: seguí tu compra"><Icon name="package" /><span><small>Seguí tu compra</small>Mi pedido</span></button>
          <button className="cart-button" onClick={() => setScreen("cart")} aria-label={"Carrito, " + itemCount + (itemCount === 1 ? " producto" : " productos")}>
            <Icon name="cart" /><span>Carrito</span><b>{itemCount}</b>
          </button>
        </div>
      </div>
      <nav className="category-nav" aria-label="Categorías principales">
        <div className="nav-inner">
          <button className="nav-all" onClick={() => setMenuOpen(true)}><Icon name="menu" size={18} /> Categorías</button>
          {categories.map((category) => <button key={category.id} onClick={() => { setQuery(""); selectCategory(category.id); }}><Icon name={categoryIcon(category.id)} size={17} /> {category.name}</button>)}
          <button onClick={() => { setQuery(""); selectSubcategory("sanitarios", "plomeria"); }}>Plomería</button>
          <span className="nav-spacer" />
          <span className="nav-promise"><Icon name="truck" size={17} /> Entrega en obra o retiro</span>
        </div>
      </nav>
      {menuOpen && (
        <div className="menu-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <aside className="menu-drawer" role="dialog" aria-modal="true" aria-labelledby="menu-title" ref={drawerRef}>
            <div className="drawer-head"><h2 id="menu-title">Categorías</h2><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Cerrar categorías"><Icon name="close" /></button></div>
            {categories.map((category) => (
              <div className="menu-group" key={category.id}>
                <button className="menu-category" onClick={() => { setMenuOpen(false); setQuery(""); selectCategory(category.id); }}><span className={"menu-icon tone-" + category.id}><Icon name={categoryIcon(category.id)} /></span>{category.name}<Icon name="arrow" size={18} /></button>
                <div className="menu-subcategories">{category.subcategories.map((subcategory) => <button key={subcategory.id} onClick={() => { setMenuOpen(false); setQuery(""); selectSubcategory(category.id, subcategory.id); }}>{subcategory.name}</button>)}</div>
              </div>
            ))}
            <div className="menu-help"><b>¿No encontrás lo que buscás?</b><a className="button button-brand button-block" href={WHATSAPP_URL}><Icon name="chat" size={18} /> Consultanos por WhatsApp</a></div>
          </aside>
        </div>
      )}
    </header>
  );
}

function PromoBanners({ selectCategory }: { selectCategory: (id: string) => void }) {
  if (!promoBanners.length) return null;
  return (
    <section className="banner-section wrap" aria-label="Promociones de Santa María">
      <div className="banner-grid">
        {promoBanners.map((banner) => (
          <article className="promo-banner" key={banner.id} style={banner.image ? { backgroundImage: `linear-gradient(90deg,rgba(62,42,35,.92),rgba(62,42,35,.35)),url("${banner.image}")` } : undefined}>
            <p className="eyebrow">PROMOCIÓN · HASTA {banner.valid_until}</p>
            <h3>{banner.title}</h3>
            <p>{banner.subtitle}</p>
            {banner.category_id && <button className="button button-yellow" onClick={() => selectCategory(banner.category_id ?? "")}>Ver productos <Icon name="arrow" size={18} /></button>}
          </article>
        ))}
      </div>
    </section>
  );
}

function BankPromotions() {
  if (!bankPromotions.length) {
    return (
      <section className="promo-section wrap" aria-labelledby="promos-title">
        <div className="bank-banner">
          <div className="bank-banner-copy">
            <p className="eyebrow"><Icon name="bank" size={18} /> PROMOCIONES CON BANCOS Y TARJETAS</p>
            <h2 id="promos-title">Beneficios en preparación</h2>
            <p>Santa María está conversando con bancos y emisores de tarjetas. Cuando una promoción esté confirmada la vas a ver acá, con su banco, sus condiciones y su vigencia.</p>
            <a className="button button-yellow" href={WHATSAPP_URL}><Icon name="chat" size={18} /> Consultá formas de pago</a>
          </div>
          <div className="bank-banner-panel">
            <p className="bank-banner-panel-title">Cada promoción va a mostrar</p>
            <ul className="bank-banner-list" aria-label="Qué vas a ver en cada promoción">
              <li><span><Icon name="bank" size={20} /></span><div><b>Banco y tarjetas</b><small>Qué tarjetas participan</small></div></li>
              <li><span><Icon name="check" size={20} /></span><div><b>Beneficio y condiciones</b><small>Cuotas, reintegro o descuento confirmado</small></div></li>
              <li><span><Icon name="package" size={20} /></span><div><b>Vigencia</b><small>Desde y hasta cuándo aplica</small></div></li>
            </ul>
            <p className="bank-banner-note">Todavía no hay promociones bancarias vigentes en esta tienda.</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="promo-section wrap" aria-labelledby="promos-title">
      <div className="section-heading"><div><p className="eyebrow">PROMOCIONES BANCARIAS</p><h2 id="promos-title">Pagá con beneficios</h2></div></div>
      <div className="promo-grid">
        {bankPromotions.map((promotion) => (
          <article className="promo-card" key={promotion.id}>
            <span className="promo-icon">{promotion.logo ? <img src={promotion.logo} alt={promotion.bank} /> : <Icon name="bank" />}</span>
            <div><strong>{promotion.bank}</strong><p>{promotion.benefit}</p><small>{promotion.cards} · {promotion.conditions} · Vigente hasta {promotion.valid_until}</small></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Partners() {
  if (!partners.length) return null;
  return (
    <section className="partners-section wrap" aria-labelledby="partners-title">
      <div className="partners-head"><span className="promo-icon"><Icon name="handshake" /></span><div><p className="eyebrow">ALIANZAS Y MARCAS</p><h2 id="partners-title">Aliados de Santa María</h2></div></div>
      <div className="partner-grid">
        {partners.map((partner) => {
          const content = partner.logo ? <img src={partner.logo} alt={partner.name} loading="lazy" /> : partner.name;
          return partner.url
            ? <a className="partner-logo" key={partner.id} href={partner.url} target="_blank" rel="noopener noreferrer">{content}</a>
            : <div className="partner-logo" key={partner.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}

function SiteFooter({ goHome, selectCategory, setScreen }: { goHome: () => void; selectCategory: (id: string) => void; setScreen: (screen: Screen) => void }) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-about">
          <button className="brand footer-brand" onClick={goHome}><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span className="brand-copy"><strong>SANTA MARÍA</strong><small>MATERIALES DE CONSTRUCCIÓN</small></span></button>
          <p>Ferretería y materiales para construcción en Limpio, Paraguay.</p>
          <a className="button button-yellow" href={WHATSAPP_URL}><Icon name="chat" size={18} /> WhatsApp {WHATSAPP_LABEL}</a>
        </div>
        <div><h3>Categorías</h3>{categories.map((category) => <button key={category.id} onClick={() => selectCategory(category.id)}>{category.name}</button>)}</div>
        <div><h3>Tu compra</h3><button onClick={() => setScreen("cart")}>Carrito</button><button onClick={() => setScreen("tracking")}>Seguí tu pedido</button><span>Entrega en obra o retiro en el local</span></div>
        <div><h3>El local</h3><span>Limpio, Paraguay</span><span>Dirección y horarios: a confirmar</span><span>Medios de pago: a confirmar</span></div>
      </div>
      <div className="footer-bottom">© 2026 Materiales Santa María · Demo de presentación: precios, stock, pagos y entregas son de muestra.</div>
    </footer>
  );
}

function MobileNav({ screen, itemCount, goHome, openSearch, setScreen }: { screen: Screen; itemCount: number; goHome: () => void; openSearch: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Navegación rápida">
      <button className={screen === "store" ? "active" : ""} aria-current={screen === "store" ? "page" : undefined} onClick={goHome}><Icon name="home" /><span>Inicio</span></button>
      <button onClick={openSearch}><Icon name="search" /><span>Buscar</span></button>
      <a href={WHATSAPP_URL}><Icon name="chat" /><span>WhatsApp</span></a>
      <button className={screen === "tracking" ? "active" : ""} aria-current={screen === "tracking" ? "page" : undefined} onClick={() => setScreen("tracking")}><Icon name="package" /><span>Mi pedido</span></button>
      <button className={screen === "cart" ? "active" : ""} aria-current={screen === "cart" ? "page" : undefined} aria-label={"Carrito, " + itemCount + (itemCount === 1 ? " producto" : " productos")} onClick={() => setScreen("cart")}><span className="mobile-cart"><Icon name="cart" />{itemCount > 0 && <b>{itemCount}</b>}</span><span>Carrito</span></button>
    </nav>
  );
}

function ProductRow({ category, items, cart, onOpen, onAdd, onSeeAll, onSubcategory }: { category: ProductCategory; items: CatalogProduct[]; cart: CartState; onOpen: (product: CatalogProduct) => void; onAdd: (product: CatalogProduct) => void; onSeeAll: () => void; onSubcategory: (id: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = () => {
    const row = rowRef.current;
    if (row) setEdges({ start: row.scrollLeft < 8, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 8 });
  };
  useEffect(updateEdges, []);
  const scroll = (direction: number) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.9, behavior: "smooth" });
  };
  return (
    <section className={"product-row-section wrap tone-" + category.id} id={"fila-" + category.id} aria-labelledby={"fila-title-" + category.id}>
      <div className="row-heading">
        <span className="category-icon" aria-hidden="true"><Icon name={categoryIcon(category.id)} size={24} /></span>
        <div className="row-title"><h2 id={"fila-title-" + category.id}>{category.name}</h2><small>{items.length} productos</small></div>
        <div className="row-controls">
          <button className="row-arrow" aria-label={"Ver productos anteriores de " + category.name} aria-controls={"carrusel-" + category.id} disabled={edges.start} onClick={() => scroll(-1)}><Icon name="arrow" size={18} /></button>
          <button className="row-arrow" aria-label={"Ver más productos de " + category.name} aria-controls={"carrusel-" + category.id} disabled={edges.end} onClick={() => scroll(1)}><Icon name="arrow" size={18} /></button>
        </div>
        <button className="link-button" onClick={onSeeAll} aria-label={"Ver todo " + category.name}>Ver todo <Icon name="arrow" size={18} /></button>
      </div>
      <div className="row-subcategories" role="group" aria-label={"Subcategorías de " + category.name}>
        {category.subcategories.map((subcategory) => <button key={subcategory.id} className="chip" onClick={() => onSubcategory(subcategory.id)}>{subcategory.name}</button>)}
      </div>
      <div className="product-row" id={"carrusel-" + category.id} ref={rowRef} onScroll={updateEdges} role="region" aria-roledescription="carrusel" aria-label={"Productos de " + category.name + ". Deslizá para ver más."} tabIndex={0}>
        {items.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} onAdd={onAdd} inCart={cart[product.id] ?? 0} />)}
      </div>
    </section>
  );
}

function homeProductsForCategory(categoryId: string): CatalogProduct[] {
  return products
    .filter((product) => product.category_id === categoryId)
    .map((product, index) => ({ product, index, hasImage: productPhoto(product) !== null }))
    .sort((a, b) => Number(b.hasImage) - Number(a.hasImage) || a.index - b.index)
    .map(({ product }) => product);
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
  const [announcement, setAnnouncement] = useState("");
  const modalRef = useRef<HTMLElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
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
  useDialog(modalRef, Boolean(selectedProduct), () => setSelectedProduct(null));
  useDialog(filterRef, filtersOpen, () => setFiltersOpen(false));

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

  const searchRanking = useMemo(() => (query.trim() ? searchProducts(query).map((result) => result.product) : products), [query]);

  const filteredProducts = useMemo(() => {
    const minimum = filters.minimum ? Number(filters.minimum) : 0;
    const maximum = filters.maximum ? Number(filters.maximum) : Number.POSITIVE_INFINITY;
    let list = searchRanking.filter((product) => {
      const correctCategory = !categoryId || product.category_id === categoryId;
      const correctSubcategory = !subcategoryId || product.subcategory_id === subcategoryId;
      const correctBrand = !filters.brand || product.brand === filters.brand;
      const correctAvailability = !filters.availability || product.availability === filters.availability;
      const correctSize = !filters.smallOnly || !product.is_bulky;
      const correctPrice = product.price_pyg >= minimum && product.price_pyg <= maximum;
      return correctCategory && correctSubcategory && correctBrand && correctAvailability && correctSize && correctPrice;
    });
    if (sortOrder === "price_asc") list = [...list].sort((a, b) => a.price_pyg - b.price_pyg);
    if (sortOrder === "price_desc") list = [...list].sort((a, b) => b.price_pyg - a.price_pyg);
    if (sortOrder === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [categoryId, subcategoryId, searchRanking, sortOrder, filters]);

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
    setToast("");
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

  function selectSubcategory(nextCategoryId: string, nextSubcategoryId: string) {
    selectCategory(nextCategoryId);
    setSubcategoryId(nextSubcategoryId);
  }

  function openSearch() {
    if (screen !== "store") changeScreen("store");
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector<HTMLInputElement>(".search-box input")?.focus();
    }, 60);
  }

  function addToCart(product: CatalogProduct, quantity = 1) {
    setCart((current) => ({ ...current, [product.id]: Math.min(999, (current[product.id] ?? 0) + quantity) }));
    setSelectedProduct(null);
    setDetailQuantity(1);
    showToast("Agregaste " + quantity + " × " + product.name + " al carrito. Tenés " + (itemCount + quantity) + (itemCount + quantity === 1 ? " producto." : " productos."));
  }

  function updateQuantity(productId: string, amount: number) {
    const product = products.find((item) => item.id === productId);
    const nextQuantity = Math.max(0, Math.min(999, (cart[productId] ?? 0) + amount));
    if (product) setAnnouncement(nextQuantity ? product.name + ": " + nextQuantity + " en el carrito." : product.name + " se quitó del carrito.");
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
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        wants_invoice: customer.wantsInvoice,
        ruc: customer.ruc,
        business_name: customer.businessName,
        whatsapp_updates: customer.whatsappUpdates,
      },
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

  const relatedProducts = selectedProduct
    ? [
        ...products.filter((product) => product.id !== selectedProduct.id && product.subcategory_id === selectedProduct.subcategory_id),
        ...products.filter((product) => product.id !== selectedProduct.id && product.category_id === selectedProduct.category_id && product.subcategory_id !== selectedProduct.subcategory_id),
      ].slice(0, 4)
    : [];
  const isHome = !categoryId && !query.trim();
  const storefrontProducts = filteredProducts;
  const openProduct = (item: CatalogProduct) => { setSelectedProduct(item); setDetailQuantity(1); };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Header itemCount={itemCount} query={query} setQuery={setQuery} setScreen={changeScreen} goHome={goHome} selectCategory={selectCategory} selectSubcategory={selectSubcategory} onOpenProduct={openProduct} onAdd={(product) => addToCart(product)} />
      <div id="contenido" tabIndex={-1} />

      {screen === "store" && (
        <>
          {!categoryId && !query.trim() && (
            <>
              <section className="hero">
                <div className="wrap hero-inner">
                  <div className="hero-copy">
                    <p className="eyebrow"><span /> FERRETERÍA Y MATERIALES · LIMPIO</p>
                    <h1>Todo para tu obra, <em>en un solo lugar.</em></h1>
                    <p className="hero-text">Herramientas, sanitarios, electricidad y materiales de construcción. Pedí desde el celular y elegí si te lo llevamos a la obra o lo retirás en el local.</p>
                    <div className="hero-actions">
                      <button className="button button-yellow button-large" onClick={() => selectCategory("construccion")}>Ver materiales de obra <Icon name="arrow" size={18} /></button>
                      <a className="button button-ghost button-large" href={WHATSAPP_URL}><Icon name="chat" size={18} /> Pedí asesoramiento</a>
                    </div>
                  </div>
                  <div className="hero-steps" aria-label="Cómo comprar">
                    <p className="hero-steps-title">Comprá en 3 pasos</p>
                    <ol>
                      <li><span><Icon name="search" /></span><div><b>Elegí tus productos</b><small>Buscá por nombre o por categoría.</small></div></li>
                      <li><span><Icon name="truck" /></span><div><b>Entrega en obra o retiro</b><small>Elegí cómo recibir tu pedido.</small></div></li>
                      <li><span><Icon name="package" /></span><div><b>Seguí tu pedido</b><small>Con tu número de pedido.</small></div></li>
                    </ol>
                  </div>
                </div>
              </section>

              <section className="benefit-strip wrap" aria-label="Por qué comprar en Santa María">
                <div><Icon name="truck" /><span><b>Entrega en obra</b><small>Zonas y costos a confirmar</small></span></div>
                <div><Icon name="store" /><span><b>Retiro en el local</b><small>En Limpio</small></span></div>
                <div><Icon name="chat" /><span><b>Te asesoramos</b><small>Consultanos por WhatsApp</small></span></div>
                <div><Icon name="shield" /><span><b>Pedido con seguimiento</b><small>Con tu número de pedido</small></span></div>
              </section>

              <nav className="category-quick wrap" aria-label="Comprá por categoría">
                {categories.map((category) => (
                  <a className={"quick-card tone-" + category.id} key={category.id} id={"category-" + category.id} href={"#fila-" + category.id}>
                    <span className="category-icon"><Icon name={categoryIcon(category.id)} size={26} /></span>
                    <span><strong>{category.name}</strong><small>{products.filter((product) => product.category_id === category.id).length} productos</small></span>
                  </a>
                ))}
              </nav>

              <ProductRow category={categories.find((category) => category.id === "ferreteria")!} items={homeProductsForCategory("ferreteria")} cart={cart} onOpen={openProduct} onAdd={addToCart} onSeeAll={() => selectCategory("ferreteria")} onSubcategory={(id) => selectSubcategory("ferreteria", id)} />
              <ProductRow category={categories.find((category) => category.id === "sanitarios")!} items={homeProductsForCategory("sanitarios")} cart={cart} onOpen={openProduct} onAdd={addToCart} onSeeAll={() => selectCategory("sanitarios")} onSubcategory={(id) => selectSubcategory("sanitarios", id)} />
              <BankPromotions />
              <ProductRow category={categories.find((category) => category.id === "construccion")!} items={homeProductsForCategory("construccion")} cart={cart} onOpen={openProduct} onAdd={addToCart} onSeeAll={() => selectCategory("construccion")} onSubcategory={(id) => selectSubcategory("construccion", id)} />
              <ProductRow category={categories.find((category) => category.id === "electricos")!} items={homeProductsForCategory("electricos")} cart={cart} onOpen={openProduct} onAdd={addToCart} onSeeAll={() => selectCategory("electricos")} onSubcategory={(id) => selectSubcategory("electricos", id)} />
              <PromoBanners selectCategory={selectCategory} />
            </>
          )}

          {!isHome && <section className="catalog-section wrap catalog-only" id="catalogo">
            {selectedCategory && <div className="breadcrumbs"><button onClick={goHome}>Inicio</button><span><i>/</i>{subcategoryId ? <button onClick={() => setSubcategoryId("")}>{selectedCategory.name}</button> : <b>{selectedCategory.name}</b>}</span>{subcategoryId && <span><i>/</i><b>{selectedCategory.subcategories.find((item) => item.id === subcategoryId)?.name}</b></span>}</div>}
            <div className="section-heading catalog-heading">
              <div><p className="eyebrow">{query ? "RESULTADOS DE BÚSQUEDA" : selectedCategory ? "CATEGORÍA" : "SELECCIÓN PARA TU OBRA"}</p><h2>{query ? "Resultados para “" + query + "”" : selectedCategory?.name || "Productos destacados"}</h2></div>
              {(selectedCategory || query) && <button className="clear-filter" onClick={goHome}>Ver todo <Icon name="close" size={16} /></button>}
            </div>
            {selectedCategory && (
              <div className="subcategory-row" aria-label="Subcategorías">
                <button className={!subcategoryId ? "chip active" : "chip"} onClick={() => setSubcategoryId("")}>Todas</button>
                {selectedCategory.subcategories.map((subcategory) => <button id={"subcategory-" + subcategory.id} key={subcategory.id} className={subcategoryId === subcategory.id ? "chip active" : "chip"} onClick={() => setSubcategoryId(subcategory.id)}>{subcategory.name}</button>)}
              </div>
            )}
            <div className="catalog-tools">
              <span role="status">{storefrontProducts.length} productos{query ? " encontrados" : ""}</span>
              <button className="filter-toggle" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog"><Icon name="grid" size={16} /> Filtrar</button>
              <label className="sort-control"><span>Ordenar por</span>
                <select aria-label="Ordenar productos" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
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
              </aside>
              {storefrontProducts.length ? <div className="product-grid">{storefrontProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={openProduct} onAdd={addToCart} inCart={cart[product.id] ?? 0} />)}</div> : (
                <div className="empty-results"><Icon name="search" size={34} /><h3>{query ? "No encontramos “" + query + "”" : "No hay productos con estos filtros."}</h3><p>{query ? "Revisá cómo lo escribiste o buscá por categoría. Si no está en la web, preguntanos: capaz lo tenemos en el local." : "Probá quitando alguno."}</p><div className="empty-categories">{categories.map((category) => <button key={category.id} onClick={() => selectCategory(category.id)}>{category.name}</button>)}</div>{query && <a className="button button-brand" href={WHATSAPP_URL + "?text=" + encodeURIComponent("Hola, busco: " + query.trim())}><Icon name="chat" size={18} /> Consultar por WhatsApp</a>}</div>
              )}
            </div>
          </section>}

          {isHome && (
            <>
              <section className="service-band wrap">
                <div className="service-card service-delivery"><Icon name="truck" size={30} /><div><h3>Te lo llevamos a la obra</h3><p>Elegí tu zona al finalizar la compra y coordinamos la entrega. Zonas, costos y plazos de demostración.</p></div></div>
                <div className="service-card service-pickup"><Icon name="store" size={30} /><div><h3>O retiralo en el local</h3><p>Pedí por la web y pasá a buscar tu pedido en Limpio en el día y horario que elijas.</p></div></div>
              </section>
              <section className="list-cta wrap">
                <div><p className="eyebrow">¿TENÉS TU LISTA DE MATERIALES?</p><h2>Mandanos tu lista y te ayudamos a armar el pedido</h2><p>Escribinos por WhatsApp con lo que necesitás para tu obra y te orientamos con cantidades y productos.</p></div>
                <a className="button button-yellow button-large" href={WHATSAPP_URL}><Icon name="chat" size={20} /> Enviar mi lista</a>
              </section>
              <Partners />
            </>
          )}
        </>
      )}

      {screen === "cart" && (
        <section className="flow-page wrap">
          <Breadcrumbs items={["Inicio", "Tu carrito"]} goHome={goHome} />
          <div className="flow-title"><div><p className="eyebrow">REVISÁ TU PEDIDO</p><h1>Tu carrito</h1></div><span className="step-pill">Paso 1 de 4</span></div>
          {cartProducts.length === 0 ? <div className="empty-cart"><Icon name="cart" size={34} /><h2>Tu carrito está vacío</h2><p>Buscá lo que necesitás para tu obra y agregalo acá.</p><button className="button button-brand" onClick={goHome}>Ir al inicio</button></div> : (
            <div className="checkout-layout">
              <div className="cart-lines">
                {cartProducts.map((product) => <div className="cart-line" key={product.id}>
                  <div className="cart-thumb"><CartThumb product={product} /></div>
                  <div className="cart-product"><span>{product.subcategory}{product.is_bulky ? " · Voluminoso" : ""}</span><strong>{product.name}</strong><small>{product.presentation} · {money(product.price_pyg)} c/u</small></div>
                  <QuantityControl label={product.name} value={cart[product.id]} onChange={(change) => updateQuantity(product.id, change)} />
                  <div className="line-total">{money(product.price_pyg * cart[product.id])}<button aria-label={"Quitar " + product.name + " del carrito"} onClick={() => { setAnnouncement(product.name + " se quitó del carrito."); setCart((current) => { const next = { ...current }; delete next[product.id]; return next; }); }}>Quitar</button></div>
                </div>)}
                {hasBulky && <div className="notice-box">Tu carrito tiene productos voluminosos. La entrega se hace en camión y puede tardar un poco más (plazos de demostración).</div>}
                <button className="back-link" onClick={goHome}>← Seguir comprando</button>
              </div>
              <OrderSummary subtotal={subtotal} deliveryFee={null} total={null} itemCount={itemCount} onContinue={() => changeScreen("fulfillment")} continueLabel="Continuar con la compra" />
              <div className="mobile-checkout-bar"><div><small>Subtotal ({itemCount})</small><strong>{money(subtotal)}</strong></div><button className="button button-yellow" onClick={() => changeScreen("fulfillment")}>Continuar <Icon name="arrow" size={18} /></button></div>
            </div>
          )}
        </section>
      )}

      {screen === "fulfillment" && (
        <section className="flow-page wrap">
          <Breadcrumbs items={["Inicio", "Carrito", "Entrega o retiro"]} goHome={goHome} goCart={() => changeScreen("cart")} />
          <div className="flow-title"><div><p className="eyebrow">PASO 2 DE 4</p><h1>¿Cómo querés recibir tu pedido?</h1></div><span className="step-pill">Entrega</span></div>
          <div className="checkout-layout">
            <div className="form-column">
              <div className="form-card">
                <div className="choice-grid">
                  <button className={fulfillmentType === "delivery" ? "choice selected" : "choice"} aria-pressed={fulfillmentType === "delivery"} onClick={() => { setFulfillmentType("delivery"); setFieldError(""); }}><span aria-hidden="true">🚚</span><b>Entrega en obra</b><small>Te lo llevamos a la dirección que nos indiques.</small></button>
                  <button className={fulfillmentType === "pickup" ? "choice selected" : "choice"} aria-pressed={fulfillmentType === "pickup"} onClick={() => { setFulfillmentType("pickup"); setFieldError(""); }}><span aria-hidden="true">⌂</span><b>Retiro en el local</b><small>Pasás a buscar tu pedido en Santa María, Limpio.{pickup.fee_pyg === 0 ? " Sin costo en esta demostración." : " Costo de retiro de demostración: " + money(pickup.fee_pyg) + "."}</small></button>
                </div>
                {fulfillmentType === "delivery" ? (
                  <div className="form-stack">
                    <label className="form-field">Zona o ciudad<select value={zoneId} onChange={(event) => setZoneId(event.target.value)}><option value="">Elegí tu zona</option>{zones.map((zone) => <option key={zone.id} value={zone.id} disabled={!zone.available}>{zone.name}{zone.available ? "" : " · " + zone.unavailable_message}</option>)}</select></label>
                    <div className="form-grid"><label className="form-field">Calle<input required autoComplete="address-line1" enterKeyHint="next" value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} placeholder="Nombre de la calle" /></label><label className="form-field">Número o referencia<input required autoComplete="address-line2" enterKeyHint="next" value={address.number} onChange={(event) => setAddress({ ...address, number: event.target.value })} placeholder="N.º de casa o entre calles" /></label></div>
                    <div className="form-grid"><label className="form-field">Barrio<input autoComplete="address-level3" enterKeyHint="next" value={address.neighborhood} onChange={(event) => setAddress({ ...address, neighborhood: event.target.value })} placeholder="Tu barrio" /></label><label className="form-field">Punto de referencia<input enterKeyHint="next" value={address.landmark} onChange={(event) => setAddress({ ...address, landmark: event.target.value })} placeholder="Ej.: portón verde, frente a la escuela" /></label></div>
                    <label className="form-field">Ubicación (opcional)<input type="url" value={address.mapLink} onChange={(event) => setAddress({ ...address, mapLink: event.target.value })} placeholder="Pegá el enlace del mapa" /></label>
                    <div className="form-grid"><label className="form-field">Nombre de quien recibe (opcional)<input autoComplete="off" value={address.receiverName} onChange={(event) => setAddress({ ...address, receiverName: event.target.value })} placeholder={customer.name || "Si recibe otra persona"} /></label><label className="form-field">Teléfono de quien recibe (opcional)<input inputMode="tel" autoComplete="off" value={address.receiverPhone} onChange={(event) => setAddress({ ...address, receiverPhone: event.target.value })} placeholder={customer.phone || "Teléfono"} /></label></div>
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
                <div className="form-grid"><label className="form-field">Nombre y apellido<input autoComplete="name" enterKeyHint="next" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Cómo te llamás" /></label><label className="form-field">Teléfono o WhatsApp<input autoComplete="tel" inputMode="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="0981 123 456" /></label></div>
                <label className="form-field">Correo electrónico (opcional)<input type="email" autoComplete="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="tu@correo.com" /></label>
                <label className="checkbox-line"><input type="checkbox" checked={customer.wantsInvoice} onChange={(event) => setCustomer({ ...customer, wantsInvoice: event.target.checked })} /> Necesito factura con RUC</label>
                {customer.wantsInvoice && <div className="form-grid"><label className="form-field">RUC o cédula<input inputMode="numeric" value={customer.ruc} onChange={(event) => setCustomer({ ...customer, ruc: event.target.value })} /></label><label className="form-field">Razón social<input value={customer.businessName} onChange={(event) => setCustomer({ ...customer, businessName: event.target.value })} /></label></div>}
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
              <div className="form-card review-card"><h2>Resumen de tu pedido</h2>{cartProducts.map((product) => <p key={product.id}>{cart[product.id]} × {product.name} · {money(product.price_pyg * cart[product.id])}</p>)}<p><b>Entrega:</b> {deliveryText}</p><p><b>Cliente:</b> {customer.name} · {customer.phone}</p><p><b>Pago:</b> {paymentMethod === "transferencia" ? "Transferencia bancaria" : paymentMethod === "tarjeta" ? "Tarjeta de crédito o débito" : "Efectivo al recibir o al retirar"}</p><p><b>Total:</b> {money(orderTotal)}</p><button type="button" className="back-link" onClick={() => changeScreen("customer")}>Cambiar datos</button></div>
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
            <form className="tracking-search" onSubmit={searchOrder}><label>Número de pedido<input autoCapitalize="characters" value={trackingQuery} onChange={(event) => setTrackingQuery(event.target.value)} placeholder="Ej.: SM-00001" /></label><button className="button button-yellow">Buscar pedido</button></form>
            {fieldError && <p className="field-error" role="alert">{fieldError}</p>}
            {trackingOrder && <div className="tracking-result">
              <div className="tracking-order"><span>Pedido</span><b>{trackingOrder.order_number}</b><small>{statusLabels[trackingOrder.status]}</small></div>
              {trackingOrder.status === "cancelado" ? <div className="notice-box">Este pedido fue cancelado. Si tenés dudas, escribinos.</div> : (
                <ol className="timeline">{(trackingOrder.fulfillment.type === "pickup" ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"] : ["recibido", "en_preparacion", "en_camino", "entregado"]).map((status) => {
                  const historyEntry = trackingOrder.status_history.find((entry) => entry.status === status);
                  const currentIndex = (trackingOrder.fulfillment.type === "pickup" ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"] : ["recibido", "en_preparacion", "en_camino", "entregado"]).indexOf(trackingOrder.status);
                  const stepIndex = (trackingOrder.fulfillment.type === "pickup" ? ["recibido", "en_preparacion", "listo_para_retirar", "entregado"] : ["recibido", "en_preparacion", "en_camino", "entregado"]).indexOf(status);
                  const date = historyEntry ? formatDateTime(historyEntry.at) : null;
                  return <li className={stepIndex === currentIndex ? "current" : stepIndex < currentIndex ? "done" : ""} key={status}><i>{stepIndex <= currentIndex ? "✓" : stepIndex + 1}</i><div><b>{statusLabels[status as OrderStatus]}</b><small>{historyEntry && date ? "Actualizado el " + date.date + " a las " + date.time : "Pendiente"}</small></div></li>;
                })}</ol>
              )}
              <div className="tracking-order-summary"><h3>Resumen del pedido</h3>{trackingOrder.items.map((item) => <p key={item.product_id}>{item.quantity} × {item.name} <span>{money(item.price_pyg * item.quantity)}</span></p>)}<p><b>Total</b><b>{money(trackingOrder.total_pyg)}</b></p><small>{trackingOrder.fulfillment.type === "pickup" ? "Retiro en local: " + formatPickupDate(trackingOrder.fulfillment.date) + " · " + trackingOrder.fulfillment.slot_label : "Entrega en " + trackingOrder.fulfillment.zone_name + " · " + trackingOrder.fulfillment.address}</small></div>
              {trackingOrder.status !== "entregado" && trackingOrder.status !== "cancelado" && <div className="tracking-demo-controls"><button className="button button-outline advance-status" onClick={advanceDemoStatus}>Avanzar estado de demostración</button><button className="text-link" onClick={cancelDemoOrder}>Cancelar pedido de demostración</button></div>}
            </div>}
            <p className="form-note">El estado lo actualiza el equipo de Santa María desde su panel. En esta demo, es simulado.</p>
          </div>
        </section>
      )}

      <SiteFooter goHome={goHome} selectCategory={selectCategory} setScreen={changeScreen} />
      {!["fulfillment", "customer", "payment"].includes(screen) && <MobileNav screen={screen} itemCount={itemCount} goHome={goHome} openSearch={openSearch} setScreen={changeScreen} />}

      {filtersOpen && <div className="filter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filters-title" ref={filterRef}><div className="drawer-head"><h2 id="filters-title">Filtros</h2><button className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros"><Icon name="close" /></button></div><label>Subcategoría<select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Todas</option>{(selectedCategory?.subcategories || categories.flatMap((category) => category.subcategories)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Marca<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Todas</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label><fieldset><legend>Precio</legend><div className="price-fields"><input inputMode="numeric" aria-label="Precio mínimo" placeholder="Desde Gs." value={filters.minimum} onChange={(event) => setFilters({ ...filters, minimum: event.target.value.replace(/\D/g, "") })} /><input inputMode="numeric" aria-label="Precio máximo" placeholder="Hasta Gs." value={filters.maximum} onChange={(event) => setFilters({ ...filters, maximum: event.target.value.replace(/\D/g, "") })} /></div></fieldset><label>Disponibilidad<select value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })}><option value="">Todas</option><option value="disponible">Disponible</option><option value="pocas_unidades">Pocas unidades</option><option value="consultar">Consultar disponibilidad</option></select></label><label className="checkbox-line"><input type="checkbox" checked={filters.smallOnly} onChange={(event) => setFilters({ ...filters, smallOnly: event.target.checked })} /> Solo productos chicos</label><button className="text-link" onClick={resetFilters}>Limpiar filtros</button><button className="button button-brand button-block" onClick={() => setFiltersOpen(false)}>Ver {storefrontProducts.length} resultados</button></div></div>}

      {selectedProduct && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title" ref={modalRef}><button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Cerrar ficha"><Icon name="close" /></button><ProductVisual product={selectedProduct} large /><div className="modal-copy"><p className="eyebrow">{selectedProduct.category} · {selectedProduct.subcategory}</p><h2 id="product-title">{selectedProduct.name}</h2><p><b>Marca:</b> {selectedProduct.brand}</p><p><b>Código:</b> {selectedProduct.sku}</p><p><b>Presentación:</b> {selectedProduct.presentation}</p><p><b>Disponibilidad:</b> {selectedProduct.availability === "disponible" ? "Disponible" : selectedProduct.availability === "pocas_unidades" ? "Pocas unidades" : "Consultar disponibilidad"}</p><p className="photo-note">{productPhoto(selectedProduct) ? "Foto: " + productPhoto(selectedProduct)?.source : "Foto del producto pendiente de confirmar."}</p>{selectedProduct.availability === "consultar" && <div className="notice-box">Te confirmamos la disponibilidad después de recibir tu pedido.</div>}{selectedProduct.is_bulky && <div className="notice-box">Producto voluminoso: se entrega en camión en tu obra o se retira coordinado en el local.</div>}<div className="modal-buy"><div className="modal-buy-price"><small className="price-label">PRECIO DE MUESTRA</small><strong className="modal-price">{money(selectedProduct.price_pyg)}</strong></div><QuantityControl label={selectedProduct.name} value={detailQuantity} onChange={(change) => setDetailQuantity((current) => Math.max(1, Math.min(999, current + change)))} /><button className="button button-yellow button-block button-large" onClick={() => addToCart(selectedProduct, detailQuantity)} aria-label={"Agregar " + detailQuantity + " al carrito"}><Icon name="cart" size={18} /> Agregar<span className="hide-narrow"> al carrito</span></button></div><div className="related-products"><b id="related-title">También te puede servir</b><div role="group" aria-labelledby="related-title">{relatedProducts.map((product) => <button key={product.id} onClick={() => { setSelectedProduct(product); setDetailQuantity(1); }}>{product.name}</button>)}</div></div></div></section></div>}
      <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><span>{toast}</span><button onClick={() => changeScreen("cart")}>Ir al carrito</button></div>}</div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </main>
  );
}

function QuantityControl({ value, onChange, label }: { value: number; onChange: (amount: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  function commitQuantity() {
    const parsed = Number(draft);
    const next = Number.isInteger(parsed) ? Math.max(1, Math.min(999, parsed)) : value;
    setDraft(String(next));
    if (next !== value) onChange(next - value);
  }

  return (
    <div className="quantity-control" role="group" aria-label={"Cantidad de " + label}>
      <button type="button" onClick={() => onChange(-1)} aria-label={"Quitar una unidad de " + label}>−</button>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        max="999"
        step="1"
        aria-label={"Cantidad de " + label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitQuantity}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitQuantity();
          }
        }}
      />
      <button type="button" onClick={() => onChange(1)} aria-label={"Sumar una unidad de " + label}>+</button>
    </div>
  );
}

function Breadcrumbs({ items, goHome, goCart }: { items: string[]; goHome: () => void; goCart?: () => void }) {
  return <div className="breadcrumbs"><button onClick={goHome}>Inicio</button>{items.slice(1).map((item, index) => <span key={item}><i>/</i>{index === items.length - 2 ? <b>{item}</b> : <button onClick={item === "Carrito" && goCart ? goCart : goHome}>{item}</button>}</span>)}</div>;
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
