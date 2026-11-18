import { adminSignIn, ADMIN_URL, deleteBannersTitled, expect, test } from './fixtures';

const TITLE = 'Monsoon pest shield';

/** A real, colourful photo-like picture (rendered and screenshotted), so the admin's resize step runs for real. */
async function makePicture(browser: import('@playwright/test').Browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 500 } });
  await page.setContent(`
    <body style="margin:0;display:grid;grid-template-columns:repeat(6,1fr);height:500px">
      ${['#0f766e', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#22c55e'].map((c) => `<div style="background:${c}"></div>`).join('')}
    </body>`);
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return png;
}

test.describe('banners managed in the admin panel', () => {
  test.afterEach(async ({ request }) => {
    await deleteBannersTitled(request, TITLE);
  });

  test('the team uploads a photo banner, customers see it, switching it off hides it', async ({ page, browser }) => {
    const picture = await makePicture(browser);

    // Admin: create a split banner with a photo that opens the Pest Control category
    await adminSignIn(page);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Banners' }).click();
    await expect(page.getByRole('heading', { name: 'Banners' })).toBeVisible();
    await expect(page.getByTestId('banner-row')).toHaveCount(4);
    await page.getByRole('button', { name: 'New banner' }).click();

    const form = page.getByRole('dialog', { name: 'New banner' });
    await form.locator('#banner-photo').setInputFiles({ name: 'monsoon.png', mimeType: 'image/png', buffer: picture });
    await expect(form.getByTestId('banner-photo-drop')).toHaveAttribute('data-state', 'done', { timeout: 15_000 });
    await form.getByLabel('Eyebrow').fill('Before the rains');
    await form.locator('#banner-title').fill(TITLE);
    await form.getByLabel('Subtitle').fill('Odourless treatment, safe for kids and pets.');
    await form.getByRole('button', { name: 'Teal' }).click();
    await form.getByRole('radio', { name: 'Light' }).check();
    await form.locator('#banner-action').selectOption('category');
    await form.getByLabel('Category').selectOption('pest-control');
    await expect(form.getByTestId('banner-live-preview')).toContainText(TITLE);

    const saved = page.waitForResponse((r) => r.url().endsWith('/admin/banners') && r.request().method() === 'POST');
    await form.getByRole('button', { name: 'Save banner' }).click();
    expect((await saved).status()).toBe(201);
    const row = page.locator(`[data-testid=banner-row][data-title="${TITLE}"]`);
    await expect(row.getByTestId('banner-status')).toHaveAttribute('data-status', 'active');
    await expect(row.getByTestId('banner-action')).toContainText('pest-control');

    // Customer: the new banner is the fifth slide, shows the uploaded photo and opens the category
    await page.goto('/');
    const slides = page.getByTestId('promo-slide');
    await expect(slides).toHaveCount(5);
    await page.getByRole('button', { name: 'Show offer 5' }).click();
    const slide = slides.nth(4);
    await expect(slide).toHaveClass(/is-active/);
    await expect(slide).toContainText(TITLE);
    await expect(slide).toContainText('Before the rains');
    const photo = slide.locator('img');
    await expect(photo).toHaveAttribute('src', /\/uploads\/[a-f0-9]{24}\.(webp|jpg)$/);
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
    expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeLessThanOrEqual(1600);
    await expect(slide).toHaveCSS('background-color', 'rgb(15, 118, 110)');
    await slide.getByRole('link', { name: 'Book now' }).click();
    await expect(page).toHaveURL(/\/c\/pest-control$/);

    // Admin: switch it off; customers are back to the four seeded banners
    await page.goto(`${ADMIN_URL}/banners`);
    const off = page.waitForResponse((r) => r.url().includes('/admin/banners/') && r.request().method() === 'PATCH');
    await row.getByRole('switch', { name: `${TITLE} active` }).click();
    expect((await off).ok()).toBe(true);
    await expect(row.getByTestId('banner-status')).toHaveAttribute('data-status', 'off');
    await page.goto('/');
    await expect(page.getByTestId('promo-slide')).toHaveCount(4);
    await expect(page.getByText(TITLE)).toHaveCount(0);
  });

  test('banner order set in the admin panel is the order customers see', async ({ page }) => {
    await adminSignIn(page);
    await page.goto(`${ADMIN_URL}/banners`);
    const rows = page.getByTestId('banner-row');
    await expect(rows).toHaveCount(4);
    const first = (await rows.nth(0).getAttribute('data-title'))!;
    const second = (await rows.nth(1).getAttribute('data-title'))!;
    try {
      const saved = page.waitForResponse((r) => r.url().endsWith('/admin/banners/reorder'));
      await page.getByRole('button', { name: `Move ${first} down` }).click();
      expect((await saved).ok()).toBe(true);
      await expect(rows.nth(0)).toHaveAttribute('data-title', second);

      await page.goto('/');
      const slides = page.getByTestId('promo-slide');
      await expect(slides.nth(0)).toContainText(second);
      await page.getByRole('button', { name: 'Show offer 2' }).click();
      await expect(slides.nth(1)).toContainText(first);
    } finally {
      // put the seeded order back for the other tests
      await page.goto(`${ADMIN_URL}/banners`);
      const restored = page.waitForResponse((r) => r.url().endsWith('/admin/banners/reorder'));
      await page.getByRole('button', { name: `Move ${first} up` }).click();
      expect((await restored).ok()).toBe(true);
      await expect(rows.nth(0)).toHaveAttribute('data-title', first);
    }
  });
});
