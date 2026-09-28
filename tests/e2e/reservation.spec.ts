import { expect, test } from "@playwright/test";
import { E2E, choose, expectToast, login, logout } from "./fixtures";

test("reservation: student requests, staff approves, student sees it", async ({ page }) => {
  await login(page, E2E.student);
  await page.goto("/reservations");

  // Tomorrow, so the slot hasn't started whatever time the test runs.
  const tomorrow = new Date(Date.now() + 86_400_000);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(tomorrow);
  await page.getByLabel("Date").fill(ymd);
  await choose(page, "Lab", "Lab 526");
  await page.getByRole("button", { name: /^8:00 AM – 9:30 AM/ }).click();
  await page.getByRole("button", { name: "PC 7", exact: true }).click();
  await choose(page, "Language", "PHP");
  await page.getByLabel("What will you work on?").fill("Web project");
  await page.getByRole("button", { name: "Request booking" }).click();
  await expectToast(page, /Request sent/);

  // PC 7 is no longer offered for that slot.
  await page.getByRole("button", { name: /^8:00 AM – 9:30 AM/ }).click();
  await expect(page.getByRole("button", { name: "PC 7", exact: true })).toHaveCount(0);
  await logout(page);

  await login(page, E2E.staff);
  await page.goto("/admin/reservations");
  const request = page.getByRole("row").filter({ hasText: "Web project" });
  await request.getByRole("button", { name: "Approve" }).click();
  await expectToast(page, /Approved/);
  await logout(page);

  await login(page, E2E.student);
  await page.goto("/reservations");
  await expect(page.getByText("Approved").first()).toBeVisible();
  await expect(page.getByText("Lab 526, PC 7")).toBeVisible();
});
