# Especificación de pantallas T1–T10 · Demo Ecommerce Santa María

Versión 1.0.0 · 2026-10-09 · Preparado por Claude para Codex.

> **Todo dato de muestra es FICTICIO.** Precios, disponibilidad, marcas, zonas, costos y plazos salen de `content/catalog.json` y `content/delivery-zones.json` y no son datos reales de Santa María. El pago, el stock y el seguimiento son simulados.

## Cómo usar este documento

- Los datos vienen de `content/catalog.json` y `content/delivery-zones.json`. Leelos tal cual: no cambies nombres de campos ni estructura. Si necesitás un campo nuevo, pedilo a Claude y se agrega en el archivo de contenido.
- Los textos de pantalla vienen de `content/ui-copy.md`, por clave (por ejemplo `t1.search.placeholder`). Las claves se citan en esta especificación entre comillas invertidas.
- Claude no edita código. Codex no edita los archivos de `content/` ni de `docs/`.
- Cada pantalla tiene **Comportamiento** (qué tiene que pasar) y **Criterios de aceptación** (cómo comprobar que funciona). Una pantalla está terminada cuando pasan todos sus criterios.

## Reglas generales (aplican a todas las pantallas)

1. **Celular primero.** Todo se usa sin scroll horizontal en 375 px de ancho; también se ve bien en escritorio (1280 px o más).
2. **Colores del logo.** Terracota `#925246`, amarillo `#FCC401`, marrón `#684237`, negro y blanco. Amarillo solo en botones principales y promociones. Fondo blanco.
3. **Precios.** `price_pyg` se muestra como `Gs. 62.000` (punto de miles, sin decimales).
4. **Etiqueta Demo.** Una etiqueta discreta con `global.demo_badge` en el encabezado de todas las pantallas, y el aviso `global.demo_notice` en el pie.
5. **Disponibilidad.** `availability` se muestra con el texto de `_meta.availability_values` del catálogo. `consultar` no impide agregar al carrito, pero muestra `t4.availability.consult_note`.
6. **Voluminosos.** Productos con `is_bulky = true` muestran la etiqueta `global.bulky_badge` en listas, detalle y carrito.
7. **Carrito y pedidos.** Se guardan en el navegador (por ejemplo `localStorage`) y sobreviven a recargar la página.
8. **Búsqueda sin acentos ni mayúsculas.** "cano", "Caño" y "CAÑO" encuentran lo mismo.
9. **Imágenes.** Si `image` no existe, se usa una imagen genérica por categoría.
10. **Encabezado fijo** en todas las pantallas de tienda: logo (lleva a T1), buscador, ícono de carrito con cantidad de artículos y acceso a "Mi pedido" (T10).

## Modelo de pedido (para T5 a T10)

Un pedido guardado tiene, como mínimo:

| Campo | Ejemplo | Nota |
| --- | --- | --- |
| `order_number` | `SM-00001` | Correlativo, empieza en SM-00001 |
| `created_at` | `2026-10-09T15:30:00-03:00` | Fecha y hora local |
| `items` | `[{ "product_id", "sku", "name", "presentation", "price_pyg", "quantity", "is_bulky" }]` | Copia de los datos del producto al momento de comprar |
| `subtotal_pyg` | `186000` | Suma de precio por cantidad |
| `fulfillment` | `{ "type": "delivery", "zone_id": "limpio", ... }` o `{ "type": "pickup", "date", "slot_id" }` | Ver T6 |
| `delivery_fee_pyg` | `60000` | 0 si es retiro |
| `total_pyg` | `246000` | Subtotal más entrega |
| `customer` | `{ "name", "phone", "email", "wants_invoice", "ruc", "business_name" }` | Ver T7 |
| `payment` | `{ "method": "transferencia", "status": "simulado_aprobado" }` | Ver T8 |
| `status` | `recibido` | Ver estados abajo |
| `status_history` | `[{ "status": "recibido", "at": "..." }]` | Una entrada por cada cambio |

**Estados del pedido**, en orden: `recibido` → `en_preparacion` → `en_camino` (entrega en obra) o `listo_para_retirar` (retiro) → `entregado`. Además `cancelado`. Los textos están en `t10.status.*`. En esta entrega los estados los cambia el panel del equipo (P1–P3, segunda entrega); mientras tanto, dejá una forma simple de avanzar el estado para probar (por ejemplo un botón oculto o un parámetro en la dirección).

