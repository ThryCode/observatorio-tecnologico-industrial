import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('Sidebar navigation', () => {
  test('navigates to Grafo de Conocimiento', async ({ page }) => {
    await page.getByRole('link', { name: /grafo de conocimiento/i }).first().click();
    await expect(page).toHaveURL('/graph');
    await expect(page.locator('text=Explorador del Grafo')).toBeVisible();
  });

  test('navigates to Tecnologías', async ({ page }) => {
    await page.getByRole('link', { name: /tecnologías/i }).first().click();
    await expect(page).toHaveURL('/technologies');
  });

  test('navigates to Patentes', async ({ page }) => {
    await page.getByRole('link', { name: /patentes/i }).first().click();
    await expect(page).toHaveURL('/patents');
  });

  test('navigates to Alertas', async ({ page }) => {
    await page.getByRole('link', { name: /alertas/i }).first().click();
    await expect(page).toHaveURL('/alerts');
  });

  test('navigates to Publicaciones', async ({ page }) => {
    await page.getByRole('link', { name: /publicaciones/i }).first().click();
    await expect(page).toHaveURL('/publications');
  });

  test('navigates to Entidades CTI', async ({ page }) => {
    await page.getByRole('link', { name: /entidades cti/i }).first().click();
    await expect(page).toHaveURL('/organizations');
  });

  test('navigates to Análisis de Competitividad', async ({ page }) => {
    await page.getByRole('link', { name: /análisis de competitividad/i }).first().click();
    await expect(page).toHaveURL('/competitiveness');
  });

  test('navigates to Mapas de Patentes', async ({ page }) => {
    await page.getByRole('link', { name: /mapas de patentes/i }).first().click();
    await expect(page).toHaveURL('/patent-maps');
  });

  test('navigates to Red Profesional', async ({ page }) => {
    await page.getByRole('link', { name: /red profesional/i }).first().click();
    await expect(page).toHaveURL('/network');
  });

  test('navigates back to Dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /tecnologías/i }).first().click();
    await expect(page).toHaveURL('/technologies');

    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL('/');
  });
});
