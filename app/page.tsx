"use client";

import { useMemo, useState, type FormEvent } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  unit: string;
  price: number;
  emoji: string;
  bulky?: boolean;
};

type Cart = Record<string, number>;
type Screen = "store" | "cart" | "checkout" | "confirmation" | "tracking";

const CATEGORIES = [
  { name: "Ferretería", emoji: "🛠️", tone: "sand" },
  { name: "Sanitarios", emoji: "🚿", tone: "blue" },
  { name: "Materiales de construcción", emoji: "🧱", tone: "clay" },
  { name: "Materiales eléctricos", emoji: "💡", tone: "gold" },
];

const PRODUCTS: Product[] = [
  { id: "cemento-1", name: "Cemento Portland Tipo I", category: "Materiales de construcción", subcategory: "Cemento", unit: "Bolsa de 50 kg", price: 68000, emoji: "🧱", bulky: true },
  { id: "ladrillo-1", name: "Ladrillo hueco 6 tubos", category: "Materiales de construcción", subcategory: "Cerámica", unit: "Unidad", price: 4900, emoji: "🧱", bulky: true },
  { id: "arena-1", name: "Arena lavada", category: "Materiales de construcción", subcategory: "Agregados", unit: "Bolsa", price: 16000, emoji: "⛰️", bulky: true },
  { id: "caño-1", name: "Caño PVC sanitario 100 mm", category: "Materiales de construcción", subcategory: "Plomería", unit: "Tramo de 6 m", price: 42000, emoji: "🪠", bulky: true },
  { id: "inodoro-1", name: "Inodoro con mochila", category: "Sanitarios", subcategory: "Inodoros", unit: "Unidad", price: 465000, emoji: "🚽" },
  { id: "ducha-1", name: "Ducha eléctrica básica", category: "Sanitarios", subcategory: "Duchas", unit: "Unidad", price: 198000, emoji: "🚿" },
  { id: "griferia-1", name: "Grifería monocomando", category: "Sanitarios", subcategory: "Griferías", unit: "Unidad", price: 315000, emoji: "🚰" },
  { id: "lavatorio-1", name: "Lavatorio de loza", category: "Sanitarios", subcategory: "Lavatorios", unit: "Unidad", price: 235000, emoji: "🚰" },
  { id: "cable-1", name: "Cable unipolar 2,5 mm", category: "Materiales eléctricos", subcategory: "Cables", unit: "Rollo de 100 m", price: 228000, emoji: "🔌" },
  { id: "llave-1", name: "Llave termomagnética 20 A", category: "Materiales eléctricos", subcategory: "Protección", unit: "Unidad", price: 42000, emoji: "⚡" },
  { id: "toma-1", name: "Tomacorriente doble", category: "Materiales eléctricos", subcategory: "Tomacorrientes", unit: "Unidad", price: 18500, emoji: "🔌" },
  { id: "foco-1", name: "Lámpara LED 12 W", category: "Materiales eléctricos", subcategory: "Iluminación", unit: "Unidad", price: 13500, emoji: "💡" },
  { id: "taladro-1", name: "Taladro percutor 13 mm", category: "Ferretería", subcategory: "Herramientas eléctricas", unit: "Unidad", price: 595000, emoji: "🔧" },
  { id: "martillo-1", name: "Martillo de carpintero", category: "Ferretería", subcategory: "Herramientas manuales", unit: "Unidad", price: 68000, emoji: "🔨" },
  { id: "disco-1", name: "Disco de corte 115 mm", category: "Ferretería", subcategory: "Accesorios", unit: "Unidad", price: 12000, emoji: "⚙️" },
  { id: "cinta-1", name: "Cinta métrica 5 m", category: "Ferretería", subcategory: "Medición", unit: "Unidad", price: 39000, emoji: "📏" },
];

