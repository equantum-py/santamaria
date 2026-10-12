import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://127.0.0.1:4173";
const output = "artifacts/admin-e03";
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
    for (const [path, heading] of [["/admin/productos", "Productos"], ["/admin/inventario", "Inventario"]]) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, `${path} must load at ${width}px`);
      await page.getByRole("heading", { level: 1, name: heading, exact: true }).waitFor({ state: "visible" });
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(dimensions.scroll <= width && dimensions.client <= width, `Horizontal overflow on ${path} at ${width}px: ${JSON.stringify(dimensions)}`);
      if ([1440, 390, 320].includes(width)) await page.screenshot({ path: `${output}/${path.split("/").at(-1)}-${width}.png`, fullPage: true });
    }

    if (width === 1440) {
      await page.goto(`${baseUrl}/admin/productos`, { waitUntil: "networkidle" });
      const productRow = page.locator(".inventory-table .order-select-button").first();
      await productRow.click();
      const originalPrice = await page.getByLabel("Precio demo (Gs.)").inputValue();
      const updatedPrice = String(Number(originalPrice) + 1000);
      await page.getByLabel("Precio demo (Gs.)").fill(updatedPrice);
      await page.getByRole("button", { name: "Guardar cambios demo" }).click();
      await page.getByRole("status").filter({ hasText: "actualizado en esta demostración" }).waitFor({ state: "visible" });

      await page.goto(`${baseUrl}/admin/inventario`, { waitUntil: "networkidle" });
      await page.getByLabel("Cantidad", { exact: true }).fill("2");
      await page.getByLabel("Motivo").fill("Recepción QA de demostración");
      await page.getByRole("button", { name: "Registrar movimiento demo" }).click();
      await page.getByRole("status").filter({ hasText: "Entrada de stock registrada" }).waitFor({ state: "visible" });

      await page.goto(`${baseUrl}/admin/pedidos`, { waitUntil: "networkidle" });
      await page.getByLabel("Cantidad", { exact: true }).fill("1");
      await page.getByRole("button", { name: "Agregar línea" }).click();
      await page.getByRole("button", { name: "Crear pedido de demostración" }).click();
      const createdStatus = page.locator(".order-create-panel").getByRole("status");
      await createdStatus.waitFor({ state: "visible" });
      const orderNumber = (await createdStatus.innerText()).match(/DEM-PED-\d+/)?.[0];
      assert.ok(orderNumber, "New demo order has a generated number");
      await page.getByLabel("Nuevo estado").selectOption("confirmed");
      await page.getByRole("button", { name: "Guardar estado" }).click();
      await page.locator(".order-detail-panel .admin-status-pill").filter({ hasText: "Confirmado" }).waitFor({ state: "visible" });

      await page.goto(`${baseUrl}/admin/inventario`, { waitUntil: "networkidle" });
      const firstProduct = page.locator(".inventory-table tbody tr").first();
      const stockCells = await firstProduct.locator("td").allTextContents();
      assert.equal(Number(stockCells[2]), 1, "Confirmed order reserves one unit");
      assert.equal(Number(stockCells[3]), Number(stockCells[1]) - 1, "Available stock excludes reserved units");
      assert.ok((await page.locator(".inventory-history-table").innerText()).includes("Reserva"), "Order confirmation creates a reservation movement");
      await page.screenshot({ path: `${output}/inventory-reservation-1440.png`, fullPage: true });
    }
    assert.deepEqual(errors, [], `Browser errors at ${width}px: ${errors.join(" | ")}`);
    results.push({ width, routes: ["/admin/productos", "/admin/inventario"], horizontalOverflow: false, browserErrors: errors.length });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/report.json`, JSON.stringify({ baseUrl, widths, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
