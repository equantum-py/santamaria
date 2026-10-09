# Textos de la tienda · Demo Ecommerce Santa María

Versión 1.0.0 · 2026-10-09 · Español paraguayo, trato de "vos", frases cortas.

> Los textos que mencionan costos, plazos, horarios, pagos o WhatsApp son **de demostración (ficticios)** hasta que Santa María los confirme. Los marcados `PENDIENTE` llevan un dato que falta.

**Cómo leer este archivo (para Codex):** cada fila es `clave` → texto. Las claves son las que cita `docs/screen-spec.md`. Lo que va entre llaves (`{count}`, `{query}`, `{order_number}`) se reemplaza por el valor real. Usá los textos tal cual; si necesitás uno nuevo, pedíselo a Claude y se agrega acá.

## Global

| Clave | Texto |
| --- | --- |
| `global.store_name` | Materiales Santa María |
| `global.tagline` | Todo para tu obra, en Limpio |
| `global.demo_badge` | Demo |
| `global.demo_notice` | Esta es una demostración. Precios, disponibilidad, entregas y pagos son ficticios: no se cobra ni se envía nada. |
| `global.bulky_badge` | Voluminoso |
| `global.add_to_cart` | Agregar al carrito |
| `global.cart` | Carrito |
| `global.cart_count` | {count} en el carrito |
| `global.my_order` | Mi pedido |
| `global.search_button` | Buscar |
| `global.back` | Volver |
| `global.home` | Inicio |
| `global.whatsapp_help` | ¿Dudas? Escribinos por WhatsApp |
| `global.whatsapp_number` | PENDIENTE de confirmar |
| `global.store_address` | PENDIENTE de confirmar (Limpio, Paraguay) |
| `global.store_hours` | PENDIENTE de confirmar |
| `global.currency_prefix` | Gs. |
| `global.loading` | Cargando… |
| `global.generic_error` | Algo salió mal. Probá de nuevo. |
| `global.footer_rights` | © 2026 Materiales Santa María. Demo de presentación. |

## T1 · Inicio

| Clave | Texto |
| --- | --- |
| `t1.search.placeholder` | ¿Qué necesitás para tu obra? Ej.: cemento, caño, cable |
| `t1.hero.title` | Lo que tu obra necesita, sin vueltas |
| `t1.hero.subtitle` | Ferretería, sanitarios, materiales de construcción y eléctricos en un solo lugar. |
| `t1.hero.cta` | Ver materiales de construcción |
| `t1.hero.promo_label` | Promo demo |
| `t1.categories.title` | Comprá por categoría |
| `t1.featured.title` | Lo más pedido |
| `t1.benefits.delivery.title` | Te lo llevamos a la obra |
| `t1.benefits.delivery.text` | Elegí tu zona y recibí en tu obra (servicio de demostración). |
| `t1.benefits.pickup.title` | O retiralo en el local |
| `t1.benefits.pickup.text` | Pedí por la web y pasá a buscar en Limpio (servicio de demostración). |
| `t1.benefits.help.title` | Te asesoramos |
| `t1.benefits.help.text` | ¿No sabés qué llevar? Consultanos y te ayudamos a elegir. |

## T2 · Categoría

| Clave | Texto |
| --- | --- |
| `t2.subcategories.all` | Todas |
| `t2.results_count` | {count} productos |
| `t2.results_count_one` | 1 producto |
| `t2.filters.open` | Filtrar |
| `t2.filters.title` | Filtros |
| `t2.filters.subcategory` | Subcategoría |
| `t2.filters.brand` | Marca |
| `t2.filters.price` | Precio |
| `t2.filters.price_min` | Desde Gs. |
| `t2.filters.price_max` | Hasta Gs. |
| `t2.filters.availability` | Disponibilidad |
| `t2.filters.small_only` | Solo productos chicos (sin voluminosos) |
| `t2.filters.category` | Categoría |
| `t2.filters.apply` | Ver resultados |
| `t2.filters.clear` | Limpiar filtros |
| `t2.sort.label` | Ordenar por |
| `t2.sort.relevance` | Más relevantes |
| `t2.sort.price_asc` | Menor precio |
| `t2.sort.price_desc` | Mayor precio |
| `t2.sort.name_asc` | Nombre (A–Z) |
| `t2.empty` | No hay productos con estos filtros. Probá quitando alguno. |

