# Investigación de imágenes del catálogo Santa María

Fecha: 10 de octubre de 2026  
Rama: `codex/investigacion-imagenes-productos` · PR #2 (draft)

## Resultado de esta ronda

Se revisaron los 40 SKU bajo la regla nueva: **A — producto de marca/modelo**, que exige coincidencia específica; y **B — producto genérico**, que acepta una foto representativa correctamente identificada y con permiso comercial verificable.

- **14 LISTO**: 12 SKU genéricos con imagen local más las 2 imágenes ya habilitadas (Sika y grifería publicada por Santa María).
- **7 CANDIDATO**: todos de marca/modelo; no se publicaron fotos de tiendas sin permiso verificable.
- **0 NECESITA CONFIRMACIÓN**: los productos genéricos no se bloquean por falta de marca. Los detalles de variante que la foto no puede probar quedan señalados dentro de la revisión.
- **19 SIN RESULTADO**: las fotografías candidatas consultadas no representaron el producto con suficiente fidelidad.

El grupo B suma 31 SKU: 12 LISTO y 19 SIN RESULTADO. El grupo A suma 9 SKU: 2 LISTO y 7 CANDIDATO. Hay **14 de 40 productos con imagen habilitada**; 11 archivos de imagen locales cubren esos 12 SKU genéricos. Dos SKU de varillas comparten una foto genérica de hierro corrugado. La fotografía no permite verificar diámetro, color, presentación ni marca; no atribuir esos detalles al producto desde la imagen.

## Fuentes y licencia de los archivos integrados

Las fotos Pixabay están declaradas en sus páginas como gratuitas bajo la Pixabay Content License. Su resumen permite uso gratuito, adaptación y no requiere atribución; prohíbe distribuir el contenido sin transformación suficiente como un archivo aislado, usar marcas reconocibles comercialmente y usos engañosos. Este proyecto las usa como fotos de referencia de producto genérico dentro de las tarjetas del ecommerce y conserva una lista de atribuciones. Se debe volver a comprobar que no aparezca un logo reconocible antes de publicar comercialmente.

La foto de la cuchara procede de Wikimedia Commons bajo CC BY-SA 3.0. Se conserva atribución y la adaptación (redimensionado/compresión) bajo la misma licencia.

