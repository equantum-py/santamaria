# Ecommerce Santa María

Tienda de demostración para Materiales Santa María, Limpio, Paraguay.

## Tecnología

La aplicación está hecha con TypeScript, React y Next.js. El ecommerce no incorpora inteligencia artificial: Claude y Codex se usan como herramientas para preparar contenido y escribir/revisar el código. La tienda funciona con lógica programada de forma convencional.

## Recorrido disponible

- Catálogo por categorías, búsqueda y orden por precio.
- Ficha de producto y carrito.
- Checkout de demostración con entrega en obra o retiro, datos de contacto y opciones de pago simuladas.
- Confirmación y seguimiento local del pedido, guardado en el navegador.

Los productos, precios, pagos, disponibilidad, zonas y costos de entrega son datos de ejemplo. La compra no realiza cobros ni envía pedidos a Santa María.

## Ejecutar en un entorno de desarrollo

Requiere Node.js 20.9 o posterior.

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Para validar tipos y preparar una compilación:

```bash
npm run typecheck
npm run build
```

## División de trabajo

- **Codex:** interfaz y lógica del ecommerce en `app/`, `components/` y `lib/`.
- **Claude:** catálogo y zonas de ejemplo en `content/`; especificaciones de pantallas y textos en `docs/`.
- Mantener el catálogo ficticio identificado como tal hasta que Santa María confirme productos, precios, stock, pagos y entregas.
