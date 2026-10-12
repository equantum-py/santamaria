import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://127.0.0.1:4173";
const output = "artifacts/admin-e02b";
const widths = [1440, 1024, 768, 430, 390, 375, 320];
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const reports = [];
const parseMoney = (text) => Number((text.match(/[\d.]+/g) ?? []).join("").replaceAll(".", ""));
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width > 760 ? 1000 : 900 }, isMobile: width <= 760, hasTouch: width <= 760 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

    let response = await page.goto(`${baseUrl}/admin/pos`, { waitUntil: "networkidle", timeout: 60000 });
    assert.equal(response?.status(), 200, `POS must load at ${width}px`);
    await page.getByRole("heading", { name: "Punto de venta" }).waitFor({ state: "visible" });
    await page.getByLabel("Cambiar perfil de demostración").selectOption("cajero");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Punto de venta" }).waitFor({ state: "visible" });
    assert.equal(await page.locator(".pos-product-row").count(), 40, "POS shows all 40 catalog products");
    const catalogSkus = await page.locator(".pos-product-copy span").allTextContents();
    assert.equal(new Set(catalogSkus.map((sku) => sku.split(" · ")[0])).size, 40, "Catalog SKUs are unique");
    let dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= width && dimensions.body <= width, `Horizontal overflow at ${width}px on POS: ${JSON.stringify(dimensions)}`);
    assert.ok(await page.locator(".pos-product-row").first().getByRole("button", { name: /Agregar/ }).isVisible());

    await page.locator(".admin-module-links").getByRole("link", { name: "Caja" }).click();
    await page.getByRole("heading", { name: "Abrir caja" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Abrir caja" }).click();
    await page.getByRole("status").filter({ hasText: "Caja abierta" }).waitFor({ state: "visible" });
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/cash-open-${width}.png`, fullPage: true });
    await page.goto(`${baseUrl}/admin/pos`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Punto de venta" }).waitFor({ state: "visible" });

    await page.getByLabel("Buscar por nombre, SKU o categoría").fill("cemento");
    assert.ok(await page.locator(".pos-product-row").count() >= 1, "Product search returns a result");
    await page.locator(".pos-product-row").first().getByRole("button", { name: /Agregar/ }).click();
    await page.getByLabel(/Cantidad de/).fill("2");
    const saleTotal = parseMoney(await page.locator(".pos-total-row strong").innerText());
    assert.ok(saleTotal > 0, "Cart total is positive and based on current price");
    await page.getByLabel("Efectivo recibido (Gs.)").fill(String(saleTotal + 15000));
    dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= width && dimensions.body <= width, `Horizontal overflow in cart at ${width}px`);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/pos-cart-${width}.png`, fullPage: true });

    await page.getByRole("button", { name: "Confirmar venta" }).click();
    await page.getByRole("status").filter({ hasText: "Venta registrada" }).waitFor({ state: "visible" });
    const saleNumber = (await page.locator(".pos-sale-result strong").innerText()).split("·").at(-1).trim();
    assert.ok(saleNumber.startsWith("DEM-V-"), "Sale receives a demonstrative number");
    assert.equal(await page.locator(".pos-cart-line").count(), 0, "Cart clears only after sale succeeds");
    assert.match(await page.locator(".admin-ticket").innerText(), /SIN VALIDEZ FISCAL/);
    if ([1440, 390].includes(width)) {
      await page.screenshot({ path: `${output}/pos-success-${width}.png`, fullPage: true });
      await page.emulateMedia({ media: "print" });
      assert.equal(await page.locator(".admin-ticket").evaluate((el) => getComputedStyle(el).display), "block");
      assert.match(await page.locator(".admin-ticket").innerText(), /COMPROBANTE DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL/);
      await page.screenshot({ path: `${output}/receipt-${width}.png`, fullPage: true });
      await page.emulateMedia({ media: "screen" });
    }

    response = await page.goto(`${baseUrl}/admin/caja`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, `Caja must load at ${width}px`);
    await page.getByRole("heading", { name: "Caja", exact: true }).waitFor({ state: "visible" });
    assert.ok(await page.locator(".cash-summary-grid").isVisible(), "Open register is shared from POS");
    assert.ok(await page.locator(".cash-movements").getByText("Venta en efectivo").isVisible());
    const openedExpected = parseMoney(await page.locator(".cash-summary-grid article").nth(1).locator("strong").innerText());
    assert.equal(openedExpected, 100000 + saleTotal, "Cash movement records net sale total");
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/cash-movements-${width}.png`, fullPage: true });

    await page.getByLabel("Tipo").selectOption("manual_expense");
    await page.getByLabel("Importe (Gs.)").fill("20000");
    await page.getByLabel("Motivo").fill("Egreso de prueba");
    await page.getByRole("button", { name: "Registrar movimiento" }).click();
    await page.getByRole("status").filter({ hasText: "Movimiento registrado" }).waitFor({ state: "visible" });
    const afterExpense = parseMoney(await page.locator(".cash-summary-grid article").nth(1).locator("strong").innerText());
    assert.equal(afterExpense, 80000 + saleTotal, "Manual expense reduces expected cash");
    await page.getByLabel("Saldo contado (Gs.)").fill(String(afterExpense - 5000));
    assert.match(await page.locator(".cash-difference strong").innerText(), /5\.000/);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/cash-arqueo-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Confirmar cierre de caja" }).click();
    await page.getByRole("status").filter({ hasText: "Caja cerrada" }).waitFor({ state: "visible" });
    assert.ok(await page.locator(".cash-history").getByText("Cerrada").isVisible());
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/cash-closed-${width}.png`, fullPage: true });
    await page.goto(`${baseUrl}/admin/pos`, { waitUntil: "networkidle" });
    assert.equal(await page.getByRole("button", { name: "Confirmar venta" }).isDisabled(), true, "Closed register blocks POS sales");
    assert.match(await page.locator(".pos-checkout").innerText(), /Abrí una caja/);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.getByRole("button", { name: "Confirmar venta" }).isDisabled(), true, "Closed state persists after reload");

    await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
    await page.getByLabel("Cambiar perfil de demostración").selectOption("admin");
    await page.getByRole("heading", { name: /Buen día, Laura/ }).waitFor({ state: "visible" });
    const dashboardSales = parseMoney(await page.locator(".admin-metric-card").first().locator(".admin-metric-value").innerText());
    assert.equal(dashboardSales, saleTotal, "Dashboard uses the shared sale state without static double-counting");
    assert.match(await page.locator(".admin-payments-total").innerText(), /1 ventas/);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/dashboard-updated-${width}.png`, fullPage: true });
    dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= width && dimensions.body <= width, `Horizontal overflow at ${width}px on dashboard: ${JSON.stringify(dimensions)}`);
    assert.deepEqual(errors, [], `Browser errors at ${width}px: ${errors.join(" | ")}`);
    reports.push({ width, products: 40, searched: true, sale: saleNumber, cashNetAmount: saleTotal, manualExpense: 20000, closeDifference: -5000, dashboardTotal: dashboardSales, horizontalOverflow: false, browserErrors: errors.length });
    await page.close();
  }

  const storefront = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await storefront.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "Public ecommerce remains available");
  assert.equal(await storefront.locator(".sm-admin").count(), 0, "Admin shell does not leak into public storefront");
  assert.ok(await storefront.locator(".product-card").count() > 0, "Public catalog remains visible");
  reports.push({ route: "/", status: "passed", ecommerceUnaffected: true });
  await storefront.close();
} finally {
  await browser.close();
}

await writeFile(`${output}/report.json`, JSON.stringify({ baseUrl, widths, reports }, null, 2));
console.log(JSON.stringify(reports, null, 2));
