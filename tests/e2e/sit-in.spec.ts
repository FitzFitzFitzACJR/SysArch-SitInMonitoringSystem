import { expect, test } from "@playwright/test";
import { E2E, choose, expectToast, login, logout } from "./fixtures";

// The core flow: a new student accepts the lab rules, staff check them in at the desk,
// the student sees it on their dashboard, staff end it with a reward.
test("sit-in lifecycle: rules → check-in → dashboard → end with reward", async ({ page }) => {
  // Staff can't check the student in before they accept the rules.
  await login(page, E2E.staff);
  await page.goto("/admin/sit-ins");
  await page.getByLabel("QR code or ID number").fill(E2E.newStudent);
  await page.getByRole("button", { name: "Look up" }).click();
  await expect(page.getByText(/haven.t accepted the current lab rules/)).toBeVisible();
  await logout(page);

  // The student accepts them.
  await login(page, E2E.newStudent);
  await page.getByLabel(/read and will follow the lab rules/).check();
  await page.getByRole("button", { name: "Accept rules" }).click();
  await expectToast(page, /all set to check in/);
  await logout(page);

  // Now staff check them in.
  await login(page, E2E.staff);
  await page.goto("/admin/sit-ins");
  await page.getByLabel("QR code or ID number").fill(E2E.newStudent);
  await page.getByRole("button", { name: "Look up" }).click();
  await choose(page, "Lab", "Lab 524");
  await choose(page, "Computer", "PC 1");
  await choose(page, "Language", "Java");
  await page.getByRole("button", { name: "Start sit-in" }).click();
  await expectToast(page, /checked in/);
  const row = page.getByRole("row").filter({ hasText: E2E.newStudent });
  await expect(row).toContainText("Lab 524, PC 1");

  // PC 1 now shows as in use on the live map.
  await page.goto("/admin/labs");
  await page.getByRole("link", { name: "Lab 524" }).click();
  await expect(page.getByRole("button", { name: /^PC 1, in use by/ })).toBeVisible();
  await logout(page);

  // The student sees their sit-in and one fewer session.
  await login(page, E2E.newStudent);
  await expect(page.getByText("You're checked in")).toBeVisible();
  await expect(page.getByText("Lab 524, PC 1")).toBeVisible();
  await logout(page);

  // Staff end it with a reward: the student gets a point.
  await login(page, E2E.staff);
  await page.goto("/admin/sit-ins");
  await page
    .getByRole("row")
    .filter({ hasText: E2E.newStudent })
    .getByRole("button", { name: /^End (& reward \(\+1\)|\+pt),/ })
    .click();
  await expectToast(page, /\+1 point/);
  await logout(page);

  await login(page, E2E.newStudent);
  await expect(page.getByText("You're checked in")).toHaveCount(0);
  await page.goto("/history");
  await expect(page.getByRole("row").filter({ hasText: "Lab 524" })).toContainText("+points");
});
