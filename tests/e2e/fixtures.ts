import { expect, type Page } from "@playwright/test";

// Test-only credentials for the throwaway e2e database (never used anywhere else).
export const E2E = {
  password: "E2e-Demo-Pass1",
  admin: "admin",
  adminInitialPassword: "E2e-Admin-Init1",
  adminNewPassword: "E2e-Admin-New1",
  staff: "staff",
  newStudent: "2024-0001", // hasn't accepted the lab rules yet
  student: "2024-0002",
  student3: "2024-0003",
};

export async function login(page: Page, idNumber: string, password: string = E2E.password) {
  await page.goto("/login");
  await page.getByLabel("ID number").fill(idNumber);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
}

/** Radix selects: open by accessible name, then pick the option. */
export async function choose(page: Page, label: string | RegExp, option: string | RegExp) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: typeof option === "string" }).click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}
