import { createBooking, createCustomer, expect, signInWithOtp, test, uniquePhone, useCustomerSession } from './fixtures';

test.describe('customer booking flow', () => {
  test('books a service end to end: cart → coupon → OTP sign-in → address → slot → confirmed', async ({ page }) => {
    await page.goto('/c/cleaning');
    await page.getByRole('button', { name: 'Add Bathroom deep cleaning' }).click();
    await page.getByTestId('cart-pill').click();
    await expect(page).toHaveURL(/\/cart$/);

    // Bill comes from the server quote: ₹499, free visit
    await expect(page.getByTestId('bill-total')).toHaveText('₹499');
    await page.getByLabel('Coupon code').fill('WELCOME100');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('WELCOME100 applied · you save ₹100')).toBeVisible();
    await expect(page.getByTestId('bill-total')).toHaveText('₹399');

    // An invalid coupon is explained, not silently ignored
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await page.getByLabel('Coupon code').fill('GENIE20');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Add ₹500 more to use GENIE20' })).toBeVisible();
    await page.getByLabel('Coupon code').fill('WELCOME100');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByTestId('bill-total')).toHaveText('₹399');

    // Checkout asks for sign-in
    await page.getByRole('button', { name: /Choose address & slot/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Sign in to pick an address and time slot.');
    await page.getByLabel('Mobile number').fill('123');
    await page.getByRole('button', { name: 'Get OTP' }).click();
    await expect(page.getByText('Enter a valid 10-digit mobile number')).toBeVisible();
    await signInWithOtp(page, uniquePhone(), 'Asha Krishnan');
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByText('Booking for Asha Krishnan')).toBeVisible();

    // New customer: add an address (validation first)
    const form = page.getByTestId('address-form');
    await form.getByRole('button', { name: 'Save address' }).click();
    await expect(form.getByText('Enter a 6-digit pincode')).toBeVisible();
    await form.getByLabel('House / flat & building').fill('21, Marina Heights');
    await form.getByLabel('Street & area').fill('Beach Road, Besant Nagar');
    await form.getByLabel('Pincode').fill('600090');
    await form.getByRole('button', { name: 'Save address' }).click();
    await expect(page.getByRole('radio', { name: /Home 21, Marina Heights/ })).toHaveAttribute('aria-checked', 'true');

    // Pick the first free slot
    const slot = page.getByTestId('slot-picker').locator('button[data-time]:not([disabled])').first();
    await slot.click();
    await expect(slot).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('chosen-slot')).toBeVisible();

    await page.getByRole('button', { name: 'Place booking' }).click();
    await expect(page.getByTestId('booking-confirmed')).toContainText('Booking confirmed!');
    const code = (await page.getByTestId('booking-code').innerText()).trim();
    expect(code).toMatch(/^GS[A-Z0-9]{6}$/);
    await expect(page.getByTestId('status-track')).toContainText('Booking placed');
    await expect(page.getByTestId('bill-total')).toHaveText('₹399');

    // Cart is emptied, booking is listed
    await expect(page.getByTestId('cart-pill')).toHaveCount(0);
    await page.goto('/bookings');
    await expect(page.locator(`[data-testid=booking-card][data-code=${code}]`)).toContainText('Finding your pro');
  });

  test('reschedules and cancels a booking', async ({ page, request }) => {
    const customer = await createCustomer(request, 'Ravi Shankar');
    const booking = await createBooking(request, customer.token, 'tap-repair-replacement');
    await useCustomerSession(page, customer.token);
    await page.goto(`/bookings/${booking.id}`);
    await expect(page.getByTestId('booking-code')).toHaveText(booking.code);

    const before = await page.getByTestId('booking-slot').innerText();
    await page.getByRole('button', { name: 'Reschedule' }).click();
    const sheet = page.getByRole('dialog', { name: 'Pick a new time' });
    await sheet.getByTestId('slot-picker').locator('button[data-time]:not([disabled])').first().click();
    await sheet.getByRole('button', { name: /^Move to / }).click();
    await expect(page.getByText('Booking rescheduled')).toBeVisible();
    await expect(page.getByTestId('booking-slot')).not.toHaveText(before);
    await expect(page.getByTestId('status-track')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel booking' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancel this booking?' });
    await dialog.getByLabel('Need a different time').check();
    await dialog.getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cancelled');
    await expect(page.getByText('Need a different time')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0);

    await page.goto('/bookings');
    await page.getByRole('tab', { name: /Past/ }).click();
    await expect(page.locator(`[data-testid=booking-card][data-code=${booking.code}]`)).toContainText('Cancelled');
  });

  test('account: profile and addresses', async ({ page, request }) => {
    const customer = await createCustomer(request, 'Meera Iyer');
    await useCustomerSession(page, customer.token);
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meera Iyer');
    await page.getByLabel('Email (for receipts)').fill('meera@example.com');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile saved')).toBeVisible();

    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByLabel('House / flat & building').fill('4, Palm Grove');
    await page.getByLabel('Pincode').fill('641001');
    await page.getByLabel('City', { exact: true }).selectOption('coimbatore');
    await page.getByRole('button', { name: 'Save address' }).click();
    await expect(page.getByText('4, Palm Grove, 641001')).toBeVisible();

    await page.getByRole('button', { name: 'Remove Home address' }).click();
    await page.getByRole('dialog', { name: 'Remove this address?' }).getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('4, Palm Grove, 641001')).toHaveCount(0);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByRole('dialog', { name: 'Sign out?' }).getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('button', { name: 'Sign in with OTP' })).toBeVisible();
  });

  test('help desk and professional application forms', async ({ page }) => {
    await page.goto('/help');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Tell us your name')).toBeVisible();
    await page.getByLabel('Your name').fill('Kavin');
    await page.getByLabel('Mobile number').fill(uniquePhone());
    await page.getByLabel('Message').fill('The plumber left without fixing the leak.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Message sent')).toBeVisible();

    await page.goto('/pro');
    await page.getByLabel('Full name').fill('Selvam K');
    await page.getByLabel('Mobile number').fill(uniquePhone());
    await page.getByRole('button', { name: 'Send application' }).click();
    await expect(page.getByText('Pick at least one skill')).toBeVisible();
    await page.getByRole('button', { name: 'Plumbing' }).click();
    await page.getByRole('button', { name: 'Send application' }).click();
    await expect(page.getByText('Application received')).toBeVisible();
  });
});
