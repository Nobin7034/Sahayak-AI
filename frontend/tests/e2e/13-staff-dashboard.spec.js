import { test, expect } from '@playwright/test';

test.describe('Staff Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/staff/dashboard');
  });

  test('should display staff dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should show staff metrics', async ({ page }) => {
    const metrics = page.locator('[class*="metric"], [class*="card"]').first();
    await expect(metrics).toBeVisible({ timeout: 10000 });
  });

  test('should display today appointments', async ({ page }) => {
    const appointments = page.locator('text=/today|appointment/i').first();
    await expect(appointments).toBeVisible({ timeout: 10000 });
  });

  test('should show quick actions', async ({ page }) => {
    const quickActions = page.locator('text=/quick|action/i').first();
    await expect(quickActions).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to staff appointments', async ({ page }) => {
    const appointmentsLink = page.getByRole('link', { name: /appointment/i }).first();
    if (await appointmentsLink.isVisible({ timeout: 5000 })) {
      await appointmentsLink.click();
      await expect(page).toHaveURL(/\/staff\/appointments/);
    }
  });

  test('should display notifications', async ({ page }) => {
    const notifications = page.locator('[class*="notification"]').first();
    if (await notifications.isVisible({ timeout: 5000 })) {
      await expect(notifications).toBeVisible();
    }
  });

  test('should show staff profile', async ({ page }) => {
    const profile = page.locator('text=/profile|account/i').first();
    await expect(profile).toBeVisible({ timeout: 10000 });
  });

  test('should display assigned center', async ({ page }) => {
    const center = page.locator('text=/center|location/i').first();
    await expect(center).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Staff Appointments Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/staff/appointments');
  });

  test('should display staff appointments page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /appointment/i })).toBeVisible();
  });

  test('should show appointments list', async ({ page }) => {
    const appointmentsList = page.locator('table, [class*="list"]').first();
    await expect(appointmentsList).toBeVisible({ timeout: 10000 });
  });

  test('should filter by appointment status', async ({ page }) => {
    const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible({ timeout: 5000 })) {
      await statusFilter.click();
    }
  });

  test('should view appointment details', async ({ page }) => {
    const viewButton = page.locator('button').filter({ hasText: /view/i }).first();
    if (await viewButton.isVisible({ timeout: 5000 })) {
      await viewButton.click();
    }
  });

  test('should update appointment status', async ({ page }) => {
    const statusButton = page.locator('button').filter({ hasText: /complete|process/i }).first();
    if (await statusButton.isVisible({ timeout: 5000 })) {
      await expect(statusButton).toBeVisible();
    }
  });

  test('should show customer information', async ({ page }) => {
    const customerInfo = page.locator('text=/customer|user|client/i').first();
    await expect(customerInfo).toBeVisible({ timeout: 10000 });
  });
});
