# Build y QA mobile

## Build estándar

En el checkout de Codex, `npm run build` fallaba después de compilar, durante la lectura de la configuración TypeScript de Next. El proyecto resuelve Next.js 16.4.0 y TypeScript 5.9.3. El comando `tsc --showConfig` ejecutado desde la terminal devuelve JSON válido; el fallo aparece cuando Next intenta ejecutar `tsc --showConfig` como proceso hijo. El runtime restringido rechaza ese `spawn` (`EPERM`) porque el ejecutable de Node está bajo `/opt/codex`; Next termina mostrando `Could not parse output from TypeScript's --showConfig` al recibir salida vacía. No es un error del `tsconfig` ni una incompatibilidad de versiones.

Se configuró `experimental.useTypeScriptCli: false` en `next.config.ts`. Next usa así la API del compilador TypeScript dentro del proceso de build, sin cambiar reglas de TypeScript ni el contenido del sitio. Se alineó `tsconfig.json` con los valores que Next 16 ya generaba (`jsx: react-jsx` e inclusión de `.next/dev/types/**/*.ts`) para que el build no necesite reescribirlo. `npm run build` pasa con la configuración normal, sin edición manual antes o después. El archivo `next-env.d.ts` también queda versionado como archivo generado que el `tsconfig` ya incluye.

## QA mobile del Preview

`.github/workflows/mobile-preview-qa.yml` ejecuta primero el build estándar y luego Playwright en GitHub Actions cuando Vercel informa un deployment exitoso de la rama `codex/investigacion-imagenes-productos`. También admite ejecución manual con una URL de Preview. El job usa la URL exacta del deployment reportado por Vercel.

El script `scripts/qa/mobile-preview.mjs` abre el Preview a 430, 390, 375, 360 y 320 px, guarda capturas y un reporte JSON como artefacto `santamaria-mobile-preview-qa`, y valida overflow horizontal, al menos 40 tarjetas, precio y botón Agregar de los 10 SKU activos, carga de sus imágenes, `object-fit: contain`, límites del contenedor y tamaño mínimo de representación.

Esta fase no cambia imágenes: permanecen 10 LISTO, 7 CANDIDATO y 23 SIN RESULTADO. Las referencias de candidatos para tornillos y ladrillo hueco siguen documentadas en `docs/atribuciones-imagenes-productos.md`; no se integran.
