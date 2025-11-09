# Playwright E2E Tests

This directory contains end-to-end tests for the ASD Detection application using Playwright.

## Test Structure

```
tests/
├── dashboards/           # Dashboard tests for each user role
│   ├── admin-dashboard.spec.js
│   ├── researcher-dashboard.spec.js
│   ├── parent-dashboard.spec.js
│   ├── teacher-dashboard.spec.js
│   └── therapist-dashboard.spec.js
├── homepage.spec.js      # Home page tests
├── registration.spec.js  # Registration page tests
├── login.spec.js         # Login page tests
├── auth-flow.spec.js     # Complete authentication flow tests
└── test-utils.js         # Test utilities and helpers
```

## Prerequisites

1. Backend server must be running on `http://localhost:5000`
2. Frontend server must be running on `http://localhost:3000`
3. Database must be accessible and contain test user credentials

## Test Credentials

The tests use the following test credentials:

- **Admin**: alentatms27@gmail.com / 2276273
- **Researcher**: alentatom02@gmail.com / 7887
- **Parent**: hayestheosinclair25@gmail.com / 27102002
- **Teacher**: alentahhhtom10@gmail.com / pedri
- **Therapist**: alentatom2026@mca.ajce.in / alentatom16520

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test tests/login.spec.js
```

### Run tests for specific dashboard
```bash
npx playwright test tests/dashboards/admin-dashboard.spec.js
```

## Test Coverage

### Home Page Tests
- ✅ Display homepage with navigation
- ✅ Hero section with main heading
- ✅ "How It Works" section
- ✅ Call-to-action buttons
- ✅ Navigation to login/register

### Registration Tests
- ✅ Registration form display
- ✅ Role selection dropdown
- ✅ Therapist-specific fields
- ✅ Email and password validation
- ✅ Password visibility toggle
- ✅ Navigation to login

### Login Tests
- ✅ Login form display
- ✅ Role selection
- ✅ Login for all user roles (admin, researcher, parent, teacher, therapist)
- ✅ Invalid credentials handling
- ✅ Password visibility toggle
- ✅ Navigation to register
- ✅ Forgot password option
- ✅ Google sign-in option

### Dashboard Tests
Each dashboard (admin, researcher, parent, teacher, therapist) includes:
- ✅ Dashboard load verification
- ✅ Navigation menu display
- ✅ Navigation to key pages
- ✅ Logout functionality
- ✅ Role-specific content display

## Configuration

Tests are configured in `playwright.config.js`:
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Retries: 0 (2 on CI)
- Screenshots: On failure
- Videos: On failure

## Test Reports

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

Screenshots and videos are saved in `test-results/` directory.

## Troubleshooting

### Tests failing due to timeouts
- Ensure both frontend and backend servers are running
- Check that the database is accessible
- Increase timeout values in test files if needed

### Login tests failing
- Verify test credentials are correct in the database
- Check that the backend authentication endpoint is working
- Ensure CORS is properly configured

### Dashboard tests failing
- Verify user roles are correctly assigned in the database
- Check that dashboard routes are properly protected
- Ensure JWT tokens are being generated correctly

## Adding New Tests

1. Create a new test file in the appropriate directory
2. Import necessary utilities from `test-utils.js`
3. Use the provided test credentials or add new ones
4. Follow the existing test patterns for consistency

## Best Practices

1. Always clear storage before each test
2. Use appropriate wait times for async operations
3. Use descriptive test names
4. Group related tests in describe blocks
5. Clean up after tests (logout, clear data if needed)

