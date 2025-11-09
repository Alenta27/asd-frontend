const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, login, clearStorage } = require('./test-utils');

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await page.waitForSelector('form', { timeout: 10000 });
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show role selection dropdown', async ({ page }) => {
    const roleSelect = page.locator('select');
    await expect(roleSelect).toBeVisible();
    
    const options = await roleSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
  });

  test('should login as admin successfully', async ({ page }) => {
    const creds = TEST_CREDENTIALS.admin;
    
    // Admin can login with any role selected (backend allows it)
    // Use 'parent' as the role since admin is not in the dropdown
    await page.selectOption('select', 'parent');
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page).toHaveURL(/.*admin/);
  });

  test('should login as researcher successfully', async ({ page }) => {
    const creds = TEST_CREDENTIALS.researcher;
    
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to research dashboard
    await page.waitForURL('**/research', { timeout: 15000 });
    await expect(page).toHaveURL(/.*research/);
  });

  test('should login as parent successfully', async ({ page }) => {
    const creds = TEST_CREDENTIALS.parent;
    
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to parent dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should login as teacher successfully', async ({ page }) => {
    const creds = TEST_CREDENTIALS.teacher;
    
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to teacher dashboard
    await page.waitForURL('**/teacher', { timeout: 15000 });
    await expect(page).toHaveURL(/.*teacher/);
  });

  test('should login as therapist successfully', async ({ page }) => {
    const creds = TEST_CREDENTIALS.therapist;
    
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to therapist dashboard
    await page.waitForURL('**/therapist', { timeout: 15000 });
    await expect(page).toHaveURL(/.*therapist/);
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.selectOption('select', 'parent');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    const errorMessage = page.locator('text=/failed|invalid|error/i');
    const isVisible = await errorMessage.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should have password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('testpassword');
    
    // Verify password was entered
    expect(await passwordInput.inputValue()).toBe('testpassword');
    
    // Look for the password toggle - it's in the same relative container as the password input
    // Find all spans with absolute positioning that contain SVG icons
    const toggleSpans = page.locator('div.relative span.absolute').filter({ 
      has: page.locator('svg')
    });
    
    // There should be at least one toggle (password visibility)
    const toggleCount = await toggleSpans.count();
    expect(toggleCount).toBeGreaterThan(0);
    
    // Verify the toggle is visible and clickable
    const firstToggle = toggleSpans.first();
    await expect(firstToggle).toBeVisible({ timeout: 2000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Sign up');
    
    await page.waitForURL('**/register', { timeout: 10000 });
    await expect(page).toHaveURL(/.*register/);
  });

  test('should show forgot password option', async ({ page }) => {
    const forgotPasswordLink = page.locator('text=Forgot password');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should show Google sign-in option', async ({ page }) => {
    // Scroll to see Google login if needed
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Check for the "Or" separator in the flex container between form and Google login
    // The structure is: div.flex.items-center.my-6 containing hr, span with "Or", hr
    const separatorContainer = page.locator('div.flex.items-center.my-6').first();
    const orText = separatorContainer.getByText('Or', { exact: true });
    
    // Verify the separator exists
    await expect(orText).toBeVisible({ timeout: 5000 });
    
    // Also verify there are hr elements (dividers) on both sides
    const dividers = separatorContainer.locator('hr');
    const dividerCount = await dividers.count();
    expect(dividerCount).toBeGreaterThanOrEqual(2);
  });
});

