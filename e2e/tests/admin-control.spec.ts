import { adminSignIn, ADMIN_URL, clickAndSave, expect, setCategoryVisible, setServiceStatus, test } from './fixtures';

test.describe('admin controls what customers see', () => {
  test('rejects a wrong password with an inline error', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.getByLabel('Email').fill('admin@sevai.in');
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Wrong email or password');
  });

  test('service status: Live → Unavailable → Hidden → Live', async ({ page, request }) => {
    const slug = 'carpet-shampooing-up-to-50-sq-ft';
    try {
      await adminSignIn(page);
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Services' }).click();
      const row = page.locator(`[data-testid=service-row][data-slug=${slug}]`);
      await expect(row).toHaveAttribute('data-status', 'active');

      // Unavailable, with a reason
      await row.getByRole('button', { name: 'Unavailable' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Reason').fill('Back on Monday');
      await clickAndSave(page, dialog.getByRole('button', { name: 'Confirm' }), '/status');
      await expect(row).toHaveAttribute('data-status', 'unavailable');

      await page.goto('/c/cleaning');
      const customerRow = page.locator(`[data-testid=service-row][data-slug=${slug}]`);
      await expect(customerRow).toHaveAttribute('data-bookable', 'false');
      await expect(customerRow).toContainText('Back on Monday');
      await expect(customerRow.getByRole('button', { name: /^Add / })).toHaveCount(0);

      // Hidden
      await page.goto(`${ADMIN_URL}/services`);
      await clickAndSave(page, row.getByRole('button', { name: 'Hidden' }), '/status');
      await expect(row).toHaveAttribute('data-status', 'hidden');
      await page.goto('/c/cleaning');
      await expect(page.getByTestId('service-row').first()).toBeVisible();
      await expect(customerRow).toHaveCount(0);

      // Live again
      await page.goto(`${ADMIN_URL}/services`);
      await clickAndSave(page, row.getByRole('button', { name: 'Live' }), '/status');
      await expect(row).toHaveAttribute('data-status', 'active');
      await page.goto('/c/cleaning');
      await expect(customerRow.getByRole('button', { name: /^Add Carpet shampooing/ })).toBeVisible();
    } finally {
      await setServiceStatus(request, slug, 'active', '');
    }
  });

  test('category visibility switch hides a whole category', async ({ page, request }) => {
    try {
      await adminSignIn(page);
      await page.goto(`${ADMIN_URL}/categories`);
      const toggle = page.locator('[data-testid=category-row][data-slug=pest-control]').getByRole('switch', { name: 'Visible on site' });
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await clickAndSave(page, toggle, '/admin/categories/');
      await expect(toggle).toHaveAttribute('aria-checked', 'false');

      await page.goto('/');
      await expect(page.getByTestId('category-tile')).toHaveCount(9);
      await expect(page.locator('[data-testid=category-tile][data-slug=pest-control]')).toHaveCount(0);
      await page.goto('/c/pest-control');
      await expect(page.getByText(/category isn.t available/)).toBeVisible();

      await page.goto(`${ADMIN_URL}/categories`);
      await clickAndSave(page, toggle, '/admin/categories/');
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await page.goto('/');
      await expect(page.locator('[data-testid=category-tile][data-slug=pest-control]')).toBeVisible();
    } finally {
      await setCategoryVisible(request, 'pest-control', true);
    }
  });
});
