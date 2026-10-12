import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://127.0.0.1:4173";
const output = "artifacts/admin-e02c";
const widths = [1440, 1024, 768, 430, 390, 375, 320];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width > 760 ? 1000 : 900 }, isMobile: width <= 760, hasTouch: width <= 760 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    let response = await page.goto(`${baseUrl}/admin/presupuestos`, { waitUntil: "networkidle", timeout: 60000 });
    assert.equal(response?.status(), 200, `Presupuestos must load at ${width}px`);
    await page.getByRole("heading", { level: 1, name: "Presupuestos", exact: true }).waitFor({ state: "visible" });
    assert.ok(await page.getByRole("button", { name: "Crear presupuesto demo" }).isVisible());
    let dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= width && dimensions.body <= width, `Horizontal overflow on quotes at ${width}px: ${JSON.stringify(dimensions)}`);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/quotes-${width}.png`, fullPage: true });

    response = await page.goto(`${baseUrl}/admin/pedidos`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, `Pedidos must load at ${width}px`);
    await page.getByRole("heading", { name: "Pedidos", exact: true }).waitFor({ state: "visible" });
    assert.ok(await page.getByRole("button", { name: "Crear pedido de demostración" }).isVisible());
    dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.document <= width && dimensions.body <= width, `Horizontal overflow on orders at ${width}px: ${JSON.stringify(dimensions)}`);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/orders-${width}.png`, fullPage: true });

    if ([1440, 390].includes(width)) {
      await page.goto(`${baseUrl}/admin/presupuestos`, { waitUntil: "networkidle" });
      await page.getByLabel("Cantidad del producto").fill("2");
      await page.getByRole("button", { name: "Agregar línea" }).click();
      await page.getByRole("button", { name: "Crear presupuesto demo" }).click();
      await page.locator(".quote-editor-panel").getByRole("status").filter({ hasText: "creado en la demo" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Marcar enviado" }).click();
      await page.getByRole("button", { name: "Aceptar" }).click();
      await page.getByRole("button", { name: "Convertir una vez a pedido" }).click();
      await page.locator(".quote-detail-panel").getByRole("status").filter({ hasText: "convertido al pedido" }).waitFor({ state: "visible" });
      assert.match(await page.locator(".quote-detail-panel").innerText(), /no puede repetirse/i);
      const orderNumber = (await page.locator(".quote-detail-panel").innerText()).match(/DEM-PED-\d+/)?.[0];
      assert.ok(orderNumber, "Quote conversion exposes the created order number");
      await page.getByRole("button", { name: "Vista imprimible" }).click();
      await page.emulateMedia({ media: "print" });
      assert.equal(await page.locator(".admin-document-print").evaluate((el) => getComputedStyle(el).visibility), "visible");
      assert.match(await page.locator(".admin-document-print").innerText(), /SIN VALIDEZ FISCAL/);
      await page.emulateMedia({ media: "screen" });
      if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/quote-accepted-${width}.png`, fullPage: true });

      await page.goto(`${baseUrl}/admin/pedidos`, { waitUntil: "networkidle" });
      await page.locator(".order-select-button").filter({ hasText: orderNumber }).click();
      await page.getByLabel("Nuevo estado").selectOption("confirmed");
      await page.getByRole("button", { name: "Guardar estado" }).click();
      await page.locator(".order-detail-panel").getByRole("status").filter({ hasText: "Confirmado" }).waitFor({ state: "visible" });
      await page.getByPlaceholder("La observación quedará en el historial.").fill("Coordinar retiro de demostración");
      await page.getByRole("button", { name: "Guardar observación" }).click();
      await page.getByText("Coordinar retiro de demostración").waitFor({ state: "visible" });
      await page.reload({ waitUntil: "networkidle" });
      await page.getByText(orderNumber, { exact: true }).first().click();
      assert.ok(await page.getByText("Coordinar retiro de demostración").isVisible(), "Order state and observations persist after reload");
      dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      assert.ok(dimensions.document <= width && dimensions.body <= width, `Horizontal overflow in order details at ${width}px: ${JSON.stringify(dimensions)}`);
      if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/order-flow-${width}.png`, fullPage: true });

      await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".admin-metric-card").nth(2).locator(".admin-metric-value").innerText(), "1", "Dashboard counts the order from the quote");
      assert.equal(await page.locator(".admin-task-row").nth(2).locator("strong").innerText(), "00", "Dashboard quote count updates from shared state");
    }
    assert.deepEqual(errors, [], `Browser errors at ${width}px: ${errors.join(" | ")}`);
    results.push({ width, routes: ["/admin/presupuestos", "/admin/pedidos"], horizontalOverflow: false, browserErrors: errors.length });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/report.json`, JSON.stringify({ baseUrl, widths, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
