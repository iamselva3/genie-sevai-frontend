/** Ports the suite runs on. Override with E2E_API_PORT / E2E_WEB_PORT / E2E_ADMIN_PORT when the defaults are busy. */
export const API_PORT = Number(process.env.E2E_API_PORT ?? 5100);
export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5273);
export const ADMIN_PORT = Number(process.env.E2E_ADMIN_PORT ?? 5274);

export const API = `http://localhost:${API_PORT}/api/v1`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const ADMIN_URL = `http://localhost:${ADMIN_PORT}`;

/**
 * The suite can't sign in to a real Google account, so the API it starts accepts test tokens signed
 * with this secret (never in production) and the web app's Google script is replaced in the browser.
 */
export const GOOGLE_TEST_SECRET = 'e2e-google-test-secret';
export const GOOGLE_CLIENT_ID = 'e2e-client.apps.googleusercontent.com';
