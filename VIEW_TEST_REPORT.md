# View Playwright Test Reports

## Quick Access

### Option 1: Open HTML Report File
```bash
cd frontend
start playwright-report\index.html
```

### Option 2: Start Interactive Report Server
```bash
cd frontend
npx playwright show-report
```
Then open: **http://localhost:9323**

### Option 3: Use the Batch File
```bash
cd frontend
open-test-report.bat
```

## Report Features

The HTML report shows:
- ✅ **Test Results** - Pass/fail status for all 66 tests
- 📊 **Test Statistics** - Total tests, passed, failed, duration
- 📸 **Screenshots** - Automatic screenshots for failed tests
- 🎥 **Videos** - Video recordings of test executions
- 🔍 **Detailed Logs** - Step-by-step execution logs
- 📈 **Timeline** - Test execution timeline
- 🐛 **Error Details** - Stack traces and error messages

## Test Categories

1. **Home Page Tests** (7 tests)
2. **Registration Tests** (9 tests)
3. **Login Tests** (12 tests) - All 5 user roles
4. **Admin Dashboard Tests** (8 tests)
5. **Researcher Dashboard Tests** (6 tests)
6. **Parent Dashboard Tests** (7 tests)
7. **Teacher Dashboard Tests** (7 tests)
8. **Therapist Dashboard Tests** (8 tests)
9. **Authentication Flow Tests** (3 tests)

## Current Test Status

Run tests to see current status:
```bash
cd frontend
npm run test:e2e
```

View report:
```bash
npm run test:e2e:report
```

## Report Location

- **HTML Report**: `frontend/playwright-report/index.html`
- **Test Results**: `frontend/test-results/`
- **Screenshots**: `frontend/test-results/*/test-failed-*.png`
- **Videos**: `frontend/test-results/*/video.webm`







