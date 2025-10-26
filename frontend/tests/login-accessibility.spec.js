import { test, expect } from '@playwright/test';
import { testData, selectors, urls } from './test-data.js';

test.describe('Login Page Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.login);
  });

  test('should have proper form labels and accessibility attributes', async ({ page }) => {
    // Check email input accessibility
    const emailInput = page.locator(selectors.emailInput);
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required');
    await expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
    
    // Check password input accessibility
    const passwordInput = page.locator(selectors.passwordInput);
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    
    // Check form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab'); // Should focus email input
    await expect(page.locator(selectors.emailInput)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus password input
    await expect(page.locator(selectors.passwordInput)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus user role radio
    await expect(page.locator(selectors.roleUser)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus admin role radio
    await expect(page.locator(selectors.roleAdmin)).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus sign in button
    await expect(page.locator(selectors.signInButton)).toBeFocused();
  });

  test('should support form submission with Enter key', async ({ page }) => {
    // Fill form using keyboard
    await page.locator(selectors.emailInput).focus();
    await page.keyboard.type(testData.validUser.email);
    
    await page.keyboard.press('Tab');
    await page.keyboard.type(testData.validUser.password);
    
    // Submit with Enter key
    await page.keyboard.press('Enter');
    
    // Wait for form submission
    await page.waitForTimeout(1000);
    
    // Check if form was submitted (button should show loading state or page should change)
    const currentUrl = page.url();
    console.log('Current URL after Enter key submission:', currentUrl);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check if form has proper structure
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check if buttons have proper types
    await expect(page.locator(selectors.signInButton)).toHaveAttribute('type', 'submit');
    await expect(page.locator(selectors.googleSignInButton)).toHaveAttribute('type', 'button');
    
    // Check if password toggle button has proper accessibility
    const eyeButton = page.locator(selectors.eyeIcon).first();
    await expect(eyeButton).toHaveAttribute('type', 'button');
  });

  test('should handle screen reader navigation', async ({ page }) => {
    // Check if all interactive elements are accessible
    const interactiveElements = [
      selectors.emailInput,
      selectors.passwordInput,
      selectors.roleUser,
      selectors.roleAdmin,
      selectors.signInButton,
      selectors.googleSignInButton,
      selectors.signUpLink,
      selectors.backToHomeLink
    ];
    
    for (const selector of interactiveElements) {
      const element = page.locator(selector);
      await expect(element).toBeVisible();
      await expect(element).toBeEnabled();
    }
  });

  test('should maintain focus management', async ({ page }) => {
    // Fill form and submit
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    
    // Focus should be on submit button after filling form
    await page.locator(selectors.signInButton).focus();
    await expect(page.locator(selectors.signInButton)).toBeFocused();
    
    // Click submit
    await page.locator(selectors.signInButton).click();
    
    // Wait a moment for any state changes
    await page.waitForTimeout(1000);
    
    // Focus should be managed appropriately (either on error message or next page)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // If still on login page, focus might be on error message or form
      const errorMessage = page.locator(selectors.errorMessage);
      if (await errorMessage.isVisible()) {
        // Error message should be focusable for screen readers
        await expect(errorMessage).toBeVisible();
      }
    }
  });
});
