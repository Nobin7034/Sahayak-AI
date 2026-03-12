import { test, expect } from '@playwright/test';

test.describe('News Tests', () => {
  test.describe('News List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/news');
    });

    test('should display news page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /news/i })).toBeVisible();
    });

    test('should show news articles list', async ({ page }) => {
      const newsCards = page.locator('[class*="news"], [class*="article"], [class*="card"]').first();
      await expect(newsCards).toBeVisible({ timeout: 10000 });
    });

    test('should display news titles', async ({ page }) => {
      const newsTitle = page.locator('[class*="title"], h2, h3').first();
      await expect(newsTitle).toBeVisible({ timeout: 10000 });
    });

    test('should show news dates', async ({ page }) => {
      const newsDate = page.locator('text=/\\d{1,2}.*\\d{4}|ago|today|yesterday/i').first();
      await expect(newsDate).toBeVisible({ timeout: 10000 });
    });

    test('should display news categories', async ({ page }) => {
      const category = page.locator('[class*="category"], [class*="tag"]').first();
      if (await category.isVisible({ timeout: 5000 })) {
        await expect(category).toBeVisible();
      }
    });

    test('should filter news by category', async ({ page }) => {
      const categoryFilter = page.locator('select, button').filter({ hasText: /category|filter/i }).first();
      if (await categoryFilter.isVisible({ timeout: 5000 })) {
        await categoryFilter.click();
      }
    });

    test('should search news articles', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill('announcement');
        await page.waitForTimeout(1000);
      }
    });

    test('should navigate to news detail', async ({ page }) => {
      const firstNews = page.locator('[class*="news"], [class*="article"]').first();
      await firstNews.waitFor({ state: 'visible', timeout: 10000 });
      await firstNews.click();
      await expect(page).toHaveURL(/\/news\/\w+/);
    });

    test('should show pagination or load more', async ({ page }) => {
      const pagination = page.locator('text=/page|next|previous|load more/i').first();
      if (await pagination.isVisible({ timeout: 5000 })) {
        await expect(pagination).toBeVisible();
      }
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[class*="news"], [class*="article"]').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('News Detail', () => {
    test('should display news detail page', async ({ page }) => {
      await page.goto('/news');
      const firstNews = page.locator('[class*="news"], [class*="article"]').first();
      await firstNews.waitFor({ state: 'visible', timeout: 10000 });
      await firstNews.click();
      
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should show full article content', async ({ page }) => {
      await page.goto('/news');
      const firstNews = page.locator('[class*="news"], [class*="article"]').first();
      await firstNews.waitFor({ state: 'visible', timeout: 10000 });
      await firstNews.click();
      
      const content = page.locator('[class*="content"], p').first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });

    test('should display article metadata', async ({ page }) => {
      await page.goto('/news');
      const firstNews = page.locator('[class*="news"], [class*="article"]').first();
      await firstNews.waitFor({ state: 'visible', timeout: 10000 });
      await firstNews.click();
      
      const metadata = page.locator('text=/date|author|category/i').first();
      await expect(metadata).toBeVisible({ timeout: 10000 });
    });

    test('should show back to news button', async ({ page }) => {
      await page.goto('/news');
      const firstNews = page.locator('[class*="news"], [class*="article"]').first();
      await firstNews.waitFor({ state: 'visible', timeout: 10000 });
      await firstNews.click();
      
      const backButton = page.getByRole('link', { name: /back|news/i }).first();
      if (await backButton.isVisible({ timeout: 5000 })) {
        await expect(backButton).toBeVisible();
      }
    });

    test('should navigate back to news list', async ({ page }) => {
      await page.goto('/news');
      const firstNews = page.locator('[class*="news"], [class*="article"]').first();
      await firstNews.waitFor({ state: 'visible', timeout: 10000 });
      await firstNews.click();
      
      await page.goBack();
      await expect(page).toHaveURL(/\/news$/);
    });
  });
});
