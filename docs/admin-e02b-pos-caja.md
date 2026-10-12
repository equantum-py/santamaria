# Santa María Admin — E02-B: POS y Caja

## Alcance

E02-B agrega `/admin/pos` y `/admin/caja` sobre el dominio aprobado en E02-A. Reutiliza `DemoStateStore`, `localStorage` versionado y las operaciones `recordSale`, `openCashSession`, `addManualCashMovement`, `getExpectedCash` y `closeCashSession`. No crea una segunda fuente de estado.

## Flujo de venta

- El adaptador de solo lectura presenta los 40 productos del catálogo. Búsqueda inmediata por nombre, SKU y categoría; filtros por categoría.
- El carrito consolida cada SKU, permite cambiar cantidades y calcula el total desde `price_pyg`.
- Los medios efectivo, tarjeta, transferencia y QR son simulados. La interfaz no pide ni almacena números de tarjeta.
- `recordSale` valida la caja abierta del perfil, productos, cantidad, medio de pago, vuelto y operación única. Después de persistir se limpia el carrito y queda disponible el ticket imprimible marcado **COMPROBANTE DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL**.
- Las ventas no alteran el catálogo ni el inventario.

## Caja y dashboard

- Apertura con responsable ficticio e importe entero no negativo; movimientos manuales con motivo y monto positivo.
- El efectivo esperado suma apertura, ventas en efectivo e ingresos, y resta egresos. Tarjeta, transferencia y QR quedan en el total de ventas por método, con efecto en efectivo igual a cero.
- El arqueo usa contado menos esperado. El dominio impide nuevas operaciones luego del cierre y el POS solicita una caja abierta.
- El historial permite consultar apertura, cierre, responsable, diferencia, ventas y movimientos.
- El dashboard muestra ventas y distribución por medio de pago desde el estado compartido. El monto inicial está en cero para no sumar ventas ficticias estáticas y operaciones nuevas.

## Perfiles y límites

El perfil Cajera muestra POS y Caja; Gerencia muestra Resumen, POS y Caja; Administración conserva todos los módulos. Es navegación visual de demostración, no autenticación ni autorización. Clientes, responsables y operaciones son ficticios. El estado permanece en el navegador actual; no hay sincronización entre dispositivos, cobros reales, facturación fiscal ni persistencia empresarial.

## QA reproducible

`npm run test:admin-domain`, `npm run typecheck` y `npm run build`. El workflow `admin-e02b-qa.yml` repite esas pruebas y usa Playwright/Chromium para completar una venta, movimiento, arqueo y cierre en 1440, 1024, 768, 430, 390, 375 y 320 px; también valida persistencia, resumen del dashboard, ticket, ecommerce público y desbordamiento horizontal. Las capturas se publican como artefacto `santamaria-admin-e02b-qa`.
