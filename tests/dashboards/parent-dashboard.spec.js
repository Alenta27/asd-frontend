const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, clearStorage } = require('../test-utils');

test.describe('Parent Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const creds = TEST_CREDENTIALS.parent;
    
    // Login as parent
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await clearStorage(page);
    await page.waitForSelector('form', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Fill login form
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    // Wait for API response to ensure login succeeds
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/login') && resp.status() === 200,
      { timeout: 30000 }
    ).catch(() => null); // Don't fail if API response times out
    
    // Also wait for navigation as the primary indicator of success
    const navigationPromise = page.waitForURL('**/dashboard', { 
      timeout: 40000,
      waitUntil: 'domcontentloaded'
    });
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait for either navigation OR API response (whichever comes first)
    // Navigation is the primary indicator of success
    await Promise.race([
      navigationPromise,
      responsePromise.then(() => page.waitForURL('**/dashboard', { timeout: 20000, waitUntil: 'domcontentloaded' }))
    ]).catch(async () => {
      // If both fail, wait a bit and check URL
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      if (!currentUrl.includes('dashboard')) {
        // Try navigating directly if we have a token
        const token = await page.evaluate(() => localStorage.getItem('token'));
        if (token) {
          await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
        }
      }
    });
    
    // Wait for page to fully load after reload
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // Verify we're on the dashboard
    const url = page.url();
    if (!url.includes('dashboard')) {
      throw new Error(`Expected to be on dashboard, but was on ${url}`);
    }
  });

  test('should load parent dashboard successfully', async ({ page }) => {
    // Verify URL
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Check for main dashboard elements
    const welcomeText = page.locator('text=/Welcome/i');
    const hasWelcome = await welcomeText.count() > 0;
    
    // Dashboard should have loaded with content
    expect(await page.locator('body').isVisible()).toBeTruthy();
    expect(hasWelcome || await page.locator('h1, h2').count() > 0).toBeTruthy();
  });

  test('should display parent navigation menu', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Look for navigation buttons in sidebar
    // Navigation uses buttons with text: Dashboard, Appointments, Screening Results, Progress Reports, Care Team, Resources
    const navButtons = [
      page.locator('button:has-text("Dashboard")'),
      page.locator('button:has-text("Appointments")'),
      page.locator('button:has-text("Screening Results")'),
      page.locator('button:has-text("Progress Reports")'),
      page.locator('button:has-text("Care Team")'),
      page.locator('button:has-text("Resources")')
    ];
    
    // Check if at least some navigation items exist
    let totalNavItems = 0;
    for (const navButton of navButtons) {
      const count = await navButton.count();
      totalNavItems += count;
    }
    
    // Should have at least 3 navigation items (some might be visible)
    expect(totalNavItems).toBeGreaterThanOrEqual(3);
  });

  test('should navigate to appointments page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Look for "Appointments" button in navigation
    const appointmentsButton = page.locator('button:has-text("Appointments")');
    
    // Wait for button to be available
    const buttonExists = await appointmentsButton.count() > 0;
    expect(buttonExists).toBeTruthy();
    
    if (buttonExists) {
      await appointmentsButton.first().click();
      await page.waitForTimeout(2000);
      
      // Wait for navigation
      await page.waitForURL('**/parent/appointments**', { timeout: 15000 }).catch(async () => {
        await page.waitForTimeout(2000);
      });
      
      // Verify URL
      const url = page.url();
      expect(url).toContain('appointments');
    }
  });

  test('should navigate to screening results page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Look for "Screening Results" button in navigation
    const screeningButton = page.locator('button:has-text("Screening Results")');
    
    // Wait for button to be available
    const buttonExists = await screeningButton.count() > 0;
    expect(buttonExists).toBeTruthy();
    
    if (buttonExists) {
      await screeningButton.first().click();
      await page.waitForTimeout(2000);
      
      // Wait for navigation
      await page.waitForURL('**/parent/screening-results**', { timeout: 15000 }).catch(async () => {
        await page.waitForTimeout(2000);
      });
      
      // Verify URL
      const url = page.url();
      expect(url).toContain('screening');
    }
  });

  test('should navigate to progress reports page', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Look for "Progress Reports" button in navigation
    const reportsButton = page.locator('button:has-text("Progress Reports")');
    
    // Wait for button to be available
    const buttonExists = await reportsButton.count() > 0;
    expect(buttonExists).toBeTruthy();
    
    if (buttonExists) {
      await reportsButton.first().click();
      await page.waitForTimeout(2000);
      
      // Wait for navigation
      await page.waitForURL('**/parent/progress-reports**', { timeout: 15000 }).catch(async () => {
        await page.waitForTimeout(2000);
      });
      
      // Verify URL
      const url = page.url();
      expect(url.includes('reports') || url.includes('progress')).toBeTruthy();
    }
  });

  test('should display child information or cards', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Look for dashboard content - could be child cards, welcome message, or summary stats
    const dashboardElements = [
      page.locator('text=/Your Children|Welcome|Summary|Upcoming/i'),
      page.locator('[class*="card"], [class*="child"], [class*="rounded-xl"]'),
      page.locator('h1, h2, h3')
    ];
    
    // At least one dashboard element should exist
    let totalElements = 0;
    for (const element of dashboardElements) {
      const count = await element.count();
      totalElements += count;
    }
    
    // Dashboard should have loaded with some content
    expect(await page.locator('body').isVisible()).toBeTruthy();
    expect(totalElements).toBeGreaterThan(0);
  });

  test('should have logout functionality', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Look for logout button - it's in the sidebar footer
    const logoutButton = page.locator('button:has-text("Logout")');
    
    // Wait for button to be available
    const buttonExists = await logoutButton.count() > 0;
    expect(buttonExists).toBeTruthy();
    
    if (buttonExists) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);
      
      // Wait for navigation after logout (should go to home page '/')
      await page.waitForURL(/\/(login|$)/, { timeout: 15000 }).catch(async () => {
        await page.waitForTimeout(2000);
      });
      
      // Verify URL - should be home page or login
      const url = page.url();
      expect(url === 'http://localhost:3000/' || url.endsWith('/') || url.includes('login')).toBeTruthy();
    }
  });
});