## T3 · Búsqueda

| Clave | Texto |
| --- | --- |
| `t3.title` | Resultados para "{query}" |
| `t3.results_count` | {count} productos encontrados |
| `t3.empty.title` | No encontramos "{query}" |
| `t3.empty.text` | Revisá cómo lo escribiste o buscá por categoría. Si no está en la web, preguntanos: capaz lo tenemos en el local. |
| `t3.empty.categories_title` | Mirá nuestras categorías |
| `t3.empty.whatsapp` | Consultar por WhatsApp |

## T4 · Detalle de producto

| Clave | Texto |
| --- | --- |
| `t4.brand` | Marca |
| `t4.sku` | Código |
| `t4.presentation` | Presentación |
| `t4.quantity` | Cantidad |
| `t4.price_note` | Precio de demostración |
| `t4.availability.consult_note` | Te confirmamos la disponibilidad después de recibir tu pedido. |
| `t4.bulky_note` | Producto voluminoso: se entrega en camión en tu obra o se retira coordinado en el local. |
| `t4.added` | ¡Listo! Agregaste {quantity} × {product_name} al carrito. |
| `t4.go_to_cart` | Ir al carrito |
| `t4.keep_shopping` | Seguir comprando |
| `t4.related.title` | También te puede servir |

## T5 · Carrito

| Clave | Texto |
| --- | --- |
| `t5.title` | Tu carrito |
| `t5.unit_price` | Precio unitario |
| `t5.line_subtotal` | Subtotal |
| `t5.remove` | Quitar |
| `t5.subtotal` | Subtotal |
| `t5.delivery_calculated_later` | Entrega: se calcula en el siguiente paso |
| `t5.bulky_warning` | Tu carrito tiene productos voluminosos. La entrega se hace en camión y puede tardar un poco más (plazos de demostración). |
| `t5.continue` | Continuar con la compra |
| `t5.keep_shopping` | Seguir comprando |
| `t5.empty.title` | Tu carrito está vacío |
| `t5.empty.text` | Buscá lo que necesitás para tu obra y agregalo acá. |
| `t5.empty.cta` | Ir al inicio |

## T6 · Entrega o retiro

| Clave | Texto |
| --- | --- |
| `t6.title` | ¿Cómo querés recibir tu pedido? |
| `t6.delivery.title` | Entrega en obra |
| `t6.delivery.subtitle` | Te lo llevamos a la dirección que nos indiques. |
| `t6.delivery.zone` | Zona o ciudad |
| `t6.delivery.zone_placeholder` | Elegí tu zona |
| `t6.delivery.street` | Calle |
| `t6.delivery.number_or_reference` | Número de casa o entre calles |
| `t6.delivery.neighborhood` | Barrio |
| `t6.delivery.landmark` | Punto de referencia |
| `t6.delivery.landmark_placeholder` | Ej.: portón verde, frente a la escuela |
| `t6.delivery.map_link` | Ubicación (pegá el enlace del mapa, opcional) |
| `t6.delivery.receiver_same` | Recibo yo en la obra |
| `t6.delivery.receiver_name` | Nombre de quien recibe |
| `t6.delivery.receiver_phone` | Teléfono de quien recibe |
| `t6.delivery.fee` | Costo de entrega |
| `t6.delivery.eta` | Plazo estimado |
| `t6.pickup.title` | Retiro en el local |
| `t6.pickup.subtitle` | Pasás a buscar tu pedido en Santa María, Limpio. Sin costo. |
| `t6.pickup.address` | Dirección del local |
| `t6.pickup.day` | Día de retiro |
| `t6.pickup.slot` | Horario |
| `t6.pickup.ready_eta` | Te avisamos cuando esté listo |
| `t6.free_delivery` | ¡Entrega sin costo! |
| `t6.fictitious_note` | Costo y plazo de demostración (ficticios). |
| `t6.summary.subtotal` | Subtotal |
| `t6.summary.delivery` | Entrega |
| `t6.summary.total` | Total |
| `t6.continue` | Continuar |
| `t6.errors.choose_option` | Elegí entrega en obra o retiro en el local. |
| `t6.errors.zone_required` | Elegí una zona. |
| `t6.errors.address_required` | Necesitamos la calle y una referencia para llegar a tu obra. |
| `t6.errors.pickup_day_required` | Elegí el día y el horario de retiro. |

