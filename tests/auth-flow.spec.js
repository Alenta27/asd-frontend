const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, clearStorage } = require('./test-utils');

test.describe('Complete Authentication Flow', () => {
  test('should complete full authentication flow for all user roles', async ({ page }) => {
    // Test each user role
    const roles = ['admin', 'researcher', 'parent', 'teacher', 'therapist'];
    
    for (const role of roles) {
      const creds = TEST_CREDENTIALS[role];
      
      // Navigate to login first
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await clearStorage(page);
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Fill login form
      // For admin, use 'parent' role since admin is not in dropdown (backend allows admin to login with any role)
      const roleToSelect = role === 'admin' ? 'parent' : creds.role;
      await page.selectOption('select', roleToSelect);
      await page.fill('input[type="email"]', creds.email);
      await page.fill('input[type="password"]', creds.password);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('**' + creds.expectedRoute, { timeout: 15000 });
      await expect(page).toHaveURL(new RegExp(creds.expectedRoute.replace('/', '\\/'), 'i'));
      
      // Verify we're on the correct dashboard
      await page.waitForTimeout(2000);
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Logout for next iteration
      try {
        const logoutButton = page.locator('text=Logout').or(page.locator('text=Sign Out')).first();
        if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click and wait for navigation
          await Promise.race([
            logoutButton.click(),
            page.waitForURL(/\/(login|$)/, { timeout: 5000 })
          ]).catch(() => {
            // If logout doesn't navigate, that's okay - continue to next test
          });
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // If logout fails, clear storage and continue
        await clearStorage(page);
      }
    }
  });

  test('should handle navigation from home to login to dashboard', async ({ page }) => {
    const creds = TEST_CREDENTIALS.parent;
    
    // Start at home
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await expect(page).toHaveURL(/\/$/);
    
    // Click login
    await page.click('text=Login');
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // Login
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle navigation from home to register', async ({ page }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await expect(page).toHaveURL(/\/$/);
    
    // Click register
    await page.click('text=Register');
    await page.waitForURL('**/register', { timeout: 10000 });
    await expect(page).toHaveURL(/.*register/);
    
    // Should see registration form
    await expect(page.locator('text=Create Your Account')).toBeVisible();
  });
});

