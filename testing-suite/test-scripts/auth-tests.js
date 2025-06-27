/**
 * Authentication Tests for RivoHome Platform
 * 
 * Tests all authentication flows including registration, login, 
 * password reset, and role-based redirects.
 */

const { test, expect } = require('@playwright/test');

class AuthTests {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  // Test user registration flows
  async testUserRegistration() {
    console.log('🧪 Testing User Registration Flows...');
    
    // Test homeowner registration
    await this.testHomeownerRegistration();
    
    // Test provider registration  
    await this.testProviderRegistration();
    
    // Test registration validation
    await this.testRegistrationValidation();
  }

  async testHomeownerRegistration() {
    console.log('📝 Testing homeowner registration...');
    
    await this.page.goto(`${this.baseUrl}/sign-up`);
    
    // Fill registration form
    await this.page.fill('[data-testid="email-input"]', 'test-homeowner@example.com');
    await this.page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await this.page.click('[data-testid="role-homeowner"]');
    await this.page.click('[data-testid="submit-button"]');
    
    // Should redirect to homeowner onboarding
    await this.page.waitForURL('**/onboarding');
    console.log('✅ Homeowner registration successful - redirected to onboarding');
  }

  async testProviderRegistration() {
    console.log('📝 Testing provider registration...');
    
    await this.page.goto(`${this.baseUrl}/sign-up`);
    
    // Fill registration form for provider
    await this.page.fill('[data-testid="email-input"]', 'test-provider@example.com');
    await this.page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await this.page.click('[data-testid="role-provider"]');
    await this.page.click('[data-testid="submit-button"]');
    
    // Should redirect to provider onboarding
    await this.page.waitForURL('**/provider-onboarding');
    console.log('✅ Provider registration successful - redirected to provider onboarding');
  }

  async testRegistrationValidation() {
    console.log('🔍 Testing registration validation...');
    
    await this.page.goto(`${this.baseUrl}/sign-up`);
    
    // Test invalid email
    await this.page.fill('[data-testid="email-input"]', 'invalid-email');
    await this.page.fill('[data-testid="password-input"]', 'password123');
    await this.page.click('[data-testid="submit-button"]');
    
    const emailError = await this.page.textContent('[data-testid="email-error"]');
    expect(emailError).toContain('valid email');
    console.log('✅ Email validation working');
    
    // Test weak password
    await this.page.fill('[data-testid="email-input"]', 'test@example.com');
    await this.page.fill('[data-testid="password-input"]', '123');
    await this.page.click('[data-testid="submit-button"]');
    
    const passwordError = await this.page.textContent('[data-testid="password-error"]');
    expect(passwordError).toContain('password');
    console.log('✅ Password validation working');
  }

  // Test login flows
  async testLoginFlows() {
    console.log('🧪 Testing Login Flows...');
    
    await this.testValidLogin();
    await this.testInvalidLogin();
    await this.testRoleBasedRedirects();
  }

  async testValidLogin() {
    console.log('🔑 Testing valid login...');
    
    await this.page.goto(`${this.baseUrl}/sign-in`);
    
    // Login with valid credentials
    await this.page.fill('[data-testid="email-input"]', 'test-homeowner@example.com');
    await this.page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await this.page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await this.page.waitForURL('**/dashboard');
    console.log('✅ Valid login successful');
  }

  async testInvalidLogin() {
    console.log('❌ Testing invalid login...');
    
    await this.page.goto(`${this.baseUrl}/sign-in`);
    
    // Try invalid credentials
    await this.page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await this.page.fill('[data-testid="password-input"]', 'wrongpassword');
    await this.page.click('[data-testid="login-button"]');
    
    // Should show error message
    const errorMessage = await this.page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Invalid');
    console.log('✅ Invalid login properly rejected');
  }

  async testRoleBasedRedirects() {
    console.log('🎭 Testing role-based redirects...');
    
    // Test admin redirect
    await this.loginAsRole('admin@rivohome.com', 'AdminPassword123!', '/admin');
    
    // Test provider redirect  
    await this.loginAsRole('provider@example.com', 'ProviderPassword123!', '/dashboard');
    
    // Test homeowner redirect
    await this.loginAsRole('homeowner@example.com', 'HomeownerPassword123!', '/onboarding');
  }

  async loginAsRole(email, password, expectedPath) {
    await this.page.goto(`${this.baseUrl}/sign-in`);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    await this.page.waitForURL(`**${expectedPath}`);
    console.log(`✅ ${email} redirected to ${expectedPath} correctly`);
  }

  // Test password reset
  async testPasswordReset() {
    console.log('🧪 Testing Password Reset...');
    
    await this.page.goto(`${this.baseUrl}/forgot-password`);
    
    // Request password reset
    await this.page.fill('[data-testid="email-input"]', 'test-homeowner@example.com');
    await this.page.click('[data-testid="reset-button"]');
    
    // Should show confirmation message
    const confirmMessage = await this.page.textContent('[data-testid="confirm-message"]');
    expect(confirmMessage).toContain('reset link');
    console.log('✅ Password reset request sent');
    
    // Test invalid email
    await this.page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await this.page.click('[data-testid="reset-button"]');
    
    // Should still show success (security best practice)
    const securityMessage = await this.page.textContent('[data-testid="confirm-message"]');
    expect(securityMessage).toContain('reset link');
    console.log('✅ Security-conscious reset response working');
  }

  // Test session management
  async testSessionManagement() {
    console.log('🧪 Testing Session Management...');
    
    // Login first
    await this.page.goto(`${this.baseUrl}/sign-in`);
    await this.page.fill('[data-testid="email-input"]', 'test-homeowner@example.com');
    await this.page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/dashboard');
    
    // Test session persistence
    await this.page.reload();
    expect(this.page.url()).toContain('/dashboard');
    console.log('✅ Session persists across page reload');
    
    // Test logout
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('**/sign-in');
    console.log('✅ Logout successful');
    
    // Verify session cleared
    await this.page.goto(`${this.baseUrl}/dashboard`);
    await this.page.waitForURL('**/sign-in');
    console.log('✅ Session cleared - protected route redirects to login');
  }

  // Run all authentication tests
  async runAllTests() {
    console.log('🚀 Starting Authentication Tests...\n');
    
    try {
      await this.testUserRegistration();
      console.log('\n');
      
      await this.testLoginFlows();
      console.log('\n');
      
      await this.testPasswordReset();
      console.log('\n');
      
      await this.testSessionManagement();
      console.log('\n');
      
      console.log('✅ All Authentication Tests Completed Successfully!');
      return { success: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Authentication Test Failed:', error.message);
      return { success: false, errors: [error.message] };
    }
  }
}

// Playwright test runner setup
test.describe('RivoHome Authentication Tests', () => {
  test('Complete Authentication Flow Testing', async ({ page }) => {
    const authTests = new AuthTests(page);
    const results = await authTests.runAllTests();
    
    if (!results.success) {
      throw new Error(`Authentication tests failed: ${results.errors.join(', ')}`);
    }
  });
});

module.exports = AuthTests; 