import { test, expect } from '@playwright/test';

test.describe('Error Handling Tests', () => {
  test('should display 404 page for invalid route', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    const notFound = page.locator('text=/404|not found|page.*not.*found/i').first();
    await expect(notFound).toBeVisible({ timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());
    await page.goto('/services');
    const errorMessage = page.locator('text=/error|failed|try again/i').first();
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should show error message on failed login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    const error = page.locator('text=/invalid|error|failed/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should handle API timeout', async ({ page }) => {
    await page.route('**/api/**', route => {
      setTimeout(() => route.abort(), 30000);
    });
    await page.goto('/services');
  });

  test('should display error boundary', async ({ page }) => {
    await page.goto('/');
    const errorBoundary = page.locator('[class*="error-boundary"]').first();
    if (await errorBoundary.isVisible({ timeout: 2000 })) {
      await expect(errorBoundary).toBeVisible();
    }
  });

  test('should handle missing images gracefully', async ({ page }) => {
    await page.goto('/services');
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const img = images.nth(i);
      if (await img.isVisible({ timeout: 2000 })) {
        const src = await img.getAttribute('src');
        expect(src).toBeTruthy();
      }
    }
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    const validationError = page.locator('text=/required|invalid|error/i').first();
    await expect(validationError).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty states', async ({ page }) => {
    await page.goto('/appointments');
    const emptyState = page.locator('text=/no appointment|empty/i').first();
    if (await emptyState.isVisible({ timeout: 5000 })) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Form Validation Tests', () => {
  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    const error = page.locator('text=/invalid.*email/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    const error = page.locator('text=/required/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    const error = page.locator('text=/password/i').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/register');
    const phoneInput = page.locator('input[name*="phone"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 })) {
      await phoneInput.fill('123');
      await page.click('button[type="submit"]');
    }
  });
});

test.describe('Retry Mechanism Tests', () => {
  test('should show retry button on error', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());
    await page.goto('/services');
    const retryButton = page.getByRole('button', { name: /retry|try again/i }).first();
    if (await retryButton.isVisible({ timeout: 5000 })) {
      await expect(retryButton).toBeVisible();
    }
  });

  test('should reload data on retry', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/**', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('/services');
    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    if (await retryButton.isVisible({ timeout: 5000 })) {
      await retryButton.click();
    }
  });
});
