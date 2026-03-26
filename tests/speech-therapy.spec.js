const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, clearStorage } = require('./test-utils');

async function loginAs(page, creds) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await clearStorage(page);
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('form', { timeout: 15000 });
  await page.selectOption('select', creds.role);
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
}

test.describe('Speech Therapy Module', () => {
  test.setTimeout(90000);

  test('therapist can open speech therapy dashboard and switch tabs', async ({ page }) => {
    const creds = TEST_CREDENTIALS.therapist;
    await loginAs(page, creds);

    await page.waitForURL('**/therapist**', { timeout: 30000 });
    const speechTherapyNav = page.locator('.sidebar-nav button:has-text("Speech Therapy")').first();
    if (await speechTherapyNav.count()) {
      await speechTherapyNav.click();
    } else {
      await page.goto('/therapist/speech-therapy', { waitUntil: 'commit' });
    }
    await page.waitForURL('**/therapist/speech-therapy', { timeout: 30000 });

    await expect(
      page.getByRole('heading', { name: /Extended Speech Therapy Evaluation Dashboard/i })
    ).toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('button', { name: /Pending Reviews/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Progress Analytics/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Therapy Types Management/i })).toBeVisible();

    await page.getByRole('button', { name: /Progress Analytics/i }).click();
    await expect(page.getByText(/Select Child/i)).toBeVisible();

    await page.getByRole('button', { name: /Therapy Types Management/i }).click();
    await expect(page.getByRole('heading', { name: 'Pronunciation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Articulation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fluency' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'VoiceQuality' })).toBeVisible();
  });

  test('teacher can open speech therapy dashboard', async ({ page }) => {
    const creds = TEST_CREDENTIALS.teacher;
    await loginAs(page, creds);

    await page.waitForURL('**/teacher**', { timeout: 30000 });
    const speechTherapyNav = page.locator('.sidebar-nav button:has-text("Speech Therapy")').first();
    if (await speechTherapyNav.count()) {
      await speechTherapyNav.click();
    } else {
      await page.goto('/teacher/speech-therapy', { waitUntil: 'commit' });
    }
    await page.waitForURL('**/teacher/speech-therapy', { timeout: 30000 });

    await expect(
      page.getByRole('heading', { name: /Extended Speech Therapy Evaluation Dashboard/i })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /Pending Reviews/i })).toBeVisible();
  });
});
