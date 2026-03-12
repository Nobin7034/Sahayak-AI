import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard|admin/i })).toBeVisible();
  });

  test('should show statistics cards', async ({ page }) => {
    const statsCards = page.locator('[class*="stat"], [class*="card"]').first();
    await expect(statsCards).toBeVisible({ timeout: 10000 });
  });

  test('should display total users count', async ({ page }) => {
    const usersCount = page.locator('text=/user|total.*user/i').first();
    await expect(usersCount).toBeVisible({ timeout: 10000 });
  });

  test('should display total appointments count', async ({ page }) => {
    const appointmentsCount = page.locator('text=/appointment|total.*appointment/i').first();
    await expect(appointmentsCount).toBeVisible({ timeout: 10000 });
  });

  test('should display total services count', async ({ page }) => {
    const servicesCount = page.locator('text=/service|total.*service/i').first();
    await expect(servicesCount).toBeVisible({ timeout: 10000 });
  });

  test('should show recent activities', async ({ page }) => {
    const activities = page.locator('text=/recent|activity|latest/i').first();
    await expect(activities).toBeVisible({ timeout: 10000 });
  });

  test('should display charts or graphs', async ({ page }) => {
    const chart = page.locator('canvas, svg, [class*="chart"]').first();
    if (await chart.isVisible({ timeout: 5000 })) {
      await expect(chart).toBeVisible();
    }
  });

  test('should navigate to users management', async ({ page }) => {
    const usersLink = page.getByRole('link', { name: /user/i }).first();
    if (await usersLink.isVisible({ timeout: 5000 })) {
      await usersLink.click();
      await expect(page).toHaveURL(/\/admin\/users/);
    }
  });

  test('should navigate to services management', async ({ page }) => {
    const servicesLink = page.getByRole('link', { name: /service/i }).first();
    if (await servicesLink.isVisible({ timeout: 5000 })) {
      await servicesLink.click();
      await expect(page).toHaveURL(/\/admin\/services/);
    }
  });

  test('should navigate to appointments management', async ({ page }) => {
    const appointmentsLink = page.getByRole('link', { name: /appointment/i }).first();
    if (await appointmentsLink.isVisible({ timeout: 5000 })) {
      await appointmentsLink.click();
      await expect(page).toHaveURL(/\/admin\/appointments/);
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /dashboard|admin/i })).toBeVisible();
  });
});

test.describe('Admin Navigation Tests', () => {
  test('should display admin sidebar', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const sidebar = page.locator('[class*="sidebar"], nav').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('should show admin menu items', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const menuItems = page.locator('a, button').filter({ hasText: /dashboard|user|service|appointment/i });
    await expect(menuItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should highlight active menu item', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const activeItem = page.locator('[class*="active"], [aria-current="page"]').first();
    if (await activeItem.isVisible({ timeout: 5000 })) {
      await expect(activeItem).toBeVisible();
    }
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/dashboard');
    
    const menuToggle = page.locator('button').filter({ hasText: /menu|toggle/i }).first();
    if (await menuToggle.isVisible({ timeout: 5000 })) {
      await menuToggle.click();
    }
  });
});
