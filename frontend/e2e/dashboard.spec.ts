import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuario o correo electrónico').fill('admin@mindus.gob.cu');
  await page.getByLabel('Contraseña').fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL('/');
});

test.describe('Dashboard', () => {
  test('loads dashboard with KPIs', async ({ page }) => {
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible();
    await expect(page.locator('text=Grafo de Conocimiento Industrial')).toBeVisible();
  });

  test('displays alerts section', async ({ page }) => {
    await expect(page.locator('text=Alertas Recientes')).toBeVisible();
  });

  test('displays entities section', async ({ page }) => {
    await expect(page.locator('text=Entidades CTI')).toBeVisible();
  });

  test('displays timeline section', async ({ page }) => {
    await expect(page.locator('text=Actividad Reciente')).toBeVisible();
  });

  test('sector pills are clickable', async ({ page }) => {
    const pills = page.locator('button').filter({ hasText: /todos|automatización|bio/i });
    const count = await pills.count();
    expect(count).toBeGreaterThan(0);
  });

  test('export button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible();
  });

  test('new alert button navigates to alerts', async ({ page }) => {
    await page.getByRole('button', { name: /nueva alerta/i }).click();
    await expect(page).toHaveURL('/alerts');
  });
});
