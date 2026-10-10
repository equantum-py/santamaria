# Investigación de imágenes del catálogo Santa María
Fecha: 10 de octubre de 2026
Rama de trabajo: `codex/investigacion-imagenes-productos`

## Resultado ejecutivo

Se revisaron los 40 registros de `content/catalog.json`, la regla que realmente permite mostrar fotos en `lib/media.ts` y el árbol del repositorio en `main`.

- El catálogo contiene **40 productos**.
- El repositorio no tiene directorio `public/`; 30 registros apuntan a rutas relativas `images/products/...` que no existen como archivos locales.
- Diez registros apuntan a imágenes externas. Dos están habilitados actualmente por el proyecto: Sikacryl Plus de Sika y la grifería de la publicación de Santa María. Se conservan sin cambios.
- Los otros ocho enlaces externos apuntan a otros comercios o a un origen no identificado. Que la imagen o la ficha sea pública no demuestra permiso de reutilización comercial; quedan ocultas por la política actual de `lib/media.ts`.
- La primera revisión no había incorporado fotos. La segunda ronda amplió la búsqueda y verificó una licencia comercial explícita: se incorporó una imagen genérica de ladrillo común; se mantiene oculto cualquier candidato de tienda/fabricante sin permiso.
- No se alteraron catálogo, precios, nombres, disponibilidad, interfaz, ni lógica de compra.

## Fuentes revisadas

