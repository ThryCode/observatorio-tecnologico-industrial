import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads dashboard with KPIs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Grafo de Conocimiento Industrial')).toBeVisible();
  });

  test('displays alerts section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Alertas Recientes')).toBeVisible({ timeout: 15_000 });
  });

  test('displays entities section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Entidades CTI' })).toBeVisible({ timeout: 15_000 });
  });

  test('displays timeline section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Actividad Reciente')).toBeVisible({ timeout: 15_000 });
  });

  test('sector pills are clickable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 15_000 });
    const pills = page.locator('[role="group"] button').filter({ hasText: /todos/i });
    await expect(pills.first()).toBeVisible({ timeout: 10_000 });
    await pills.first().click();
  });

  test('export button is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible();
  });

  test('new alert button navigates to alerts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /nueva alerta/i }).click();
    await page.waitForURL('/alerts', { timeout: 10_000 });
  });
});
