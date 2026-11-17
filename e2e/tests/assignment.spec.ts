import { adminSignIn, ADMIN_URL, bookingAsAdmin, createBooking, createCustomer, expect, PRO_PASSWORD, test, useCustomerSession, WEB_URL } from './fixtures';

test('operations: admin assigns a professional, pro runs the job with the PIN, customer rates it', async ({ page, browser, request }) => {
  // A customer has booked a ceiling fan installation in Chennai
  const customer = await createCustomer(request, 'Nisha Raman');
  const booking = await createBooking(request, customer.token, 'ceiling-fan-installation');

  // 1. Admin finds the booking and assigns an available electrician
  await adminSignIn(page);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Bookings' }).click();
  await page.getByLabel('Search').fill(booking.code);
  const row = page.locator(`[data-testid=booking-row][data-code=${booking.code}]`);
  await row.click();
  await expect(page.getByTestId('booking-status')).toHaveAttribute('data-status', 'pending');

  await page.getByRole('button', { name: 'Assign professional' }).first().click();
  const option = page.locator('[data-testid=pro-option][data-available=true]').first();
  const proName = await option.getAttribute('data-name');
  expect(proName).toBeTruthy();
  await option.getByRole('button', { name: 'Assign' }).click();
  await expect(page.getByTestId('booking-status')).toHaveAttribute('data-status', 'assigned');
  await expect(page.getByTestId('assigned-pro')).toContainText(proName!);

  const assigned = await bookingAsAdmin(request, booking.id);
  expect(assigned.professional?.name).toBe(proName);
  const proPhone = assigned.professional!.phone;

  // 2. Customer sees the professional and their service PIN
  const customerCtx = await browser.newContext({ baseURL: WEB_URL });
  const customerPage = await customerCtx.newPage();
  await customerPage.addInitScript(() => sessionStorage.setItem('sevai:splash', '1'));
  await useCustomerSession(customerPage, customer.token);
  await customerPage.goto(`/bookings/${booking.id}`);
  await expect(customerPage.getByRole('heading', { level: 1 })).toHaveText('Pro assigned');
  await expect(customerPage.getByTestId('pro-card')).toContainText(proName!);
  const pin = await customerPage.getByTestId('service-pin').getAttribute('data-pin');
  expect(pin).toMatch(/^\d{4}$/);

  // 3. The professional signs in to the portal and works the job
  const proCtx = await browser.newContext();
  const pro = await proCtx.newPage();
  await pro.goto(`${ADMIN_URL}/login`);
  await pro.getByRole('button', { name: 'Professional' }).click();
  await pro.getByLabel('Phone number').fill(proPhone);
  await pro.getByLabel('Password').fill(PRO_PASSWORD);
  await pro.getByRole('button', { name: 'Sign in' }).click();
  const card = pro.locator(`[data-testid=job-card][data-code=${booking.code}]`);
  await expect(card).toHaveAttribute('data-status', 'assigned');
  await expect(card).toContainText('Nisha Raman');

  await card.getByRole('button', { name: 'On the way' }).click();
  await expect(card).toHaveAttribute('data-status', 'on_the_way');

  await card.getByRole('button', { name: 'Start job' }).click();
  const startDialog = pro.getByRole('dialog', { name: 'Start job' });
  await startDialog.getByLabel('Service PIN').fill(pin === '0000' ? '1111' : '0000');
  await startDialog.getByRole('button', { name: 'Start job' }).click();
  await expect(startDialog).toContainText('PIN is not right');
  await startDialog.getByLabel('Service PIN').fill(pin!);
  await startDialog.getByRole('button', { name: 'Start job' }).click();
  await expect(card).toHaveAttribute('data-status', 'in_progress');

  // Customer's status track follows along
  await customerPage.reload();
  await expect(customerPage.getByRole('heading', { level: 1 })).toHaveText('Job in progress');
  await expect(customerPage.getByTestId('service-pin')).toHaveCount(0);

  await card.getByRole('button', { name: 'Mark completed' }).click();
  await pro.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
  await expect(card).toHaveCount(0);
  await pro.getByRole('button', { name: 'History' }).click();
  await expect(pro.locator(`[data-testid=job-card][data-code=${booking.code}]`)).toHaveAttribute('data-status', 'completed');

  // 4. Customer rates the job
  await customerPage.reload();
  await expect(customerPage.getByRole('heading', { level: 1 })).toHaveText('Completed');
  await customerPage.getByRole('button', { name: 'Rate 5 stars' }).click();
  await customerPage.getByLabel('Anything to add? (optional)').fill('Neat wiring, very quick.');
  await customerPage.getByRole('button', { name: 'Submit rating' }).click();
  await expect(customerPage.getByRole('region', { name: 'Your review' })).toContainText('Neat wiring, very quick.');

  // 5. Admin sees the completed booking and the review
  await page.goto(`${ADMIN_URL}/bookings/${booking.id}`);
  await expect(page.getByTestId('booking-status')).toHaveAttribute('data-status', 'completed');
  await page.goto(`${ADMIN_URL}/reviews`);
  await expect(page.getByText('Neat wiring, very quick.')).toBeVisible();

  await customerCtx.close();
  await proCtx.close();
});

test('a professional busy in a slot cannot be assigned to a second job at the same time', async ({ page, request }) => {
  // Two customers book carpentry in Chennai for the exact same slot
  const a = await createCustomer(request, 'Customer A');
  const b = await createCustomer(request, 'Customer B');
  const first = await createBooking(request, a.token, 'door-hinge-repair');
  const second = await createBooking(request, b.token, 'door-hinge-repair', { at: first.slot });
  expect(second.slot).toEqual(first.slot);

  await adminSignIn(page);
  await page.goto(`${ADMIN_URL}/bookings/${first.id}`);
  await page.getByRole('button', { name: 'Assign professional' }).first().click();
  const pick = page.locator('[data-testid=pro-option][data-available=true]').first();
  const name = (await pick.getAttribute('data-name'))!;
  await pick.getByRole('button', { name: 'Assign' }).click();
  await expect(page.getByTestId('booking-status')).toHaveAttribute('data-status', 'assigned');

  await page.goto(`${ADMIN_URL}/bookings/${second.id}`);
  await expect(page.getByTestId('booking-status')).toHaveAttribute('data-status', 'pending');
  await page.getByRole('button', { name: 'Assign professional' }).first().click();
  const busy = page.locator(`[data-testid=pro-option][data-name="${name}"]`);
  await expect(busy).toHaveAttribute('data-available', 'false');
  await expect(busy).toContainText(`Busy with ${first.code}`);
  await expect(busy.getByRole('button', { name: 'Assign' })).toBeDisabled();

  // Another professional is still free and can take it
  const other = page.locator('[data-testid=pro-option][data-available=true]').first();
  await other.getByRole('button', { name: 'Assign' }).click();
  await expect(page.getByTestId('booking-status')).toHaveAttribute('data-status', 'assigned');
  const assigned = await bookingAsAdmin(request, second.id);
  expect(assigned.professional?.name).not.toBe(name);
});
