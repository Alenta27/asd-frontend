const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, clearStorage } = require('../test-utils');

test.describe('Teacher Behavioral Assessment', () => {
  test.beforeEach(async ({ page }) => {
    const creds = TEST_CREDENTIALS.teacher;

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await clearStorage(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('form', { timeout: 10000 });
    await page.selectOption('select', creds.role);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher', { timeout: 20000 });
  });

  test('should open teacher behavioral assessments page', async ({ page }) => {
    await page.getByRole('button', { name: /behavioral assessments/i }).click();
    await page.waitForURL('**/teacher/assessments', { timeout: 15000 });

    await expect(page.getByRole('heading', { name: /behavioral assessments/i })).toBeVisible();
    await expect(page.getByText(/game-based screening and diagnostic tools/i)).toBeVisible();
  });

  test('should open a specific assessment detail page', async ({ page }) => {
    await page.getByRole('button', { name: /behavioral assessments/i }).click();
    await page.waitForURL('**/teacher/assessments', { timeout: 15000 });

    await page.getByText('Emotion Match', { exact: true }).first().click();
    await page.waitForURL('**/teacher/assessments/emotion-match', { timeout: 15000 });

    await expect(page.getByText(/back to tools/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /emotion match/i })).toBeVisible();
  });
});
