# FE-22: E2E Tests (Playwright)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `testing`, `quality`
**Agente:** test-writer
**Dependencias:** FE-01 a FE-12 (todas las funcionalidades completadas)
**Estimación:** 5 días

---

## Descripción

Los tests unitarios cubren componentes individuales pero no verifican flujos completos de usuario. Se necesita implementar E2E tests con Playwright para validar que los usuarios pueden completar tareas críticas.

## Problema Actual

- Sin tests E2E
- Flujos críticos no verificados end-to-end
- Sin tests de navegación
- Sin tests de formularios complejos
- Sin tests de autenticación completos

## Solución Propuesta

### 1. Instalar Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Configurar playwright.config.ts

```typescript
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
  },
})
```

### 3. Test de login

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test"

test("login flow", async ({ page }) => {
  await page.goto("/login")
  
  // Fill form
  await page.fill('input[name="username"]', "admin")
  await page.fill('input[name="password"]', "admin123")
  
  // Submit
  await page.click('button[type="submit"]')
  
  // Should redirect to dashboard
  await expect(page).toHaveURL("/")
  await expect(page.locator("text=Dashboard")).toBeVisible()
})
```

### 4. Test de CRUD de tecnologías

```typescript
// e2e/technologies.spec.ts
import { test, expect } from "@playwright/test"

test("create technology", async ({ page }) => {
  // Login first
  await page.goto("/login")
  await page.fill('input[name="username"]', "admin")
  await page.fill('input[name="password"]', "admin123")
  await page.click('button[type="submit"]')
  
  // Navigate to technologies
  await page.click("text=Tecnologías")
  
  // Click create button
  await page.click("text=Nueva Tecnología")
  
  // Fill form
  await page.fill('input[name="nombre"]', "Tecnología Test")
  await page.fill('input[name="descripcion"]', "Descripción test")
  
  // Submit
  await page.click('button[type="submit"]:has-text("Crear")')
  
  // Should show success toast
  await expect(page.locator("text=creada correctamente")).toBeVisible()
  
  // Should appear in table
  await expect(page.locator("text=Tecnología Test")).toBeVisible()
})
```

### 5. Test de navegación

```typescript
// e2e/navigation.spec.ts
import { test, expect } from "@playwright/test"

test("sidebar navigation", async ({ page }) => {
  await page.goto("/")
  
  // Click each nav item
  await page.click("text=Organizaciones")
  await expect(page).toHaveURL("/organizations")
  
  await page.click("text=Tecnologías")
  await expect(page).toHaveURL("/technologies")
  
  await page.click("text=Patentes")
  await expect(page).toHaveURL("/patents")
  
  await page.click("text=Dashboard")
  await expect(page).toHaveURL("/")
})
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar `@playwright/test` |
| `frontend/playwright.config.ts` | **Crear** configuración |
| `frontend/e2e/auth.spec.ts` | **Crear** tests de auth |
| `frontend/e2e/technologies.spec.ts` | **Crear** tests de CRUD |
| `frontend/e2e/navigation.spec.ts` | **Crear** tests de navegación |
| `frontend/e2e/dashboard.spec.ts` | **Crear** tests de dashboard |
| `frontend/.gitignore` | Agregar `test-results/` |

## Criterios de Aceptación

- [ ] Playwright instalado y configurado
- [ ] Test de login (éxito y error)
- [ ] Test de CRUD de tecnologías (create, read, delete)
- [ ] Test de navegación (sidebar)
- [ ] Test de dashboard (carga de datos)
- [ ] Tests corren en CI (GitHub Actions)
- [ ] Screenshots en fallos
- [ ] Timeout configurable
- [ ] Reintentos configurados

## Notas para el Agente

- Playwright es el estándar industry para E2E tests
- Los tests necesitan un backend corriendo
- Usar `page.fill()` y `page.click()` para interacciones
- `expect(page).toHaveURL()` para verificar navegación
- Los tests deben ser independientes (no depender de otros)
