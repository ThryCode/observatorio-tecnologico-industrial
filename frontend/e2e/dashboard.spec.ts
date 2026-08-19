import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
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
    await expect(page.getByRole('heading', { name: 'Entidades CTI' })).toBeVisible();
  });

  test('displays timeline section', async ({ page }) => {
    await expect(page.locator('text=Actividad Reciente')).toBeVisible();
  });

  test('sector pills are clickable', async ({ page }) => {
    // Wait for sector pills to load
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible();
    await page.waitForLoadState('networkidle');
    // SectorPills renders buttons inside a group with aria-label
    const group = page.getByRole('group', { name: /sector/i });
    await expect(group).toBeVisible({ timeout: 10000 });
    const pills = group.getByRole('button');
    expect(await pills.count()).toBeGreaterThan(0);
  });

  test('export button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible();
  });

  test('new alert button navigates to alerts', async ({ page }) => {
    await page.getByRole('button', { name: /nueva alerta/i }).click();
    await expect(page).toHaveURL('/alerts');
  });
});
