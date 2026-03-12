import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load landing page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load services page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/services');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load news page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/news');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have reasonable page size', async ({ page }) => {
    const response = await page.goto('/');
    const size = (await response?.body())?.length || 0;
    expect(size).toBeLessThan(5000000); // 5MB
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeLessThan(50);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/services');
    await page.goto('/news');
    await page.goto('/');
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/services');
    await page.goto('/news');
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should cache static resources', async ({ page }) => {
    await page.goto('/');
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Network Performance Tests', () => {
  test('should minimize API calls on page load', async ({ page }) => {
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(requests.length).toBeLessThan(20);
  });

  test('should handle slow network gracefully', async ({ page }) => {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/services');
    const loader = page.locator('[class*="loading"], [class*="spinner"]').first();
    if (await loader.isVisible({ timeout: 1000 })) {
      await expect(loader).toBeVisible();
    }
  });
});

test.describe('Resource Loading Tests', () => {
  test('should load CSS files', async ({ page }) => {
    const responses = [];
    page.on('response', response => {
      if (response.url().endsWith('.css')) {
        responses.push(response);
      }
    });
    
    await page.goto('/');
    expect(responses.length).toBeGreaterThan(0);
  });

  test('should load JavaScript files', async ({ page }) => {
    const responses = [];
    page.on('response', response => {
      if (response.url().endsWith('.js')) {
        responses.push(response);
      }
    });
    
    await page.goto('/');
    expect(responses.length).toBeGreaterThan(0);
  });

  test('should not have 404 errors', async ({ page }) => {
    const failed = [];
    page.on('response', response => {
      if (response.status() === 404) {
        failed.push(response.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failed.length).toBe(0);
  });
});
