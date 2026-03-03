// Simple Selenium smoke tests for Cortex login flows
// Runs in Node: npm run test:selenium

const { Builder, By, until } = require('selenium-webdriver');

const BASE_URL = 'http://localhost:3000';

const USERS = [
  {
    label: 'Admin',
    role: 'admin',
    email: 'admin',
    password: '2276273',
    expectedPath: '/admin',
  },
  {
    label: 'Researcher',
    role: 'researcher',
    email: 'alentatom02@gmail.com',
    password: '7887',
    expectedPath: '/research',
  },
  {
    label: 'Parent',
    role: 'parent',
    email: 'hayestheosinclair25@gmail.com',
    password: '27102002',
    expectedPath: '/dashboard',
  },
  {
    label: 'Therapist',
    role: 'therapist',
    email: 'alentatom2026@mca.ajce.in',
    password: 'alentatom16520',
    expectedPath: '/therapist',
  },
  {
    label: 'Teacher',
    role: 'teacher',
    email: 'alentahhhtom10@gmail.com',
    password: 'pedri',
    expectedPath: '/teacher',
  },
];

async function loginAndCheck(driver, user) {
  console.log(`\n=== ${user.label} login test ===`);

  await driver.get(`${BASE_URL}/login`);

  // Select role from "Login as" dropdown (admin uses default)
  const roleSelect = await driver.wait(
    until.elementLocated(By.css('select')),
    10000
  );
  if (['parent', 'therapist', 'researcher', 'teacher'].includes(user.role)) {
    await roleSelect.click();
    const option = await driver.findElement(
      By.css(`select option[value="${user.role}"]`)
    );
    await option.click();
  }

  // Fill email
  const emailInput = await driver.findElement(By.css('input[type="email"]'));
  await emailInput.clear();
  await emailInput.sendKeys(user.email);

  // Fill password
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  await passwordInput.clear();
  await passwordInput.sendKeys(user.password);

  // Submit form (button with type=submit)
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();

  // Wait for navigation
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes(user.expectedPath) || url.includes('/select-role');
  }, 15000);

  const currentUrl = await driver.getCurrentUrl();

  if (currentUrl.includes(user.expectedPath)) {
    console.log(`✅ ${user.label} login passed → ${currentUrl}`);
  } else if (currentUrl.includes('/select-role')) {
    console.log(
      `⚠️ ${user.label} redirected to /select-role (likely Google login guest or first-time user). URL: ${currentUrl}`
    );
  } else {
    console.log(`❌ ${user.label} login did not reach expected route. URL: ${currentUrl}`);
  }
}

(async function run() {
  // Use Chrome; you can change to 'edge' or 'firefox' if needed
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    for (const user of USERS) {
      try {
        await loginAndCheck(driver, user);
      } catch (err) {
        console.error(`Selenium test error for ${user.label}:`, err.message || err);
      }
    }
  } catch (err) {
    console.error('Selenium test run error:', err);
  } finally {
    await driver.quit();
  }
})();

