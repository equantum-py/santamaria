# Santa María Admin — E02-A: dominio comercial

## Alcance

Esta entrega prepara contratos, reglas puras y almacenamiento local para POS, Caja, Pedidos y Presupuestos. No agrega pantallas, endpoints, base de datos, pagos ni conexiones con el ecommerce.

## Módulos de código

- `lib/admin/types.ts`: contratos TypeScript del catálogo operativo y las entidades comerciales.
- `lib/admin/catalog.ts`: vista de solo lectura de los 40 productos existentes; el precio para operar se toma únicamente de `price_pyg`.
- `lib/admin/domain.ts`: validaciones, cálculos de guaraníes enteros, caja, ventas, transiciones y conversión de presupuesto a pedido.
- `lib/admin/demo-state.ts`: estado inicial vacío de operaciones, clientes ficticios y perfiles de operación simulados.
- `lib/admin/persistence.ts`: almacenamiento con clave `santamaria-admin-demo:v1`, validación de versión, recuperación de JSON inválido, reinicio y suscripciones en memoria.
- `scripts/qa/admin-domain.test.mjs`: pruebas de las reglas y persistencia.

## Persistencia y límites

El estado se guarda en `localStorage` del navegador y queda en ese dispositivo/perfil. No sincroniza entre dispositivos, no es una base de datos empresarial y no ofrece autenticación ni permisos reales. Las pantallas futuras deben mostrar el aviso **“Entorno de demostración — datos simulados”**, hidratar el estado antes de actualizarlo y pedir confirmación antes de ejecutar `reset()`.

El catálogo conserva su JSON original y no se copia a `localStorage`. Ventas y presupuestos guardan una fotografía del nombre, SKU, unidad y `price_pyg` al momento de la operación. Los datos iniciales no incluyen ventas u operaciones de ejemplo, para no sumarlas dos veces a los indicadores estáticos actuales.

Las cajas, movimientos, ventas y presupuestos aceptan identificadores de operación para rechazar reintentos duplicados. Tarjeta, transferencia y QR quedan registrados como pagos simulados sin aumentar el efectivo. La conversión de presupuesto se limita a presupuestos aceptados y guarda la referencia para impedir conversiones repetidas.

## Pruebas

Ejecutar `npm run test:admin-domain`, `npm run typecheck` y `npm run build`. Node 22 ejecuta las pruebas con su soporte de stripping de tipos. El workflow `.github/workflows/admin-stage02-domain.yml` repite estas validaciones en GitHub Actions para la rama y el PR dependiente.
