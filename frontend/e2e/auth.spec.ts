import { test, expect } from '@playwright/test';
import { login, ADMIN_USER, ADMIN_PASS } from './helpers';

test.describe('Authentication', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario o correo electrónico').fill(ADMIN_USER);
    await page.getByLabel('Contraseña').fill(ADMIN_PASS);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL('/', { timeout: 30_000 });
    await expect(page.locator('text=Panel de Inteligencia')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Usuario o correo electrónico').fill('wrong@example.com');
    await page.getByLabel('Contraseña').fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(
      page.getByText(/error|credenciales|incorrecta|inválida/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('login form validates required fields', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText('Ingrese su usuario o correo electrónico')).toBeVisible();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await login(page);

    // Logout
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
