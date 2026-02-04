import { test, expect } from '@playwright/test';

// Generate unique email for each test run to avoid conflicts
const generateTestEmail = () => `e2e-test-${Date.now()}@example.com`;

test.describe('Authentication Flow', () => {
  test.describe('Registration', () => {
    test('should show validation errors on empty form submission', async ({ page }) => {
      await page.goto('/register');

      // Click submit without filling form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.getByText('Nom requis')).toBeVisible();
      await expect(page.getByText('Email requis')).toBeVisible();
      await expect(page.getByText('Mot de passe requis')).toBeVisible();
      await expect(page.getByText('Vous devez accepter les conditions')).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[placeholder="Jean Dupont"]', 'Test User');
      // Use email that passes HTML5 but fails our regex (no TLD)
      await page.fill('input[placeholder="exemple@email.com"]', 'test@domain');
      await page.fill('input[placeholder="••••••••"]', 'password123');
      await page.click('input[type="checkbox"]');

      await page.click('button[type="submit"]');

      await expect(page.getByText('Email invalide')).toBeVisible({ timeout: 5000 });
    });

    test('should successfully register a new user', async ({ page }) => {
      const testEmail = generateTestEmail();
      
      await page.goto('/register');

      await page.fill('input[placeholder="Jean Dupont"]', 'E2E Test User');
      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', 'password123');
      await page.click('input[type="checkbox"]');

      await page.click('button[type="submit"]');

      // Should show loading state
      await expect(page.getByText('Création en cours...')).toBeVisible();

      // Should redirect to home after successful registration
      await page.waitForURL('/');
      expect(page.url()).toContain('/');
    });

    test('should show error when registering with existing email', async ({ page }) => {
      // First, register a user
      const testEmail = generateTestEmail();
      
      await page.goto('/register');
      await page.fill('input[placeholder="Jean Dupont"]', 'First User');
      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', 'password123');
      await page.click('input[type="checkbox"]');
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      // Clear cookies and try to register with same email
      await page.context().clearCookies();
      await page.goto('/register');

      await page.fill('input[placeholder="Jean Dupont"]', 'Second User');
      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', 'password123');
      await page.click('input[type="checkbox"]');
      await page.click('button[type="submit"]');

      // Should show conflict error
      await expect(page.getByText(/already exists|User with this email/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Login', () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    test.beforeAll(async ({ browser }) => {
      // Register a user for login tests
      const page = await browser.newPage();
      await page.goto('/register');
      await page.fill('input[placeholder="Jean Dupont"]', 'Login Test User');
      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', testPassword);
      await page.click('input[type="checkbox"]');
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
      await page.close();
    });

    test('should show validation errors on empty form submission', async ({ page }) => {
      await page.goto('/login');

      await page.click('button[type="submit"]');

      await expect(page.getByText('Email requis')).toBeVisible();
      await expect(page.getByText('Mot de passe requis')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[placeholder="exemple@email.com"]', 'nonexistent@example.com');
      await page.fill('input[placeholder="••••••••"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.getByText(/Invalid credentials|Identifiants invalides/i)).toBeVisible({ timeout: 10000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', testPassword);

      await page.click('button[type="submit"]');

      // Should show loading state
      await expect(page.getByText('Connexion...')).toBeVisible();

      // Should redirect to home after successful login
      await page.waitForURL('/');
      expect(page.url()).toContain('/');
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('input[placeholder="••••••••"]');
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await page.click('button[type="button"]');
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await page.click('button[type="button"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Complete Auth Flow', () => {
    test('should complete full register -> login -> access protected area flow', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = 'securePassword123';

      // Step 1: Register
      await page.goto('/register');
      await page.fill('input[placeholder="Jean Dupont"]', 'Full Flow User');
      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', testPassword);
      await page.click('input[type="checkbox"]');
      await page.click('button[type="submit"]');

      // Wait for registration to complete
      await page.waitForURL('/');

      // Step 2: Clear cookies to simulate logout
      await page.context().clearCookies();

      // Step 3: Login with registered credentials
      await page.goto('/login');
      await page.fill('input[placeholder="exemple@email.com"]', testEmail);
      await page.fill('input[placeholder="••••••••"]', testPassword);
      await page.click('button[type="submit"]');

      // Should redirect to home after login
      await page.waitForURL('/');

      // Step 4: Verify we're authenticated (check for cookies)
      const cookies = await page.context().cookies();
      const accessToken = cookies.find(c => c.name === 'access_token');
      const refreshToken = cookies.find(c => c.name === 'refresh_token');

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });
  });

  test.describe('Navigation', () => {
    test('should have working links between login and register pages', async ({ page }) => {
      // Start at login page
      await page.goto('/login');
      
      // Click link to register
      await page.click('a[href="/register"]');
      await expect(page).toHaveURL('/register');

      // Click link back to login
      await page.click('a[href="/login"]');
      await expect(page).toHaveURL('/login');
    });

    test('should have forgot password link on login page', async ({ page }) => {
      await page.goto('/login');
      
      const forgotPasswordLink = page.getByText(/mot de passe oublié/i);
      await expect(forgotPasswordLink).toBeVisible();
      await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    test('should have terms and privacy links on register page', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('a[href="/terms"]')).toBeVisible();
      await expect(page.locator('a[href="/privacy"]')).toBeVisible();
    });
  });
});
