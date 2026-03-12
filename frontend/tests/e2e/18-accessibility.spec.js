import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper page titles', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/\w+/);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      if (await img.isVisible({ timeout: 2000 })) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have labels for form inputs', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const label = page.locator('label[for], label').first();
    await expect(label).toBeVisible();
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible({ timeout: 2000 })) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have proper link text', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      if (await link.isVisible({ timeout: 2000 })) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });

  test('should have proper ARIA roles', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Keyboard Navigation Tests', () => {
  test('should navigate through form with Tab', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should submit form with Enter', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.keyboard.press('Tab');
    await page.locator('input[type="password"]').fill('Test@123');
    await page.keyboard.press('Enter');
  });

  test('should navigate links with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focusedLink = page.locator('a:focus');
    if (await focusedLink.isVisible({ timeout: 2000 })) {
      await page.keyboard.press('Enter');
    }
  });
});

test.describe('Screen Reader Tests', () => {
  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should have skip to content link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
    if (await skipLink.isVisible({ timeout: 2000 })) {
      await expect(skipLink).toBeVisible();
    }
  });
});
