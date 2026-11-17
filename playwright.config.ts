import { defineConfig, devices } from '@playwright/test';

// Smoke tests against a production build. Supabase is a placeholder address that refuses
// connections, so these cover what a signed-out visitor sees without any backend or AI keys.
const PORT = 3100;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    // Real environment variables win over .env.local, so a local run is signed out too.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'e2e-placeholder',
      DEV_AUTH_BYPASS: 'false',
    },
  },
});
