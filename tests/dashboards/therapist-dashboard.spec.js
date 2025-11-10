const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, clearStorage } = require('../test-utils');

test.describe('Therapist Dashboard', () => {
  // Increase timeout for all tests in this suite
  test.setTimeout(90000);
  
  test.beforeEach(async ({ page }) => {
    const creds = TEST_CREDENTIALS.therapist;
    
    // Login as therapist
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await clearStorage(page);
    
    // Wait for form to be ready
    await page.waitForSelector('form', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Fill login form
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    
    // Click submit and wait for navigation
    await page.click('button[type="submit"]');
    
    // Wait for therapist dashboard to load (handles both navigate and reload)
    await page.waitForURL('**/therapist**', { timeout: 30000, waitUntil: 'domcontentloaded' });
    
    // Wait for page to fully load after reload
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // Wait for sidebar to appear - this is the key indicator that page loaded
    // Try multiple strategies with longer timeout
    let sidebarFound = false;
    const maxAttempts = 20;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Check if sidebar exists
        const sidebarCount = await page.locator('.sidebar').count();
        if (sidebarCount > 0) {
          // Wait for it to be visible
          await page.waitForSelector('.sidebar', { 
            timeout: 5000, 
            state: 'visible' 
          });
          sidebarFound = true;
          break;
        }
      } catch (e) {
        // Continue trying
      }
      
      // Also check for alternative selectors
      try {
        const altSelectors = [
          '.therapist-dashboard .sidebar',
          '[class*="sidebar"]',
          '.sidebar-nav'
        ];
        
        for (const selector of altSelectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            sidebarFound = true;
            break;
          }
        }
        
        if (sidebarFound) break;
      } catch (e) {
        // Continue
      }
      
      // Wait before next attempt
      await page.waitForTimeout(1000);
    }
    
    if (!sidebarFound) {
      // Final check - take screenshot and get debug info
      try {
        await page.screenshot({ path: 'test-results/therapist-dashboard-debug.png', fullPage: true });
        const bodyText = await page.locator('body').textContent().catch(() => '');
        const pageTitle = await page.title().catch(() => '');
        const currentUrl = page.url();
        const html = await page.content().catch(() => '');
        const hasSidebarInHTML = html.includes('sidebar') || html.includes('Sidebar');
        
        throw new Error(
          `Sidebar not found after ${maxAttempts} attempts. ` +
          `URL: ${currentUrl}, ` +
          `Title: ${pageTitle}, ` +
          `Has 'sidebar' in HTML: ${hasSidebarInHTML}, ` +
          `Body preview: ${bodyText?.substring(0, 300)}`
        );
      } catch (debugError) {
        throw new Error(`Sidebar not found: ${debugError.message}`);
      }
    }
    
    // Additional wait to ensure everything is stable
    await page.waitForTimeout(1000);
  });

  test('should load therapist dashboard successfully', async ({ page }) => {
    // Verify URL contains therapist
    const url = page.url();
    expect(url).toContain('therapist');
    
    // Wait for sidebar to be visible
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    
    // Wait for main content to be visible
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
    
    // Verify page has loaded
    expect(await sidebar.isVisible()).toBeTruthy();
    expect(await mainContent.isVisible()).toBeTruthy();
  });

  test('should display therapist navigation menu', async ({ page }) => {
    // Wait for sidebar navigation
    await page.waitForSelector('.sidebar-nav', { timeout: 10000 });
    
    // Look for navigation buttons
    const navButtons = [
      page.locator('.sidebar-nav button:has-text("Dashboard")'),
      page.locator('.sidebar-nav button:has-text("My Patients")'),
      page.locator('.sidebar-nav button:has-text("My Appointments")'),
      page.locator('.sidebar-nav button:has-text("Manage Slots")'),
      page.locator('.sidebar-nav button:has-text("Screening Results")')
    ];
    
    // Check if navigation buttons exist
    let totalNavItems = 0;
    for (const navButton of navButtons) {
      const count = await navButton.count();
      totalNavItems += count;
    }
    
    // Should have at least 5 navigation items
    expect(totalNavItems).toBeGreaterThanOrEqual(5);
  });

  test('should navigate to patients page', async ({ page }) => {
    // Wait for navigation to be ready
    await page.waitForSelector('.sidebar-nav', { timeout: 10000 });
    
    // Look for "My Patients" button
    const patientsButton = page.locator('.sidebar-nav button:has-text("My Patients")');
    
    // Wait for button to be visible
    await expect(patientsButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click the button
    await patientsButton.first().click();
    
    // Wait for navigation
    await page.waitForURL('**/therapist/patients**', { timeout: 15000 });
    
    // Verify URL
    const url = page.url();
    expect(url).toContain('/therapist/patients');
  });

  test('should navigate to appointments page', async ({ page }) => {
    // Wait for navigation to be ready
    await page.waitForSelector('.sidebar-nav', { timeout: 10000 });
    
    // Look for "My Appointments" button
    const appointmentsButton = page.locator('.sidebar-nav button:has-text("My Appointments")');
    
    // Wait for button to be visible
    await expect(appointmentsButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click the button
    await appointmentsButton.first().click();
    
    // Wait for navigation
    await page.waitForURL('**/therapist/appointments**', { timeout: 15000 });
    
    // Verify URL
    const url = page.url();
    expect(url).toContain('/therapist/appointments');
  });

  test('should navigate to questionnaires page', async ({ page }) => {
    // Wait for navigation to be ready
    await page.waitForSelector('.sidebar-nav', { timeout: 10000 });
    
    // Look for "Screening Results" button (which navigates to questionnaires)
    const screeningButton = page.locator('.sidebar-nav button:has-text("Screening Results")');
    
    // Wait for button to be visible
    await expect(screeningButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click the button
    await screeningButton.first().click();
    
    // Wait for navigation to questionnaires page
    await page.waitForURL('**/therapist/questionnaires**', { timeout: 15000 });
    
    // Verify URL
    const url = page.url();
    expect(url).toContain('questionnaire');
  });

  test('should navigate to slot management page', async ({ page }) => {
    // Wait for navigation to be ready
    await page.waitForSelector('.sidebar-nav', { timeout: 10000 });
    
    // Look for "Manage Slots" button
    const slotsButton = page.locator('.sidebar-nav button:has-text("Manage Slots")');
    
    // Wait for button to be visible
    await expect(slotsButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click the button
    await slotsButton.first().click();
    
    // Wait for navigation
    await page.waitForURL('**/therapist/slots**', { timeout: 15000 });
    
    // Verify URL
    const url = page.url();
    expect(url).toContain('/therapist/slots');
  });

  test('should display patient information or list', async ({ page }) => {
    // Wait for main content to load
    await page.waitForSelector('.main-content', { timeout: 10000 });
    
    // Look for dashboard content elements
    const dashboardElements = [
      page.locator('.main-content h1, .main-content h2, .main-content h3'),
      page.locator('.main-content .welcome-title, .main-content .section-title'),
      page.locator('.main-content .appointment-card, .main-content .activity-card'),
      page.locator('.main-content .content-section')
    ];
    
    // At least one dashboard element should exist
    let totalElements = 0;
    for (const element of dashboardElements) {
      const count = await element.count();
      totalElements += count;
    }
    
    // Should have some content
    expect(totalElements).toBeGreaterThan(0);
    
    // Main content should be visible
    const mainContent = page.locator('.main-content');
    expect(await mainContent.isVisible()).toBeTruthy();
  });

  test('should have logout functionality', async ({ page }) => {
    // Wait for sidebar footer to load
    await page.waitForSelector('.sidebar-footer', { timeout: 10000 });
    
    // Look for logout button in sidebar footer
    const logoutButton = page.locator('.sidebar-footer button.logout-btn, .sidebar-footer button:has-text("Logout")');
    
    // Wait for button to be visible
    await expect(logoutButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click logout
    await logoutButton.first().click();
    
    // Wait for navigation after logout (should go to home page '/')
    await page.waitForURL(/\/(login|$)/, { timeout: 15000 });
    
    // Verify URL - should be home page or login
    const url = page.url();
    expect(url === 'http://localhost:3000/' || url.endsWith('/') || url.includes('login')).toBeTruthy();
  });
});
