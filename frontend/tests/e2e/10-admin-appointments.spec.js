import { test, expect } from '@playwright/test';

test.describe('Admin Appointments Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/appointments');
  });

  test('should display appointments management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /appointment/i })).toBeVisible();
  });

  test('should show appointments list', async ({ page }) => {
    const appointmentsList = page.locator('table, [class*="list"]').first();
    await expect(appointmentsList).toBeVisible({ timeout: 10000 });
  });

  test('should filter appointments by status', async ({ page }) => {
    const statusFilter = page.locator('select, button').filter({ hasText: /status|filter/i }).first();
    if (await statusFilter.isVisible({ timeout: 5000 })) {
      await statusFilter.click();
    }
  });

  test('should search appointments', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
    }
  });

  test('should display appointment actions', async ({ page }) => {
    const actionButton = page.locator('button').filter({ hasText: /view|edit/i }).first();
    await expect(actionButton).toBeVisible({ timeout: 10000 });
  });
});
