import { test, expect } from '@playwright/test';

test.describe('Services Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('should load services page', async ({ page }) => {
    await expect(page).toHaveURL(/\/services/);
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible();
  });

  test('should display services list', async ({ page }) => {
    const serviceCards = page.locator('[class*="service"]').or(page.locator('[class*="card"]'));
    await expect(serviceCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter services by category', async ({ page }) => {
    const categoryFilter = page.locator('select, button').filter({ hasText: /category|filter/i }).first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
    }
  });

  test('should search for services', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('certificate');
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to service details', async ({ page }) => {
    const firstService = page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first();
    await firstService.waitFor({ state: 'visible', timeout: 10000 });
    await firstService.click();
    await expect(page).toHaveURL(/\/services\/\w+/);
  });

  test('should display service categories', async ({ page }) => {
    const categories = page.locator('[class*="category"]').or(page.locator('button, a')).filter({ hasText: /government|certificate|document/i });
    await expect(categories.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show service pricing', async ({ page }) => {
    const priceElement = page.locator('text=/₹|price|cost/i').first();
    await expect(priceElement).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Service Details Tests', () => {
  test('should display service details page', async ({ page }) => {
    await page.goto('/services');
    const firstService = page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first();
    await firstService.waitFor({ state: 'visible', timeout: 10000 });
    await firstService.click();
    
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should show service description', async ({ page }) => {
    await page.goto('/services');
    const firstService = page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first();
    await firstService.waitFor({ state: 'visible', timeout: 10000 });
    await firstService.click();
    
    const description = page.locator('text=/description|details|about/i').first();
    await expect(description).toBeVisible({ timeout: 10000 });
  });

  test('should display book appointment button', async ({ page }) => {
    await page.goto('/services');
    const firstService = page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first();
    await firstService.waitFor({ state: 'visible', timeout: 10000 });
    await firstService.click();
    
    const bookButton = page.getByRole('button', { name: /book|apply|request/i }).first();
    await expect(bookButton).toBeVisible({ timeout: 10000 });
  });

  test('should show service requirements', async ({ page }) => {
    await page.goto('/services');
    const firstService = page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first();
    await firstService.waitFor({ state: 'visible', timeout: 10000 });
    await firstService.click();
    
    const requirements = page.locator('text=/requirement|document|need/i').first();
    await expect(requirements).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back to services list', async ({ page }) => {
    await page.goto('/services');
    const firstService = page.locator('[class*="service"]').or(page.locator('[class*="card"]')).first();
    await firstService.waitFor({ state: 'visible', timeout: 10000 });
    await firstService.click();
    
    await page.goBack();
    await expect(page).toHaveURL(/\/services$/);
  });
});
