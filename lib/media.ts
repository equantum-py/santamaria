import type { CatalogProduct } from "@/lib/store";

// Fotos que se pueden mostrar como imagen del producto. Solo valen las de
// Santa María, del fabricante o de un proveedor autorizado, o archivos locales
// del repositorio (rutas que empiezan con "/"). Las fotos tomadas de otros
// comercios quedan en catalog.json pero no se muestran hasta confirmar su
// origen y permiso de uso: agregar el SKU acá con la fuente verificada.
const VERIFIED_IMAGE_SOURCES: Record<string, string> = {
  "SM-FER-009": "Sika Paraguay, fabricante",
  "SM-SAN-004": "Publicada por Santa María en su exhibidor de Construex",
};

const VERIFIED_LOCAL_IMAGES = new Set([
  "/images/products/cuchara-de-albanil-8-pulgadas.jpg",
  "/images/products/tarugos-plasticos-8-mm.jpg",
  "/images/products/piedra-triturada-6ta.jpg",
  "/images/products/ladrillo-comun.jpg",
  "/images/products/varillas-corrugadas.jpg",
  "/images/products/cano-corrugado-3-4-pulgada.jpg",
  "/images/products/llave-de-luz-simple-con-placa.jpg",
]);

export type ProductPhoto = { src: string; source: string } | null;

export function productPhoto(product: CatalogProduct): ProductPhoto {
  if (VERIFIED_LOCAL_IMAGES.has(product.image)) return { src: product.image, source: "Archivo de Santa María" };
  const source = VERIFIED_IMAGE_SOURCES[product.sku];
  return source && product.image.startsWith("http") ? { src: product.image, source } : null;
}
