# Home Page Test Cases - Sahayak AI

## Test Case Documentation

| Test ID | Test Description | Expected Element | Expected Behavior | Actual Result | Status |
|---------|-----------------|------------------|-------------------|---------------|--------|
| 1 | Verify main heading is displayed. | **Kerala Government Services Made Simple** | The heading should be visible on the page. | Heading is visible. | Pass |
| 2 | Verify tagline text. | **Access all Akshaya center services online. Book appointments, apply for certificates, and track your applications.** | Tagline text should be displayed. | Text is visible. | Pass |
| 3 | Verify Get Started button link is visible. | Button Text: **Get Started** | Link/button should be visible and clickable. | Link is visible and functional. | Pass |
| 4 | Verify Login button is visible. | Button Text: **Login** | Login button should be visible and clickable. | Button is visible and functional. | Pass |
| 5 | Verify trust statement section. | **Join thousands of satisfied users who have simplified their government service experience** | The trust text should be visible on the homepage. | Text displayed correctly. | Pass |
| 6 | Verify "Why Choose Akshaya Services?" section heading. | **Why Choose Akshaya Services?** | The section heading should be visible. | Heading is visible. | Pass |
| 7 | Verify features section displays all 4 feature cards. | **Easy Appointments, Document Guidance, Secure & Reliable, 24/7 Support** | All feature cards should be visible. | All features displayed correctly. | Pass |
| 8 | Verify language toggle button is visible. | Button: **English / മലയാളം** | Language toggle button should be visible in top right corner. | Button is visible and functional. | Pass |
| 9 | Verify "Latest Government News" section. | **Latest Government News** | News section heading should be visible. | Section is visible. | Pass |
| 10 | Verify "Find Akshaya Centers Near You" section. | **Find Akshaya Centers Near You** | Centers section heading should be visible. | Section is visible. | Pass |
| 11 | Verify navbar logo is displayed. | **Akshaya Services** | Logo/brand name should be visible in navbar. | Logo is visible. | Pass |
| 12 | Verify navigation links in navbar. | **Login, Register** | Navigation links should be visible for non-logged in users. | Links are visible and functional. | Pass |
| 13 | Verify "Ready to Get Started?" CTA section. | **Ready to Get Started?** | Call-to-action section should be visible at bottom. | Section is visible. | Pass |
| 14 | Verify "Create Your Account Today" button. | Button Text: **Create Your Account Today** | CTA button should be visible and clickable. | Button is visible and functional. | Pass |
| 15 | Verify Get Started button navigates to register page. | Click **Get Started** button | Should navigate to /register page. | Navigation successful. | Pass |
| 16 | Verify Login button navigates to login page. | Click **Login** button | Should navigate to /login page. | Navigation successful. | Pass |

---

## Detailed Test Scenarios

### Test Case 1: Main Heading Display
**Objective:** Verify the main hero heading is displayed correctly
**Steps:**
1. Navigate to homepage (http://localhost:3000)
2. Check if heading "Kerala Government Services Made Simple" is visible
**Expected:** Heading is displayed prominently in hero section
**Status:** ✅ Pass

### Test Case 2: Tagline Text Display
**Objective:** Verify the hero tagline/subtitle is displayed
**Steps:**
1. Navigate to homepage
2. Check if tagline text is visible below main heading
**Expected:** Tagline text is clearly visible and readable
**Status:** ✅ Pass

### Test Case 3: Get Started Button
**Objective:** Verify Get Started button is visible and functional
**Steps:**
1. Navigate to homepage
2. Locate "Get Started" button in hero section
3. Verify button is visible and clickable
**Expected:** Button is visible, properly styled, and clickable
**Status:** ✅ Pass

### Test Case 4: Trust Statement Section
**Objective:** Verify trust statement is displayed in CTA section
**Steps:**
1. Navigate to homepage
2. Scroll to bottom CTA section
3. Verify trust statement text is visible
**Expected:** Trust statement "Join thousands of satisfied users..." is displayed
**Status:** ✅ Pass

### Test Case 5: Features Section
**Objective:** Verify all 4 feature cards are displayed
**Steps:**
1. Navigate to homepage
2. Scroll to features section
3. Verify all 4 feature cards are visible:
   - Easy Appointments
   - Document Guidance
   - Secure & Reliable
   - 24/7 Support
**Expected:** All feature cards are displayed with icons and descriptions
**Status:** ✅ Pass

### Test Case 6: Navigation Functionality
**Objective:** Verify navigation buttons work correctly
**Steps:**
1. Navigate to homepage
2. Click "Get Started" button
3. Verify redirect to /register page
4. Navigate back to homepage
5. Click "Login" button
6. Verify redirect to /login page
**Expected:** Both buttons navigate to correct pages
**Status:** ✅ Pass

---

## Test Execution Summary

**Total Test Cases:** 16
**Passed:** 16
**Failed:** 0
**Pass Rate:** 100%

**Test Environment:**
- Browser: Chrome
- URL: http://localhost:3000
- Date: [Current Date]

**Notes:**
- All tests verify visual elements and basic functionality
- Navigation tests verify routing works correctly
- Responsive design tests should be performed separately



