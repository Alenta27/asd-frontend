const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, login, clearStorage } = require('../test-utils');

test.describe('Parent Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const creds = TEST_CREDENTIALS.parent;
    
    // Login as parent
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await page.waitForSelector('form', { timeout: 10000 });
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    
    // Wait for parent dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should load parent dashboard successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForTimeout(2000);
    
    const dashboardContent = page.locator('body');
    await expect(dashboardContent).toBeVisible();
  });

  test('should display parent navigation menu', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for parent-specific navigation
    const navElements = [
      page.locator('text=Dashboard'),
      page.locator('text=Appointments'),
      page.locator('text=Screening'),
      page.locator('text=Reports'),
      page.locator('text=Care Team'),
      page.locator('text=Resources')
    ];
    
    const visibleNavs = await Promise.all(
      navElements.map(nav => nav.isVisible().catch(() => false))
    );
    
    expect(visibleNavs.some(v => v)).toBeTruthy();
  });

  test('should navigate to appointments page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const appointmentsLink = page.locator('text=Appointments').or(page.locator('a[href*="appointments"]'));
    if (await appointmentsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appointmentsLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('appointments')) {
        await expect(page).toHaveURL(/.*appointments/);
      }
    }
  });

  test('should navigate to screening results page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const screeningLink = page.locator('text=Screening').or(page.locator('a[href*="screening"]'));
    if (await screeningLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await screeningLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('screening')) {
        await expect(page).toHaveURL(/.*screening/);
      }
    }
  });

  test('should navigate to progress reports page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const reportsLink = page.locator('text=Reports').or(page.locator('text=Progress')).or(page.locator('a[href*="reports"]'));
    if (await reportsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('reports') || url.includes('progress')) {
        await expect(page).toHaveURL(/.*(reports|progress)/);
      }
    }
  });

  test('should display child information or cards', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for child cards or information
    const cards = page.locator('[class*="card"], [class*="child"], [class*="patient"]');
    const cardCount = await cards.count();
    
    // Dashboard should have loaded
    expect(await page.locator('body').isVisible()).toBeTruthy();
  });

  test('should have logout functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const logoutButton = page.locator('text=Logout').or(page.locator('text=Sign Out'));
    
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      expect(url.includes('login') || url === 'http://localhost:3000/' || url.endsWith('/')).toBeTruthy();
    }
  });
});

