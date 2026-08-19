import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuario o correo electrónico').fill('admin@mindus.gob.cu');
  await page.getByLabel('Contraseña').fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});