| Fuente | Hallazgo | Uso en la tienda |
|---|---|---|
| [Stanley Black & Decker — términos de uso](https://www.stanleyblackanddecker.com/es/node/2386) | Indica que las imágenes y demás materiales están protegidos; excluye uso comercial de sus materiales sin consentimiento expreso escrito. | La foto de flexómetro no se copia. Pedir a Santa María o Stanley autorización/kit para distribuidores. |
| [Bosch Professional — GSB 13 RE, versión 750 W](https://www.bosch-professional.com/central-america/es/products/gsb-13re-06012B80E0) | Confirma modelo GSB 13 RE de 750 W y disponibilidad de fotografía oficial. No se localizó autorización para redistribuir el asset en este ecommerce. | Candidato de identidad solamente; no descargado. Solicitar permiso o kit comercial. |
| [Deca — Quadra blanco P.210.17](https://www.deca.com.br/ambientes/banheiro-e-lavabo/bacias-sanitarias/bacia-sanitaria-para-caixa-acoplada/bacia-para-caixa-acoplada-quadra-branco-p-210-17) y [kit completo KP.211.17](https://www.deca.com.br/ambientes/banheiro-e-lavabo/bacias-sanitarias/kit-bacia-sanitaria-com-caixa-acoplada/kit-completo-bacia-com-caixa-acoplada-brancokp21117) | La línea/modelo existe en el fabricante. El catálogo de Santa María no tiene código de modelo/variante suficiente para validar contra la foto externa existente. | No copiado; confirmar código exacto y permiso. |
| [Yguazú Cementos — productos](https://www.yguazucementos.com.py/productos/) | El fabricante publica cemento C32 y bolsas de 50 kg. No se halló autorización de reutilización de la imagen de una tienda distribuidora. | No copiado; pedir al proveedor el pack para canal comercial o autorización. |
| [Schneider Electric — A9K24140 Acti9 iK60 1P 40 A](https://www.se.com/ar/es/product/A9K24140/interruptor-termomagn%C3%A9tico-acti9-ik60-1p-40a-curva-c-6ka/) | Hay una ficha oficial 1P/40 A, pero el producto demo no tiene referencia de modelo completa; podría corresponder a otra familia Acti9. | No copiado; confirmar referencia exacta y permiso. |
| [Cejatel Imperial Lux, ficha existente de Casa Deco](https://casadeco.com.py/384-home_default/cejatel-50x50-imperial-lux.jpg) | Coincide nominalmente con la referencia del catálogo, pero el asset es de otro comercio. No se encontró licencia para republicarlo. | Continúa oculto; solicitar imagen a Santa María/Cejatel y permiso. |
| [Todoluz — caño corrugado 3/4](https://todoluz.com.py/tienda/materiales-electricos/instalaciones/corrugado/cao-corrugado-negro-34-x1metro/) y [Electropar — caño corrugado Tigre](https://www.electropar.com.py/producto/cano-corrugado-25mm-3-4-tigre) | Hay productos locales visualmente cercanos, pero las presentaciones y marcas difieren del registro del catálogo. | No reutilizado; confirmar marca/presentación y permiso. |
| [Delia Elisa — cuchara Tramontina 8 pulgadas](https://deliaelisa.com.py/productos/cuchara-p-albanil-tramontina-8-pesada-77348-085/) | Coincidencia de tipo, pero el catálogo no confirma Tramontina; una coincidencia de categoría no basta para una foto exacta. | No reutilizado; confirmar marca y obtener foto autorizada. |

## Inventario completo

La columna “fuente actual” registra la referencia guardada en el catálogo, no una autorización de uso. Las rutas `images/products/...` son referencias inexistentes; no se encontró un archivo local asociado en el árbol de `main`.

| SKU | Producto | Marca declarada | Estado de referencia | Fuente actual | Revisión y acción |
|---|---|---|---|---|---|
| SM-FER-001 | Flexómetro Stanley Global · 5 m (16 ft) | Stanley | Candidato externo | https://ferreteriatecnica.co/products/cinta-metrica-global-5-mts | Candidato existente: Ferretería Técnica Colombia, página de Stanley Global 5 m. El nombre de archivo identifica flexómetro; no hay permiso de uso. Stanley prohíbe explotación comercial de materiales sin consentimiento expreso escrito. | Pendiente: falta permiso/licencia verificable |
| SM-FER-002 | Taladro percutor Bosch GSB 13 RE · 750 W | Bosch | Candidato externo | https://www.cifer.com.uy/catalogo/herramientas/electricas/taladros-percutores/taladro-percutor-bosch-gsb-13-re-750w-13mm-rev-06012b80e0-000/ | Candidato existente: Cifer Uruguay, Bosch GSB 13 RE 750 W; coincidencia de modelo, pero la foto está alojada en otro comercio. Página oficial Bosch confirma el modelo 750 W; no se halló licencia de reutilización para la foto. | Pendiente: falta permiso/licencia verificable |
| SM-FER-003 | Cuchara de albañil 8 pulgadas | Consultar marca | No hay archivo | images/products/cuchara-de-albanil-8-pulgadas.jpg | No hay archivo local ni fuente enlazada en el catálogo. La foto sigue pendiente: falta confirmar marca/modelo cuando aplique y obtener una imagen propia o un asset con permiso; no se asumió una coincidencia genérica. | Pendiente: falta permiso/licencia verificable |
| SM-FER-004 | Nivel de aluminio 60 cm | Consultar marca | No hay archivo | images/products/nivel-de-aluminio-60-cm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-FER-005 | Taladro percutor 650 W | Consultar marca | No hay archivo | images/products/taladro-percutor-650-w.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-FER-006 | Amoladora angular 115 mm 850 W | Consultar marca | No hay archivo | images/products/amoladora-angular-115-mm-850-w.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-FER-007 | Tornillos para madera 8 x 1 1/2 pulgadas | Consultar marca | No hay archivo | images/products/tornillos-para-madera-8-x-1-1-2-pulgadas.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-FER-008 | Tarugos plásticos 8 mm | Consultar marca | No hay archivo | images/products/tarugos-plasticos-8-mm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-FER-009 | Sikacryl Plus Sika · membrana impermeable 5 kg | Sika | Candidato externo | https://pry.sika.com/es/construccion/impermeabilizacion/impermeabilizaciondefachadas/sikacryl-plus-py.html | Foto del fabricante Sika ya habilitada por el proyecto; conservar como está, sin reemplazarla. | Conservar foto activa |
| SM-FER-010 | Rodillo de lana 23 cm | Consultar marca | No hay archivo | images/products/rodillo-de-lana-23-cm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-001 | Inodoro Deca Quadra con mochila · blanco | Deca | Candidato externo | https://www.allbanho.com.br/banheiro/loucas-sanitarias/bacias-e-caixas/kit-completo-bacia-com-caixa-acoplada-quadra-branco-deca-20691 | Candidato existente alojado en tienda brasileña. Deca publica el modelo Quadra y el kit completo KP.211.17 en su sitio oficial; no se confirmó que la foto externa existente sea la misma variante ni su licencia. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-002 | Lavatorio con columna blanco | Consultar marca | No hay archivo | images/products/lavatorio-con-columna-blanco.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-003 | Asiento para inodoro plástico | Consultar marca | No hay archivo | images/products/asiento-para-inodoro-plastico.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-004 | Grifería para baño · referencia publicada por Santa María | Santa María · referencia pública | Candidato externo | https://www.construex.com.py/exhibidores/materiales_de_construccion_santa_maria/producto/grifos_bano_paraguay | Foto ya habilitada por el proyecto, publicada en el exhibidor de Santa María en Construex; conservar como está. | Conservar foto activa |
| SM-SAN-005 | Ducha eléctrica 5500 W | Consultar marca | No hay archivo | images/products/ducha-electrica-5500-w.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-006 | Caño PVC soldable 25 mm | Consultar marca | No hay archivo | images/products/cano-pvc-soldable-25-mm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-007 | Caño PVC desagüe 100 mm | Consultar marca | No hay archivo | images/products/cano-pvc-desague-100-mm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-008 | Codo PVC soldable 25 mm 90° | Consultar marca | No hay archivo | images/products/codo-pvc-soldable-25-mm-90.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-009 | Llave de paso esférica 3/4 pulgada | Consultar marca | No hay archivo | images/products/llave-de-paso-esferica-3-4-pulgada.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-SAN-010 | Tanque de agua 1000 litros | Consultar marca | No hay archivo | images/products/tanque-de-agua-1000-litros.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-001 | Cemento Yguazú Portland compuesto CPII-C32 · 50 kg | Yguazú | Candidato externo | https://construshop.com.py/23460 | Candidato existente de Construshop. Yguazú publica productos C32 en bolsa de 50 kg, pero no se verificó permiso de reutilizar la imagen del comercio. | Pendiente: falta permiso/licencia verificable |
| SM-CON-002 | Cemento de albañilería | Consultar marca | No hay archivo | images/products/cemento-de-albanileria.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-003 | Cerámica Cejatel Imperial Lux · 50 × 50 cm | Cejatel · referencia de producto | Candidato externo | https://casadeco.com.py/ceramicas/238-cejatel-50x50-imperial-lux.html | Candidato existente de Casa Deco; la página refiere a Cejatel 50x50 Imperial Lux. Sin permiso de Casa Deco ni asset pack autorizado de Cejatel. | Pendiente: falta permiso/licencia verificable |
| SM-CON-004 | Pegamento para cerámica | Consultar marca | No hay archivo | images/products/pegamento-para-ceramica.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-005 | Arena lavada | Sin marca | No hay archivo | images/products/arena-lavada.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-006 | Piedra triturada 6ta | Sin marca | No hay archivo | images/products/piedra-triturada-6ta.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-007 | Ladrillo común | Sin marca | No hay archivo | images/products/ladrillo-comun.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-008 | Ladrillo hueco 12 x 18 x 33 cm | Consultar marca | No hay archivo | images/products/ladrillo-hueco-12-x-18-x-33-cm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-CON-009 | Varilla corrugada de construcción · 8 mm x 12 m | Consultar marca | Candidato externo | https://www.construex.com.py/exhibidores/deposito_de_materiales_serrana/producto/varilla_corrugada_paraguay | Candidato externo alojado en CloudFront, sin ficha de producto verificable ni modelo/marca; rechazar hasta identificar fabricante y origen. | Pendiente: falta permiso/licencia verificable |
| SM-CON-010 | Varilla de hierro 10 mm | Consultar marca | No hay archivo | images/products/varilla-de-hierro-10-mm.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-001 | Cable unipolar Argenplas 2,5 mm² · rollo 100 m | Argenplas | Candidato externo | https://www.jumaelectric.com.ar/productos/cable-unipolar-argenplas-flexible-25-mm-celeste-100-mts/ | Candidato existente de una tienda argentina en Tiendanube. El producto identifica Argenplas/Juma Electric, pero no es fuente autorizada de Santa María y no aporta permiso de reutilización. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-002 | Cable unipolar 1,5 mm² | Consultar marca | No hay archivo | images/products/cable-unipolar-1-5-mm2.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-003 | Caño corrugado 3/4 pulgada | Consultar marca | No hay archivo | images/products/cano-corrugado-3-4-pulgada.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-004 | Llave de luz simple con placa | Consultar marca | No hay archivo | images/products/llave-de-luz-simple-con-placa.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-005 | Tomacorriente doble con placa | Consultar marca | No hay archivo | images/products/tomacorriente-doble-con-placa.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-006 | Lámpara LED 9 W luz fría | Consultar marca | No hay archivo | images/products/lampara-led-9-w-luz-fria.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-007 | Reflector LED 50 W exterior | Consultar marca | No hay archivo | images/products/reflector-led-50-w-exterior.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-008 | Interruptor termomagnético Schneider Acti9 · 1 polo, 40 A | Schneider Electric | Candidato externo | https://syzcominsa.pe/products/a9f74140-interruptor-termomagnetico-riel-acti-9-schneider | Candidato existente de Syzcom Perú; catálogo Schneider confirma opciones Acti9 de 1P/40 A, pero el nombre del producto no contiene referencia completa para distinguir iK60/iC60N ni se confirmó licencia de imagen. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-009 | Interruptor diferencial 2 x 25 A | Consultar marca | No hay archivo | images/products/interruptor-diferencial-2-x-25-a.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |
| SM-ELE-010 | Tablero para 8 módulos embutido | Consultar marca | No hay archivo | images/products/tablero-para-8-modulos-embutido.jpg | No existe archivo local correspondiente en el repositorio (no hay directorio public/ ni el archivo de imagen); marca/modelo no definido o sin candidato exacto con autorización verificada. | Pendiente: falta permiso/licencia verificable |

## Criterio aplicado

1. La coincidencia de marca/modelo se trata por separado del permiso de uso.
2. No se tomaron imágenes de resultados de Google, marketplaces o comercios para publicarlas.
3. Las páginas de fabricante sirven para validar identidad; no se asumió que habilitan descarga o redistribución de sus fotos.
4. Los productos sin marca/modelo confirmados no reciben una imagen de una marca elegida por el agente.
5. Se conservan las dos fotos que ya aparecen habilitadas en el proyecto; esta ronda no las altera.

## Material que falta para integrar imágenes

Santa María puede destrabar la integración entregando cualquiera de estas opciones por SKU:

- fotografía propia del producto tomada en el local o depósito;
- archivo de catálogo/pack de imágenes del fabricante o distribuidor con permiso para usar en ecommerce;
- autorización escrita del titular de derechos que especifique uso comercial en el sitio;
- nombre de marca y modelo/part number de los artículos genéricos o incompletos.

Con los archivos autorizados, se pueden guardar en `public/products/<categoría>/`, relacionarlos al SKU, registrar la fuente y evidencia de permiso, y validar el sitio en desktop/mobile sin modificar el diseño.


## Segunda investigación ampliada — 10 de octubre de 2026

Este anexo amplía y reemplaza cualquier conclusión anterior sobre cobertura y ausencia de imágenes. Se revisaron fuentes de fabricante, distribuidores, mayoristas, catálogos/PDF, comercios de Paraguay, Argentina, Brasil y Uruguay, y bancos/repositorios con licencias comerciales o Creative Commons. La búsqueda de cada SKU incluyó varias formulaciones por nombre técnico, medida, marca y presentación; las filas de abajo incluyen la mejor evidencia recuperada.

### Resultado de esta ronda

- **3 LISTO**: dos fotos que ya estaban habilitadas por el proyecto y una imagen genérica nueva para ladrillo común.
- **8 CANDIDATO**: coincidencia de producto suficientemente cercana; falta permiso para reutilizar la foto externa.
- **29 NECESITA CONFIRMACIÓN**: se hallaron productos parecidos, pero la marca, modelo, presentación, acabado, variante o especificación no coincide o no está indicada en el catálogo.
- **0 SIN RESULTADO**: en esta ronda no se declara un SKU agotado sin buscar. Los SKUs sin una coincidencia exacta se incluyen en “Necesita confirmación” con el dato que falta.
- Se agrega solamente `SM-CON-007` a `public/images/products/ladrillo-comun.jpg`. No se tocaron precios, nombres, categorías, tarjetas, diseño, navegación, buscador, carrito ni checkout.

La búsqueda de medios genéricos encontró fotos de arena en Wikimedia Commons y Pixabay con licencias reutilizables. No se publica una en `SM-CON-005`: las fotos encontradas muestran arena de construcción genérica, pero no permiten verificar que sea arena lavada y una alternativa mostraba un acopio con entorno de cantera; falta confirmar con Santa María que una imagen referencial genérica sea aceptable para esa especificación.

### Clasificación de los 40 SKU

| SKU | Estado | Producto | Resultado de identidad / dato faltante |
|---|---|---|---|
| SM-FER-001 | CANDIDATO | Flexómetro Stanley Global 5 m | Coincidencia de modelo y longitud; falta permiso sobre la foto externa. |
| SM-FER-002 | CANDIDATO | Bosch GSB 13 RE 750 W | Coincidencia de modelo y potencia; falta permiso sobre la foto externa. |
| SM-FER-003 | NECESITA CONFIRMACIÓN | Cuchara de albañil 8″ | Falta marca/modelo; el resultado local más cercano es Tramontina 8″. |
| SM-FER-004 | NECESITA CONFIRMACIÓN | Nivel de aluminio 60 cm | Coincidencia de medida en Baumarket, marca Total; Santa María debe confirmar marca y forma. |
| SM-FER-005 | NECESITA CONFIRMACIÓN | Taladro percutor 650 W | Hay alternativas B+D, Jadever y otras; confirmar marca, modelo, mandril y voltaje. |
| SM-FER-006 | NECESITA CONFIRMACIÓN | Amoladora 115 mm 850 W | Hay alternativas Profield, Gamma, Einhell y otras; confirmar fabricante/modelo. |
| SM-FER-007 | NECESITA CONFIRMACIÓN | Tornillo madera #8 × 1 1/2″ | Se halló Toolcraft #8 × 1 1/2″ x100; confirmar marca, acabado y empaque. |
| SM-FER-008 | NECESITA CONFIRMACIÓN | Tarugo plástico 8 mm | Hay versiones para ladrillo hueco/común, con o sin tornillo y distintos packs; confirmar variante y cantidad. |
| SM-FER-009 | LISTO | Sikacryl Plus Sika 5 kg | Foto oficial de Sika ya habilitada en el proyecto; se conserva. |
| SM-FER-010 | NECESITA CONFIRMACIÓN | Rodillo de lana 23 cm | Hay Roma, Compel, Atlas y Tigre; confirmar fibra, modelo, mango y marca. |
| SM-SAN-001 | CANDIDATO | Inodoro Deca Quadra con mochila blanco | Coincidencia de línea/kit en Deca y tiendas brasileñas; falta permiso de la imagen y confirmar código del kit. |
| SM-SAN-002 | NECESITA CONFIRMACIÓN | Lavatorio con columna blanco | Se encontró Celite blanco; falta marca/modelo de Santa María y confirmar si incluye pedestal. |
| SM-SAN-003 | NECESITA CONFIRMACIÓN | Asiento plástico para inodoro | Faltan forma, medidas, color, bisagras y modelo. |
| SM-SAN-004 | LISTO | Grifería para baño | Foto ya publicada por Santa María en Construex y habilitada por el proyecto; se conserva. |
| SM-SAN-005 | NECESITA CONFIRMACIÓN | Ducha eléctrica 5500 W | Baumarket tiene Dicompel 220 V / 5500 W; confirmar marca, voltaje y modelo. |
| SM-SAN-006 | NECESITA CONFIRMACIÓN | Caño PVC soldable 25 mm | Ferremas, Tigre/Inducrom muestran tiras de 6 m; confirmar marca, largo y clase/presión. |
| SM-SAN-007 | NECESITA CONFIRMACIÓN | Caño PVC desagüe 100 mm | Construshop lista Tigre/Plastec en tiras de 6 m; confirmar marca, largo, espesor y norma. |
| SM-SAN-008 | NECESITA CONFIRMACIÓN | Codo PVC soldable 25 mm 90° | Delia Elisa tiene Tigre con esa medida; confirmar marca/color y cantidad de venta. |
| SM-SAN-009 | NECESITA CONFIRMACIÓN | Llave esférica 3/4″ | Se encontraron Deca y Plastilit; confirmar marca, material y tipo de conexión. |
| SM-SAN-010 | NECESITA CONFIRMACIÓN | Tanque de agua 1000 L | Fibrac tiene tanque tricapa tipo vaso; confirmar marca, geometría, capas, color y tapa. |
| SM-CON-001 | CANDIDATO | Cemento Yguazú CPII-C32 50 kg | Coincide marca, tipo y bolsa; falta permiso de la imagen del distribuidor. |
| SM-CON-002 | NECESITA CONFIRMACIÓN | Cemento de albañilería 40 kg | Hay Vallemi CAB 4.5 y otras marcas; confirmar marca y tipo exacto. |
| SM-CON-003 | CANDIDATO | Cejatel Imperial Lux 50×50 | Coincidencia nominal exacta en Casa Deco; falta permiso de Casa Deco/Cejatel. |
| SM-CON-004 | NECESITA CONFIRMACIÓN | Pegamento para cerámica 30 kg | Hay variantes SikaCeram y otras; confirmar marca, adhesivo/clase, color y bolsa. |
| SM-CON-005 | NECESITA CONFIRMACIÓN | Arena lavada | Pixabay/Wikimedia tienen arena de construcción con licencia; confirmar que represente la arena lavada vendida por Santa María. |
| SM-CON-006 | CANDIDATO | Piedra triturada 6.ª | R. Maia publica piedra triturada 6.ª de 6 mm; falta permiso de su foto. |
| SM-CON-007 | LISTO | Ladrillo común | Foto genérica de ladrillos de arcilla, Pixabay Content License; asset incorporado. |
| SM-CON-008 | CANDIDATO | Ladrillo hueco 12×18×33 cm | Cerámica Chaco confirma esa medida; falta permiso del fabricante para la foto. |
| SM-CON-009 | NECESITA CONFIRMACIÓN | Varilla corrugada 8 mm × 12 m | Hay ofertas brasileñas CA50 8 mm × 12 m y referencia en Construex; confirmar acero/norma y marca que vende Santa María. |
| SM-CON-010 | NECESITA CONFIRMACIÓN | Varilla de hierro 10 mm | Hay especificaciones locales para 10 mm; confirmar corrugada/lisa, calidad, norma, marca y largo. |
| SM-ELE-001 | CANDIDATO | Cable Argenplas 2,5 mm² rollo 100 m | Coincide marca/sección/longitud en Juma Electric; confirmar color y pedir permiso de la foto al titular. |
| SM-ELE-002 | NECESITA CONFIRMACIÓN | Cable unipolar 1,5 mm² | Se encontraron Inpaco/CondEl con colores y presentaciones distintos; confirmar marca, color y rollo. |
| SM-ELE-003 | NECESITA CONFIRMACIÓN | Caño corrugado eléctrico 3/4″, rollo 25 m | Electropar ofrece Tigre naranja de 25 m; confirmar marca/color de Santa María. |
| SM-ELE-004 | NECESITA CONFIRMACIÓN | Llave de luz simple con placa | Hay Elektron, Tramontina, Kally y Sica; confirmar línea, color y formato de placa. |
| SM-ELE-005 | NECESITA CONFIRMACIÓN | Tomacorriente doble con placa | Hay placas y líneas distintas; confirmar marca, color, puesta a tierra y estándar. |
| SM-ELE-006 | NECESITA CONFIRMACIÓN | Lámpara LED 9 W luz fría pack x4 | VCP ofrece 9 W pack x4, pero la ficha titula “frío” y detalla 3000 K (cálido); confirmar marca y temperatura de color antes de usar imagen. |
| SM-ELE-007 | NECESITA CONFIRMACIÓN | Reflector LED exterior 50 W | Hay modelos con diferencias en IP, sensor, color y forma; confirmar marca/modelo y protección. |
| SM-ELE-008 | NECESITA CONFIRMACIÓN | Schneider Acti9 1P 40 A | Schneider tiene varias referencias 1P/40 A; falta código exacto, curva y poder de corte. |
| SM-ELE-009 | NECESITA CONFIRMACIÓN | Diferencial 2×25 A | Hay modelos de varias marcas; confirmar marca, sensibilidad diferencial (mA), polos y tipo. |
| SM-ELE-010 | NECESITA CONFIRMACIÓN | Tablero embutido de 8 módulos | Hay T-Plast/VCP/Argo y alternativas con tapa diferente; confirmar marca, puerta, material e IP. |

### CANDIDATOS sin permiso documentado

“Coincidencia estimada” expresa coincidencia de nombre y especificaciones visibles; no certifica que Santa María tenga exactamente esa variante. Los candidatos permanecen fuera de la tienda.

| SKU / producto | Página del producto | Imagen directa, si disponible | Fabricante/tienda | Coincidencia | Por qué no se publicó / permiso pendiente |
|---|---|---|---|---|---|
| SM-FER-001 Stanley Global 5 m | [Ferretería Técnica](https://ferreteriatecnica.co/products/cinta-metrica-global-5-mts) | [JPG directo](https://ferreteriatecnica.co/cdn/shop/products/Flexometro-5-mts-stanley_900x.jpg?v=1625496120) | Ferretería Técnica / Stanley | 95% | La página identifica Stanley Global 5 m; la foto no tiene licencia publicada para republicación. Pedir a Stanley o al fotógrafo/distribuidor autorización escrita para ecommerce o kit de dealer. Stanley restringe el uso comercial de materiales de su sitio sin consentimiento escrito. |
| SM-FER-002 Bosch GSB 13 RE 750 W | [Cifer Uruguay](https://www.cifer.com.uy/catalogo/herramientas/electricas/taladros-percutores/taladro-percutor-bosch-gsb-13-re-750w-13mm-rev-06012b80e0-000/) | [JPG directo](https://www.cifer.com.uy/imgs/productos/_original_16154.jpg) | Cifer / Bosch | 100% modelo/potencia | Bosch confirma GSB 13 RE 750 W, pero no se localizó permiso de redistribución de esta foto. Pedir permiso a Cifer o asset comercial Bosch. |
| SM-SAN-001 Deca Quadra con mochila | [Allbanho](https://www.allbanho.com.br/banheiro/loucas-sanitarias/bacias-e-caixas/kit-completo-bacia-com-caixa-acoplada-quadra-branco-deca-20691) | [JPG directo](https://images.tcdn.com.br/img/img_prod/1349798/kit_completo_bacia_com_caixa_acoplada_quadra_branco_deca_20691_1_580b98277fd7893e864a182927198389.jpg) | Allbanho / Deca | 90% | Coincide kit Quadra blanco; hay que confirmar código/variante y la tienda no publica licencia. Pedir a Allbanho/Deca permiso comercial o media kit para distribuidores. |
| SM-CON-001 Yguazú CPII-C32 50 kg | [Tupi](https://www.tupi.com.py/producto/MKP092372/BOLSA-DE-CEMENTO-COMPUESTO-YGUAZU-CP2-C32-DE-50KG.-) | [JPG directo de Construshop](https://hhmniisxddfuccbaybui.supabase.co/storage/v1/object/public/productImages/construshop/YG.jpg-1757537415270-large.jpg) | Tupi/Construshop / Yguazú | 100% etiqueta/producto | Marca, compuesto y bolsa coinciden; la foto está alojada en distribuidor sin permiso de copia. Pedir autorización al distribuidor/fotógrafo o a Yguazú para asset comercial. |
| SM-CON-003 Cejatel Imperial Lux 50×50 | [Casa Deco](https://casadeco.com.py/ceramicas/238-cejatel-50x50-imperial-lux.html) | [JPG directo](https://casadeco.com.py/384-home_default/cejatel-50x50-imperial-lux.jpg) | Casa Deco / Cejatel | 100% nombre/medida | Es la referencia exacta visible, pero pertenece a otro comercio. Pedir a Cejatel un archivo de distribuidor autorizado o permiso escrito de Casa Deco/Cejatel. |
| SM-CON-006 piedra triturada 6.ª | [R. Maia](https://rmaiasa.com.py/producto/piedra-triturada-6/) | Imagen disponible en ficha; el servidor no expone URL directa estable en el texto indexado. | R. Maia | 95% | Ficha especifica piedra triturada 6.ª, 6 mm. Pedir permiso a R. Maia o a quien tomó la foto para alojarla en el ecommerce. |
| SM-CON-008 ladrillo hueco 12×18×33 | [Cerámica Chaco](https://www.ceramicachaco.com.py/productos_ladrillo_hueco.html) | Imagen visible junto a la ficha de medidas; el sitio no expuso URL directa estable. | Cerámica Chaco | 100% medida | El fabricante confirma la medida; permiso de uso de imagen no está publicado. Solicitar pack de distribuidor/marketing o permiso escrito. |
| SM-ELE-001 cable Argenplas 2,5 mm² 100 m | [Juma Electric](https://www.jumaelectric.com.ar/productos/cable-unipolar-argenplas-flexible-25-mm-celeste-100-mts/) | [WebP directo](https://acdn-us.mitiendanube.com/stores/004/754/236/products/cable-argenplas-juma-electric-junin-250-mm-azul-homologado-2-867a0e1f73ec21662e17321275162102-1024-1024.webp) | Juma Electric / Argenplas | 95% | Coincide marca, sección y rollo; el color visible es celeste/azul. Falta confirmar que sea la variante de Santa María y permiso del comercio/fotógrafo o Argenplas. |

### Datos puntuales que Santa María debe confirmar

| SKU | Confirmar exactamente |
|---|---|
| SM-FER-003 | Marca/modelo o indicar que se venderá una cuchara genérica; tipo albañil y medida 8″. |
| SM-FER-004 | Marca/modelo, 60 cm y si es nivel con burbuja; perfil y color. |
| SM-FER-005 | Marca/modelo, potencia real 650 W, voltaje, mandril y accesorios. |
| SM-FER-006 | Marca/modelo, disco 115 mm, potencia 850 W y voltaje. |
| SM-FER-007 | Marca, material/acabado, empaque/cantidad; confirmar si el tornillo es de rosca completa o parcial. |
| SM-FER-008 | Uso para ladrillo hueco o macizo, con/sin tornillo, color/forma y cantidad por pack. |
| SM-FER-010 | Marca/modelo, lana natural o sintética, alto de fibra y si incluye mango. |
| SM-SAN-002 | Marca/modelo de lavatorio; pedestal incluido y forma/ancho. |
| SM-SAN-003 | Marca/modelo, medidas, color, bisagra y forma ovalada/redonda. |
| SM-SAN-005 | Marca/modelo, 220 V u otro voltaje y tipo de ducha. |
| SM-SAN-006 | Marca, largo de tira, clase/PN y uso de agua fría/caliente. |
| SM-SAN-007 | Marca, largo, espesor/serie y norma del tubo 100 mm. |
| SM-SAN-008 | Marca/color y si es unidad o paquete. |
| SM-SAN-009 | Marca, bronce/PVC, roscable/soldable y si incluye manija. |
| SM-SAN-010 | Marca/modelo, tipo de cuerpo, número de capas, color, tapa y protección UV. |
| SM-CON-002 | Marca (por ejemplo Vallemi/otra), tipo CAB/denominación y bolsa 40 kg. |
| SM-CON-004 | Marca, clase del adhesivo, interior/exterior y bolsa 30 kg. |
| SM-CON-005 | Confirmar granulometría/origen de arena lavada y si acepta foto genérica de arena de construcción o exige foto del material local. |
| SM-CON-009 | Marca, norma/calidad, superficie corrugada y diámetro/largo comercial de la barra. |
| SM-CON-010 | Marca, lisa o corrugada, calidad/norma y largo (el catálogo sugiere 12 m). |
| SM-ELE-002 | Marca, color, aislación/tensión y si el rollo es de 100 m. |
| SM-ELE-003 | Marca, color del tubo, flexibilidad y rollo de 25 m. |
| SM-ELE-004 | Marca/línea, color, tecla y forma de placa. |
| SM-ELE-005 | Marca/línea, color, puesta a tierra y tipo de placa. |
| SM-ELE-006 | Marca/modelo, E27 u otra rosca, y temperatura real en K; la ficha VCP localizada rotula “frío” pero también declara 3000 K (cálido). |
| SM-ELE-007 | Marca/modelo, IP, si lleva sensor y temperatura/color de luz. |
| SM-ELE-008 | Código Schneider exacto, curva, kA, número de polos y referencia Acti9. |
| SM-ELE-009 | Marca/modelo, polos, corriente diferencial nominal en mA y tipo AC/A. |
| SM-ELE-010 | Marca, tipo de tapa/puerta, IP, material y configuración de 8 módulos. |

### Fuentes adicionales consultadas por categoría

Además de las fuentes enlazadas en las tablas anteriores, se contrastaron varias opciones locales y regionales por SKU:

- **Ferretería:** tiendas paraguayas Baumarket, Ferremas, Tienda Lincoln, Nissei, Porter, Delia Elisa y catálogos de herramientas/fijaciones; marcas comparadas incluyen Bellota/Tramontina, Total, B+D/Jadever, Profield/Gamma/Bosch, Toolcraft y Roma/Compel/Atlas.
- **Sanitarios y plomería:** Deca, Celite, Baumarket, Delia Elisa, Ferremas, Construshop, Tigre, Inducrom/Paipuku, Plastilit y Fibrac; se revisaron páginas comerciales y fichas/catálogos técnicos.
- **Construcción:** Yguazú, INC/Vallemi, Cejatel, Tupi, Construshop, R. Maia, Cerámica Chaco, comercios locales de áridos y proveedores de hierro en Paraguay/Brasil.
- **Eléctricos:** Argenplas/Juma y comercios argentinos, Electropar, VCP, Schneider, Todoluz, Nissei, Baumarket y distribuidores de las marcas Sica/Elektron/Tramontina; se compararon ficha y medida frente a cada descripción.
- **Licencias para genéricos:** Wikimedia Commons (incluidos archivos CC0 y CC BY-SA, licencia comprobada por archivo), Pixabay Content License y Pexels; para arena no se encontró una foto que fuera a la vez visualmente adecuada y que eliminara la duda del tipo lavado.

### Registro del asset publicado

La foto de ladrillos proviene de Pixabay, no representa una marca comercial y no incluye precio ni marca de tienda. Se conserva la licencia y procedencia en [`docs/atribuciones-imagenes-productos.md`](./atribuciones-imagenes-productos.md). La atribución no es obligatoria según la licencia Pixabay, pero queda documentada; el recorte a cuadrado y la reducción de tamaño se anotan como modificaciones.
