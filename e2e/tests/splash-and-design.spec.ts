import { adminSignIn, ADMIN_URL, expect, findGradients, test } from './fixtures';

test.describe('splash screen', () => {
  test.use({ skipSplash: false });

  test('plays on the first visit, then reveals the app', async ({ page }) => {
    await page.goto('/');
    const splash = page.locator('#splash');
    await expect(splash).toBeVisible();
    // Genie Sevai brand: lamp emblem (spins in on a 3D axis, smoke draws the roof) + wordmark
    await expect(splash.locator('.sp-word')).toContainText('Genie');
    await expect(splash.locator('.sp-word .sp-s')).toHaveText('Sevai');
    await expect(splash.locator('.sp-emblem svg')).toBeVisible();
    await expect(splash.locator('.sp-emblem .sp-lamp')).toHaveCount(1);
    await expect(splash.locator('.sp-emblem .sp-smoke')).toHaveCount(2);
    const anim = await splash.locator('.sp-emblem').evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe('sp-flip');
    // The splash animates out and is removed from the page.
    await expect(splash).toHaveCount(0, { timeout: 6000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Home services');
  });

  test('is skipped on later page loads in the same session', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#splash')).toHaveCount(0, { timeout: 6000 });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/no-splash/);
    await expect(page.locator('#splash')).toHaveCount(0);
  });

  test('can be skipped with a tap', async ({ page }) => {
    // Freeze page timers so the automatic exit can't happen first; only the tap can start it.
    await page.clock.install();
    await page.goto('/');
    const splash = page.locator('#splash');
    await expect(splash).toBeVisible();
    await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
    await expect(splash).not.toHaveClass(/exit/);
    await splash.click({ position: { x: 20, y: 20 } });
    await expect(splash).toHaveClass(/exit/);
    await page.clock.runFor(1200);
    await expect(splash).toHaveCount(0);
  });
});

test.describe('brand rules', () => {
  test('the customer app uses no gradient colours', async ({ page }) => {
    for (const path of ['/', '/c/cleaning', '/explore', '/help', '/pro']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await findGradients(page), `gradients on ${path}`).toEqual([]);
    }
  });

  test('the admin panel uses no gradient colours', async ({ page }) => {
    await adminSignIn(page);
    for (const path of ['/', '/services', '/bookings', '/professionals']) {
      await page.goto(`${ADMIN_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(await findGradients(page), `gradients on admin ${path}`).toEqual([]);
    }
  });

  test('home: category grid, offer banners and promises', async ({ page }) => {
    await page.goto('/');
    // Header: next free slot (live from the API) + where we serve + search
    await expect(page.getByTestId('city-pill')).toContainText('Chennai');
    await expect(page.getByTestId('city-pill')).toContainText(/Next slot \d{1,2}(:\d{2})? (AM|PM)/);
    await expect(page.getByRole('button', { name: 'Search services' })).toBeVisible();

    // "What do you need help with?" grid
    const grid = page.getByTestId('category-grid');
    await expect(page.getByText('What do you need help with?')).toBeVisible();
    await expect(grid.getByTestId('category-tile')).toHaveCount(10);
    await expect(grid.locator('[data-slug=cleaning]')).toContainText('from ₹499');

    // Offer banners: two service banners (with live prices) and the two public coupons
    const slides = page.getByTestId('promo-slide');
    await expect(slides).toHaveCount(4);
    await expect(slides.nth(0)).toHaveClass(/is-active/);
    await expect(slides.nth(0)).toContainText('₹499');
    await page.getByRole('button', { name: 'Show offer 2' }).click();
    await expect(slides.nth(1)).toHaveClass(/is-active/);
    await expect(slides.nth(1)).toContainText('Flat ₹100 off');
    await expect(slides.nth(0)).toHaveClass(/is-prev/);

    // Our promises
    await expect(page.getByRole('heading', { name: 'Our promises' })).toBeVisible();
    await expect(page.locator('section[aria-labelledby=promise-title] li')).toHaveCount(4);

    // Category tiles carry illustrations; the first banner books its service
    await expect(grid.locator('[data-slug=cleaning] svg')).toHaveCount(1);
    await page.getByRole('button', { name: 'Show offer 1' }).click();
    await slides.nth(0).getByRole('link', { name: 'Book now' }).click();
    await expect(page).toHaveURL(/\/c\/cleaning\?s=bathroom-deep-cleaning/);
    await expect(page.getByRole('dialog', { name: 'Bathroom deep cleaning' })).toBeVisible();
  });

  test('home shelves: spotlight, most booked and category rows', async ({ page }) => {
    await page.goto('/');
    const spotlight = page.getByTestId('spotlight');
    await spotlight.scrollIntoViewIfNeeded();
    await expect(spotlight.getByTestId('spotlight-card')).toHaveCount(6);
    const mostBooked = page.getByTestId('most-booked');
    await mostBooked.scrollIntoViewIfNeeded();
    expect(await mostBooked.getByTestId('service-tile').count()).toBeGreaterThan(5);
    for (const name of ['Salon for Women', "Men's Grooming", 'Home Cleaning']) {
      const heading = page.getByRole('heading', { level: 2, name, exact: true });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
    }
    await page.getByRole('link', { name: 'See all' }).first().click();
    await expect(page).toHaveURL(/\/c\/salon-women$/);
  });

  test('an offer banner pre-applies its coupon', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('promo-slide')).toHaveCount(4);
    await page.getByRole('button', { name: 'Show offer 2' }).click();
    await expect(page.getByTestId('promo-slide').nth(1)).toHaveClass(/is-active/);
    await page.getByTestId('promo-slide').nth(1).getByRole('button', { name: 'Book now' }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await page.goto('/c/cleaning');
    await page.getByRole('button', { name: 'Add Bathroom deep cleaning' }).click();
    await page.getByTestId('cart-pill').click();
    await expect(page.getByText('WELCOME100 applied · you save ₹100')).toBeVisible();
    await expect(page.getByTestId('bill-total')).toHaveText('₹399');
  });
});
