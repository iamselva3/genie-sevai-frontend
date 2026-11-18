import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';

import { ADMIN_URL, API, WEB_URL } from '../ports';
export { ADMIN_URL, API, WEB_URL };
export const ADMIN = { email: 'admin@sevai.in', password: 'Admin@12345' };
export const PRO_PASSWORD = 'Pro@12345';

/** Every test page skips the splash unless the test opts out with test.use({ skipSplash: false }). */
export const test = base.extend<{ skipSplash: boolean }>({
  skipSplash: [true, { option: true }],
  page: async ({ page, skipSplash }, use) => {
    if (skipSplash) {
      await page.addInitScript(() => {
        try {
          sessionStorage.setItem('sevai:splash', '1');
        } catch {
          /* ignore */
        }
      });
    }
    await use(page);
  },
});
export { expect };

let seq = 0;
/** A fresh, valid Indian mobile number for each call. */
export function uniquePhone() {
  seq += 1;
  const tail = String((Date.now() * 10 + seq) % 1_000_000_000).padStart(9, '0');
  return `7${tail}`;
}

async function json<T>(res: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(res.ok(), `${res.url()} -> ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()) as T;
}

export async function adminToken(request: APIRequestContext) {
  return (await json<{ token: string }>(await request.post(`${API}/admin/auth/login`, { data: ADMIN }))).token;
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function setServiceStatus(request: APIRequestContext, slug: string, status: 'active' | 'unavailable' | 'hidden', reason?: string) {
  const token = await adminToken(request);
  const { services } = await json<{ services: { id: string; slug: string }[] }>(await request.get(`${API}/admin/services`, { headers: bearer(token) }));
  const service = services.find((s) => s.slug === slug);
  if (!service) throw new Error(`No service ${slug}`);
  await json(await request.patch(`${API}/admin/services/${service.id}/status`, { headers: bearer(token), data: { status, ...(reason !== undefined ? { unavailableReason: reason } : {}) } }));
}

export async function setCategoryVisible(request: APIRequestContext, slug: string, isActive: boolean) {
  const token = await adminToken(request);
  const { categories } = await json<{ categories: { id: string; slug: string }[] }>(await request.get(`${API}/admin/categories`, { headers: bearer(token) }));
  const category = categories.find((c) => c.slug === slug);
  if (!category) throw new Error(`No category ${slug}`);
  await json(await request.patch(`${API}/admin/categories/${category.id}`, { headers: bearer(token), data: { isActive } }));
}

/** Creates a customer through the OTP API and returns their token. */
export async function createCustomer(request: APIRequestContext, name = 'E2E Customer') {
  const phone = uniquePhone();
  const sent = await json<{ devCode: string }>(await request.post(`${API}/auth/otp/send`, { data: { phone } }));
  const { token } = await json<{ token: string }>(await request.post(`${API}/auth/otp/verify`, { data: { phone, code: sent.devCode } }));
  await json(await request.patch(`${API}/me`, { headers: bearer(token), data: { name } }));
  return { token, phone, name };
}

/** Books a service for a customer at the first free slot (through the API, for test setup). */
export async function createBooking(
  request: APIRequestContext,
  token: string,
  serviceSlug: string,
  opts: { city?: string; at?: { date: string; time: string } } = {},
) {
  const city = opts.city ?? 'chennai';
  const { service } = await json<{ service: { id: string; category: { slug: string } } }>(await request.get(`${API}/catalog/services/${serviceSlug}?city=${city}`));
  const { addressId } = await json<{ addressId: string }>(
    await request.post(`${API}/me/addresses`, { headers: bearer(token), data: { label: 'Home', line1: '7, E2E Residency', line2: 'Test Nagar', city, pincode: '600042' } }),
  );
  const { days } = await json<{ days: { date: string; slots: { time: string; available: boolean }[] }[] }>(
    await request.get(`${API}/slots?city=${city}&category=${service.category.slug}`),
  );
  // Use the latest free slot so tests don't fill up the slots customers see first.
  const slot =
    opts.at ??
    [...days]
      .reverse()
      .flatMap((d) => [...d.slots].reverse().map((s) => ({ ...s, date: d.date })))
      .find((s) => s.available);
  if (!slot) throw new Error('No free slot');
  const { booking } = await json<{ booking: { id: string; code: string; slot: { date: string; time: string } } }>(
    await request.post(`${API}/bookings`, {
      headers: bearer(token),
      data: { city, items: [{ serviceId: service.id, qty: 1 }], addressId, date: slot.date, time: slot.time },
    }),
  );
  return booking;
}

export async function bookingAsAdmin(request: APIRequestContext, id: string) {
  const token = await adminToken(request);
  return (await json<{ booking: { status: string; professional: { name: string; phone: string } | null } }>(await request.get(`${API}/admin/bookings/${id}`, { headers: bearer(token) }))).booking;
}

/** Signs the customer in on the web app by seeding their token before the app loads. */
export async function useCustomerSession(page: Page, token: string) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('sevai:token', JSON.stringify(t));
    } catch {
      /* ignore */
    }
  }, token);
}

/** Completes the OTP sign-in sheet in the web app (reads the code shown in test mode). */
export async function signInWithOtp(page: Page, phone: string, name: string) {
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Get OTP' }).click();
  const code = await page.getByTestId('dev-code').locator('strong').innerText();
  expect(code).toMatch(/^\d{6}$/);
  await page.getByLabel('One-time code').fill(code);
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

/** Clicks something in the admin and waits until the API has saved the change. */
export async function clickAndSave(page: Page, target: { click: () => Promise<void> }, urlPart: string) {
  await Promise.all([
    page.waitForResponse((r) => r.url().includes(urlPart) && ['PATCH', 'POST'].includes(r.request().method()) && r.ok()),
    target.click(),
  ]);
}

export async function adminSignIn(page: Page) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByRole('button', { name: 'Team' }).click();
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}

/** Collects elements whose computed background uses a gradient (the brand rule is: solid colours only). */
export async function findGradients(page: Page) {
  return page.evaluate(() => {
    const hits: string[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      for (const pseudo of [null, '::before', '::after']) {
        const bg = getComputedStyle(el, pseudo).backgroundImage;
        if (bg && bg.includes('gradient')) hits.push(`${el.tagName.toLowerCase()}.${(el as HTMLElement).className}${pseudo ?? ''}`);
      }
    }
    return hits;
  });
}

/** Removes banners with this title (keeps the seeded four for other tests). */
export async function deleteBannersTitled(request: APIRequestContext, title: string) {
  const token = await adminToken(request);
  const { banners } = await json<{ banners: { id: string; title: string }[] }>(await request.get(`${API}/admin/banners`, { headers: bearer(token) }));
  for (const b of banners.filter((x) => x.title === title)) {
    await json(await request.delete(`${API}/admin/banners/${b.id}`, { headers: bearer(token) }));
  }
}