const money = (amount: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(amount);

export default function Home() {
  const [screen, setScreen] = useState<Screen>("store");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [delivery, setDelivery] = useState<"obra" | "retiro">("obra");
  const [orderCode, setOrderCode] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(
    () =>
      PRODUCTS.filter((product) => {
        const matchesCategory = !category || product.category === category;
        const text = `${product.name} ${product.subcategory} ${product.category}`.toLowerCase();
        return matchesCategory && text.includes(query.trim().toLowerCase());
      }),
    [category, query],
  );

  const cartProducts = PRODUCTS.filter((product) => cart[product.id]);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = cartProducts.reduce(
    (sum, product) => sum + product.price * cart[product.id],
    0,
  );

  function addToCart(product: Product) {
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] ?? 0) + 1,
    }));
    setNotice(`${product.name} agregado al carrito`);
    setSelectedProduct(null);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[productId] ?? 0) + amount;
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }

  function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = `SM-${String(Date.now()).slice(-5)}`;
    setOrderCode(code);
    setTrackingCode(code);
    try {
      window.localStorage.setItem(
        "santamaria-demo-order",
        JSON.stringify({ code, items: cart, subtotal, status: "En preparación" }),
      );
    } catch {
      // La demo sigue funcionando aunque el navegador no permita guardar datos.
    }
    setCart({});
    setScreen("confirmation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCategory(name: string) {
    setCategory(name);
    setQuery("");
    setScreen("store");
    window.setTimeout(() => {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  return (
    <main>
      <div className="demo-ribbon">
        <span className="demo-dot" />
        Tienda de demostración · precios, disponibilidad, pagos y entregas son ficticios
      </div>

      <header className="site-header">
        <button className="brand" onClick={() => { setScreen("store"); setCategory(""); setQuery(""); }} aria-label="Volver al inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-copy"><strong>SANTA MARÍA</strong><small>MATERIALES DE CONSTRUCCIÓN</small></span>
        </button>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setScreen("store"); }}
            onFocus={() => setCategory("")}
            placeholder="¿Qué necesitás para tu obra?"
            aria-label="Buscar productos"
          />
          <kbd>Buscar</kbd>
        </label>
        <div className="header-actions">
          <button className="text-action" onClick={() => setScreen("tracking")}>Seguir pedido</button>
          <button className="cart-button" onClick={() => setScreen("cart")} aria-label={`Carrito, ${itemCount} productos`}>
            <span aria-hidden="true">▱</span><span>Carrito</span><b>{itemCount}</b>
          </button>
        </div>
      </header>

      <nav className="category-nav" aria-label="Categorías principales">
        <div className="nav-inner">
          <button className={!category ? "nav-link active" : "nav-link"} onClick={() => { setCategory(""); setScreen("store"); }}>Todo para tu obra</button>
          {CATEGORIES.map((item) => (
            <button key={item.name} className={category === item.name ? "nav-link active" : "nav-link"} onClick={() => openCategory(item.name)}>{item.name}</button>
          ))}
          <button className="nav-link" onClick={() => openCategory("Materiales de construcción")}>Plomería</button>
        </div>
      </nav>

      {screen === "store" && (
        <>
          <section className="hero wrap">
            <div className="hero-copy">
              <p className="eyebrow"><span /> TODO PARA CONSTRUIR</p>
              <h1>Lo que necesitás<br />para tu obra, <em>acá.</em></h1>
              <p className="hero-text">Encontrá materiales, sanitarios y ferretería en un solo lugar. Elegí tus productos y armá tu pedido.</p>
              <div className="hero-actions">
                <button className="button button-yellow" onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}>Ver productos <span>→</span></button>
                <button className="button button-quiet" onClick={() => setScreen("tracking")}>Seguir un pedido</button>
              </div>
              <div className="hero-note"><span>✓</span> Atención cercana desde Limpio, Paraguay</div>
            </div>
            <div className="hero-art" aria-label="Materiales de construcción para tu proyecto">
              <div className="art-grid" />
              <div className="art-label"><span>PARA CADA ETAPA</span><b>DE TU OBRA</b></div>
              <div className="art-card art-card-one"><span>🧱</span><small>OBRA GRUESA</small></div>
              <div className="art-card art-card-two"><span>🚿</span><small>SANITARIOS</small></div>
              <div className="art-card art-card-three"><span>⚡</span><small>ELÉCTRICOS</small></div>
              <div className="art-sun" />
            </div>
          </section>

          <section className="category-section wrap">
            <div className="section-heading">
              <div><p className="eyebrow">ENCONTRÁ LO QUE BUSCÁS</p><h2>¿Qué necesita tu obra?</h2></div>
              <span className="subtle">Explorá nuestras categorías</span>
            </div>
            <div className="category-grid">
              {CATEGORIES.map((item, index) => (
                <button key={item.name} className={`category-card ${item.tone}`} onClick={() => openCategory(item.name)}>
                  <span className="category-number">0{index + 1}</span>
                  <span className="category-emoji" aria-hidden="true">{item.emoji}</span>
                  <strong>{item.name}</strong>
                  <span className="category-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          <section className="catalog-section wrap" id="catalogo">
            <div className="section-heading catalog-heading">
              <div><p className="eyebrow">{category || (query ? "RESULTADOS DE BÚSQUEDA" : "SELECCIÓN PARA TU OBRA")}</p><h2>{category || (query ? `Resultados para “${query}”` : "Productos destacados")}</h2></div>
              {category && <button className="clear-filter" onClick={() => setCategory("")}>Ver todo ×</button>}
            </div>
            <div className="filter-row">
              <span>{visibleProducts.length} productos de muestra</span>
              <select aria-label="Ordenar productos" onChange={(event) => {
                if (event.target.value === "price") {
                  setNotice("Orden por precio: disponible al integrar el catálogo completo");
                  window.setTimeout(() => setNotice(""), 2400);
                }
              }}>
                <option value="recommended">Ordenar: Recomendados</option>
                <option value="price">Menor precio</option>
              </select>
            </div>
            {visibleProducts.length > 0 ? (
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <button className="product-image" onClick={() => setSelectedProduct(product)} aria-label={`Ver ${product.name}`}>
                      {product.bulky && <span className="product-tag">PESADO</span>}
                      <span className="product-emoji" aria-hidden="true">{product.emoji}</span>
                      <span className="image-caption">IMAGEN DE MUESTRA</span>
                    </button>
                    <div className="product-info">
                      <span className="product-category">{product.subcategory}</span>
                      <button className="product-name" onClick={() => setSelectedProduct(product)}>{product.name}</button>
                      <span className="product-unit">{product.unit}</span>
                      <div className="product-bottom">
                        <div><small>PRECIO FICTICIO</small><strong>{money(product.price)}</strong></div>
                        <button className="add-button" onClick={() => addToCart(product)} aria-label={`Agregar ${product.name} al carrito`}>+</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-results"><span>⌕</span><h3>No encontramos ese producto</h3><p>Probá con otra palabra o revisá las categorías.</p><button className="button button-brown" onClick={() => { setQuery(""); setCategory(""); }}>Ver todos los productos</button></div>
            )}
          </section>

          <section className="service-band">
            <div className="wrap service-content">
              <div><span className="service-icon">⌂</span><div><strong>¿Estás empezando una obra?</strong><p>Encontrá lo que necesitás para cada etapa.</p></div></div>
              <div><span className="service-icon">◎</span><div><strong>¿Tenés dudas con tu pedido?</strong><p>Consultá al equipo de Santa María.</p></div></div>
              <button className="button button-yellow" onClick={() => setScreen("tracking")}>Consultar mi pedido <span>→</span></button>
            </div>
          </section>
        </>
      )}

      {screen === "cart" && (
        <section className="flow-page wrap">
          <div className="breadcrumbs"><button onClick={() => setScreen("store")}>Inicio</button><span>/</span><b>Tu carrito</b></div>
          <div className="flow-title"><div><p className="eyebrow">REVISÁ TU PEDIDO</p><h1>Tu carrito</h1><p>Los datos de esta tienda son de demostración.</p></div><span className="step-pill">Paso 1 de 3</span></div>
          {cartProducts.length === 0 ? (
            <div className="empty-cart"><span>▱</span><h2>Tu carrito está vacío</h2><p>Agregá productos para comenzar tu pedido.</p><button className="button button-brown" onClick={() => setScreen("store")}>Ver productos</button></div>
          ) : (
            <div className="checkout-layout">
              <div className="cart-lines">
                {cartProducts.map((product) => (
                  <div className="cart-line" key={product.id}>
                    <div className="cart-thumb">{product.emoji}</div>
                    <div className="cart-product"><span>{product.subcategory}</span><strong>{product.name}</strong><small>{product.unit} · Precio ficticio</small></div>
                    <div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Quitar una unidad">−</button><b>{cart[product.id]}</b><button onClick={() => changeQuantity(product.id, 1)} aria-label="Agregar una unidad">+</button></div>
                    <strong className="line-total">{money(product.price * cart[product.id])}</strong>
                  </div>
                ))}
                {cartProducts.some((product) => product.bulky) && <div className="notice-box">Algunos productos son voluminosos. La entrega y su costo se muestran como ejemplos ficticios.</div>}
                <button className="back-link" onClick={() => setScreen("store")}>← Seguir comprando</button>
              </div>
              <aside className="summary-card">
                <h2>Resumen</h2><div className="summary-row"><span>Productos ({itemCount})</span><b>{money(subtotal)}</b></div>
                <div className="summary-row"><span>Entrega</span><span>A calcular (ficticio)</span></div>
                <div className="summary-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <p className="summary-disclaimer">Precios y costos de entrega ficticios. No se realizará ningún cobro.</p>
                <button className="button button-yellow button-full" onClick={() => setScreen("checkout")}>Continuar <span>→</span></button>
              </aside>
            </div>
          )}
        </section>
      )}

      {screen === "checkout" && (
        <section className="flow-page wrap">
          <div className="breadcrumbs"><button onClick={() => setScreen("store")}>Inicio</button><span>/</span><button onClick={() => setScreen("cart")}>Carrito</button><span>/</span><b>Datos y entrega</b></div>
          <div className="flow-title"><div><p className="eyebrow">CASI LISTO</p><h1>Completá tu pedido</h1><p>Usamos estos datos solo para mostrar el flujo de compra.</p></div><span className="step-pill">Paso 2 de 3</span></div>
          <form className="checkout-layout" onSubmit={placeOrder}>
            <div className="form-column">
              <div className="form-card">
                <h2><span>1</span> ¿Cómo recibís tu pedido?</h2>
                <div className="choice-grid">
                  <label className={delivery === "obra" ? "choice selected" : "choice"}><input type="radio" name="delivery" checked={delivery === "obra"} onChange={() => setDelivery("obra")} /><span>🚚</span><b>Entrega en obra</b><small>Zonas y costo por confirmar</small></label>
                  <label className={delivery === "retiro" ? "choice selected" : "choice"}><input type="radio" name="delivery" checked={delivery === "retiro"} onChange={() => setDelivery("retiro")} /><span>⌂</span><b>Retiro en el local</b><small>Horario y dirección por confirmar</small></label>
                </div>
                {delivery === "obra" ? (
                  <div className="field-grid">
                    <label className="field field-wide">Dirección de la obra<input required placeholder="Calle, número y barrio" /></label>
                    <label className="field">Ciudad o zona<input required placeholder="Ej.: Limpio" /></label>
                    <label className="field">Referencia<input placeholder="Ej.: portón verde, frente a..." /></label>
                  </div>
                ) : (
                  <div className="field-grid">
                    <label className="field">Día de retiro<input type="date" required /></label>
                    <label className="field">Franja horaria<select required defaultValue=""><option value="" disabled>Elegí una franja</option><option>Mañana (ficticio)</option><option>Tarde (ficticio)</option></select></label>
                  </div>
                )}
                <p className="form-note">Las opciones de entrega y retiro son de muestra y deben confirmarse con Santa María.</p>
              </div>
              <div className="form-card">
                <h2><span>2</span> Tus datos</h2>
                <div className="field-grid">
                  <label className="field">Nombre y apellido<input required autoComplete="name" placeholder="Cómo te llamás" /></label>
                  <label className="field">WhatsApp o teléfono<input required autoComplete="tel" inputMode="tel" placeholder="09xx xxx xxx" /></label>
                  <label className="field">Correo electrónico <small>Opcional</small><input type="email" autoComplete="email" placeholder="tu@correo.com" /></label>
                  <label className="field">RUC para factura <small>Opcional</small><input placeholder="RUC" /></label>
                </div>
              </div>
              <div className="form-card">
                <h2><span>3</span> Forma de pago</h2>
                <div className="payment-options">
                  <label><input type="radio" name="payment" defaultChecked /><span>Transferencia</span></label>
                  <label><input type="radio" name="payment" /><span>Tarjeta</span></label>
                  <label><input type="radio" name="payment" /><span>Pago al recibir</span></label>
                </div>
                <div className="demo-warning"><b>Pago simulado</b><span>No se cobra nada ni se envía información a una entidad financiera.</span></div>
              </div>
            </div>
            <aside className="summary-card">
              <h2>Tu pedido</h2>
              {cartProducts.map((product) => <div className="summary-row" key={product.id}><span>{cart[product.id]} × {product.name}</span><b>{money(product.price * cart[product.id])}</b></div>)}
              <div className="summary-row"><span>Entrega</span><span>Ficticia</span></div>
              <div className="summary-total"><span>Total de muestra</span><strong>{money(subtotal)}</strong></div>
              <p className="summary-disclaimer">Los valores son ficticios y no se efectuará el pago.</p>
              <button className="button button-yellow button-full" type="submit" disabled={!cartProducts.length}>Confirmar pedido <span>→</span></button>
              <button className="back-link" type="button" onClick={() => setScreen("cart")}>← Volver al carrito</button>
            </aside>
          </form>
        </section>
      )}

      {screen === "confirmation" && (
        <section className="flow-page wrap confirmation-page">
          <div className="success-mark">✓</div><p className="eyebrow">PEDIDO DE DEMOSTRACIÓN</p><h1>¡Listo! Recibimos tu pedido</h1>
          <p>Este pedido se guardó solo en este navegador. No se realizó ningún cobro.</p>
          <div className="order-code"><span>NÚMERO DE PEDIDO</span><strong>{orderCode}</strong><small>Código ficticio</small></div>
          <div className="demo-warning confirmation-warning"><b>Compra simulada</b><span>El equipo y el seguimiento se muestran como ejemplo para esta demo.</span></div>
          <div className="hero-actions"><button className="button button-yellow" onClick={() => setScreen("tracking")}>Seguir mi pedido <span>→</span></button><button className="button button-quiet" onClick={() => setScreen("store")}>Volver a la tienda</button></div>
        </section>
      )}

      {screen === "tracking" && (
        <section className="flow-page wrap tracking-page">
          <div className="breadcrumbs"><button onClick={() => setScreen("store")}>Inicio</button><span>/</span><b>Seguimiento</b></div>
          <div className="tracking-card">
            <p className="eyebrow">SEGUIMIENTO DE DEMOSTRACIÓN</p><h1>¿Dónde está tu pedido?</h1><p>Ingresá el código que aparece en la confirmación.</p>
            <form className="tracking-search" onSubmit={(event) => { event.preventDefault(); setNotice(trackingCode ? "Mostrando el seguimiento de ejemplo." : "Ingresá un código de pedido."); window.setTimeout(() => setNotice(""), 2400); }}>
              <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="Ej.: SM-12345" aria-label="Número de pedido" />
              <button className="button button-yellow" type="submit">Consultar</button>
            </form>
            {orderCode && trackingCode === orderCode && (
              <div className="tracking-result">
                <div className="tracking-order"><span>Pedido</span><b>{orderCode}</b><small>Estados de ejemplo</small></div>
                <ol className="timeline">
                  <li className="done"><i>✓</i><div><b>Pedido recibido</b><small>Confirmación de muestra</small></div></li>
                  <li className="current"><i>2</i><div><b>En preparación</b><small>Estado actual de demostración</small></div></li>
                  <li><i>3</i><div><b>En camino o listo para retirar</b><small>Estado pendiente</small></div></li>
                  <li><i>4</i><div><b>Entregado</b><small>Estado pendiente</small></div></li>
                </ol>
              </div>
            )}
            <div className="form-note">El seguimiento de esta demo es local. En producción se conectará al proceso que defina Santa María.</div>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="wrap footer-main">
          <div className="brand footer-brand"><span className="brand-mark"><i /><i /><i /></span><span className="brand-copy"><strong>SANTA MARÍA</strong><small>MATERIALES DE CONSTRUCCIÓN</small></span></div>
          <p>Materiales para acompañar cada etapa de tu obra.</p>
          <div className="footer-meta"><span>Limpio, Paraguay</span><span>Catálogo de demostración</span></div>
        </div>
        <div className="footer-bottom">© Materiales Santa María · Experiencia de muestra</div>
      </footer>

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}>
          <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Cerrar">×</button>
            <div className="modal-visual"><span>{selectedProduct.emoji}</span><small>IMAGEN DE MUESTRA</small></div>
            <div className="modal-copy"><p className="eyebrow">{selectedProduct.subcategory}</p><h2 id="product-modal-title">{selectedProduct.name}</h2><p className="modal-unit">{selectedProduct.unit}</p>
              {selectedProduct.bulky && <div className="notice-box">Producto voluminoso. La opción de entrega se confirma durante el pedido.</div>}
              <p className="modal-description">Producto de catálogo de ejemplo para mostrar la experiencia de compra de Materiales Santa María. Presentación y disponibilidad ficticias.</p>
              <small className="price-label">PRECIO FICTICIO</small><strong className="modal-price">{money(selectedProduct.price)}</strong>
              <button className="button button-yellow button-full" onClick={() => addToCart(selectedProduct)}>Agregar al carrito <span>+</span></button>
            </div>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
