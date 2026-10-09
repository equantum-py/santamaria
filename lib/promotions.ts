// Espacios comerciales de la home. Quedan vacíos a propósito: Santa María todavía
// no confirmó bancos, cuotas, descuentos, vigencias ni convenios. Cuando lleguen los
// datos reales se cargan acá y la home deja de mostrar los espacios reservados.

export type BankPromotion = {
  id: string;
  bank: string;
  benefit: string;
  conditions: string;
  valid_until: string;
  logo?: string;
};

export type Partner = {
  id: string;
  name: string;
  logo?: string;
  url?: string;
};

export const bankPromotions: BankPromotion[] = [];
export const partners: Partner[] = [];

export const BANK_PROMOTION_SLOTS = 3;
export const PARTNER_SLOTS = 6;
