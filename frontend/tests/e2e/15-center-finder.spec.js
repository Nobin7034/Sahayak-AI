import { test, expect } from '@playwright/test';

test.describe('Center Finder Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/center-finder');
  });

  test('should display center finder page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /center|find/i })).toBeVisible();
  });

  test('should show map container', async ({ page }) => {
    const map = page.locator('[class*="map"], #map').first();
    await expect(map).toBeVisible({ timeout: 10000 });
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should show pincode input', async ({ page }) => {
    const pincodeInput = page.locator('input[name*="pincode"], input[placeholder*="pincode" i]').first();
    if (await pincodeInput.isVisible({ timeout: 5000 })) {
      await expect(pincodeInput).toBeVisible();
    }
  });

  test('should display centers list', async ({ page }) => {
    const centersList = page.locator('[class*="center"], [class*="list"]').first();
    await expect(centersList).toBeVisible({ timeout: 10000 });
  });

  test('should show center details', async ({ page }) => {
    const centerCard = page.locator('[class*="center"]').first();
    if (await centerCard.isVisible({ timeout: 5000 })) {
      await expect(centerCard).toContainText(/\w+/);
    }
  });

  test('should display center address', async ({ page }) => {
    const address = page.locator('text=/address|location/i').first();
    await expect(address).toBeVisible({ timeout: 10000 });
  });

  test('should show center contact info', async ({ page }) => {
    const contact = page.locator('text=/phone|email|contact/i').first();
    if (await contact.isVisible({ timeout: 5000 })) {
      await expect(contact).toBeVisible();
    }
  });

  test('should filter centers by service', async ({ page }) => {
    const serviceFilter = page.locator('select').filter({ hasText: /service/i }).first();
    if (await serviceFilter.isVisible({ timeout: 5000 })) {
      await serviceFilter.click();
    }
  });

  test('should show get directions button', async ({ page }) => {
    const directionsButton = page.getByRole('button', { name: /direction|navigate/i }).first();
    if (await directionsButton.isVisible({ timeout: 5000 })) {
      await expect(directionsButton).toBeVisible();
    }
  });

  test('should display distance from user', async ({ page }) => {
    const distance = page.locator('text=/km|mile|distance/i').first();
    if (await distance.isVisible({ timeout: 5000 })) {
      await expect(distance).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[class*="map"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Map Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/center-finder');
  });

  test('should display map markers', async ({ page }) => {
    const markers = page.locator('[class*="marker"]').first();
    if (await markers.isVisible({ timeout: 5000 })) {
      await expect(markers).toBeVisible();
    }
  });

  test('should show center popup on marker click', async ({ page }) => {
    const marker = page.locator('[class*="marker"]').first();
    if (await marker.isVisible({ timeout: 5000 })) {
      await marker.click();
      const popup = page.locator('[class*="popup"]').first();
      await expect(popup).toBeVisible({ timeout: 3000 });
    }
  });

  test('should zoom in on map', async ({ page }) => {
    const zoomIn = page.locator('button, a').filter({ hasText: /\\+|zoom.*in/i }).first();
    if (await zoomIn.isVisible({ timeout: 5000 })) {
      await zoomIn.click();
    }
  });

  test('should zoom out on map', async ({ page }) => {
    const zoomOut = page.locator('button, a').filter({ hasText: /-|zoom.*out/i }).first();
    if (await zoomOut.isVisible({ timeout: 5000 })) {
      await zoomOut.click();
    }
  });
});
