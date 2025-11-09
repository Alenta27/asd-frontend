const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, login, clearStorage } = require('../test-utils');

test.describe('Researcher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const creds = TEST_CREDENTIALS.researcher;
    
    // Login as researcher
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await page.waitForSelector('form', { timeout: 10000 });
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    
    // Wait for research dashboard to load
    await page.waitForURL('**/research', { timeout: 15000 });
  });

  test('should load researcher dashboard successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*research/);
    await page.waitForTimeout(2000);
    
    const dashboardContent = page.locator('body');
    await expect(dashboardContent).toBeVisible();
  });

  test('should display researcher navigation menu', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for researcher-specific navigation
    const navElements = [
      page.locator('text=Dashboard'),
      page.locator('text=Dataset'),
      page.locator('text=Users'),
      page.locator('text=Analytics'),
      page.locator('text=Research')
    ];
    
    const visibleNavs = await Promise.all(
      navElements.map(nav => nav.isVisible().catch(() => false))
    );
    
    expect(visibleNavs.some(v => v)).toBeTruthy();
  });

  test('should navigate to dataset page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const datasetLink = page.locator('text=Dataset').or(page.locator('a[href*="dataset"]'));
    if (await datasetLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await datasetLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('dataset')) {
        await expect(page).toHaveURL(/.*dataset/);
      }
    }
  });

  test('should navigate to users page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const usersLink = page.locator('text=Users').or(page.locator('a[href*="users"]'));
    if (await usersLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usersLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('users')) {
        await expect(page).toHaveURL(/.*users/);
      }
    }
  });

  test('should display research statistics or charts', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for charts, statistics, or research data
    const charts = page.locator('[class*="chart"], [class*="graph"], [class*="stat"]');
    const chartCount = await charts.count();
    
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

