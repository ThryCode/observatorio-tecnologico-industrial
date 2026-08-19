import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    channel: 'chrome',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'G:\\Proyects\\Observatorio\\tools\\nodejs\\node-v20.18.3-win-x64\\node.exe node_modules\\vite\\bin\\vite.js',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
