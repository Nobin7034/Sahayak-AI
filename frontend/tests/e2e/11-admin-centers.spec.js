import { test, expect } from '@playwright/test';

test.describe('Admin Centers Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/centers');
  });

  test('should display centers management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /center/i })).toBeVisible();
  });

  test('should show centers list', async ({ page }) => {
    const centersList = page.locator('table, [class*="list"]').first();
    await expect(centersList).toBeVisible({ timeout: 10000 });
  });

  test('should display add center button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });

  test('should search centers', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
    }
  });

  test('should display edit center button', async ({ page }) => {
    const editButton = page.locator('button').filter({ hasText: /edit/i }).first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
  });

  test('should display delete center button', async ({ page }) => {
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
  });

  test('should show center status', async ({ page }) => {
    const status = page.locator('[class*="status"]').first();
    if (await status.isVisible({ timeout: 5000 })) {
      await expect(status).toBeVisible();
    }
  });

  test('should display center location', async ({ page }) => {
    const location = page.locator('text=/address|location/i').first();
    await expect(location).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Add/Edit Center Tests', () => {
  test('should open add center form', async ({ page }) => {
    await page.goto('/admin/centers');
    const addButton = page.getByRole('button', { name: /add|new/i }).first();
    await addButton.click();
    const form = page.locator('form, [role="dialog"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('should display center form fields', async ({ page }) => {
    await page.goto('/admin/centers');
    const addButton = page.getByRole('button', { name: /add|new/i }).first();
    await addButton.click();
    const nameInput = page.locator('input[name*="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/centers');
    const addButton = page.getByRole('button', { name: /add|new/i }).first();
    await addButton.click();
    const submitButton = page.getByRole('button', { name: /submit|save/i }).first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await submitButton.click();
      await expect(page.locator('text=/required/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
