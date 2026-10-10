import { categories, normalizeText, products, type CatalogProduct } from "@/lib/store";

// Búsqueda de la tienda: ignora mayúsculas y tildes, entiende sinónimos del rubro,
// tolera errores de tipeo y ordena por relevancia. Solo lee el catálogo; no lo modifica.

// Palabras que la gente usa para lo mismo. Si alguien busca una, también encuentra las otras.
const SYNONYM_GROUPS: string[][] = [
  ["cano", "tubo", "caneria", "tuberia"],
  ["canilla", "grifo", "griferia"],
  ["inodoro", "taza", "water", "wc"],
  ["lavatorio", "lavamanos", "pileta", "bacha"],
  ["taladro", "agujereadora", "perforadora"],
  ["amoladora", "pulidora", "esmeriladora"],
  ["tarugo", "taco", "taquete"],
  ["varilla", "hierro", "fierro"],
  ["ladrillo", "bloque"],
  ["ceramica", "piso", "porcelanato", "azulejo", "revestimiento"],
  ["pegamento", "adhesivo"],
  ["interruptor", "tecla", "apagador"],
  ["toma", "tomacorriente", "enchufe"],
  ["lampara", "foco", "bombilla"],
  ["termica", "termomagnetico", "disyuntor"],
  ["flexometro", "metro", "cinta"],
  ["tanque", "cisterna"],
  ["piedra", "ripio", "triturada"],
  ["ducha", "calefon"],
  ["membrana", "impermeabilizante"],
];

const STOP_WORDS = new Set(["de", "del", "la", "el", "los", "las", "para", "con", "un", "una", "y", "en", "x", "por"]);

// Equivalencias en un solo sentido: quien busca "bolsa" suele querer cemento, pero no al revés.
const ONE_WAY: Record<string, string[]> = {
  bolsa: ["cemento"],
};

const synonymIndex = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) for (const word of group) synonymIndex.set(word, group);
for (const [word, targets] of Object.entries(ONE_WAY)) synonymIndex.set(word, [...(synonymIndex.get(word) ?? [word]), ...targets]);

function words(value: string): string[] {
  return normalizeText(value).split(/[^a-z0-9]+/).filter(Boolean);
}

type IndexedProduct = { product: CatalogProduct; nameTokens: string[]; tokens: string[] };

const index: IndexedProduct[] = products.map((product) => ({
  product,
  nameTokens: words(product.name),
  tokens: [...new Set(words([product.name, product.brand, product.subcategory, product.category, product.presentation, ...product.search_terms].join(" ")))],
}));

const vocabulary = [...new Set([...index.flatMap((item) => item.tokens), ...synonymIndex.keys()])].filter((token) => token.length >= 3);

// Distancia entre palabras que cuenta letras cambiadas, faltantes, sobrantes o invertidas.
function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[a.length][b.length];
}

function allowedTypos(word: string): number {
  return word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;
}

// Variantes de una palabra buscada: ella misma, su singular y sus sinónimos del rubro.
function variants(word: string): string[] {
  const base = new Set([word]);
  if (word.length > 4 && word.endsWith("es")) base.add(word.slice(0, -2));
  if (word.length > 3 && word.endsWith("s")) base.add(word.slice(0, -1));
  const expanded = new Set(base);
  for (const value of base) for (const synonym of synonymIndex.get(value) ?? []) expanded.add(synonym);
  return [...expanded];
}

// Correcciones de tipeo ("cemnto" → "cemento"). Solo se usan si la palabra tal cual no encuentra nada.
function typoVariants(word: string): string[] {
  const typos = allowedTypos(word);
  if (!typos) return [];
  return vocabulary.filter((token) => Math.abs(token.length - word.length) <= typos && editDistance(word, token) <= typos);
}

function wordScore(word: string, options: string[], item: IndexedProduct): number {
  let best = 0;
  for (const option of options) {
    const exactWord = option === word;
    for (const token of item.tokens) {
      let score = 0;
      if (token === option) score = exactWord ? 4 : 3;
      else if (token.startsWith(option) && option.length >= 2) score = exactWord ? 3 : 2;
      else if (option.length >= 4 && token.includes(option)) score = 1.5;
      if (score && item.nameTokens.includes(token)) score += 1;
      best = Math.max(best, score);
    }
  }
  return best;
}

export type SearchResult = { product: CatalogProduct; score: number };

export function searchProducts(query: string): SearchResult[] {
  const queryWords = words(query).filter((word) => !STOP_WORDS.has(word));
  if (!queryWords.length) return products.map((product) => ({ product, score: 0 }));
  const expanded = queryWords.map((word) => {
    const options = variants(word);
    const found = index.some((item) => wordScore(word, options, item) > 0);
    return { word, options: found ? options : typoVariants(word) };
  });
  const results: SearchResult[] = [];
  for (const item of index) {
    let total = 0;
    for (const { word, options } of expanded) {
      const score = wordScore(word, options, item);
      if (!score) { total = 0; break; }
      total += score;
    }
    if (total) results.push({ product: item.product, score: total });
  }
  return results.sort((a, b) => b.score - a.score);
}

export type CategorySuggestion = { categoryId: string; subcategoryId?: string; label: string; detail: string };

export function suggestCategories(query: string): CategorySuggestion[] {
  const queryWords = words(query).filter((word) => !STOP_WORDS.has(word));
  if (!queryWords.length) return [];
  const matches = (label: string) => {
    const tokens = words(label);
    return queryWords.every((word) => variants(word).some((option) => tokens.some((token) => token.startsWith(option))));
  };
  const suggestions: CategorySuggestion[] = [];
  for (const category of categories) {
    if (matches(category.name)) suggestions.push({ categoryId: category.id, label: category.name, detail: "Categoría" });
    for (const subcategory of category.subcategories) {
      if (matches(subcategory.name)) suggestions.push({ categoryId: category.id, subcategoryId: subcategory.id, label: subcategory.name, detail: category.name });
    }
  }
  return suggestions.slice(0, 4);
}
