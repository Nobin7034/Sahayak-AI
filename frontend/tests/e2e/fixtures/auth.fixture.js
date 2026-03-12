import { test as base } from '@playwright/test';

export const test = base.extend({
  // Authenticated user context
  authenticatedPage: async ({ page }, use) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await use(page);
  },

  // Admin authenticated context
  adminPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    await use(page);
  },

  // Staff authenticated context
  staffPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'staff@example.com');
    await page.fill('input[type="password"]', 'Staff@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/staff/dashboard', { timeout: 10000 });
    await use(page);
  },
});

export { expect } from '@playwright/test';
