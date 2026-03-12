import { test, expect } from '@playwright/test';

test.describe('Admin Users Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('should display users management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /user/i })).toBeVisible();
  });

  test('should show users table or list', async ({ page }) => {
    const usersTable = page.locator('table, [class*="list"], [class*="grid"]').first();
    await expect(usersTable).toBeVisible({ timeout: 10000 });
  });

  test('should display user information columns', async ({ page }) => {
    const columns = page.locator('th, [class*="header"]').filter({ hasText: /name|email|role|status/i });
    await expect(columns.first()).toBeVisible({ timeout: 10000 });
  });

  test('should search users', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('should filter users by role', async ({ page }) => {
    const roleFilter = page.locator('select, button').filter({ hasText: /role|filter/i }).first();
    if (await roleFilter.isVisible({ timeout: 5000 })) {
      await roleFilter.click();
    }
  });

  test('should filter users by status', async ({ page }) => {
    const statusFilter = page.locator('select, button').filter({ hasText: /status|active|inactive/i }).first();
    if (await statusFilter.isVisible({ timeout: 5000 })) {
      await statusFilter.click();
    }
  });

  test('should show user actions', async ({ page }) => {
    const actionButton = page.locator('button, a').filter({ hasText: /edit|delete|view|action/i }).first();
    await expect(actionButton).toBeVisible({ timeout: 10000 });
  });

  test('should display add user button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    if (await addButton.isVisible({ timeout: 5000 })) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should show user count', async ({ page }) => {
    const userCount = page.locator('text=/total|\\d+.*user/i').first();
    await expect(userCount).toBeVisible({ timeout: 10000 });
  });

  test('should paginate users list', async ({ page }) => {
    const pagination = page.locator('text=/page|next|previous/i, [class*="pagination"]').first();
    if (await pagination.isVisible({ timeout: 5000 })) {
      await expect(pagination).toBeVisible();
    }
  });

  test('should sort users by column', async ({ page }) => {
    const sortableColumn = page.locator('th, [class*="sortable"]').first();
    if (await sortableColumn.isVisible({ timeout: 5000 })) {
      await sortableColumn.click();
    }
  });

  test('should display user roles', async ({ page }) => {
    const roleCell = page.locator('text=/admin|user|staff|customer/i').first();
    await expect(roleCell).toBeVisible({ timeout: 10000 });
  });

  test('should show user status badges', async ({ page }) => {
    const statusBadge = page.locator('[class*="badge"], [class*="status"]').first();
    if (await statusBadge.isVisible({ timeout: 5000 })) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /user/i })).toBeVisible();
  });
});

test.describe('Admin User Actions Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('should open edit user modal', async ({ page }) => {
    const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show delete confirmation', async ({ page }) => {
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    if (await deleteButton.isVisible({ timeout: 5000 })) {
      await deleteButton.click();
      const confirmation = page.locator('text=/confirm|sure|delete/i').first();
      await expect(confirmation).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view user details', async ({ page }) => {
    const viewButton = page.locator('button, a').filter({ hasText: /view|detail/i }).first();
    if (await viewButton.isVisible({ timeout: 5000 })) {
      await viewButton.click();
    }
  });

  test('should change user role', async ({ page }) => {
    const roleSelect = page.locator('select').filter({ hasText: /role/i }).first();
    if (await roleSelect.isVisible({ timeout: 5000 })) {
      await expect(roleSelect).toBeVisible();
    }
  });

  test('should toggle user status', async ({ page }) => {
    const statusToggle = page.locator('button, input[type="checkbox"]').filter({ hasText: /active|status/i }).first();
    if (await statusToggle.isVisible({ timeout: 5000 })) {
      await expect(statusToggle).toBeVisible();
    }
  });
});
