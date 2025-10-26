import { test, expect } from '@playwright/test';
import { testData, selectors, urls } from './test-data.js';

test.describe('Login Page API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.login);
  });

  test('should handle successful user login flow', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: testData.validUser.email,
            role: 'user',
            name: 'Test User'
          }
        })
      });
    });

    // Fill login form
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    
    // Submit form
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation
    await page.waitForURL(urls.dashboard);
    
    // Verify successful login
    await expect(page).toHaveURL(urls.dashboard);
  });

  test('should handle successful admin login flow', async ({ page }) => {
    // Mock successful API response for admin
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: testData.validAdmin.email,
            role: 'admin',
            name: 'Test Admin'
          }
        })
      });
    });

    // Fill login form as admin
    await page.fill(selectors.emailInput, testData.validAdmin.email);
    await page.fill(selectors.passwordInput, testData.validAdmin.password);
    await page.locator(selectors.roleAdmin).check();
    
    // Submit form
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation
    await page.waitForURL(urls.adminDashboard);
    
    // Verify successful admin login
    await expect(page).toHaveURL(urls.adminDashboard);
  });

  test('should handle login failure with invalid credentials', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      });
    });

    // Fill login form with invalid credentials
    await page.fill(selectors.emailInput, testData.invalidCredentials.email);
    await page.fill(selectors.passwordInput, testData.invalidCredentials.password);
    
    // Submit form
    await page.locator(selectors.signInButton).click();
    
    // Wait for error message
    await page.waitForSelector(selectors.errorMessage, { timeout: 5000 });
    
    // Verify error message is displayed
    await expect(page.locator(selectors.errorMessage)).toBeVisible();
    await expect(page.locator(selectors.errorMessage)).toContainText('Invalid credentials');
    
    // Verify still on login page
    await expect(page).toHaveURL(urls.login);
  });

  test('should handle network error during login', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/login', async route => {
      await route.abort('failed');
    });

    // Fill login form
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    
    // Submit form
    await page.locator(selectors.signInButton).click();
    
    // Wait for error message
    await page.waitForSelector(selectors.errorMessage, { timeout: 5000 });
    
    // Verify error message is displayed
    await expect(page.locator(selectors.errorMessage)).toBeVisible();
    
    // Verify still on login page
    await expect(page).toHaveURL(urls.login);
  });

  test('should show loading state during login', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token',
          user: { id: '1', email: testData.validUser.email, role: 'user' }
        })
      });
    });

    // Fill login form
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    
    // Submit form
    await page.locator(selectors.signInButton).click();
    
    // Check loading state
    await expect(page.locator(selectors.loadingText)).toBeVisible();
    
    // Wait for completion
    await page.waitForURL(urls.dashboard);
  });

  test('should store authentication data in localStorage after successful login', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-123',
          user: {
            id: '1',
            email: testData.validUser.email,
            role: 'user',
            name: 'Test User'
          }
        })
      });
    });

    // Fill and submit login form
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation
    await page.waitForURL(urls.dashboard);
    
    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    
    expect(token).toBe('mock-jwt-token-123');
    expect(JSON.parse(user)).toEqual({
      id: '1',
      email: testData.validUser.email,
      role: 'user',
      name: 'Test User'
    });
  });
});
