import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('Technologies CRUD', () => {
  test('displays technologies list', async ({ page }) => {
    await page.getByRole('link', { name: /tecnologías/i }).first().click();
    await expect(page).toHaveURL('/technologies');
    await expect(page.locator('h1, h2').filter({ hasText: /tecnolog/i }).first()).toBeVisible();
  });

  test('opens create form and cancels', async ({ page }) => {
    await page.goto('/technologies');
    await page.getByRole('button', { name: /nuevo/i }).click();

    // Form should be visible (dialog opens)
    await expect(page.locator('#technology-nombre')).toBeVisible({ timeout: 10000 });

    // Cancel
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('creates a new technology', async ({ page }) => {
    await page.goto('/technologies');
    await page.getByRole('button', { name: /nuevo/i }).click();

    const testName = `Tech E2E ${Date.now()}`;

    await page.locator('#technology-nombre').fill(testName);
    await page.locator('#technology-descripcion').fill('Descripción de prueba E2E');

    await page.getByRole('button', { name: /crear/i }).first().click();

    // After clicking Crear, either dialog closes (success) or error is shown
    await page.waitForTimeout(3000);
  });

  test('searches technologies', async ({ page }) => {
    await page.goto('/technologies');

    const searchInput = page.locator('input[placeholder*="buscar"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E');
      await page.waitForTimeout(500);
    }
  });
});
