# Proyecto Ecommerce Santa María

## Objetivo

Crear una demo funcional y presentable del ecommerce de Materiales de Construcción Santa María, con sede en Limpio, Paraguay. La demo debe mostrar una experiencia coherente desde que el cliente llega a la tienda online hasta que recibe el pedido, y permitir que el equipo actualice el estado de una orden.

El repositorio empieza sin aplicación implementada. Antes de elegir arquitectura o añadir dependencias, revisar el estado actual del repo y proponer la solución más simple que permita construir y presentar la demo.

## Negocio y categorías

Santa María trabaja con ferretería, artículos sanitarios, materiales de construcción y materiales eléctricos. La presentación corporativa también menciona obra gruesa, cemento, agregados, insumos cerámicos y plomería.

La tienda debe priorizar estas categorías:
- Ferretería
- Artículos sanitarios
- Materiales de construcción
- Materiales eléctricos

## Identidad visual

Tomar el logo entregado como referencia:
- Terracota: `#925246`
- Amarillo: `#FCC401`
- Marrón: `#684237`
- Negro y blanco

Usar una interfaz comercial, clara y ordenada. Mantener el amarillo para llamadas a la acción, etiquetas u ofertas puntuales. Diseñar primero para celular y asegurar que la tienda también se vea bien en escritorio.

## Recorrido de compra para la demo

1. Inicio con categorías, búsqueda y productos destacados.
2. Catálogo con búsqueda, filtros y ordenamiento.
3. Ficha con fotos, descripción, precio de muestra, presentación/unidad y disponibilidad de muestra.
4. Carrito con cantidades, subtotal y resumen.
5. Checkout como invitado con datos básicos del cliente.
6. Elección de retiro o entrega en obra.
7. Opción de pago demostrativa.
8. Confirmación con número de pedido.
9. Seguimiento con estados: recibido, preparando, en camino y entregado.
10. Panel interno sencillo para ver pedidos y cambiar su estado.

Los datos de muestra deben estar identificados visiblemente como ficticios. No afirmar que existen stock, precios, pagos, envíos o seguimiento conectados a sistemas reales.

## Videos de lanzamiento

Preparar dos conceptos independientes y complementarios:

### Compra en el local
Mostrar al cliente llegando al local, consultando por materiales, recibiendo asesoramiento, seleccionando productos y confirmando la compra. Mostrar preparación o carga del pedido solo si la escena se presenta como una propuesta de producción.

### Compra desde la web
Mostrar al cliente desde su casa usando la tienda desde el celular, buscando productos, agregándolos al carrito, completando la compra y eligiendo entrega o retiro. Mostrar preparación y entrega como parte de una historia de lanzamiento, sin afirmar que el seguimiento o la logística están automatizados si todavía no existen.

Para cada video preparar objetivo, duración, formato horizontal y vertical, guion, escenas, tomas, textos en pantalla, locución opcional y cierre de marca.

## Referencias de ecommerce

Usar como referencias de navegación y catálogo:
- Porter Paraguay: https://porter.com.py/ferreteria
- Sodimac Chile: https://www.sodimac.cl/sodimac-cl/lista/CATG10005/Construccion
- Leroy Merlin Brasil: https://www.leroymerlin.com.br/

Tomar ideas de organización y compra; no copiar sus diseños, textos ni marcas.

## División de responsabilidades

### Claude
- Ordena el alcance y prepara el plan de pantallas y flujos.
- Propone estructura visual, contenido y datos de ejemplo identificados como ficticios.
- Prepara guiones/storyboards de los dos videos.
- Revisa capturas y entrega observaciones concretas.

### Codex
- Revisa el repositorio y recomienda una arquitectura compatible con el alcance.
- Implementa la tienda y el panel interno.
- Comprueba que los flujos funcionen, revisa la vista móvil y corrige errores.
- Mantiene el código y las instrucciones del proyecto coherentes con este documento.

### Derlis
- Confirma datos comerciales y prioridades con Santa María.
- Revisa que el contenido y las promesas de la demo sean correctos para el negocio.

Evitar que Claude y Codex editen los mismos archivos a la vez. Claude entrega especificaciones y revisión; Codex implementa el código.

## Datos pendientes de confirmar con Santa María

- Catálogo definitivo, nombres, marcas, imágenes y presentaciones/unidades de venta.
- Precios y descuentos autorizados.
- Qué productos tienen stock y cómo se actualiza.
- Zonas de entrega, costos, plazos y restricciones para materiales pesados.
- Horarios, dirección y condiciones de retiro.
- Medios de pago reales previstos.
- Datos requeridos para factura.
- Responsable y proceso interno para preparar, despachar y cerrar los pedidos.

Hasta confirmar estos puntos, usar ejemplos de demo rotulados como ficticios o indicar “pendiente de confirmar”.

## Criterios de demo lista para presentar

- Un visitante puede navegar el catálogo y completar un pedido de muestra.
- Se puede ver una confirmación y recorrer los estados del pedido.
- El panel interno permite actualizar el estado de un pedido de muestra.
- Los valores ficticios y las funciones simuladas están claramente señalados.
- La interfaz es usable en móvil y escritorio.
- No se presentan pagos, inventario, entrega ni notificaciones como integraciones reales si no lo son.
