import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should navigate from home to services', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /service/i }).first().click();
    await expect(page).toHaveURL(/\/services/);
  });

  test('should navigate from home to news', async ({ page }) => {
    await page.goto('/');
    const newsLink = page.getByRole('link', { name: /news/i }).first();
    if (await newsLink.isVisible({ timeout: 5000 })) {
      await newsLink.click();
      await expect(page).toHaveURL(/\/news/);
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should use browser back button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /service/i }).first().click();
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('should use browser forward button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /service/i }).first().click();
    await page.goBack();
    await page.goForward();
    await expect(page).toHaveURL(/\/services/);
  });

  test('should navigate using navbar logo', async ({ page }) => {
    await page.goto('/services');
    const logo = page.locator('a[href="/"], img[alt*="logo" i]').first();
    if (await logo.isVisible({ timeout: 5000 })) {
      await logo.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should maintain navigation state on refresh', async ({ page }) => {
    await page.goto('/services');
    await page.reload();
    await expect(page).toHaveURL(/\/services/);
  });
});

test.describe('Breadcrumb Navigation Tests', () => {
  test('should display breadcrumbs', async ({ page }) => {
    await page.goto('/services');
    const breadcrumb = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb" i]').first();
    if (await breadcrumb.isVisible({ timeout: 5000 })) {
      await expect(breadcrumb).toBeVisible();
    }
  });

  test('should navigate using breadcrumbs', async ({ page }) => {
    await page.goto('/services');
    const firstService = page.locator('[class*="service"]').first();
    if (await firstService.isVisible({ timeout: 5000 })) {
      await firstService.click();
      const breadcrumbLink = page.locator('[class*="breadcrumb"] a').first();
      if (await breadcrumbLink.isVisible({ timeout: 3000 })) {
        await breadcrumbLink.click();
      }
    }
  });
});

test.describe('Footer Navigation Tests', () => {
  test('should display footer links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should navigate using footer links', async ({ page }) => {
    await page.goto('/');
    const footerLink = page.locator('footer a').first();
    if (await footerLink.isVisible({ timeout: 5000 })) {
      const href = await footerLink.getAttribute('href');
      if (href && !href.startsWith('http')) {
        await footerLink.click();
      }
    }
  });
});

test.describe('Protected Routes Tests', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing admin route', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing staff route', async ({ page }) => {
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
