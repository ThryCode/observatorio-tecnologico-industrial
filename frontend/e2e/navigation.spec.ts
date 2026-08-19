import { test, expect } from '@playwright/test';

test.describe('Sidebar navigation', () => {
  test('navigates to Grafo de Conocimiento', async ({ page }) => {
    await page.goto('/graph');
    await expect(page.locator('text=Explorador del Grafo')).toBeVisible({ timeout: 15_000 });
  });

  test('navigates to Tecnologías', async ({ page }) => {
    await page.goto('/technologies');
    await expect(page.getByRole('heading', { name: /tecnologías/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Patentes', async ({ page }) => {
    await page.goto('/patents');
    await expect(page.getByRole('heading', { name: /patentes/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Alertas', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByRole('heading', { name: /alertas/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Publicaciones', async ({ page }) => {
    await page.goto('/publications');
    await expect(page.getByRole('heading', { name: /publicaciones/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Entidades CTI', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.getByRole('heading', { name: /organizaciones/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Análisis de Competitividad', async ({ page }) => {
    await page.goto('/competitiveness');
    await expect(page.getByRole('heading', { name: /competitividad/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Mapas de Patentes', async ({ page }) => {
    await page.goto('/patent-maps');
    await expect(page.getByRole('heading', { name: 'Mapas de Patentes' })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Red Profesional', async ({ page }) => {
    await page.goto('/network');
    await expect(page.getByRole('heading', { name: /red profesional/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates back to Dashboard', async ({ page }) => {
    await page.goto('/technologies');
    await expect(page.getByRole('heading', { name: /tecnologías/i })).toBeVisible({ timeout: 10_000 });

    await page.goto('/');
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 10_000 });
  });
});