## T1 · Inicio

**Comportamiento**
- Muestra el encabezado, un buscador grande con `t1.search.placeholder`, el banner de promoción (`t1.hero.*`), las 4 categorías del catálogo en el orden de `order`, y una fila de 8 productos destacados.
- Destacados: los primeros 2 productos de cada categoría con `availability = disponible`.
- Tocar una categoría lleva a T2. Buscar lleva a T3. Tocar un producto lleva a T4.
- Muestra los dos beneficios `t1.benefits.*` (entrega en obra y retiro en el local), con la nota de que son de demostración.

**Criterios de aceptación**
- [ ] Se ven exactamente 4 categorías: Ferretería, Artículos sanitarios, Materiales de construcción, Materiales eléctricos.
- [ ] Plomería no aparece como categoría principal en T1.
- [ ] Hay 8 productos destacados, 2 por categoría, todos con precio en formato `Gs. 00.000`.
- [ ] El botón del banner usa amarillo `#FCC401` y lleva a una categoría o búsqueda que tiene resultados.
- [ ] La etiqueta Demo se ve en el encabezado.

## T2 · Categoría

**Comportamiento**
- Título con el nombre de la categoría, chips de subcategorías (con "Todas" primero) y lista de productos de la categoría.
- Filtros: subcategoría, marca (`brand`), rango de precio, disponibilidad y "Solo productos chicos" (excluye `is_bulky = true`).
- Orden: `t2.sort.*` (relevancia por defecto = orden del archivo, precio menor a mayor, precio mayor a menor, nombre A–Z).
- En celular, los filtros se abren en un panel desde abajo con `t2.filters.apply` y `t2.filters.clear`. En escritorio, columna a la izquierda.
- Cada tarjeta muestra imagen, nombre, presentación, precio, disponibilidad, etiqueta de voluminoso si corresponde y botón `global.add_to_cart`.
- Muestra la cantidad de resultados (`t2.results_count`).

**Criterios de aceptación**
- [ ] Artículos sanitarios muestra 10 productos y las subcategorías Baño, Grifería y Plomería.
- [ ] Elegir la subcategoría Plomería deja 5 productos.
- [ ] Ordenar por precio menor a mayor en Materiales de construcción muestra primero "Cal hidratada" (Gs. 30.000).
- [ ] "Solo productos chicos" en Materiales de construcción deja 0 productos y muestra `t2.empty`.
- [ ] Limpiar filtros vuelve a mostrar los 10 productos.
- [ ] Agregar al carrito desde la tarjeta suma 1 unidad y actualiza el número del ícono de carrito.

## T3 · Resultados de búsqueda

**Comportamiento**
- Busca en `name`, `brand`, `subcategory`, `category` y `search_terms`, sin acentos ni mayúsculas. Un producto aparece si contiene todas las palabras buscadas.
- Muestra `t3.title` con el texto buscado, la cantidad de resultados y los mismos filtros y orden que T2 (con filtro de categoría además).
- Sin resultados: `t3.empty.*` con las 4 categorías como sugerencia y el enlace de WhatsApp de consulta (número pendiente de confirmar).
- Búsqueda vacía no navega.

**Criterios de aceptación**
- [ ] "cemento" muestra al menos 2 resultados, incluidos "Cemento Portland tipo I" y "Cemento de albañilería".
- [ ] "cano" y "caño" dan los mismos resultados (al menos los 2 caños de PVC).
- [ ] "tubo" encuentra los caños de PVC (sinónimo en `search_terms`).
- [ ] "varilla 10" muestra solo "Varilla de hierro 10 mm".
- [ ] "xyz123" muestra el estado vacío con las 4 categorías.

## T4 · Detalle de producto

**Comportamiento**
- Imagen, nombre, marca, SKU, presentación, precio, disponibilidad y etiqueta de voluminoso.
- Si `is_bulky = true`, muestra `t4.bulky_note` (se entrega en camión o se retira coordinado).
- Selector de cantidad con − y + (mínimo 1, máximo 999) y botón `global.add_to_cart`.
- Al agregar: mensaje `t4.added` con dos acciones, `t4.go_to_cart` y `t4.keep_shopping`.
- Debajo: hasta 4 productos relacionados de la misma subcategoría (si hay menos, completa con la misma categoría).
- Ruta de navegación: Inicio › Categoría › Subcategoría.

