@echo off
echo Opening Playwright Test Report...
cd /d "%~dp0"
if exist "playwright-report\index.html" (
    start playwright-report\index.html
    echo Report opened in browser
) else (
    echo Report not found. Running tests first...
    npx playwright test --reporter=html
    if exist "playwright-report\index.html" (
        start playwright-report\index.html
    ) else (
        echo Starting report server...
        npx playwright show-report
    )
)
pause





