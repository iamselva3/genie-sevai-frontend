import { expect, test } from './fixtures';

test.describe('browsing the catalogue', () => {
  test('home lists categories and popular services from the API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('category-tile')).toHaveCount(10);
    expect(await page.getByTestId('service-tile').count()).toBeGreaterThan(5);
    await page.getByTestId('category-tile').filter({ hasText: 'Home Cleaning' }).click();
    await expect(page).toHaveURL(/\/c\/cleaning$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home Cleaning');
  });

  test('category page shows groups, prices and unavailable services', async ({ page }) => {
    await page.goto('/c/cleaning');
    for (const g of ['Bathroom', 'Kitchen', 'Full home', 'Sofa & carpet']) {
      await expect(page.getByRole('heading', { name: g, level: 2 })).toBeVisible();
    }
    const sofa = page.locator('[data-testid=service-row][data-slug=sofa-shampooing-5-seats]');
    await expect(sofa).toHaveAttribute('data-bookable', 'false');
    await expect(sofa).toContainText('Machines are being serviced');
    await expect(sofa.getByRole('button', { name: /^Add / })).toHaveCount(0);

    const bath = page.locator('[data-testid=service-row][data-slug=bathroom-deep-cleaning]');
    await expect(bath).toContainText('₹499');
    await expect(bath.getByRole('button', { name: 'Add Bathroom deep cleaning' })).toBeVisible();
  });

  test('hidden services never appear', async ({ page }) => {
    await page.goto('/c/appliances');
    await expect(page.getByTestId('service-row').first()).toBeVisible();
    await expect(page.locator('[data-testid=service-row][data-slug=geyser-check-up]')).toHaveCount(0);
  });

  test('service details open in a sheet with a shareable link', async ({ page }) => {
    await page.goto('/c/cleaning');
    await page.locator('[data-testid=service-row][data-slug=kitchen-deep-cleaning]').getByRole('button', { name: 'View details' }).click();
    await expect(page).toHaveURL(/s=kitchen-deep-cleaning/);
    const sheet = page.getByRole('dialog', { name: 'Kitchen deep cleaning' });
    await expect(sheet).toContainText('What’s included');
    await sheet.getByRole('button', { name: 'Add Kitchen deep cleaning' }).click();
    await expect(sheet.getByRole('button', { name: 'Add one more Kitchen deep cleaning' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('cart-pill')).toContainText('1 item');
  });

  test('city choice changes availability', async ({ page }) => {
    await page.goto('/c/painting');
    const proofing = page.locator('[data-testid=service-row][data-slug=bathroom-waterproofing]');
    await expect(proofing).toHaveAttribute('data-bookable', 'true');

    await page.getByTestId('city-pill').click();
    await page.getByRole('dialog', { name: 'Where do you need us?' }).getByRole('button', { name: /Madurai/ }).click();
    await expect(page.getByTestId('city-pill')).toContainText('Madurai');
    await expect(proofing).toHaveAttribute('data-bookable', 'false');
    await expect(proofing).toContainText('Not available in Madurai yet');
  });

  test('search finds services and opens them', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await page.locator('#search-input').fill('tap');
    const results = page.getByTestId('search-results');
    await results.getByRole('button', { name: /Tap repair \/ replacement/ }).click();
    await expect(page).toHaveURL(/\/c\/plumbing\?s=tap-repair-replacement/);
    await expect(page.getByRole('dialog', { name: 'Tap repair / replacement' })).toBeVisible();
  });

  test('the cart keeps one category at a time', async ({ page }) => {
    await page.goto('/c/cleaning');
    await page.getByRole('button', { name: 'Add Bathroom deep cleaning' }).click();
    await page.goto('/c/plumbing');
    await page.getByRole('button', { name: 'Add Tap repair / replacement' }).click();
    const dialog = page.getByRole('dialog', { name: 'Start a new cart?' });
    await expect(dialog).toContainText('Home Cleaning');
    await dialog.getByRole('button', { name: 'Keep cart' }).click();
    await expect(page.getByTestId('cart-pill')).toContainText('Home Cleaning');

    await page.getByRole('button', { name: 'Add Tap repair / replacement' }).click();
    await page.getByRole('dialog', { name: 'Start a new cart?' }).getByRole('button', { name: 'Replace' }).click();
    await expect(page.getByTestId('cart-pill')).toContainText('Plumbing');
    await expect(page.getByTestId('cart-pill')).toContainText('1 item · ₹129');
  });

  test('unknown pages and categories are handled', async ({ page }) => {
    await page.goto('/nope');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Wrong door');
    await page.goto('/c/does-not-exist');
    await expect(page.getByText(/category isn.t available/)).toBeVisible();
  });
});
