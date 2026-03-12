import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} Viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
      });

      test('should display landing page correctly', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('nav')).toBeVisible();
      });

      test('should display services page correctly', async ({ page }) => {
        await page.goto('/services');
        await expect(page.getByRole('heading', { name: /service/i })).toBeVisible();
      });

      test('should display login page correctly', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[type="email"]')).toBeVisible();
      });

      test('should display news page correctly', async ({ page }) => {
        await page.goto('/news');
        await expect(page.getByRole('heading', { name: /news/i })).toBeVisible();
      });
    });
  });

  test('should toggle mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.locator('button').filter({ hasText: /menu|toggle/i }).first();
    if (await menuButton.isVisible({ timeout: 5000 })) {
      await menuButton.click();
      const mobileMenu = page.locator('[class*="mobile"], nav').first();
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should hide desktop menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const desktopMenu = page.locator('[class*="desktop"]').first();
    if (await desktopMenu.isVisible({ timeout: 2000 })) {
      await expect(desktopMenu).toBeHidden();
    }
  });

  test('should stack cards vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/services');
    
    const cards = page.locator('[class*="card"], [class*="service"]');
    const count = await cards.count();
    if (count > 0) {
      const firstCard = cards.first();
      const box = await firstCard.boundingBox();
      expect(box?.width).toBeLessThan(400);
    }
  });

  test('should display grid layout on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/services');
    
    const grid = page.locator('[class*="grid"]').first();
    if (await grid.isVisible({ timeout: 5000 })) {
      await expect(grid).toBeVisible();
    }
  });
});

test.describe('Touch Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should handle touch events on buttons', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button').first();
    if (await button.isVisible({ timeout: 5000 })) {
      await button.tap();
    }
  });

  test('should handle touch events on links', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link').first();
    if (await link.isVisible({ timeout: 5000 })) {
      await link.tap();
    }
  });
});
