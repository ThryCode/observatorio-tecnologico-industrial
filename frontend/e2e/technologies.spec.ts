import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuario o correo electrónico').fill('admin@mindus.gob.cu');
  await page.getByLabel('Contraseña').fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL('/');
});

test.describe('Technologies CRUD', () => {
  test('displays technologies list', async ({ page }) => {
    await page.getByRole('link', { name: /tecnologías/i }).first().click();
    await expect(page).toHaveURL('/technologies');
    await expect(page.locator('h2, h3').filter({ hasText: /tecnolog/i })).toBeVisible();
  });

  test('opens create form and cancels', async ({ page }) => {
    await page.goto('/technologies');
    await page.getByRole('button', { name: /nueva/i }).click();

    // Form should be visible
    await expect(page.locator('input[name="nombre"], input[placeholder*="nombre"]')).toBeVisible();

    // Cancel
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('creates a new technology', async ({ page }) => {
    await page.goto('/technologies');
    await page.getByRole('button', { name: /nueva/i }).click();

    const testName = `Tech E2E ${Date.now()}`;

    await page.locator('input[name="nombre"], input[placeholder*="nombre"]').first().fill(testName);
    await page.locator('textarea[name="descripcion"], input[name="descripcion"]').first().fill('Descripción de prueba E2E');

    await page.getByRole('button', { name: /crear/i }).first().click();

    // Should show success and appear in list
    await expect(page.locator(`text=${testName}`)).toBeVisible({ timeout: 10_000 });
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
