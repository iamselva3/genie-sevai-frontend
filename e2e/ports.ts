/** Ports the suite runs on. Override with E2E_API_PORT / E2E_WEB_PORT / E2E_ADMIN_PORT when the defaults are busy. */
export const API_PORT = Number(process.env.E2E_API_PORT ?? 5100);
export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5273);
export const ADMIN_PORT = Number(process.env.E2E_ADMIN_PORT ?? 5274);

export const API = `http://localhost:${API_PORT}/api/v1`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const ADMIN_URL = `http://localhost:${ADMIN_PORT}`;
