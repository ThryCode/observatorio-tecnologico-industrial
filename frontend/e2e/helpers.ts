import { type Page } from '@playwright/test';

export const ADMIN_USER = 'admin@mindus.gob.cu';
export const ADMIN_PASS = 'admin123';

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Usuario o correo electrónico').fill(ADMIN_USER);
  await page.getByLabel('Contraseña').fill(ADMIN_PASS);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();

  // Wait for either dashboard content or navigation to / (whichever resolves first)
  // Use a generous timeout since the first login after idle may be slow
  await Promise.race([
    page.locator('text=Panel de Inteligencia').waitFor({ timeout: 20_000 }),
    page.waitForURL('/', { timeout: 20_000 }),
  ]).catch(async () => {
    // If first attempt fails, retry once more
    await page.waitForLoadState('networkidle');
    await Promise.race([
      page.locator('text=Panel de Inteligencia').waitFor({ timeout: 15_000 }),
      page.waitForURL('/', { timeout: 15_000 }),
    ]);
  });
  await page.waitForLoadState('networkidle');
}