| SKU | Archivo local | Fuente / autor | Licencia y coincidencia |
|---|---|---|---|
| SM-FER-003 | `public/images/products/cuchara-de-albanil-8-pulgadas.jpg` | [Wikimedia Commons — Truelle pour maçonnerie](https://commons.wikimedia.org/wiki/File:Truelle_pour_ma%C3%A7onnerie.jpg), Habib M’henni (Dyolf77) | CC BY-SA 3.0; cuchara de albañil genérica. La página identifica que una versión anterior fue tratada para quitar marca de agua; se descargó la imagen actual y no se quitó marca adicional. |
| SM-FER-006 | `public/images/products/amoladora-angular-115-mm-850-w.jpg` | [Pixabay — Angle grinder](https://pixabay.com/photos/angle-grinder-grind-tool-grinder-3761838/), knipsling | Pixabay Content License; amoladora genérica en uso. |
| SM-FER-007 | `public/images/products/tornillos-para-madera-8-x-1-1-2-pulgadas.jpg` | [Pixabay — Screws, wood screws](https://pixabay.com/photos/screws-wood-screws-tool-1255940/), maria-anne | Pixabay Content License; surtido de tornillos genéricos para madera; la foto no prueba la longitud. |
| SM-FER-008 | `public/images/products/tarugos-plasticos-8-mm.jpg` | [Pixabay — Anchor / dowel](https://pixabay.com/photos/anchor-background-construction-83067/), PublicDomainPictures | Pixabay Content License; tarugos plásticos genéricos; la foto no prueba el diámetro. |
| SM-FER-010 | `public/images/products/rodillo-de-lana-23-cm.jpg` | [Pixabay — Paint roller](https://pixabay.com/photos/paint-roller-paint-paint-tray-6099595/) | Pixabay Content License; rodillo genérico. La foto no confirma ancho exacto ni material de lana. |
| SM-CON-006 | `public/images/products/piedra-triturada-6ta.jpg` | [Pixabay — Gravel / stones](https://pixabay.com/photos/gravel-stones-dirt-road-fixed-3354839/), anaterate | Pixabay Content License; árido triturado genérico; la foto no permite certificar granulometría local “6ta”. |
| SM-CON-007 | `public/images/products/ladrillo-comun.jpg` | [Pixabay — Bricks heap](https://pixabay.com/photos/bricks-heap-pile-stack-material-1345327/), terimakasih0 | Pixabay Content License; ladrillos comunes genéricos. Sustituye la foto recortada por una versión de proporción original. |
| SM-CON-008 | `public/images/products/ladrillo-hueco-12-x-18-x-33-cm.jpg` | [Pixabay — Hollow brick](https://pixabay.com/photos/brick-hollow-hole-brick-facade-3512435/) | Pixabay Content License; tipo hueco representado; las dimensiones exactas no son distinguibles en la foto. |
| SM-CON-009, SM-CON-010 | `public/images/products/varillas-corrugadas.jpg` | [Pixabay — Construction steel / rebar](https://pixabay.com/photos/construction-steel-steel-bar-1733848/) | Pixabay Content License; varilla corrugada genérica. Un solo archivo para ambos SKU; no acredita diámetro ni longitud. |
| SM-ELE-003 | `public/images/products/cano-corrugado-3-4-pulgada.jpg` | [Pixabay — Cable sheath / conduit](https://pixabay.com/photos/cable-sheath-wire-tubing-conduit-6488030/), richardfoulon | Pixabay Content License; tubo corrugado eléctrico genérico. La imagen encontrada es roja y el color no se declara en el título del SKU. |
| SM-ELE-004 | `public/images/products/llave-de-luz-simple-con-placa.jpg` | [Pixabay — Light switch](https://pixabay.com/photos/light-switch-light-switch-power-1519735/), joffi | Pixabay Content License; interruptor simple blanco con placa. |

**Optimización y presentación:** JPEG; redimensionado proporcional con lado mayor de hasta 850 px (720 px para piedra), calidad 68–74, sin recortar ni deformar. El CSS existente aplica `object-fit: contain`; no se modificó diseño ni CSS. Las rutas locales empiezan por `/images/products/`.

## Candidatos de marca pendientes

Para cada candidato se mantiene la foto actual como referencia de investigación, pero no se habilita en la tienda hasta recibir autorización escrita/licencia comercial del titular o assets oficiales para distribuidores. Las URLs de imagen directa corresponden a las imágenes que ya apuntaba el catálogo; no son URL de descarga nueva ni permiso.

| SKU / producto | Página de la fuente | Imagen directa actual | Fabricante / tienda | Coincidencia estimada | Por qué no se publicó; permiso pendiente |
|---|---|---|---|---|---|
| SM-FER-001 — Stanley Global 5 m | [Ferretería Técnica](https://ferreteriatecnica.co/products/cinta-metrica-global-5-mts) | [Imagen](https://ferreteriatecnica.co/cdn/shop/products/Flexometro-5-mts-stanley_900x.jpg?v=1625496120) | Stanley / Ferretería Técnica (Colombia) | Alta, modelo Global 5 m | Imagen alojada en comercio ajeno. Falta autorización escrita de titular/fabricante para reutilizarla en ecommerce. |
| SM-FER-002 — Bosch GSB 13 RE 750 W | [Cifer Uruguay](https://www.cifer.com.uy/catalogo/herramientas/electricas/taladros-percutores/taladro-percutor-bosch-gsb-13-re-750w-13mm-rev-06012b80e0-000/) | [Imagen](https://www.cifer.com.uy/imgs/productos/_original_16154.jpg) | Bosch / Cifer | Alta, modelo y potencia coinciden | Sin permiso de Cifer/Bosch para copiar la fotografía. No se reemplazó por otra Bosch parecida. |
| SM-SAN-001 — Deca Quadra | [All Banho Brasil](https://www.allbanho.com.br/banheiro/loucas-sanitarias/bacias-e-caixas/kit-completo-bacia-com-caixa-acoplada-quadra-branco-deca-20691) | [Imagen](https://images.tcdn.com.br/img/img_prod/1349798/kit_completo_bacia_com_caixa_acoplada_quadra_branco_deca_20691_1_580b98277fd7893e864a182927198389.jpg) | Deca / All Banho | Media-alta, kit Quadra blanco | Falta confirmar que variante de inodoro corresponde exactamente y conseguir permiso de la tienda o asset de Deca. |
| SM-CON-001 — Cemento Yguazú CPII-C32 50 kg | [Construshop Paraguay](https://construshop.com.py/23460) | [Imagen](https://hhmniisxddfuccbaybui.supabase.co/storage/v1/object/public/productImages/construshop/YG.jpg-1757537415270-large.jpg) | Yguazú / Construshop | Alta, línea C32 y bolsa 50 kg | Sin permiso para reutilizar la foto del comercio/fabricante. |
| SM-CON-003 — Cejatel Imperial Lux 50 × 50 | [Casa Deco Paraguay](https://casadeco.com.py/ceramicas/238-cejatel-50x50-imperial-lux.html) | [Imagen](https://casadeco.com.py/384-home_default/cejatel-50x50-imperial-lux.jpg) | Cejatel / Casa Deco | Alta, nombre y tamaño coinciden | Sin permiso de Casa Deco ni media kit autorizado de Cejatel. |
| SM-ELE-001 — Cable Argenplas 2,5 mm² 100 m | [Juma Electric Argentina](https://www.jumaelectric.com.ar/productos/cable-unipolar-argenplas-flexible-25-mm-celeste-100-mts/) | [Imagen](https://acdn-us.mitiendanube.com/stores/004/754/236/products/cable-argenplas-juma-electric-junin-250-mm-azul-homologado-2-867a0e1f73ec21662e17321275162102-1024-1024.webp) | Argenplas / Juma Electric | Alta, calibre y metraje coinciden; cambia tono/color posible | Falta autorización del fabricante/tienda y confirmación de color real que vende Santa María. |
| SM-ELE-008 — Schneider Acti9 1P 40 A | [Syzcom Perú](https://syzcominsa.pe/products/a9f74140-interruptor-termomagnetico-riel-acti-9-schneider) | [Imagen](https://syzcominsa.pe/cdn/shop/files/0037149_5cf55a0a-9ee0-40d8-bc71-659654272bc7_1024x.jpg?v=1762037638) | Schneider Electric / Syzcom | Media; la serie y la corriente coinciden, falta referencia completa | Falta el código exacto (por ejemplo, variante Acti9) y autorización de la tienda o asset oficial. |

## Productos genéricos sin resultado

No se detuvo la búsqueda por falta de marca. Se buscaron y compararon fotografías de repositorios de licencias comerciales/CC y resultados de producto, incluyendo Pixabay, Pexels, Wikimedia Commons y catálogos públicos. Se rechazaron los resultados que no representaban la forma, la familia, el acabado o el uso del producto:

- **SM-FER-004 Nivel de aluminio 60 cm:** primeros planos de burbuja y nivel torpedo corto; no muestran el nivel largo solicitado.
- **SM-FER-005 Taladro percutor 650 W:** modelos con marca legible o inalámbricos; no hay coincidencia genérica limpia con cable y potencia aproximada.
- **SM-SAN-002 Lavatorio con columna:** escenas de baño o lavatorios sin columna visible.
- **SM-SAN-003 Asiento para inodoro:** inodoros completos, interiores o ilustraciones; no asiento aislado.
- **SM-SAN-005 Ducha eléctrica 5500 W:** ducha común o box, sin unidad eléctrica calefactora.
- **SM-SAN-006 Caño PVC soldable 25 mm:** tubo de arcilla o conexión usada/con fuga; no producto nuevo y limpio.
- **SM-SAN-007 Caño PVC desagüe 100 mm:** no se pudo validar material, tipo ni diámetro en una imagen licenciada adecuada.
- **SM-SAN-008 Codo PVC 25 mm 90°:** codos metálicos o piezas que no eran PVC/medida correspondiente.
- **SM-SAN-009 Llave esférica 3/4:** coincidencia cercana era render 3D, no fotografía.
- **SM-SAN-010 Tanque de agua 1000 L:** torres y tanques metálicos; no tanque plástico doméstico.
- **SM-CON-002 Cemento de albañilería:** bolsas de marca competidora legible o sin presentación genérica apta.
- **SM-CON-004 Pegamento para cerámica:** sacos de competidores con marca visible.
- **SM-CON-005 Arena lavada:** pilas de arena sin forma fiable de confirmar que esté lavada o corresponda a un producto comercial de ese tipo.
- **SM-ELE-002 Cable unipolar 1,5 mm²:** rollos/muestras de cable no reconocibles como conductor unipolar genérico; algunos candidatos mostraban marcas.
- **SM-ELE-005 Tomacorriente doble con placa:** regletas, tomas simples o ilustraciones; no fotografía de toma doble empotrable.
- **SM-ELE-006 Lámpara LED 9 W fría:** bombillas decorativas/incandescentes o sin especificar potencia/temperatura.
- **SM-ELE-007 Reflector LED 50 W:** reflectores de estadio a distancia; no producto autónomo.
- **SM-ELE-009 Diferencial 2 × 25 A:** tableros eléctricos completos, no interruptor diferencial individual de dos polos.
- **SM-ELE-010 Tablero embutido 8 módulos:** gabinetes grandes o formatos sin coincidencia clara de 8 módulos.

## Alcance y límites

Se incorporaron o actualizaron imágenes locales para 12 SKU mediante 11 archivos. Cambiaron las rutas de imagen de 11 productos; para el ladrillo común se reemplazó el archivo bajo una ruta ya existente. También se agregaron atribuciones e informe. No se tocaron nombres, precios, categorías, inventario, promociones, diseño, componentes, tarjetas, botones, buscador, carrito ni checkout. Las fotos genéricas representan la clase de producto; no demuestran las medidas exactas, el stock, la marca, el acabado ni la presentación que comercializa Santa María.

**Estado final por SKU**

| SKU | Producto | Grupo | Estado | Resultado de revisión |
|---|---|---|---|---|
| SM-FER-001 | Flexómetro Stanley Global · 5 m (16 ft) | A | **CANDIDATO** | Stanley Global 5 m exact candidate; missing commercial image permission. |
| SM-FER-002 | Taladro percutor Bosch GSB 13 RE · 750 W | A | **CANDIDATO** | Bosch GSB 13 RE 750 W exact candidate; image belongs to retailer, permission unverified. |
| SM-FER-003 | Cuchara de albañil 8 pulgadas | B | **LISTO** | Photo generic correct type; CC BY-SA 3.0 verified. |
| SM-FER-004 | Nivel de aluminio 60 cm | B | **SIN RESULTADO** | Licensed photos found were a macro bubble close-up or a short torpedo level; neither represents 60 cm aluminum level. |
| SM-FER-005 | Taladro percutor 650 W | B | **SIN RESULTADO** | Photos showed visible brand or cordless/rechargeable models; no clean corded 650 W generic match. |
| SM-FER-006 | Amoladora angular 115 mm 850 W | B | **LISTO** | Generic angle grinder photo; no visible maker/logo; Pixabay Content License. |
| SM-FER-007 | Tornillos para madera 8 x 1 1/2 pulgadas | B | **LISTO** | Unbranded screws in assortment; Pixabay identifies wood screws; Pixabay Content License. |
| SM-FER-008 | Tarugos plásticos 8 mm | B | **LISTO** | Plastic wall plugs, unbranded; Pixabay tags include dowel/plug; license verified. |
| SM-FER-009 | Sikacryl Plus Sika · membrana impermeable 5 kg | A | **LISTO** | Sika manufacturer photo already enabled in the catalog. |
| SM-FER-010 | Rodillo de lana 23 cm | B | **LISTO** | Generic paint roller/nap photo; Pixabay Content License. |
| SM-SAN-001 | Inodoro Deca Quadra con mochila · blanco | A | **CANDIDATO** | Deca Quadra candidate listing; variant correspondence and reuse permission not confirmed. |
| SM-SAN-002 | Lavatorio con columna blanco | B | **SIN RESULTADO** | Found interiors and sink images, but no clear isolated washbasin with pedestal matching the product. |
| SM-SAN-003 | Asiento para inodoro plástico | B | **SIN RESULTADO** | Found full toilets, illustrations and bathroom scenes; no isolated generic plastic toilet seat photo. |
| SM-SAN-004 | Grifería para baño · referencia publicada por Santa María | A | **LISTO** | Photo published by Santa María already enabled. |
| SM-SAN-005 | Ducha eléctrica 5500 W | B | **SIN RESULTADO** | Results were ordinary shower heads/enclosures, not an electric shower heater. |
| SM-SAN-006 | Caño PVC soldable 25 mm | B | **SIN RESULTADO** | No clean retail PVC 25 mm pipe image; results included clay pipe or a leaking, used connection. |
| SM-SAN-007 | Caño PVC desagüe 100 mm | B | **SIN RESULTADO** | No usable image of clean 100 mm PVC drain pipe; size/type could not be verified from candidates. |
| SM-SAN-008 | Codo PVC soldable 25 mm 90° | B | **SIN RESULTADO** | Found metal or non-PVC elbows; no commercially licensed exact PVC 25 mm 90° fitting photo. |
| SM-SAN-009 | Llave de paso esférica 3/4 pulgada | B | **SIN RESULTADO** | Closest result was a 3D render, not a product photograph. |
| SM-SAN-010 | Tanque de agua 1000 litros | B | **SIN RESULTADO** | Results were water towers/steel tanks, not a generic 1000 L domestic plastic tank. |
| SM-CON-001 | Cemento Yguazú Portland compuesto CPII-C32 · 50 kg | A | **CANDIDATO** | Yguazú 50 kg/CPII-C32 candidate; shop image reuse permission missing. |
| SM-CON-002 | Cemento de albañilería | B | **SIN RESULTADO** | Licensed cement-bag photos visibly show other brands or no suitable generic retail sack. |
| SM-CON-003 | Cerámica Cejatel Imperial Lux · 50 × 50 cm | A | **CANDIDATO** | Cejatel Imperial Lux 50 × 50 candidate listing; Casa Deco reuse permission/authorized asset missing. |
| SM-CON-004 | Pegamento para cerámica | B | **SIN RESULTADO** | Candidate adhesive bags visibly carried competing brands; no clean generic package photo. |
| SM-CON-005 | Arena lavada | B | **SIN RESULTADO** | Found sand piles/quarry images, but could not verify washed sand or a product presentation suitable for this listing. |
| SM-CON-006 | Piedra triturada 6ta | B | **LISTO** | Generic fine crushed aggregate photo; Pixabay Content License. |
| SM-CON-007 | Ladrillo común | B | **LISTO** | Generic common-brick photo, uncropped original proportions; Pixabay Content License. |
| SM-CON-008 | Ladrillo hueco 12 x 18 x 33 cm | B | **LISTO** | Photo clearly shows hollow brick; exact dimensions are not visually verifiable; Pixabay Content License. |
| SM-CON-009 | Varilla corrugada de construcción · 8 mm x 12 m | B | **LISTO** | Generic ribbed construction rebar; shared with 10 mm generic rebar SKU; Pixabay Content License. |
| SM-CON-010 | Varilla de hierro 10 mm | B | **LISTO** | Generic ribbed construction rebar; exact diameter is not visually distinguishable; Pixabay Content License. |
| SM-ELE-001 | Cable unipolar Argenplas 2,5 mm² · rollo 100 m | A | **CANDIDATO** | Argenplas 2.5 mm²/100 m candidate listing; retailer image permission missing. |
| SM-ELE-002 | Cable unipolar 1,5 mm² | B | **SIN RESULTADO** | Found wiring/coils and branded products, not a clear unbranded 1.5 mm² conductor roll. |
| SM-ELE-003 | Caño corrugado 3/4 pulgada | B | **LISTO** | Generic electrical corrugated conduit photo; red color is incidental, Pixabay Content License. |
| SM-ELE-004 | Llave de luz simple con placa | B | **LISTO** | Generic single wall switch with plate; Pixabay Content License. |
| SM-ELE-005 | Tomacorriente doble con placa | B | **SIN RESULTADO** | Closest results were an extension strip, single outlet or illustration; no photo of double outlet with plate. |
| SM-ELE-006 | Lámpara LED 9 W luz fría | B | **SIN RESULTADO** | Candidate bulbs were decorative/incandescent or did not verify LED 9 W cool-white. |
| SM-ELE-007 | Reflector LED 50 W exterior | B | **SIN RESULTADO** | Licensed results showed distant stadium floodlights rather than a standalone 50 W LED product. |
| SM-ELE-008 | Interruptor termomagnético Schneider Acti9 · 1 polo, 40 A | A | **CANDIDATO** | Schneider Acti9 1P/40 A candidate; full reference model needs matching and retailer image permission is missing. |
| SM-ELE-009 | Interruptor diferencial 2 x 25 A | B | **SIN RESULTADO** | No licensed isolated 2-pole/25 A differential switch photo; results were panels/boards. |
| SM-ELE-010 | Tablero para 8 módulos embutido | B | **SIN RESULTADO** | No sufficiently specific photo of an 8-module flush-mount distribution box. |

