# Quick Guide: Running All Playwright Tests

## 🚀 Quick Start

### Run All Tests (Including Screening CNN & SVM)
```bash
cd frontend
npx playwright test --reporter=html
```

### View Test Report
```bash
cd frontend
npx playwright show-report
```

Or open directly:
```bash
cd frontend
start playwright-report\index.html
```

## 📋 Test Suites Included

1. ✅ **Home Page** - Navigation and UI elements
2. ✅ **Registration** - Form validation and submission
3. ✅ **Login** - Authentication for all 5 user roles
4. ✅ **Authentication Flow** - Complete login flow for all users
5. ✅ **Admin Dashboard** - Admin-specific features
6. ✅ **Researcher Dashboard** - Researcher features
7. ✅ **Parent Dashboard** - Parent features
8. ✅ **Teacher Dashboard** - Teacher features
9. ✅ **Therapist Dashboard** - Therapist features
10. ✅ **Screening Tests (CNN & SVM)** - 24 comprehensive tests covering:
    - Facial Image Screening (CNN Module)
    - Voice Screening Module
    - MRI Screening (SVM Module)
    - Screening Tools Navigation
    - Complete Workflow Tests

## 🎯 Total Test Coverage

**~56+ tests** covering:
- Home page functionality
- User registration
- User login (all 5 roles)
- All 5 user dashboards
- Screening test submission (CNN & SVM modules)

## ⚙️ Configuration

The tests automatically:
- Start the frontend server (`http://localhost:3000`)
- Use test credentials from `test-utils.js`
- Capture screenshots on failure
- Record videos on failure
- Generate HTML reports

## 📊 Viewing Results

After tests complete:
1. HTML report is automatically generated in `playwright-report/`
2. Open `playwright-report/index.html` in your browser
3. Or run `npx playwright show-report` to start a local server

## 🔧 Troubleshooting

If tests fail:
1. Ensure backend server is running on `http://localhost:5000`
2. Check database has test user accounts
3. Review screenshots and videos in the HTML report
4. Check test-results folder for detailed error information


