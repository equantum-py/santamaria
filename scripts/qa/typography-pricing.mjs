import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const previewUrl = process.env.PREVIEW_URL;
assert.ok(previewUrl, "PREVIEW_URL is required");
const catalog = JSON.parse(await readFile("content/catalog.json", "utf8"));
const demoPricing = JSON.parse(await readFile("content/demo-promotions.json", "utf8"));
assert.equal(demoPricing._meta.is_fictitious, true, "Demo price file must stay marked fictitious");
assert.equal(demoPricing._meta.scope, "preview-only", "Demo price file must be Preview only");
const demoPreviousPrices = new Map(demoPricing.products.map((item) => [item.sku, item.compare_at_price_pyg]));
assert.equal(demoPreviousPrices.size, 40, "Expected 40 demonstrative discount entries");
assert.deepEqual([...demoPreviousPrices.keys()].sort(), catalog.products.map((product) => product.sku).sort(),
  "Every catalog product must have exactly one demonstrative discount");
const expectedDiscounts = new Set([10, 15, 20, 25, 30]);
const vercelOidcToken = process.env.VERCEL_OIDC_TOKEN;
assert.ok(vercelOidcToken, "VERCEL_OIDC_TOKEN is required for the protected Preview");
const previewHost = new URL(previewUrl).hostname;
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
    await page.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.hostname === previewHost) {
        await route.continue({
          headers: {
            ...route.request().headers(),
            "x-vercel-trusted-oidc-idp-token": vercelOidcToken,
          },
        });
      } else {
        await route.continue();
      }
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    assert.ok(response && response.ok(), `Preview returned ${response?.status()} at ${width}px`);
    await page.waitForTimeout(1500);
    const initialTitle = await page.title();
    if (await page.locator(".product-card").count() === 0) {
      const diagnosticPath = `${outputDir}/preview-access-${width}.png`;
      await page.screenshot({ path: diagnosticPath, fullPage: true, animations: "disabled" });
      const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 600);
      const responseHeaders = await response.allHeaders();
      const protectionHeaders = Object.fromEntries(
        ["x-vercel-protection-reason", "x-vercel-error", "location"].filter((key) => responseHeaders[key]).map((key) => [key, responseHeaders[key]]),
      );
      throw new Error(`Preview did not render Santa María at ${width}px (HTTP ${response.status()}, URL ${page.url()}, title "${initialTitle}"). Page text: ${bodyText}. Protection response: ${JSON.stringify(protectionHeaders)}. Diagnostic screenshot: ${diagnosticPath}`);
    }
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      const images = [...document.querySelectorAll(".product-visual img")];
      images.forEach((image) => { image.loading = "eager"; });
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    });

    const title = await page.title();
    const pageState = await page.evaluate(() => {
      const bodyFont = getComputedStyle(document.body).fontFamily;
      return {
        bodyFont,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        cardCount: document.querySelectorAll(".product-card").length,
        fontLoaded: document.fonts.check(`400 16px ${bodyFont.split(",")[0].trim()}`),
        weights: {
          heading: getComputedStyle(document.querySelector("h1")).fontWeight,
          navigation: getComputedStyle(document.querySelector(".nav-inner > button")).fontWeight,
          productName: getComputedStyle(document.querySelector(".product-name")).fontWeight,
          addButton: getComputedStyle(document.querySelector(".add-button")).fontWeight,
          currentPrice: getComputedStyle(document.querySelector(".product-price .price-values strong")).fontWeight,
        },
        rows: [...document.querySelectorAll(".product-row")].map((row) => {
          const cards = [...row.querySelectorAll(".product-card")];
          const firstImage = cards[0]?.querySelector(".product-visual img");
          const loadedImages = cards.filter((card) => {
            const image = card.querySelector(".product-visual img");
            return image && image.complete && image.naturalWidth > 0 &&
              getComputedStyle(image).objectFit === "contain";
          }).length;
          return {
            category: row.getAttribute("aria-label"),
            firstCardHasLoadedImage: Boolean(firstImage && firstImage.complete && firstImage.naturalWidth > 0 &&
              getComputedStyle(firstImage).objectFit === "contain"),
            loadedImages,
          };
        }),
      };
    });
    if (!pageState.cardCount) {
      const diagnosticPath = `${outputDir}/preview-access-${width}.png`;
      await page.screenshot({ path: diagnosticPath, fullPage: true, animations: "disabled" });
      const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 600);
      throw new Error(`Preview did not render the ecommerce at ${width}px (HTTP ${response.status()}, URL ${page.url()}, title "${title}"). Page text: ${bodyText}. Diagnostic screenshot: ${diagnosticPath}`);
    }
    const screenshotPath = `${outputDir}/home-${width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
    const typographyDetails = await page.evaluate(() => {
      const inspect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const style = getComputedStyle(element);
        return {
          selector,
          text: element.textContent?.trim().slice(0, 100),
          className: typeof element.className === "string" ? element.className : "",
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize,
          matchedStylesheets: [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean),
        };
      };
      return [
        inspect(".hero h1"),
        inspect(".nav-inner > button"),
        inspect(".product-name"),
        inspect(".add-button"),
        inspect(".product-price .price-values strong"),
      ];
    });
    console.log(`Rendered typography at ${width}px: ${JSON.stringify(typographyDetails)}`);
    assert.match(title, /Santa María/i, `Preview is not Santa María at ${width}px: ${title}`);
    assert.ok(!page.url().includes("vercel.com/login") && !/login\s*[–-]\s*vercel/i.test(title),
      `Vercel login appeared instead of the store at ${width}px: ${page.url()} ${title}`);
    assert.ok(!/Manrope|DM Sans/i.test(pageState.bodyFont), `Legacy font remains at ${width}px: ${pageState.bodyFont}`);
    assert.ok(pageState.fontLoaded, `Inter font did not load at ${width}px: ${pageState.bodyFont}`);
    assert.ok(
      (await page.locator(".top-bar-demo").innerText()).includes("Precios y descuentos de demostración"),
      `Demo discount notice missing at ${width}px`,
    );
    assert.deepEqual(pageState.weights, { heading: "600", navigation: "500", productName: "500", addButton: "500", currentPrice: "600" },
      `Unexpected typography weights at ${width}px`);
    for (const row of pageState.rows) {
      const rowHasPhotos = row.loadedImages > 0;
      assert.ok(!rowHasPhotos || row.firstCardHasLoadedImage,
        `Products with photos are not prioritized in this Home section at ${width}px: ${row.category}`);
    }
    assert.ok(pageState.documentWidth <= pageState.viewportWidth, `Horizontal overflow at ${width}px: ${pageState.documentWidth}px`);
    assert.equal(pageState.cardCount, 40, `Expected all 40 catalog cards at ${width}px`);
    assert.equal(await page.locator(".product-discount-badge").count(), 40, `Expected 40 red stickers at ${width}px`);
    assert.equal(await page.locator(".product-price .price-values s").count(), 40, `Expected 40 previous prices at ${width}px`);

    for (const product of catalog.products) {
      const previousPrice = demoPreviousPrices.get(product.sku);
      const previewProduct = previousPrice === undefined ? product : { ...product, compare_at_price_pyg: previousPrice };
      const promotion = validPromotion(previewProduct);
      const card = page.getByRole("article", { name: product.name, exact: true }).first();
      if (await card.count()) {
        const currentPriceText = (await card.locator(".product-price .price-values strong").innerText()).replace(/\D/g, "");
        assert.equal(currentPriceText, String(product.price_pyg), `${product.sku}: current card price differs from price_pyg`);
        assert.equal(await card.locator(".product-price .price-values strong").evaluate((element) => getComputedStyle(element).color), "rgb(230, 0, 18)", `${product.sku}: current product price must be red`);
        assert.ok(promotion, `${product.sku}: every SKU must have a valid demo discount`);
        assert.ok(expectedDiscounts.has(promotion.percent), `${product.sku}: unexpected discount ${promotion.percent}%`);
        {
          await card.locator(".product-discount-badge").filter({ hasText: `-${promotion.percent}% OFF` }).waitFor({ state: "visible" });
          const previousText = (await card.locator(".product-price .price-values s").innerText()).replace(/\D/g, "");
          assert.equal(previousText, String(promotion.previous), `${product.sku}: previous price differs from the demo data`);
          const sticker = card.locator(".product-discount-badge");
          assert.equal((await sticker.innerText()).trim(), `-${promotion.percent}% OFF`,
            `${product.sku}: discount sticker percent is incorrect`);
          const stickerStyle = await sticker.evaluate((element) => {
            const style = getComputedStyle(element);
            const result = {
              background: style.backgroundColor,
              color: style.color,
              weight: style.fontWeight,
              animationName: style.animationName,
              animationDuration: style.animationDuration,
            };
            element.style.animation = "none";
            const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
            result.tiltDegrees = Math.round(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI);
            return result;
          });
          assert.equal(stickerStyle.background, "rgb(230, 0, 18)", `${product.sku}: sticker must be Santa María promotion red`);
          assert.equal(stickerStyle.color, "rgb(255, 255, 255)", `${product.sku}: sticker text must be white`);
          assert.equal(stickerStyle.weight, "700", `${product.sku}: sticker text must use weight 700`);
          assert.ok(stickerStyle.animationName.includes("discount-enter") && stickerStyle.animationName.includes("discount-pulse"),
            `${product.sku}: entry and pulse animations are missing`);
          assert.ok(stickerStyle.animationDuration.includes("0.4s") && stickerStyle.animationDuration.includes("3s"),
            `${product.sku}: sticker animation durations are incorrect`);
          assert.equal(stickerStyle.tiltDegrees, -5, `${product.sku}: sticker must tilt by -5 degrees`);
        }
      }
    }

    const firstCard = page.locator(".product-card").first();
    const price = firstCard.locator(".product-price .price-values strong");
    const addButton = firstCard.locator("button.add-button");
    assert.ok(await price.isVisible(), `Current price is not visible at ${width}px`);
    assert.ok(await addButton.isVisible(), `Add button is not visible at ${width}px`);
    const currentPriceText = (await price.innerText()).trim();
    await addButton.click();
    assert.equal((await firstCard.locator(".in-cart-badge").innerText()).trim(), "1", `Add button did not update the cart at ${width}px`);
    const cartButton = page.locator(".cart-button:visible, .mobile-nav button:visible").filter({ hasText: "Carrito" }).first();
    await cartButton.click();
    await page.locator(".cart-line").first().waitFor({ state: "visible", timeout: 10_000 });
    const cartPrice = (await page.locator(".cart-unit-price .price-values strong").first().innerText()).trim();
    assert.equal(cartPrice, currentPriceText, `Cart price differs from the product price at ${width}px`);
    const finalWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(finalWidth <= width, `Horizontal overflow after add/cart at ${width}px: ${finalWidth}px`);
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);

    results.push({ width, ...pageState, screenshot: screenshotPath, addToCart: "passed", cartPrice });
    await context.close();
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.hostname === previewHost) {
      await route.continue({ headers: { ...route.request().headers(), "x-vercel-trusted-oidc-idp-token": vercelOidcToken } });
    } else {
      await route.continue();
    }
  });
  const reducedErrors = [];
  reducedPage.on("pageerror", (error) => reducedErrors.push(error.message));
  const reducedResponse = await reducedPage.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  assert.ok(reducedResponse && reducedResponse.ok(), "Reduced-motion Preview navigation failed");
  assert.match(await reducedPage.title(), /Santa María/i, "Reduced-motion Preview is not Santa María");
  const reducedSticker = reducedPage.locator(".product-discount-badge").first();
  await reducedSticker.waitFor({ state: "visible" });
  assert.equal(await reducedSticker.evaluate((element) => getComputedStyle(element).animationName), "none",
    "prefers-reduced-motion must disable sticker animations");
  assert.ok(await reducedSticker.isVisible(), "Reduced motion must not hide the discount sticker");
  await reducedPage.screenshot({ path: `${outputDir}/home-390-reduced-motion.png`, fullPage: true, animations: "disabled" });
  assert.deepEqual(reducedErrors, [], "Browser errors in reduced-motion mode");
  results.push({ width: 390, reducedMotion: "passed", stickerVisible: true, animation: "disabled" });
  await reducedContext.close();
} finally {
  await browser.close();
}

await (await import("node:fs/promises")).writeFile(
  `${outputDir}/report.json`,
  JSON.stringify({ previewUrl, results }, null, 2),
);
console.log(JSON.stringify(results, null, 2));
