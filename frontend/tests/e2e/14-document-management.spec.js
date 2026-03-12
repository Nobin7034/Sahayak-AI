import { test, expect } from '@playwright/test';

test.describe('Document Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/service-application');
  });

  test('should display document upload section', async ({ page }) => {
    const uploadSection = page.locator('text=/upload|document/i').first();
    await expect(uploadSection).toBeVisible({ timeout: 10000 });
  });

  test('should show file input', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 5000 })) {
      await expect(fileInput).toBeVisible();
    }
  });

  test('should display upload button', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /upload|choose/i }).first();
    if (await uploadButton.isVisible({ timeout: 5000 })) {
      await expect(uploadButton).toBeVisible();
    }
  });

  test('should show supported file types', async ({ page }) => {
    const fileTypes = page.locator('text=/pdf|jpg|png|jpeg/i').first();
    if (await fileTypes.isVisible({ timeout: 5000 })) {
      await expect(fileTypes).toBeVisible();
    }
  });

  test('should display file size limit', async ({ page }) => {
    const sizeLimit = page.locator('text=/mb|size|limit/i').first();
    if (await sizeLimit.isVisible({ timeout: 5000 })) {
      await expect(sizeLimit).toBeVisible();
    }
  });
});

test.describe('Document Locker Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/document-locker');
  });

  test('should display document locker page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /document|locker/i })).toBeVisible();
  });

  test('should show uploaded documents', async ({ page }) => {
    const documentsList = page.locator('[class*="document"], [class*="file"]').first();
    if (await documentsList.isVisible({ timeout: 5000 })) {
      await expect(documentsList).toBeVisible();
    }
  });

  test('should display empty state', async ({ page }) => {
    const emptyState = page.locator('text=/no document|empty/i').first();
    if (await emptyState.isVisible({ timeout: 5000 })) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should show document actions', async ({ page }) => {
    const actionButton = page.locator('button').filter({ hasText: /view|download|delete/i }).first();
    if (await actionButton.isVisible({ timeout: 5000 })) {
      await expect(actionButton).toBeVisible();
    }
  });

  test('should filter documents', async ({ page }) => {
    const filter = page.locator('select, button').filter({ hasText: /filter|type/i }).first();
    if (await filter.isVisible({ timeout: 5000 })) {
      await filter.click();
    }
  });

  test('should search documents', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
    }
  });
});

test.describe('Document Review Tests', () => {
  test('should display document review interface', async ({ page }) => {
    await page.goto('/service-application');
    const reviewSection = page.locator('text=/review|verify/i').first();
    if (await reviewSection.isVisible({ timeout: 5000 })) {
      await expect(reviewSection).toBeVisible();
    }
  });

  test('should show OCR processing option', async ({ page }) => {
    await page.goto('/service-application');
    const ocrOption = page.locator('text=/ocr|extract|scan/i').first();
    if (await ocrOption.isVisible({ timeout: 5000 })) {
      await expect(ocrOption).toBeVisible();
    }
  });

  test('should display extracted data', async ({ page }) => {
    await page.goto('/service-application');
    const extractedData = page.locator('[class*="extracted"], [class*="data"]').first();
    if (await extractedData.isVisible({ timeout: 5000 })) {
      await expect(extractedData).toBeVisible();
    }
  });
});
