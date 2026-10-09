// Contenido comercial de la home. Todo queda vacío a propósito: Santa María todavía
// no confirmó bancos, tarjetas, cuotas, descuentos, vigencias, ofertas ni convenios.
// Solo se carga acá información confirmada por Santa María (y por el banco, en las
// promociones bancarias). Mientras las listas estén vacías, la home muestra
// "Beneficios en preparación", oculta los banners y no marca productos en oferta.

export type BankPromotion = {
  id: string;
  bank: string;
  benefit: string;
  cards: string;
  conditions: string;
  valid_until: string;
  logo?: string;
};

export type PromoBanner = {
  id: string;
  title: string;
  subtitle: string;
  valid_until: string;
  category_id?: string;
  image?: string;
};

export type ProductOffer = {
  product_id: string;
  offer_price_pyg: number;
  valid_until: string;
};

export type Partner = {
  id: string;
  name: string;
  logo?: string;
  url?: string;
};

export const bankPromotions: BankPromotion[] = [];
export const promoBanners: PromoBanner[] = [];
export const productOffers: ProductOffer[] = [];
export const partners: Partner[] = [];
