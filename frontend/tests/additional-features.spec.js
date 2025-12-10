import { test, expect } from '@playwright/test';
import { testData, selectors, urls } from './test-data.js';

test.describe('Additional Features Tests', () => {
  
  test('1. Register page - should display all form elements correctly', async ({ page }) => {
    await page.goto(urls.register);
    await expect(page).toHaveTitle(/Akshaya Services/);
    
    // Check if all form fields are visible
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    
    // Check submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible();
  });

  test('2. Register page - should validate form fields on input', async ({ page }) => {
    await page.goto(urls.register);
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="firstName"]', 'Test');
    await page.keyboard.press('Tab'); // Trigger validation
    
    // Wait for validation message
    await page.waitForTimeout(500);
    const emailError = page.locator('text=/valid email/i');
    await expect(emailError.first()).toBeVisible();
    
    // Test password validation
    await page.fill('input[name="password"]', 'weak');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    const passwordError = page.locator('text=/password must/i');
    await expect(passwordError.first()).toBeVisible();
  });

  test('3. Landing page - should display main elements and navigation', async ({ page }) => {
    await page.goto(urls.home);
    await expect(page).toHaveTitle(/Akshaya Services/);
    
    // Check navbar logo
    await expect(page.locator('text="Akshaya Services"')).toBeVisible();
    
    // Check main navigation links in navbar
    const navLinks = ['Login', 'Register'];
    for (const linkText of navLinks) {
      const link = page.locator(`a:has-text("${linkText}")`);
      await expect(link.first()).toBeVisible();
    }
    
    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check language toggle button
    await expect(page.locator('button:has-text("English"), button:has-text("മലയാളം")')).toBeVisible();
  });

  test('4. Landing page - should navigate to login and register pages', async ({ page }) => {
    await page.goto(urls.home);
    
    // Click login link
    await page.locator('a:has-text("Login")').first().click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(urls.login);
    
    // Go back and click register
    await page.goto(urls.home);
    await page.locator('a:has-text("Register")').first().click();
    await page.waitForURL('**/register');
    await expect(page).toHaveURL(urls.register);
  });

  test('5. Dashboard - should navigate to dashboard after successful login', async ({ page }) => {
    // Mock successful login
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

    await page.goto(urls.login);
    
    // Fill and submit login form
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(urls.dashboard);
    
    // Check if navbar is visible (indicating successful login)
    await expect(page.locator('nav')).toBeVisible();
  });

  test('6. Navbar - should display navigation elements when logged in', async ({ page }) => {
    // Mock successful login
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

    // Login first
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/dashboard');
    
    // Check navbar is visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text="Akshaya Services"')).toBeVisible();
    
    // Check that at least one navigation link is visible (Dashboard should be visible)
    await expect(page.locator('a:has-text("Dashboard")').first()).toBeVisible();
  });

  test('7. Dashboard - should display all main dashboard elements', async ({ page }) => {
    // Mock login and dashboard data
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
            name: 'Test User',
            phone: '1234567890'
          }
        })
      });
    });

    await page.route('**/api/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
    });

    await page.route('**/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
    });

    // Login and navigate to dashboard
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/dashboard');
    
    // Check dashboard header
    await expect(page.locator('h1')).toBeVisible();
    
    // Check stats cards (completed, in progress, upcoming)
    await expect(page.locator('text=/completed/i').first()).toBeVisible();
    await expect(page.locator('text=/in progress/i, text=/upcoming/i').first()).toBeVisible();
    
    // Check profile card
    await expect(page.locator('text=/profile information/i')).toBeVisible();
    
    // Check quick actions section
    await expect(page.locator('text=/quick actions/i')).toBeVisible();
    await expect(page.locator('a:has-text("Apply for Service")')).toBeVisible();
    await expect(page.locator('a:has-text("Book Appointment")')).toBeVisible();
    await expect(page.locator('a:has-text("Read Latest News")')).toBeVisible();
  });

  test('8. Dashboard - should navigate to Services page from quick actions', async ({ page }) => {
    // Mock login and dashboard data
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

    await page.route('**/api/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    // Login and go to dashboard
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/dashboard');
    
    // Click "Apply for Service" link in quick actions
    await page.locator('a:has-text("Apply for Service")').click();
    await page.waitForURL('**/services');
    await expect(page).toHaveURL(/.*\/services/);
  });

  test('9. Dashboard - should navigate to Appointments page from navbar', async ({ page }) => {
    // Mock login and dashboard data
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

    await page.route('**/api/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    // Login and go to dashboard
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/dashboard');
    
    // Click "Appointments" link in navbar
    await page.locator('nav a:has-text("Appointments")').click();
    await page.waitForURL('**/appointments');
    await expect(page).toHaveURL(/.*\/appointments/);
  });

  test('10. Dashboard - should navigate to Profile page from profile card', async ({ page }) => {
    // Mock login and dashboard data
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
            name: 'Test User',
            phone: '1234567890'
          }
        })
      });
    });

    await page.route('**/api/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    // Login and go to dashboard
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validUser.email);
    await page.fill(selectors.passwordInput, testData.validUser.password);
    await page.locator(selectors.roleUser).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/dashboard');
    
    // Click "Edit Profile" link in profile card
    await page.locator('a:has-text("Edit Profile")').click();
    await page.waitForURL('**/profile');
    await expect(page).toHaveURL(/.*\/profile/);
  });

});

