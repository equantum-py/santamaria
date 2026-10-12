import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile("content/catalog.json", "utf8"));
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, VERCEL_ENV: "production" },
  stdio: "ignore",
});

let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`next start exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(ready, "Production build server did not become ready");

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const response = await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  assert.equal(response?.status(), 200);
  assert.match(await page.title(), /Santa María/i);
  await page.locator(".product-card").first().waitFor({ state: "visible" });

  const rendered = await page.evaluate(() => ({
    notice: document.querySelector(".top-bar-demo")?.textContent?.trim() ?? "",
    discountBadges: document.querySelectorAll(".product-discount-badge").length,
    previousPrices: document.querySelectorAll(".product-price .price-values s").length,
    cards: [...document.querySelectorAll(".product-card")].map((card) => ({
      name: card.getAttribute("aria-label"),
      price: card.querySelector(".product-price .price-values strong")?.textContent?.replace(/\\D/g, "") ?? "",
    })),
  }));
  assert.ok(!rendered.notice.includes("Precios y descuentos de demostración"), "Demo discount notice leaked into Production");
  assert.equal(rendered.discountBadges, 0, "Fictitious discount stickers must be disabled in Production");
  assert.equal(rendered.previousPrices, 0, "Fictitious previous prices must be disabled in Production");

  for (const product of catalog.products) {
    const card = rendered.cards.find((item) => item.name === product.name);
    if (card) assert.equal(card.price, String(product.price_pyg), `${product.sku}: production card price must equal price_pyg`);
  }

  const firstCard = page.locator(".product-card").first();
  const price = (await firstCard.locator(".product-price .price-values strong").innerText()).trim();
  await firstCard.locator("button.add-button").click();
  const cartButton = page.locator(".cart-button:visible").first();
  await cartButton.click();
  await page.locator(".cart-line").first().waitFor({ state: "visible" });
  assert.equal(
    (await page.locator(".cart-unit-price .price-values strong").first().innerText()).trim(),
    price,
    "Production cart must charge only price_pyg",
  );

  console.log(JSON.stringify({
    productionDemoDiscounts: "disabled",
    cards: rendered.cards.length,
    stickers: rendered.discountBadges,
    previousPrices: rendered.previousPrices,
    cartPrice: price,
  }, null, 2));
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
