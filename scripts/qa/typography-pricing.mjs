import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const previewUrl = process.env.PREVIEW_URL;
assert.ok(previewUrl, "PREVIEW_URL is required");
const catalog = JSON.parse(await readFile("content/catalog.json", "utf8"));
const outputDir = "artifacts/typography-pricing";
await mkdir(outputDir, { recursive: true });

function validPromotion(product) {
  const current = product.price_pyg;
  const previous = product.compare_at_price_pyg;
  if (!Number.isSafeInteger(current) || current <= 0 ||
      !Number.isSafeInteger(previous) || previous <= current) return null;
  const percent = Math.round(((previous - current) / previous) * 100);
  return percent >= 1 && percent <= 100 ? { previous, percent } : null;
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [1920, 1440, 430, 390, 375, 360, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: width >= 681 ? 1000 : 900 },
      deviceScaleFactor: 1,
      isMobile: width <= 680,
      hasTouch: width <= 680,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(previewUrl, { waitUntil: "networkidle", timeout: 90_000 });
    assert.ok(response && response.ok(), `Preview returned ${response?.status()} at ${width}px`);
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.fonts.ready);

    const title = await page.title();
    const pageState = await page.evaluate(() => {
      const bodyFont = getComputedStyle(document.body).fontFamily;
      return {
        bodyFont,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        cardCount: document.querySelectorAll(".product-card").length,
        fontLoaded: document.fonts.check(`400 16px ${bodyFont.split(",")[0].trim()}`),
      };
    });
    if (!pageState.cardCount) {
      const diagnosticPath = `${outputDir}/preview-access-${width}.png`;
      await page.screenshot({ path: diagnosticPath, fullPage: true, animations: "disabled" });
      const bodyText = (await page.locator("body").innerText()).replace(/\\s+/g, " ").slice(0, 600);
      throw new Error(`Preview did not render the ecommerce at ${width}px (HTTP ${response.status()}, URL ${page.url()}, title "${title}"). Page text: ${bodyText}. Diagnostic screenshot: ${diagnosticPath}`);
    }
    assert.match(title, /Santa María/i, `Preview is not Santa María at ${width}px: ${title}`);
    assert.ok(!/Manrope|DM Sans/i.test(pageState.bodyFont), `Legacy font remains at ${width}px: ${pageState.bodyFont}`);
    assert.ok(pageState.fontLoaded, `Inter font did not load at ${width}px: ${pageState.bodyFont}`);
    assert.ok(pageState.documentWidth <= pageState.viewportWidth, `Horizontal overflow at ${width}px: ${pageState.documentWidth}px`);
    assert.ok(pageState.cardCount > 0, `No ecommerce product cards rendered at ${width}px`);

    for (const product of catalog.products) {
      const promotion = validPromotion(product);
      const card = page.getByRole("article", { name: product.name, exact: true }).first();
      if (await card.count()) {
        if (promotion) {
          await card.locator(".product-discount-badge").filter({ hasText: `-${promotion.percent}% OFF` }).waitFor({ state: "visible" });
          assert.ok(await card.locator(".price-values s").count(), `${product.sku}: previous price missing`);
        } else if (product.compare_at_price_pyg !== undefined) {
          assert.equal(await card.locator(".product-discount-badge").count(), 0, `${product.sku}: invalid promotion must stay hidden`);
        }
      }
    }

    const firstCard = page.locator(".product-card").first();
    const price = firstCard.locator(".product-price .price-values strong");
    const addButton = firstCard.locator("button.add-button");
    assert.ok(await price.isVisible(), `Current price is not visible at ${width}px`);
    assert.ok(await addButton.isVisible(), `Add button is not visible at ${width}px`);
    const screenshotPath = `${outputDir}/home-${width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });

    await addButton.click();
    assert.equal((await firstCard.locator(".in-cart-badge").innerText()).trim(), "1", `Add button did not update the cart at ${width}px`);
    const cartButton = page.locator(".cart-button:visible, .mobile-nav button:visible").filter({ hasText: "Carrito" }).first();
    await cartButton.click();
    await page.locator(".cart-line").first().waitFor({ state: "visible", timeout: 10_000 });
    const cartPrice = (await page.locator(".cart-unit-price .price-values strong").first().innerText()).trim();
    assert.equal(cartPrice, (await price.innerText()).trim(), `Cart price differs from the product price at ${width}px`);
    const finalWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(finalWidth <= width, `Horizontal overflow after add/cart at ${width}px: ${finalWidth}px`);
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);

    results.push({ width, ...pageState, screenshot: screenshotPath, addToCart: "passed", cartPrice });
    await context.close();
  }
} finally {
  await browser.close();
}

await (await import("node:fs/promises")).writeFile(
  `${outputDir}/report.json`,
  JSON.stringify({ previewUrl, results }, null, 2),
);
console.log(JSON.stringify(results, null, 2));
