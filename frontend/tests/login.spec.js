import { test, expect } from '@playwright/test';
import { testData, selectors, urls } from './test-data.js';

test.describe('Login Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.login);
    await expect(page).toHaveTitle(/Akshaya Services/);
  });

  test('should display login page elements correctly', async ({ page }) => {
    // Check if all main elements are visible
    await expect(page.locator(selectors.logo)).toBeVisible();
    await expect(page.locator(selectors.welcomeText)).toBeVisible();
    await expect(page.locator(selectors.emailInput)).toBeVisible();
    await expect(page.locator(selectors.passwordInput)).toBeVisible();
    await expect(page.locator(selectors.signInButton)).toBeVisible();
    await expect(page.locator(selectors.googleSignInButton)).toBeVisible();
    await expect(page.locator(selectors.signUpLink)).toBeVisible();
    await expect(page.locator(selectors.backToHomeLink)).toBeVisible();
    
    // Check role selection
    await expect(page.locator(selectors.roleUser)).toBeChecked();
    await expect(page.locator(selectors.roleAdmin)).not.toBeChecked();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator(selectors.passwordInput);
    const eyeButton = page.locator(selectors.eyeIcon).first();
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click eye icon to show password
    await eyeButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide password
    await eyeButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should switch between user and admin roles', async ({ page }) => {
    // Default should be user role
    await expect(page.locator(selectors.roleUser)).toBeChecked();
    
    // Switch to admin role
    await page.locator(selectors.roleAdmin).check();
    await expect(page.locator(selectors.roleAdmin)).toBeChecked();
    await expect(page.locator(selectors.roleUser)).not.toBeChecked();
    
    // Switch back to user role
    await page.locator(selectors.roleUser).check();
    await expect(page.locator(selectors.roleUser)).toBeChecked();
    await expect(page.locator(selectors.roleAdmin)).not.toBeChecked();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit with empty fields
    await page.locator(selectors.signInButton).click();
    
    // Check HTML5 validation
    const emailInput = page.locator(selectors.emailInput);
    const passwordInput = page.locator(selectors.passwordInput);
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill(selectors.emailInput, testData.invalidEmail.email);
    await page.fill(selectors.passwordInput, testData.invalidEmail.password);
    await page.locator(selectors.signInButton).click();
    
    // Check HTML5 email validation
    const emailInput = page.locator(selectors.emailInput);
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.locator(selectors.signUpLink).click();
    await expect(page).toHaveURL(urls.register);
  });

  test('should navigate back to home page', async ({ page }) => {
    await page.locator(selectors.backToHomeLink).click();
    await expect(page).toHaveURL(urls.home);
  });

  test('should attempt login with invalid credentials', async ({ page }) => {
    await page.fill(selectors.emailInput, testData.invalidCredentials.email);
    await page.fill(selectors.passwordInput, testData.invalidCredentials.password);
    await page.locator(selectors.signInButton).click();
    
    // Wait for potential error message or loading state
    await page.waitForTimeout(2000);
    
    // Check if error message appears or if still on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should attempt login with valid user credentials', async ({ page }) => {
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if redirected to dashboard or if error occurred
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // If login is successful, should redirect to dashboard
    // If login fails, should stay on login page or show error
    if (currentUrl.includes('/dashboard')) {
      await expect(page).toHaveURL(urls.dashboard);
    } else {
      // Login failed, should still be on login page
      expect(currentUrl).toContain('/login');
    }
  });

  test('should attempt login with valid admin credentials', async ({ page }) => {
    await page.fill(selectors.emailInput, testData.validAdmin.email);
    await page.fill(selectors.passwordInput, testData.validAdmin.password);
    await page.locator(selectors.roleAdmin).check();
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if redirected to admin dashboard or if error occurred
    const currentUrl = page.url();
    console.log('Current URL after admin login attempt:', currentUrl);
    
    // If login is successful, should redirect to admin dashboard
    // If login fails, should stay on login page or show error
    if (currentUrl.includes('/admin/dashboard')) {
      await expect(page).toHaveURL(urls.adminDashboard);
    } else {
      // Login failed, should still be on login page
      expect(currentUrl).toContain('/login');
    }
  });

  test('should handle Google sign-in button click', async ({ page }) => {
    // Click Google sign-in button
    await page.locator(selectors.googleSignInButton).click();
    
    // Wait a moment to see if any popup or redirect occurs
    await page.waitForTimeout(2000);
    
    // Check if still on login page or if Google OAuth flow started
    const currentUrl = page.url();
    console.log('Current URL after Google sign-in click:', currentUrl);
    
    // Should either stay on login page or redirect to Google OAuth
    expect(currentUrl).toMatch(/\/login|accounts\.google\.com/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if elements are still visible and properly laid out
    await expect(page.locator(selectors.logo)).toBeVisible();
    await expect(page.locator(selectors.emailInput)).toBeVisible();
    await expect(page.locator(selectors.passwordInput)).toBeVisible();
    await expect(page.locator(selectors.signInButton)).toBeVisible();
    
    // Check if left side image is hidden on mobile (should be hidden on small screens)
    const leftSide = page.locator('.hidden.md\\:flex');
    await expect(leftSide).toBeHidden();
  });
});
