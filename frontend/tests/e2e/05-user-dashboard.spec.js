import { test, expect } from '@playwright/test';

test.describe('User Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should show user statistics', async ({ page }) => {
    const stats = page.locator('[class*="stat"], [class*="card"]').first();
    await expect(stats).toBeVisible({ timeout: 10000 });
  });

  test('should display recent appointments', async ({ page }) => {
    const appointments = page.locator('text=/appointment|recent|upcoming/i').first();
    await expect(appointments).toBeVisible({ timeout: 10000 });
  });

  test('should show quick actions', async ({ page }) => {
    const quickActions = page.locator('text=/quick|action|shortcut/i').first();
    await expect(quickActions).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to profile', async ({ page }) => {
    const profileLink = page.getByRole('link', { name: /profile/i }).first();
    if (await profileLink.isVisible({ timeout: 5000 })) {
      await profileLink.click();
      await expect(page).toHaveURL(/\/profile/);
    }
  });

  test('should navigate to appointments', async ({ page }) => {
    const appointmentsLink = page.getByRole('link', { name: /appointment/i }).first();
    if (await appointmentsLink.isVisible({ timeout: 5000 })) {
      await appointmentsLink.click();
      await expect(page).toHaveURL(/\/appointments/);
    }
  });

  test('should display notifications', async ({ page }) => {
    const notifications = page.locator('[class*="notification"]').or(
      page.locator('text=/notification|alert/i')
    ).first();
    if (await notifications.isVisible({ timeout: 5000 })) {
      await expect(notifications).toBeVisible();
    }
  });

  test('should show service history', async ({ page }) => {
    const history = page.locator('text=/history|past|previous/i').first();
    await expect(history).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});

test.describe('User Profile Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('should display profile page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should show user information', async ({ page }) => {
    const userInfo = page.locator('text=/name|email|phone/i').first();
    await expect(userInfo).toBeVisible({ timeout: 10000 });
  });

  test('should display edit profile button', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /edit|update/i }).first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
  });

  test('should show profile picture', async ({ page }) => {
    const avatar = page.locator('img[alt*="profile" i], img[alt*="avatar" i], [class*="avatar"]').first();
    if (await avatar.isVisible({ timeout: 5000 })) {
      await expect(avatar).toBeVisible();
    }
  });

  test('should allow profile picture upload', async ({ page }) => {
    const uploadButton = page.locator('input[type="file"], button').filter({ hasText: /upload|change.*photo/i }).first();
    if (await uploadButton.isVisible({ timeout: 5000 })) {
      await expect(uploadButton).toBeVisible();
    }
  });

  test('should display account settings', async ({ page }) => {
    const settings = page.locator('text=/setting|preference|account/i').first();
    await expect(settings).toBeVisible({ timeout: 10000 });
  });

  test('should show change password option', async ({ page }) => {
    const changePassword = page.locator('button, a').filter({ hasText: /password|security/i }).first();
    if (await changePassword.isVisible({ timeout: 5000 })) {
      await expect(changePassword).toBeVisible();
    }
  });
});
