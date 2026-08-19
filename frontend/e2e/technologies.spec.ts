import { test, expect } from '@playwright/test';

test.describe('Technologies CRUD', () => {
  test('displays technologies list', async ({ page }) => {
    await page.goto('/technologies');
    await expect(page.getByRole('heading', { name: /tecnologías/i })).toBeVisible({ timeout: 10_000 });
  });

  test('opens create form and cancels', async ({ page }) => {
    await page.goto('/technologies');
    await expect(page.getByRole('heading', { name: /tecnologías/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /nuevo/i }).click();

    await expect(page.locator('#technology-nombre')).toBeVisible();

    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('creates a new technology', async ({ page }) => {
    await page.goto('/technologies');
    await expect(page.getByRole('heading', { name: /tecnologías/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /nuevo/i }).click();

    const testName = `Tech E2E ${Date.now()}`;

    await page.locator('#technology-nombre').fill(testName);
    await page.locator('#technology-descripcion').fill('Descripción de prueba E2E');

    await page.getByRole('button', { name: /crear/i }).first().click();

    // Dialog closes on success; stays open with "Request failed" on error
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Verify toast success message appeared
    await expect(page.getByText(/creado correctamente/i)).toBeVisible({ timeout: 5_000 });

    // Cleanup: find and delete the test technology
    const testRow = page.getByText(testName);
    if (await testRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testRow.click();
      const deleteBtn = page.getByRole('button', { name: /eliminar/i });
      if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.getByRole('button', { name: /eliminar/i }).last().click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('searches technologies', async ({ page }) => {
    await page.goto('/technologies');
    await expect(page.getByRole('heading', { name: /tecnologías/i })).toBeVisible({ timeout: 10_000 });

    const searchInput = page.locator('input[placeholder*="buscar"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E');
      await page.waitForTimeout(500);
    }
  });
});
