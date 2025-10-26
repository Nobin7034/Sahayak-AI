# Playwright Test Setup Instructions

## Installation

1. **Install Playwright dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

## Running Tests

### Basic Test Commands

- **Run all tests:** `npm test`
- **Run tests in headed mode:** `npm run test:headed`
- **Run tests with UI:** `npm run test:ui`
- **Debug tests:** `npm run test:debug`
- **View test report:** `npm run test:report`

### Running Specific Test Files

- **Login functionality tests:** `npx playwright test login.spec.js`
- **API integration tests:** `npx playwright test login-api.spec.js`
- **Accessibility tests:** `npx playwright test login-accessibility.spec.js`

### Running Tests on Specific Browsers

- **Chrome only:** `npx playwright test --project=chromium`
- **Firefox only:** `npx playwright test --project=firefox`
- **Safari only:** `npx playwright test --project=webkit`
- **Mobile Chrome:** `npx playwright test --project="Mobile Chrome"`
- **Mobile Safari:** `npx playwright test --project="Mobile Safari"`

## Test Data Configuration

The test data is configured in `tests/test-data.js` with the following credentials:

- **Valid User Email:** nobin@gmail.com
- **Valid Password:** Nobin@7034
- **Role:** user/admin

## Test Structure

### 1. `login.spec.js` - Basic Login Functionality
- Page element visibility
- Form validation
- Password visibility toggle
- Role selection
- Navigation links
- Responsive design

### 2. `login-api.spec.js` - API Integration Tests
- Successful login flows (user/admin)
- Failed login handling
- Network error handling
- Loading states
- LocalStorage verification

### 3. `login-accessibility.spec.js` - Accessibility Tests
- Form labels and ARIA attributes
- Keyboard navigation
- Screen reader compatibility
- Focus management

## Prerequisites

1. **Backend Server:** Make sure your backend server is running
2. **Frontend Server:** The tests will automatically start the frontend dev server
3. **Database:** Ensure your database has the test user account

## Troubleshooting

### Common Issues

1. **Port conflicts:** If port 5173 is busy, change it in `playwright.config.js`
2. **Backend not running:** Tests may fail if the backend API is not accessible
3. **Browser installation:** Run `npx playwright install` if browsers are missing

### Debug Mode

Use `npm run test:debug` to run tests in debug mode where you can:
- Step through tests
- Inspect elements
- View console logs
- Take screenshots

### Test Reports

After running tests, use `npm run test:report` to view detailed HTML reports with:
- Test results
- Screenshots
- Videos
- Traces
- Performance metrics

## Configuration

The main configuration is in `playwright.config.js`:
- **Base URL:** http://localhost:5173
- **Test Directory:** ./tests
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots:** On failure
- **Videos:** On failure
- **Traces:** On first retry

## Adding New Tests

1. Create new `.spec.js` files in the `tests/` directory
2. Import test data from `test-data.js`
3. Use the provided selectors for consistency
4. Follow the existing test patterns

## Continuous Integration

For CI/CD pipelines, use:
```bash
npx playwright install --with-deps
npm test
```

This will install browsers with system dependencies and run all tests.
