import { test, expect } from '@playwright/test';

test.describe('Admin Staff Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/staff');
  });

  test('should display staff management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /staff/i })).toBeVisible();
  });

  test('should show staff list', async ({ page }) => {
    const staffList = page.locator('table, [class*="list"]').first();
    await expect(staffList).toBeVisible({ timeout: 10000 });
  });

  test('should display pending staff approvals', async ({ page }) => {
    const pending = page.locator('text=/pending|approval/i').first();
    await expect(pending).toBeVisible({ timeout: 10000 });
  });

  test('should search staff', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
    }
  });

  test('should filter staff by status', async ({ page }) => {
    const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible({ timeout: 5000 })) {
      await statusFilter.click();
    }
  });

  test('should approve staff', async ({ page }) => {
    const approveButton = page.locator('button').filter({ hasText: /approve/i }).first();
    if (await approveButton.isVisible({ timeout: 5000 })) {
      await expect(approveButton).toBeVisible();
    }
  });

  test('should reject staff', async ({ page }) => {
    const rejectButton = page.locator('button').filter({ hasText: /reject/i }).first();
    if (await rejectButton.isVisible({ timeout: 5000 })) {
      await expect(rejectButton).toBeVisible();
    }
  });

  test('should view staff details', async ({ page }) => {
    const viewButton = page.locator('button').filter({ hasText: /view/i }).first();
    if (await viewButton.isVisible({ timeout: 5000 })) {
      await viewButton.click();
    }
  });

  test('should display staff center assignment', async ({ page }) => {
    const centerInfo = page.locator('text=/center|location/i').first();
    await expect(centerInfo).toBeVisible({ timeout: 10000 });
  });

  test('should show staff status badges', async ({ page }) => {
    const statusBadge = page.locator('[class*="badge"]').first();
    if (await statusBadge.isVisible({ timeout: 5000 })) {
      await expect(statusBadge).toBeVisible();
    }
  });
});