**Criterios de aceptación**
- [ ] "Cemento Portland tipo I" muestra Bolsa de 50 kg, Gs. 62.000, Disponible y la nota de voluminoso.
- [ ] "Amoladora angular 115 mm 850 W" muestra "Consultar disponibilidad" y la nota `t4.availability.consult_note`, y se puede agregar igual.
- [ ] Elegir cantidad 10 y agregar suma 10 unidades al carrito.
- [ ] El botón − no baja de 1.
- [ ] Hay productos relacionados y ninguno es el mismo producto.

## T5 · Carrito

**Comportamiento**
- Lista de productos con imagen, nombre, presentación, precio unitario, selector de cantidad, subtotal de línea y `t5.remove`.
- Resumen: subtotal y la línea `t5.delivery_calculated_later`.
- Si hay al menos un voluminoso, muestra `t5.bulky_warning`.
- Botones `t5.continue` (va a T6) y `t5.keep_shopping` (vuelve a T1).
- Carrito vacío: `t5.empty.*` con botón a T1.

**Criterios de aceptación**
- [ ] Con 3 bolsas de cemento Portland (Gs. 62.000) y 2 codos PVC (Gs. 4.000), el subtotal es Gs. 194.000.
- [ ] Cambiar una cantidad actualiza subtotal de línea y total al instante.
- [ ] Quitar el último producto muestra el estado vacío y el ícono de carrito queda en 0.
- [ ] El aviso de voluminosos aparece solo si hay un producto con `is_bulky = true`.
- [ ] Recargar la página mantiene el carrito.

## T6 · Entrega en obra o retiro en el local

**Comportamiento**
- Dos opciones grandes: `t6.delivery.title` y `t6.pickup.title`.
- **Entrega en obra:** zona (de `zones`, las que tienen `available = false` aparecen deshabilitadas con `unavailable_message`), dirección o calle, número o referencia, barrio, punto de referencia libre, nombre y teléfono de quien recibe en la obra (opcional, por defecto el cliente). Opcional: ubicación en mapa como enlace pegado (no hace falta mapa real).
- **Costo de entrega**, según las reglas de `delivery-zones.json`:
    - con algún voluminoso: `bulky_fee_pyg` y `bulky_eta`;
    - sin voluminosos: `standard_fee_pyg` y `standard_eta`, o 0 si el subtotal es igual o mayor a `free_delivery_from_pyg`.
- **Retiro en el local:** dirección de `pickup.address`, día (desde mañana hasta `days_ahead` días, sin los días de `closed_weekdays`, donde 0 = domingo) y franja de `pickup.time_slots`. Costo 0.
- Resumen visible: subtotal, entrega, total. Junto al costo y plazo, la nota `t6.fictitious_note`.
- `t6.continue` lleva a T7 solo con los campos obligatorios completos.

**Criterios de aceptación**
- [ ] Carrito con solo herramientas (sin voluminosos), subtotal Gs. 45.000, zona Limpio: entrega Gs. 20.000, plazo "En el día (ficticio)".
- [ ] Mismo carrito más 1 bolsa de cemento, zona Limpio: entrega Gs. 60.000, plazo "24 a 48 horas (ficticio)".
- [ ] Carrito sin voluminosos de Gs. 500.000 o más en Limpio: entrega Gs. 0 con `t6.free_delivery`.
- [ ] "Otras ciudades" se ve pero no se puede elegir.
- [ ] Retiro: no se puede elegir domingo; costo Gs. 0.
- [ ] Sin dirección, el botón continuar muestra el error `t6.errors.address_required` y no avanza.

## T7 · Datos del cliente

**Comportamiento**
- Campos: nombre y apellido (obligatorio), teléfono o WhatsApp (obligatorio, formato paraguayo: 09XX XXX XXX o +595 9XX XXX XXX), correo (opcional).
- Casilla `t7.invoice.checkbox`: si se marca, pide RUC o cédula y razón social (los dos obligatorios).
- Casilla `t7.whatsapp_updates` (solo guarda la preferencia; no envía mensajes).
- Muestra el resumen del pedido en una columna (escritorio) o plegable (celular).
- `t7.continue` lleva a T8.

**Criterios de aceptación**
- [ ] Sin nombre o teléfono no avanza y marca el campo con su error de `t7.errors.*`.
- [ ] Acepta `0981 123 456`, `0981123456` y `+595 981 123 456`; rechaza `123`.
- [ ] Marcar factura muestra RUC y razón social; desmarcar los oculta y no los exige.
- [ ] Volver a T6 y regresar mantiene lo cargado.

