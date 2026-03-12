# Playwright E2E Test Suite

Comprehensive end-to-end testing suite for Sahayak AI application with 80+ tests covering all core functionalities.

## Test Coverage

### 1. Landing Page Tests (01-landing-page.spec.js)
- Page loading and navigation
- Hero section display
- Navigation menu functionality
- Footer display
- Responsive design

### 2. Authentication Tests (02-authentication.spec.js)
- User registration
- User login
- Form validation
- Google OAuth integration
- Logout functionality

### 3. Services Tests (03-services.spec.js)
- Services list display
- Service filtering and search
- Service details page
- Category navigation
- Booking functionality

### 4. Appointments Tests (04-appointments.spec.js)
- Appointment booking
- Appointment list view
- Appointment filtering
- Appointment management
- Status updates

### 5. User Dashboard Tests (05-user-dashboard.spec.js)
- Dashboard statistics
- Recent appointments
- Quick actions
- Profile management
- User settings

### 6. News Tests (06-news.spec.js)
- News list display
- News filtering and search
- News detail page
- Category filtering
- Pagination

### 7. Admin Dashboard Tests (07-admin-dashboard.spec.js)
- Admin statistics
- Dashboard metrics
- Recent activities
- Navigation
- Charts and graphs

### 8. Admin Users Management (08-admin-users.spec.js)
- User list display
- User search and filter
- User actions (edit, delete, view)
- Role management
- Status management

### 9. Admin Services Management (09-admin-services.spec.js)
- Service list display
- Add/Edit service
- Delete service
- Service validation
- Image upload

### 10. Admin Appointments Management (10-admin-appointments.spec.js)
- Appointments list
- Status filtering
- Appointment actions
- Search functionality

### 11. Admin Centers Management (11-admin-centers.spec.js)
- Centers list display
- Add/Edit center
- Delete center
- Center validation
- Location management

### 12. Admin Staff Management (12-admin-staff.spec.js)
- Staff list display
- Staff approval workflow
- Staff filtering
- Status management
- Center assignment

### 13. Staff Dashboard Tests (13-staff-dashboard.spec.js)
- Staff metrics
- Today's appointments
- Quick actions
- Notifications
- Profile management

### 14. Document Management Tests (14-document-management.spec.js)
- Document upload
- Document locker
- Document review
- OCR processing
- File validation

### 15. Center Finder Tests (15-center-finder.spec.js)
- Map display
- Center search
- Location filtering
- Map interactions
- Directions

### 16. Navigation Tests (16-navigation.spec.js)
- Page navigation
- Breadcrumb navigation
- Footer navigation
- Protected routes
- Browser navigation

### 17. Responsive Design Tests (17-responsive-design.spec.js)
- Mobile viewport
- Tablet viewport
- Desktop viewport
- Touch interactions
- Menu responsiveness

### 18. Accessibility Tests (18-accessibility.spec.js)
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast

### 19. Performance Tests (19-performance.spec.js)
- Page load times
- Resource loading
- Network performance
- Memory management
- Caching

### 20. Error Handling Tests (20-error-handling.spec.js)
- 404 pages
- Network errors
- Form validation
- Empty states
- Retry mechanisms

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests on specific browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Run mobile tests
```bash
npm run test:e2e:mobile
```

### View test report
```bash
npm run test:report
```

### Generate Allure report
```bash
npm run test:allure
```

## Test Reports

After running tests, reports are generated in multiple formats:

1. **HTML Report**: `playwright-report/index.html`
   - Interactive HTML report with screenshots and videos
   - Open with: `npm run test:report`

2. **JSON Report**: `test-results/results.json`
   - Machine-readable test results
   - Useful for CI/CD integration

3. **JUnit Report**: `test-results/junit.xml`
   - Standard JUnit XML format
   - Compatible with most CI/CD systems

4. **Allure Report**: `allure-results/`
   - Comprehensive test report with trends
   - Generate with: `npm run test:allure`

## Test Configuration

Configuration is in `playwright.config.js`:

- **Base URL**: http://localhost:5173
- **Timeout**: 30 seconds for navigation
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: On failure only
- **Trace**: On first retry

## Test Structure

```
tests/
├── e2e/
│   ├── fixtures/
│   │   └── auth.fixture.js       # Authentication fixtures
│   ├── helpers/
│   │   └── test-data.js          # Test data and constants
│   ├── 01-landing-page.spec.js
│   ├── 02-authentication.spec.js
│   ├── 03-services.spec.js
│   ├── 04-appointments.spec.js
│   ├── 05-user-dashboard.spec.js
│   ├── 06-news.spec.js
│   ├── 07-admin-dashboard.spec.js
│   ├── 08-admin-users.spec.js
│   ├── 09-admin-services.spec.js
│   ├── 10-admin-appointments.spec.js
│   ├── 11-admin-centers.spec.js
│   ├── 12-admin-staff.spec.js
│   ├── 13-staff-dashboard.spec.js
│   ├── 14-document-management.spec.js
│   ├── 15-center-finder.spec.js
│   ├── 16-navigation.spec.js
│   ├── 17-responsive-design.spec.js
│   ├── 18-accessibility.spec.js
│   ├── 19-performance.spec.js
│   └── 20-error-handling.spec.js
└── README.md
```

## Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   The tests will automatically start the dev server if not running.

4. **Backend server** should be running on port 5000

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright
  run: npx playwright install --with-deps
  
- name: Run tests
  run: npm run test:e2e
  
- name: Upload report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Descriptive Names**: Test names clearly describe what is being tested
3. **Proper Waits**: Use Playwright's auto-waiting instead of arbitrary timeouts
4. **Error Handling**: Tests handle missing elements gracefully
5. **Responsive Testing**: Tests cover multiple viewport sizes
6. **Accessibility**: Tests include accessibility checks

## Troubleshooting

### Tests failing locally
- Ensure dev server is running on port 5173
- Ensure backend server is running on port 5000
- Clear browser cache: `npx playwright clean`

### Slow tests
- Run tests in parallel: Tests run in parallel by default
- Reduce retries in playwright.config.js
- Use headed mode to debug: `npm run test:e2e:headed`

### Screenshots not captured
- Check `use.screenshot` setting in playwright.config.js
- Ensure test is actually failing
- Check `test-results/` directory

## Contributing

When adding new tests:
1. Follow the existing naming convention
2. Add test description to this README
3. Use proper test organization with describe blocks
4. Include both positive and negative test cases
5. Test responsive behavior where applicable

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test logs in `test-results/`
- Run tests in debug mode: `npm run test:e2e:debug`
