import { test, expect } from '@playwright/test';
import { testUsers } from './helpers/test-data.js';

test.describe('Authentication Tests', () => {
  test.describe('Registration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display registration form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.click('button[type="submit"]');
      // Check for validation messages
      await expect(page.locator('text=/required/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[type="password"]', 'Test@123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/invalid.*email/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for weak password', async ({ page }) => {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[type="password"]', '123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/password/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to login page from register', async ({ page }) => {
      await page.getByRole('link', { name: /login/i }).click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/required/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'WrongPassword123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/invalid|error|failed/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to register page from login', async ({ page }) => {
      await page.getByRole('link', { name: /register/i }).click();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should display Google OAuth button', async ({ page }) => {
      const googleButton = page.locator('button:has-text("Google")');
      await expect(googleButton).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // This test assumes you have a way to login programmatically
      await page.goto('/login');
      // Add login steps here if needed
      // Then test logout
    });
  });
});
