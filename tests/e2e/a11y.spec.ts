import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E, login } from "./fixtures";

// Automated accessibility check (axe-core, WCAG 2.1 A/AA rules) on the main screens, in
// light and dark mode. Serious and critical violations fail the test.
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    blocking.map(
      (v) =>
        `${page.url()} ${v.id}: ${v.nodes
          .slice(0, 3)
          .map((n) => `${n.html.slice(0, 160)} — ${n.failureSummary}`)
          .join(" | ")}`,
    ),
  ).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    test("login", async ({ page }) => {
      await page.goto("/login");
      await expectAccessible(page);
    });

    test("student pages", async ({ page }) => {
      await login(page, E2E.student3);
      for (const path of ["/dashboard", "/reservations", "/lab-map", "/stats", "/feedback"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expectAccessible(page);
      }
    });

    test("staff pages", async ({ page }) => {
      await login(page, E2E.staff);
      for (const path of ["/admin", "/admin/sit-ins", "/admin/students", "/admin/reservations"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expectAccessible(page);
      }
    });
  });
}
