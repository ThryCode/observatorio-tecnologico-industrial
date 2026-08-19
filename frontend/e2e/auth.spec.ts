import { test, expect } from '@playwright/test';

const ADMIN_USER = 'admin@mindus.gob.cu';
const ADMIN_PASS = 'admin123';

test.describe('Authentication', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario o correo electrónico').fill(ADMIN_USER);
    await page.getByLabel('Contraseña').fill(ADMIN_PASS);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL('/');
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Usuario o correo electrónico').fill('wrong@example.com');
    await page.getByLabel('Contraseña').fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText(/error|incorrecto|inválid|credenciales/i)).toBeVisible({ timeout: 10_000 });
  });

  test('login form validates required fields', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText('Ingrese su usuario o correo electrónico')).toBeVisible();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    // This test needs to log in fresh (no storageState)
    await page.goto('/login');
    await page.getByLabel('Usuario o correo electrónico').fill(ADMIN_USER);
    await page.getByLabel('Contraseña').fill(ADMIN_PASS);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await page.waitForURL('/login', { timeout: 10_000 });
  });
});
