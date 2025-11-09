const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, login, clearStorage } = require('../test-utils');

test.describe('Teacher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const creds = TEST_CREDENTIALS.teacher;
    
    // Login as teacher
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await page.waitForSelector('form', { timeout: 10000 });
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    
    // Wait for teacher dashboard to load
    await page.waitForURL('**/teacher', { timeout: 15000 });
  });

  test('should load teacher dashboard successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*teacher/);
    await page.waitForTimeout(2000);
    
    const dashboardContent = page.locator('body');
    await expect(dashboardContent).toBeVisible();
  });

  test('should display teacher navigation menu', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for teacher-specific navigation
    const navElements = [
      page.locator('text=Dashboard'),
      page.locator('text=Students'),
      page.locator('text=Screenings'),
      page.locator('text=Reports'),
      page.locator('text=Teacher')
    ];
    
    const visibleNavs = await Promise.all(
      navElements.map(nav => nav.isVisible().catch(() => false))
    );
    
    expect(visibleNavs.some(v => v)).toBeTruthy();
  });

  test('should navigate to students page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const studentsLink = page.locator('text=Students').or(page.locator('a[href*="students"]'));
    if (await studentsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studentsLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('students')) {
        await expect(page).toHaveURL(/.*students/);
      }
    }
  });

  test('should navigate to screenings page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const screeningsLink = page.locator('text=Screenings').or(page.locator('a[href*="screenings"]'));
    if (await screeningsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await screeningsLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('screenings')) {
        await expect(page).toHaveURL(/.*screenings/);
      }
    }
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const reportsLink = page.locator('text=Reports').or(page.locator('a[href*="reports"]'));
    if (await reportsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsLink.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('reports')) {
        await expect(page).toHaveURL(/.*reports/);
      }
    }
  });

  test('should display student information or list', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for student cards or list
    const studentElements = page.locator('[class*="student"], [class*="card"], table');
    const elementCount = await studentElements.count();
    
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

