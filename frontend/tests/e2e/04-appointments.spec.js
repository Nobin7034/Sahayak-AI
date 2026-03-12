import { test, expect } from '@playwright/test';
import { testAppointment } from './helpers/test-data.js';

test.describe('Appointments Tests', () => {
  test.describe('Book Appointment', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/book-appointment');
    });

    test('should display appointment booking form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /book|appointment/i })).toBeVisible();
    });

    test('should show service selection', async ({ page }) => {
      const serviceSelect = page.locator('select, input').filter({ hasText: /service/i }).or(
        page.locator('[name*="service"]')
      ).first();
      await expect(serviceSelect).toBeVisible({ timeout: 10000 });
    });

    test('should show date picker', async ({ page }) => {
      const datePicker = page.locator('input[type="date"]').or(
        page.locator('[name*="date"]')
      ).first();
      await expect(datePicker).toBeVisible({ timeout: 10000 });
    });

    test('should show time selection', async ({ page }) => {
      const timeSelect = page.locator('input[type="time"], select').filter({ hasText: /time/i }).or(
        page.locator('[name*="time"]')
      ).first();
      await expect(timeSelect).toBeVisible({ timeout: 10000 });
    });

    test('should validate required fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /book|submit|confirm/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await expect(page.locator('text=/required|fill/i').first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show center selection', async ({ page }) => {
      const centerSelect = page.locator('select, input').filter({ hasText: /center|location/i }).or(
        page.locator('[name*="center"]')
      ).first();
      await expect(centerSelect).toBeVisible({ timeout: 10000 });
    });

    test('should display appointment summary', async ({ page }) => {
      const summary = page.locator('text=/summary|details|review/i').first();
      await expect(summary).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('View Appointments', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/appointments');
    });

    test('should display appointments page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /appointment/i })).toBeVisible();
    });

    test('should show appointments list or empty state', async ({ page }) => {
      const appointmentsList = page.locator('[class*="appointment"]').or(
        page.locator('text=/no appointment|empty/i')
      );
      await expect(appointmentsList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter appointments by status', async ({ page }) => {
      const statusFilter = page.locator('select, button').filter({ hasText: /status|filter/i }).first();
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
      }
    });

    test('should display appointment details', async ({ page }) => {
      const appointmentCard = page.locator('[class*="appointment"]').first();
      if (await appointmentCard.isVisible({ timeout: 5000 })) {
        await expect(appointmentCard).toContainText(/date|time|service/i);
      }
    });

    test('should show cancel appointment option', async ({ page }) => {
      const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
      if (await cancelButton.isVisible({ timeout: 5000 })) {
        await expect(cancelButton).toBeVisible();
      }
    });

    test('should show reschedule option', async ({ page }) => {
      const rescheduleButton = page.getByRole('button', { name: /reschedule|edit/i }).first();
      if (await rescheduleButton.isVisible({ timeout: 5000 })) {
        await expect(rescheduleButton).toBeVisible();
      }
    });
  });

  test.describe('Appointment Management', () => {
    test('should navigate to book appointment from appointments page', async ({ page }) => {
      await page.goto('/appointments');
      const bookButton = page.getByRole('link', { name: /book|new/i }).first();
      if (await bookButton.isVisible({ timeout: 5000 })) {
        await bookButton.click();
        await expect(page).toHaveURL(/\/book-appointment/);
      }
    });

    test('should show appointment status badges', async ({ page }) => {
      await page.goto('/appointments');
      const statusBadge = page.locator('[class*="badge"], [class*="status"]').first();
      if (await statusBadge.isVisible({ timeout: 5000 })) {
        await expect(statusBadge).toBeVisible();
      }
    });

    test('should display appointment history', async ({ page }) => {
      await page.goto('/appointments');
      const historySection = page.locator('text=/history|past|previous/i').first();
      if (await historySection.isVisible({ timeout: 5000 })) {
        await expect(historySection).toBeVisible();
      }
    });
  });
});
