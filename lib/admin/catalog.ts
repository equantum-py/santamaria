import catalogData from "@/content/catalog.json";
import type { Availability, DemoProduct } from "./types";

type CatalogEntry = (typeof catalogData.products)[number];

function toDemoProduct(product: CatalogEntry): DemoProduct {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    categoryId: product.category_id,
    categoryName: product.category,
    pricePyg: product.price_pyg,
    saleUnit: product.sale_unit,
    availability: product.availability as Availability,
    active: true,
    fictitiousPrice: product.price_is_fictitious,
  };
}

/** Snapshot de solo lectura para la demo. La fuente operativa siempre es price_pyg. */
export const demoProducts: readonly DemoProduct[] = catalogData.products.map(toDemoProduct);

export function findDemoProduct(productId: string): DemoProduct | undefined {
  return demoProducts.find((product) => product.id === productId || product.sku === productId);
}
