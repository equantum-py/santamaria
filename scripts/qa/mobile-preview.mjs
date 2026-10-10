import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const previewUrl = process.env.PREVIEW_URL;
assert.ok(previewUrl, "PREVIEW_URL is required");
const parsedUrl = new URL(previewUrl);
assert.equal(parsedUrl.protocol, "https:", "Preview URL must use HTTPS");
assert.ok(
  parsedUrl.hostname.startsWith("santamaria-") && parsedUrl.hostname.endsWith(".vercel.app"),
  `Unexpected Preview host: ${parsedUrl.hostname}`,
);

const widths = [430, 390, 375, 360, 320];
const catalog = JSON.parse(
  await readFile(new URL("../../content/catalog.json", import.meta.url), "utf8"),
);
const activeSkus = [
  "SM-FER-003",
  "SM-FER-008",
  "SM-FER-009",
  "SM-SAN-004",
  "SM-CON-006",
  "SM-CON-007",
  "SM-CON-009",
  "SM-CON-010",
  "SM-ELE-003",
  "SM-ELE-004",
];
const outputDir = "artifacts/mobile";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    const response = await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const screenshotPath = `${outputDir}/preview-${width}px.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
    try {
      await page.locator("article.product-card").first().waitFor({ state: "visible", timeout: 30_000 });
    } catch (error) {
      const diagnostics = {
        width,
        responseStatus: response?.status(),
        pageUrl: page.url(),
        title: await page.title(),
        bodyText: (await page.locator("body").innerText().catch(() => "")).slice(0, 4000),
        cardCount: await page.locator("article.product-card").count(),
        pageErrors: consoleErrors,
      };
      console.error(`Preview page diagnostic: ${JSON.stringify(diagnostics, null, 2)}`);
      throw error;
    }

    const viewportResult = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      cards: document.querySelectorAll("article.product-card").length,
    }));
    assert.equal(viewportResult.viewportWidth, width, `Unexpected viewport at ${width}px`);
    assert.ok(viewportResult.documentWidth <= width, `Horizontal page overflow at ${width}px: ${viewportResult.documentWidth}px`);
    assert.ok(viewportResult.bodyWidth <= width, `Body overflow at ${width}px: ${viewportResult.bodyWidth}px`);
    assert.ok(viewportResult.cards >= 40, `Expected catalog cards at ${width}px`);

    const skuResults = [];
    for (const sku of activeSkus) {
      const product = catalog.products.find((item) => item.sku === sku);
      assert.ok(product, `Could not resolve product ${sku} in content/catalog.json`);
      const namedCard = page.getByRole("article", { name: product.name, exact: true });
      await namedCard.waitFor({ state: "visible", timeout: 10_000 });

      const price = namedCard.locator(".product-price strong");
      const addButton = namedCard.locator("button.add-button");
      await price.scrollIntoViewIfNeeded();
      assert.ok(await price.isVisible(), `${sku}: price not visible at ${width}px`);
      await addButton.scrollIntoViewIfNeeded();
      assert.ok(await addButton.isVisible(), `${sku}: Add button not visible at ${width}px`);

      const photo = namedCard.locator(".product-visual img");
      assert.equal(await photo.count(), 1, `${sku}: active image missing at ${width}px`);
      await photo.scrollIntoViewIfNeeded();
      const image = await photo.evaluate(async (img) => {
        await img.decode();
        const visual = img.closest(".product-visual");
        const imageRect = img.getBoundingClientRect();
        const visualRect = visual.getBoundingClientRect();
        const style = getComputedStyle(img);
        const contentWidth = img.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const contentHeight = img.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const scale = Math.min(contentWidth / img.naturalWidth, contentHeight / img.naturalHeight);
        const renderedWidth = img.naturalWidth * scale;
        const renderedHeight = img.naturalHeight * scale;
        return {
          loaded: img.complete && img.naturalWidth > 0,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          objectFit: style.objectFit,
          imageInsideContainer: imageRect.left >= visualRect.left - 1 && imageRect.right <= visualRect.right + 1 && imageRect.top >= visualRect.top - 1 && imageRect.bottom <= visualRect.bottom + 1,
          productOccupancy: Math.max(renderedWidth / contentWidth, renderedHeight / contentHeight),
        };
      });
      assert.ok(image.loaded, `${sku}: image failed to load at ${width}px`);
      assert.equal(image.objectFit, "contain", `${sku}: image must use object-fit: contain`);
      assert.ok(image.imageInsideContainer, `${sku}: image overflows its container`);
      assert.ok(image.productOccupancy >= 0.4, `${sku}: product appears too small in its image frame`);

      skuResults.push({ sku, ...image, priceVisible: true, addVisible: true });
    }

    assert.deepEqual(consoleErrors, [], `Browser errors at ${width}px`);
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
    results.push({ width, ...viewportResult, skuResults });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(`${outputDir}/report.json`, JSON.stringify({ previewUrl, widths: results }, null, 2));
console.log(JSON.stringify(results.map(({ width, documentWidth, bodyWidth, cards }) => ({ width, documentWidth, bodyWidth, cards })), null, 2));
