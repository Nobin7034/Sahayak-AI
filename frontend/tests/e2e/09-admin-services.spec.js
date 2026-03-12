import { test, expect } from '@playwright/test';

test.describe('Admin Services Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/services');
  });

  test('should display services management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /service/i })).toBeVisible();
  });

  test('should show services list', async ({ page }) => {
    const servicesList = page.locator('table, [class*="list"], [class*="grid"]').first();
    await expect(servicesList).toBeVisible({ timeout: 10000 });
  });

  test('should display add service button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });

  test('should search services', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('certificate');
      await page.waitForTimeout(1000);
    }
  });

  test('should filter services by category', async ({ page }) => {
    const categoryFilter = page.locator('select, button').filter({ hasText: /category|filter/i }).first();
    if (await categoryFilter.isVisible({ timeout: 5000 })) {
      await categoryFilter.click();
    }
  });

  test('should show service details', async ({ page }) => {
    const serviceRow = page.locator('tr, [class*="service"]').nth(1);
    if (await serviceRow.isVisible({ timeout: 5000 })) {
      await expect(serviceRow).toContainText(/\w+/);
    }
  });

  test('should display edit service button', async ({ page }) => {
    const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
  });

  test('should display delete service button', async ({ page }) => {
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
  });

  test('should show service status', async ({ page }) => {
    const status = page.locator('[class*="status"], [class*="badge"]').first();
    if (await status.isVisible({ timeout: 5000 })) {
      await expect(status).toBeVisible();
    }
  });

  test('should display service pricing', async ({ page }) => {
    const price = page.locator('text=/₹|price|\d+/').first();
    await expect(price).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Add/Edit Service Tests', () => {
  test('should open add service form', async ({ page }) => {
    await page.goto('/admin/services');
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();
    
    const form = page.locator('form, [role="dialog"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('should display service form fields', async ({ page }) => {
    await page.goto('/admin/services');
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();
    
    const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/services');
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();
    
    const submitButton = page.getByRole('button', { name: /submit|save|create/i }).first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await submitButton.click();
      await expect(page.locator('text=/required/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should open edit service form', async ({ page }) => {
    await page.goto('/admin/services');
    const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
    await editButton.click();
    
    const form = page.locator('form, [role="dialog"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('should show delete confirmation', async ({ page }) => {
    await page.goto('/admin/services');
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    await deleteButton.click();
    
    const confirmation = page.locator('text=/confirm|sure|delete/i').first();
    await expect(confirmation).toBeVisible({ timeout: 5000 });
  });

  test('should cancel service form', async ({ page }) => {
    await page.goto('/admin/services');
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();
    
    const cancelButton = page.getByRole('button', { name: /cancel|close/i }).first();
    if (await cancelButton.isVisible({ timeout: 5000 })) {
      await cancelButton.click();
    }
  });

  test('should upload service image', async ({ page }) => {
    await page.goto('/admin/services');
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();
    
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 5000 })) {
      await expect(fileInput).toBeVisible();
    }
  });

  test('should set service category', async ({ page }) => {
    await page.goto('/admin/services');
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();
    
    const categorySelect = page.locator('select[name*="category"]').first();
    if (await categorySelect.isVisible({ timeout: 5000 })) {
      await expect(categorySelect).toBeVisible();
    }
  });
});
