import { createCustomer, expect, test, useCustomerSession } from './fixtures';

test.describe('phone layout', () => {
  test('uses a bottom dock instead of the desktop rail', async ({ page }) => {
    await page.goto('/');
    const dock = page.locator('nav[aria-label="Primary"]:visible');
    await expect(dock).toHaveCount(1);
    for (const label of ['Home', 'Explore', 'Bookings', 'Account']) {
      await expect(dock.getByRole('link', { name: label })).toBeVisible();
    }
    await dock.getByRole('link', { name: 'Explore' }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(dock.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });

  test('no page scrolls sideways', async ({ page, request }) => {
    const customer = await createCustomer(request, 'Phone Tester');
    await useCustomerSession(page, customer.token);
    for (const path of ['/', '/explore', '/c/cleaning', '/c/salon-women', '/cart', '/bookings', '/account', '/help', '/pro', '/terms']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });

  test('checkout fits the screen (date chips scroll inside their card)', async ({ page, request }) => {
    const customer = await createCustomer(request, 'Checkout Width');
    await useCustomerSession(page, customer.token);
    await page.goto('/c/cleaning');
    await page.getByRole('button', { name: 'Add Bathroom deep cleaning' }).click();
    await page.goto('/checkout');
    await expect(page.getByTestId('slot-picker')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const card = await page.getByTestId('slot-picker').boundingBox();
    expect(card!.x + card!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test('cart pill and sticky checkout bar', async ({ page }) => {
    await page.goto('/c/salon-women');
    await expect(page.getByRole('navigation', { name: 'Service groups' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Add Fruit cleanup' }).click();
    await page.getByRole('button', { name: 'Add one more Fruit cleanup' }).click();
    const pill = page.getByTestId('cart-pill');
    await expect(pill).toContainText('2 items · ₹1,198');
    await pill.click();
    const bar = page.getByTestId('mobile-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('₹1,198');
    await bar.getByRole('button', { name: 'Choose slot' }).click();
    await expect(page.getByLabel('Mobile number')).toBeVisible();
  });

  test('search opens full screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search services' }).click();
    await page.locator('#search-input').fill('fan');
    await expect(page.getByTestId('search-results')).toContainText('Ceiling fan installation');
    await page.getByRole('button', { name: 'Close search' }).click();
    await expect(page.locator('#search-input')).toHaveCount(0);
  });
});