## T8 · Pago de demostración

**Comportamiento**
- Cartel visible arriba, en amarillo suave con borde: `t8.demo_banner`.
- Resumen final: productos, entrega o retiro elegido, datos del cliente, subtotal, entrega y total.
- Medios de pago de ejemplo (`t8.methods.*`): tarjeta, transferencia bancaria, efectivo al recibir o al retirar. Ninguno pide número de tarjeta real ni datos bancarios.
- Si se elige tarjeta, se muestra un formulario visual deshabilitado con `t8.card_disabled_note`. No se guarda ningún dato de tarjeta.
- `t8.confirm` simula 1 a 2 segundos de "procesando" (`t8.processing`), crea el pedido con estado `recibido`, vacía el carrito y lleva a T9.

**Criterios de aceptación**
- [ ] El cartel de pago simulado se ve sin hacer scroll en 375 px.
- [ ] No existe ningún campo que acepte un número de tarjeta.
- [ ] Al confirmar se crea un pedido `SM-00001` (el siguiente es `SM-00002`) y el carrito queda vacío.
- [ ] Tocar confirmar dos veces seguidas crea un solo pedido.
- [ ] El total coincide con el de T6.

## T9 · Pedido confirmado

**Comportamiento**
- Título `t9.title`, número de pedido grande y copiable, resumen y qué sigue (`t9.next_steps.delivery` o `t9.next_steps.pickup` según el tipo).
- Botones `t9.track` (va a T10 con el número cargado) y `t9.back_home`.
- Recordatorio `t9.demo_note` de que no se cobró nada.

**Criterios de aceptación**
- [ ] Muestra el número de pedido, el total y el tipo de entrega correcto.
- [ ] Entrar directo a T9 sin pedido reciente redirige a T1.
- [ ] "Seguir mi pedido" abre T10 con el estado "Recibido".

## T10 · Seguimiento del pedido

**Comportamiento**
- Campo para escribir el número de pedido (acepta `SM-00001`, `sm-00001` o `00001`) y botón `t10.search`. Si viene desde T9, se carga solo.
- Línea de estados vertical, con el estado actual resaltado y fecha y hora de cada cambio de `status_history`.
- Para entrega en obra los pasos son Recibido, En preparación, En camino, Entregado. Para retiro: Recibido, En preparación, Listo para retirar, Entregado.
- Debajo: resumen del pedido, dirección o datos de retiro, y el enlace de consulta por WhatsApp (número pendiente).
- Nota `t10.demo_note`: el estado lo actualiza el equipo de Santa María desde su panel (en la demo, simulado).
- Pedido no encontrado: `t10.not_found`.

**Criterios de aceptación**
- [ ] `sm-00001` y `00001` encuentran el pedido SM-00001.
- [ ] Un pedido de retiro muestra "Listo para retirar" y no "En camino".
- [ ] Al cambiar el estado (con el mecanismo de prueba), T10 lo refleja al recargar con la nueva fecha y hora.
- [ ] Un pedido `cancelado` muestra `t10.status.cancelado` y no la línea de pasos.
- [ ] Un número inexistente muestra el mensaje de no encontrado.

## Recorrido completo (prueba final de esta entrega)

Desde un celular de 375 px, sin recargar a mano:

1. Buscar "cemento" en T1 y entrar a "Cemento Portland tipo I".
2. Agregar 3 bolsas.
3. Ir a Plomería (Artículos sanitarios › Plomería) y agregar 2 "Codo PVC soldable 25 mm 90°".
4. En el carrito: subtotal Gs. 194.000 y aviso de voluminosos.
5. Entrega en obra, zona Limpio: entrega Gs. 60.000, total Gs. 254.000.
6. Completar datos con teléfono `0981 123 456`.
7. Pagar con transferencia (simulado) y ver el pedido SM-00001.
8. Seguir el pedido y ver "Recibido".

**Entregar a Claude:** capturas de T1 a T10 en 375 px y en escritorio, o un video corto del recorrido, más la lista de criterios marcados.

## Fuera de esta entrega

Panel del equipo (P1–P3), avisos reales por WhatsApp o correo, pagos reales, stock real, mapa, usuarios y contraseñas. Quedan para la segunda entrega o para producción.
