// Espacios comerciales de la home. Quedan vacíos a propósito: Santa María todavía
// no confirmó bancos, cuotas, descuentos, vigencias ni convenios. Mientras las listas
// estén vacías, la home muestra "Beneficios próximamente" y oculta la sección de aliados.

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
