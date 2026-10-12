import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.ADMIN_BASE_URL ?? "http://127.0.0.1:4173";
const out = "artifacts/admin-stage01";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width > 760 ? 1000 : 900 }, isMobile: width <= 760, hasTouch: width <= 760 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

    const response = await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle", timeout: 60_000 });
    assert.equal(response?.status(), 200, `/admin returned an error at ${width}px`);
    assert.match(await page.title(), /Santa María Admin/i);
    await page.getByRole("heading", { name: /Buen día, Laura/i }).waitFor({ state: "visible" });
    assert.ok(await page.getByLabel("Aviso de demostración").isVisible());
    assert.match(await page.getByLabel("Aviso de demostración").innerText(), /datos simulados/i);
    assert.equal(await page.locator(".admin-metric-card").count(), 4);
    assert.equal(await page.locator(".admin-nav-item.active").count(), 1);
    assert.ok(await page.getByRole("img", { name: /Gráfico demostrativo de ventas/i }).isVisible());

    const chartPeriod = page.locator(".admin-period-select select");
    await chartPeriod.selectOption("month");
    assert.match(await page.locator(".admin-chart").getAttribute("aria-label"), /Este mes/);

    const profile = page.getByLabel("Cambiar perfil de demostración");
    await profile.selectOption("cajero");
    await page.getByRole("heading", { name: /Buen día, Marta/i }).waitFor({ state: "visible" });
    assert.ok(await page.locator(".admin-nav-item").filter({ hasText: "Punto de venta" }).isDisabled());
    assert.equal(await page.locator(".admin-nav-item").filter({ hasText: "Productos" }).count(), 0,
      "Cajero demo should not see modules outside its visible profile");
    assert.match(await page.locator(".admin-profile-demo-warning").innerText(), /No aplica permisos/i);
    await profile.selectOption("admin");
    await page.getByRole("heading", { name: /Buen día, Laura/i }).waitFor({ state: "visible" });

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      font: getComputedStyle(document.querySelector(".sm-admin")).fontFamily,
      titleWeight: getComputedStyle(document.querySelector(".admin-page-heading h1")).fontWeight,
    }));
    assert.ok(widths.document <= width && widths.body <= width, `Horizontal overflow at ${width}px: ${JSON.stringify(widths)}`);
    assert.match(widths.font, /Inter/);

    if (width <= 1000) {
      const menu = page.getByRole("button", { name: "Abrir menú" });
      assert.ok(await menu.isVisible(), "Mobile navigation toggle should be visible");
      await menu.click();
      assert.equal(await menu.getAttribute("aria-expanded"), "true");
      assert.ok(await page.getByRole("button", { name: "Cerrar menú" }).first().isVisible());
      await page.getByRole("button", { name: "Cerrar menú" }).first().click();
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
    }

    const screenshot = `${out}/admin-${width}.png`;
    await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
    assert.deepEqual(errors, [], `Browser errors at ${width}px: ${errors.join(" | ")}`);
    results.push({ width, ...widths, metrics: 4, profileSelector: "passed", chartFilter: "passed", mobileNavigation: width <= 760 ? "passed" : "not applicable", screenshot });
    await page.close();
  }

  const storefront = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const storefrontErrors = [];
  storefront.on("pageerror", (error) => storefrontErrors.push(error.message));
  const storefrontResponse = await storefront.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  assert.equal(storefrontResponse?.status(), 200, "Public ecommerce route must remain available");
  assert.match(await storefront.title(), /Santa María/i, "Public route should remain Santa María");
  await storefront.locator(".site-header").waitFor({ state: "visible" });
  assert.ok(await storefront.locator(".product-card").count() > 0, "Public catalog should still render product cards");
  assert.equal(await storefront.locator(".sm-admin").count(), 0, "Admin shell must not leak into the public storefront");
  assert.deepEqual(storefrontErrors, [], "Public ecommerce route should not emit browser errors");
  results.push({ route: "/", status: "passed", storefrontHeader: "visible", productCards: "rendered", adminShell: "absent" });
  await storefront.close();
} finally {
  await browser.close();
}
await (await import("node:fs/promises")).writeFile(`${out}/report.json`, JSON.stringify({ baseUrl, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
