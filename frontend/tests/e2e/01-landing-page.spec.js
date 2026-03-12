import { test, expect } from '@playwright/test';

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Sahayak AI/i);
    await expect(page).toHaveURL('/');
  });

  test('should display main navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /services/i })).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('[class*="hero"]').first();
    await expect(hero).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should navigate to services page', async ({ page }) => {
    await page.getByRole('link', { name: /services/i }).first().click();
    await expect(page).toHaveURL(/\/services/);
  });

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
  });
});
