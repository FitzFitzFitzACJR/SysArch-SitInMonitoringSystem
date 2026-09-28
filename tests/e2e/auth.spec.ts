import { expect, test } from "@playwright/test";
import { E2E, login } from "./fixtures";

test.describe("authentication & permissions", () => {
  test("wrong password shows a generic error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("ID number").fill(E2E.student);
    await page.getByLabel("Password").fill("not-the-password1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Incorrect ID number or password" })).toBeVisible();
  });

  test("the seeded admin must change their password first", async ({ page }) => {
    await login(page, E2E.admin, E2E.adminInitialPassword);
    await expect(page).toHaveURL(/\/change-password/);

    // Every other page redirects back until the password is changed.
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/change-password/);

    await page.getByLabel("Current password").fill(E2E.adminInitialPassword);
    await page.getByLabel("New password", { exact: true }).fill(E2E.adminNewPassword);
    await page.getByLabel("Confirm new password").fill(E2E.adminNewPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("students can't open staff pages", async ({ page }) => {
    await login(page, E2E.student);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/admin/students");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("lab staff can't open super-admin pages", async ({ page }) => {
    await login(page, E2E.staff);
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/staff");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("anonymous visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin%2Freports/);
  });
});
