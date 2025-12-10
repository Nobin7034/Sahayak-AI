import { test, expect } from '@playwright/test';
import { testData, selectors, urls } from './test-data.js';

test.describe('Home Page and Admin Dashboard Tests', () => {
  
  // ========== USER HOME PAGE TESTS ==========
  
  test('1. Home Page - should display hero section and main elements', async ({ page }) => {
    await page.goto(urls.home);
    await expect(page).toHaveTitle(/Akshaya Services/);
    
    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check hero buttons
    await expect(page.locator('a:has-text("Get Started"), a:has-text("Register")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Login")').first()).toBeVisible();
    
    // Check language toggle button
    await expect(page.locator('button:has-text("English"), button:has-text("മലയാളം")')).toBeVisible();
    
    // Check navbar
    await expect(page.locator('text="Akshaya Services"')).toBeVisible();
  });

  test('2. Home Page - should display features section', async ({ page }) => {
    await page.goto(urls.home);
    
    // Mock news API to avoid loading issues
    await page.route('**/api/news/latest/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    await page.route('**/news/latest/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    });
    
    // Check features section heading
    await expect(page.locator('text=/why choose/i, text=/features/i').first()).toBeVisible();
    
    // Wait for features section to load
    await page.waitForTimeout(500);
    
    // Check feature cards (at least one feature title should be visible)
    const featureTitles = page.locator('text=/easy appointments/i, text=/document/i, text=/secure/i, text=/support/i');
    await expect(featureTitles.first()).toBeVisible();
  });

  test('3. Home Page - should navigate to register page from hero section', async ({ page }) => {
    await page.goto(urls.home);
    
    // Click "Get Started" or "Register" button in hero
    await page.locator('a:has-text("Get Started"), a:has-text("Register")').first().click();
    await page.waitForURL('**/register');
    await expect(page).toHaveURL(urls.register);
  });

  test('4. Home Page - should display latest news section', async ({ page }) => {
    // Mock news API
    await page.route('**/api/news/latest/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              _id: '1',
              title: 'Test News',
              summary: 'Test summary',
              publishDate: new Date().toISOString(),
              imageUrl: null
            }
          ]
        })
      });
    });

    await page.route('**/news/latest/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              _id: '1',
              title: 'Test News',
              summary: 'Test summary',
              publishDate: new Date().toISOString(),
              imageUrl: null
            }
          ]
        })
      });
    });
    
    await page.goto(urls.home);
    
    // Check latest news section
    await expect(page.locator('text=/latest news/i, text=/news/i').first()).toBeVisible();
    
    // Wait a bit for news to load
    await page.waitForTimeout(1000);
    
    // Check if news section exists (even if empty)
    const newsSection = page.locator('section').filter({ hasText: /news/i });
    await expect(newsSection.first()).toBeVisible();
  });

  // ========== ADMIN DASHBOARD TESTS ==========
  
  test('5. Admin Dashboard - should display admin dashboard after admin login', async ({ page }) => {
    // Mock admin login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-admin-token',
          user: {
            id: '1',
            email: testData.validAdmin.email,
            role: 'admin',
            name: 'Admin User'
          }
        })
      });
    });

    // Mock admin dashboard stats
    await page.route('**/api/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    await page.route('**/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    // Login as admin
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validAdmin.email);
    await page.fill(selectors.passwordInput, testData.validAdmin.password);
    await page.locator(selectors.roleAdmin).check();
    await page.locator(selectors.signInButton).click();
    
    // Wait for navigation to admin dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
    
    // Check admin dashboard header
    await expect(page.locator('text=/admin dashboard/i')).toBeVisible();
  });

  test('6. Admin Dashboard - should display all stats cards', async ({ page }) => {
    // Mock admin login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-admin-token',
          user: {
            id: '1',
            email: testData.validAdmin.email,
            role: 'admin',
            name: 'Admin User'
          }
        })
      });
    });

    // Mock admin dashboard stats
    await page.route('**/api/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    await page.route('**/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    // Login as admin
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validAdmin.email);
    await page.fill(selectors.passwordInput, testData.validAdmin.password);
    await page.locator(selectors.roleAdmin).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/admin/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
    
    // Check all stats cards
    await expect(page.locator('text=/total users/i')).toBeVisible();
    await expect(page.locator('text=/total services/i')).toBeVisible();
    await expect(page.locator('text=/total appointments/i')).toBeVisible();
    await expect(page.locator('text=/pending appointments/i')).toBeVisible();
  });

  test('7. Admin Dashboard - should display admin sidebar navigation', async ({ page }) => {
    // Mock admin login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-admin-token',
          user: {
            id: '1',
            email: testData.validAdmin.email,
            role: 'admin',
            name: 'Admin User'
          }
        })
      });
    });

    // Mock admin dashboard stats
    await page.route('**/api/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    await page.route('**/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    // Login as admin
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validAdmin.email);
    await page.fill(selectors.passwordInput, testData.validAdmin.password);
    await page.locator(selectors.roleAdmin).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/admin/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
    
    // Check admin sidebar
    await expect(page.locator('text=/admin panel/i')).toBeVisible();
    
    // Check navigation links in sidebar
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Users")')).toBeVisible();
    await expect(page.locator('a:has-text("Services")')).toBeVisible();
    await expect(page.locator('a:has-text("Appointments")')).toBeVisible();
  });

  test('8. Admin Dashboard - should navigate to admin users page from quick actions', async ({ page }) => {
    // Mock admin login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-admin-token',
          user: {
            id: '1',
            email: testData.validAdmin.email,
            role: 'admin',
            name: 'Admin User'
          }
        })
      });
    });

    // Mock admin dashboard stats
    await page.route('**/api/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    await page.route('**/admin/dashboard-stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 100,
              totalServices: 25,
              totalAppointments: 500,
              pendingAppointments: 50
            },
            mostVisitedServices: [],
            recentAppointments: []
          }
        })
      });
    });

    // Login as admin
    await page.goto(urls.login);
    await page.fill(selectors.emailInput, testData.validAdmin.email);
    await page.fill(selectors.passwordInput, testData.validAdmin.password);
    await page.locator(selectors.roleAdmin).check();
    await page.locator(selectors.signInButton).click();
    await page.waitForURL('**/admin/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
    
    // Click "Manage Users" in quick actions
    await page.locator('a:has-text("Manage Users")').click();
    await page.waitForURL('**/admin/users');
    await expect(page).toHaveURL(/.*\/admin\/users/);
  });

});

