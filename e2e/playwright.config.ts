import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ADMIN_PORT, ADMIN_URL, API, API_PORT, WEB_PORT, WEB_URL } from './ports';

/**
 * End-to-end suite for Genie Sevai. It starts all three apps itself:
 *   - the API (genie-sevai-backend) on an in-memory MongoDB,
 *   - production builds of this web app and the admin panel (genie-sevai-admin).
 *
 * The backend and admin are found next to this repo, either as the original monorepo folders
 * (../backend, ../admin) or as side-by-side clones (../genie-sevai-backend, ../genie-sevai-admin).
 * Point elsewhere with E2E_BACKEND_DIR / E2E_ADMIN_DIR.
 *
 * Already-running servers on the same ports are reused locally. If the default ports are busy:
 *   E2E_API_PORT=5101 E2E_WEB_PORT=5373 E2E_ADMIN_PORT=5374 npx playwright test
 */
const webDir = path.resolve(__dirname, '..');

function findDir(envVar: string, candidates: string[]) {
  const fromEnv = process.env[envVar];
  if (fromEnv) return path.resolve(fromEnv);
  const found = candidates.map((c) => path.resolve(webDir, c)).find((p) => fs.existsSync(path.join(p, 'package.json')));
  if (!found) throw new Error(`Could not find ${candidates.join(' or ')} next to the web app. Set ${envVar}.`);
  return found;
}

const backendDir = findDir('E2E_BACKEND_DIR', ['../backend', '../genie-sevai-backend']);
const adminDir = findDir('E2E_ADMIN_DIR', ['../admin', '../genie-sevai-admin']);
const reuse = !process.env.CI;

export default defineConfig({
  testDir: './tests',
  // The suite drives one shared API/database, so run specs one after another.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:memory',
      cwd: backendDir,
      url: `http://localhost:${API_PORT}/health`,
      env: { PORT: String(API_PORT) },
      reuseExistingServer: reuse,
      timeout: 180_000,
      stdout: 'ignore',
    },
    {
      command: `npm run build && npx vite preview --port ${WEB_PORT} --strictPort`,
      cwd: webDir,
      url: WEB_URL,
      env: { VITE_API_URL: API },
      reuseExistingServer: reuse,
      timeout: 180_000,
    },
    {
      command: `npm run build && npx vite preview --port ${ADMIN_PORT} --strictPort`,
      cwd: adminDir,
      url: ADMIN_URL,
      env: { VITE_API_URL: API },
      reuseExistingServer: reuse,
      timeout: 180_000,
    },
  ],
});