## T7 · Datos del cliente

| Clave | Texto |
| --- | --- |
| `t7.title` | Tus datos |
| `t7.name` | Nombre y apellido |
| `t7.phone` | Teléfono o WhatsApp |
| `t7.phone_placeholder` | 0981 123 456 |
| `t7.email` | Correo electrónico (opcional) |
| `t7.invoice.checkbox` | Necesito factura con RUC |
| `t7.invoice.ruc` | RUC o cédula |
| `t7.invoice.business_name` | Razón social |
| `t7.whatsapp_updates` | Quiero recibir novedades del pedido por WhatsApp (en la demo no se envían mensajes). |
| `t7.summary.title` | Resumen de tu pedido |
| `t7.continue` | Ir al pago |
| `t7.errors.name_required` | Escribí tu nombre y apellido. |
| `t7.errors.phone_required` | Escribí un teléfono para coordinar. |
| `t7.errors.phone_invalid` | Revisá el número. Ej.: 0981 123 456 |
| `t7.errors.email_invalid` | Revisá el correo. |
| `t7.errors.ruc_required` | Escribí el RUC o la cédula para la factura. |
| `t7.errors.business_name_required` | Escribí la razón social. |

## T8 · Pago de demostración

| Clave | Texto |
| --- | --- |
| `t8.title` | Confirmá tu compra |
| `t8.demo_banner` | Pago simulado: es una demostración y no se cobra nada. |
| `t8.methods.title` | Medio de pago |
| `t8.methods.card` | Tarjeta de crédito o débito (simulado) |
| `t8.methods.transfer` | Transferencia bancaria (simulado) |
| `t8.methods.cash` | Efectivo al recibir o al retirar (simulado) |
| `t8.card_disabled_note` | En la demo no se cargan datos de tarjeta. |
| `t8.summary.items` | Productos |
| `t8.summary.fulfillment` | Entrega |
| `t8.summary.customer` | Tus datos |
| `t8.summary.edit` | Cambiar |
| `t8.confirm` | Confirmar pedido |
| `t8.processing` | Procesando tu pedido… |
| `t8.errors.method_required` | Elegí un medio de pago. |

## T9 · Pedido confirmado

| Clave | Texto |
| --- | --- |
| `t9.title` | ¡Gracias! Recibimos tu pedido |
| `t9.order_number_label` | Número de pedido |
| `t9.copy` | Copiar número |
| `t9.copied` | Copiado |
| `t9.next_steps.title` | ¿Qué sigue? |
| `t9.next_steps.delivery` | Vamos a preparar tu pedido y te avisamos cuando salga para tu obra. |
| `t9.next_steps.pickup` | Vamos a preparar tu pedido y te avisamos cuando esté listo para retirar. |
| `t9.track` | Seguir mi pedido |
| `t9.back_home` | Volver al inicio |
| `t9.demo_note` | Recordá: es una demostración, no se cobró nada. |

## T10 · Seguimiento

| Clave | Texto |
| --- | --- |
| `t10.title` | Seguí tu pedido |
| `t10.input_label` | Número de pedido |
| `t10.input_placeholder` | Ej.: SM-00001 |
| `t10.search` | Buscar pedido |
| `t10.current_status` | Estado actual |
| `t10.updated_at` | Actualizado el {date} a las {time} |
| `t10.status.recibido` | Recibido |
| `t10.status.en_preparacion` | En preparación |
| `t10.status.en_camino` | En camino |
| `t10.status.listo_para_retirar` | Listo para retirar |
| `t10.status.entregado` | Entregado |
| `t10.status.cancelado` | Cancelado |
| `t10.status_help.recibido` | Recibimos tu pedido y lo estamos revisando. |
| `t10.status_help.en_preparacion` | Estamos juntando tus productos. |
| `t10.status_help.en_camino` | Tu pedido salió para tu obra. |
| `t10.status_help.listo_para_retirar` | Ya podés pasar a buscarlo por el local. |
| `t10.status_help.entregado` | ¡Entregado! Gracias por comprar en Santa María. |
| `t10.status_help.cancelado` | Este pedido fue cancelado. Si tenés dudas, escribinos. |
| `t10.demo_note` | El estado lo actualiza el equipo de Santa María desde su panel. En la demo, es simulado. |
| `t10.not_found` | No encontramos ese pedido. Revisá el número. |
