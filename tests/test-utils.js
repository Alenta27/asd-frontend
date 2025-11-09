/**
 * Test utilities and helper functions for Playwright tests
 */

// Test credentials
const TEST_CREDENTIALS = {
  admin: {
    email: 'alentatms27@gmail.com',
    password: '2276273',
    role: 'admin',
    expectedRoute: '/admin'
  },
  researcher: {
    email: 'alentatom02@gmail.com',
    password: '7887',
    role: 'researcher',
    expectedRoute: '/research'
  },
  parent: {
    email: 'hayestheosinclair25@gmail.com',
    password: '27102002',
    role: 'parent',
    expectedRoute: '/dashboard'
  },
  teacher: {
    email: 'alentahhhtom10@gmail.com',
    password: 'pedri',
    role: 'teacher',
    expectedRoute: '/teacher'
  },
  therapist: {
    email: 'alentatom2026@mca.ajce.in',
    password: 'alentatom16520',
    role: 'therapist',
    expectedRoute: '/therapist'
  }
};

/**
 * Login helper function
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 * @param {string} role
 */
async function login(page, email, password, role = 'parent') {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('select[value="' + role + '"], select >> text=' + role, { timeout: 10000 });
  
  // Select role
  await page.selectOption('select', role);
  
  // Fill email and password
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(/\/(admin|research|therapist|teacher|dashboard)/, { timeout: 15000 });
}

/**
 * Clear localStorage and sessionStorage
 * @param {import('@playwright/test').Page} page
 */
async function clearStorage(page) {
  try {
    // Navigate to a page first if not already on one
    const url = page.url();
    if (!url || url === 'about:blank') {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors if storage is not accessible
      }
    });
  } catch (e) {
    // Ignore errors - storage might not be accessible yet
  }
}

/**
 * Wait for API response
 * @param {import('@playwright/test').Page} page
 * @param {string} urlPattern
 * @param {number} timeout
 */
async function waitForAPIResponse(page, urlPattern, timeout = 10000) {
  await page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200,
    { timeout }
  );
}

/**
 * Check if element is visible
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
async function isVisible(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Take screenshot with timestamp
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png`, fullPage: true });
}

module.exports = {
  TEST_CREDENTIALS,
  login,
  clearStorage,
  waitForAPIResponse,
  isVisible,
  takeScreenshot
};

