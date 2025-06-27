/**
 * Security Tests for RivoHome Platform
 * 
 * Tests authentication security, authorization, input validation,
 * SQL injection protection, XSS prevention, and data access controls.
 */

const { test, expect } = require('@playwright/test');

class SecurityTests {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  // Test authentication security
  async testAuthenticationSecurity() {
    console.log('🧪 Testing Authentication Security...');
    
    await this.testPasswordStrength();
    await this.testBruteForceProtection();
    await this.testSessionSecurity();
    await this.testTokenSecurity();
  }

  async testPasswordStrength() {
    console.log('🔐 Testing password strength requirements...');
    
    await this.page.goto(`${this.baseUrl}/sign-up`);
    
    // Test weak passwords
    const weakPasswords = [
      '123',
      'password',
      'abc123',
      '11111111',
      'qwerty123'
    ];
    
    for (const weakPassword of weakPasswords) {
      await this.page.fill('[data-testid="email-input"]', 'test@example.com');
      await this.page.fill('[data-testid="password-input"]', weakPassword);
      await this.page.click('[data-testid="submit-button"]');
      
      const errorMessage = await this.page.textContent('[data-testid="password-error"]');
      expect(errorMessage).toBeTruthy();
      console.log(`✅ Weak password "${weakPassword}" properly rejected`);
    }
  }

  async testBruteForceProtection() {
    console.log('🛡️ Testing brute force protection...');
    
    await this.page.goto(`${this.baseUrl}/sign-in`);
    
    // Attempt multiple failed logins
    for (let i = 0; i < 10; i++) {
      await this.page.fill('[data-testid="email-input"]', 'test@example.com');
      await this.page.fill('[data-testid="password-input"]', 'wrongpassword' + i);
      await this.page.click('[data-testid="login-button"]');
      
      // Wait for response
      await this.page.waitForTimeout(1000);
    }
    
    // Should be rate limited after multiple attempts
    const rateLimitMessage = await this.page.textContent('[data-testid="rate-limit-message"]');
    expect(rateLimitMessage).toContain('too many');
    console.log('✅ Rate limiting protection working');
  }

  async testSessionSecurity() {
    console.log('🍪 Testing session security...');
    
    // Login normally
    await this.page.goto(`${this.baseUrl}/sign-in`);
    await this.page.fill('[data-testid="email-input"]', 'test-homeowner@example.com');
    await this.page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/dashboard');
    
    // Get session cookies
    const cookies = await this.page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));
    
    // Verify session cookie has security flags
    expect(sessionCookie.httpOnly).toBe(true);
    expect(sessionCookie.secure).toBe(true);
    console.log('✅ Session cookie security flags verified');
    
    // Test session timeout
    // Simulate long inactivity (would need backend implementation)
    // This would require setting shorter timeout for testing
  }

  async testTokenSecurity() {
    console.log('🎫 Testing JWT token security...');
    
    // Test API endpoint without token
    const response = await this.page.request.get(`${this.baseUrl}/api/user/profile`);
    expect(response.status()).toBe(401);
    console.log('✅ API endpoints properly protected');
    
    // Test with invalid token
    const invalidTokenResponse = await this.page.request.get(`${this.baseUrl}/api/user/profile`, {
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });
    expect(invalidTokenResponse.status()).toBe(401);
    console.log('✅ Invalid token properly rejected');
  }

  // Test authorization and access controls
  async testAuthorizationControls() {
    console.log('🧪 Testing Authorization Controls...');
    
    await this.testRoleBasedAccess();
    await this.testDataIsolation();
    await this.testAdminAccess();
    await this.testCrossUserDataAccess();
  }

  async testRoleBasedAccess() {
    console.log('👥 Testing role-based access controls...');
    
    // Test homeowner trying to access admin endpoints
    await this.loginAsUser('homeowner@example.com', 'password123');
    
    const adminResponse = await this.page.request.get(`${this.baseUrl}/api/admin/users`);
    expect(adminResponse.status()).toBe(403);
    console.log('✅ Homeowner blocked from admin endpoints');
    
    // Test provider trying to access other provider's data
    await this.loginAsUser('provider1@example.com', 'password123');
    
    const otherProviderResponse = await this.page.request.get(`${this.baseUrl}/api/provider/bookings?provider_id=other_provider_id`);
    expect(otherProviderResponse.status()).toBe(403);
    console.log('✅ Cross-provider data access blocked');
  }

  async testDataIsolation() {
    console.log('🔒 Testing data isolation...');
    
    // Login as user 1
    await this.loginAsUser('user1@example.com', 'password123');
    
    // Try to access user 2's properties
    const user2PropertiesResponse = await this.page.request.get(`${this.baseUrl}/api/properties?user_id=user2_id`);
    expect(user2PropertiesResponse.status()).toBe(403);
    console.log('✅ User data isolation enforced');
    
    // Try to modify user 2's booking
    const modifyBookingResponse = await this.page.request.put(`${this.baseUrl}/api/bookings/user2_booking_id`, {
      data: { status: 'cancelled' }
    });
    expect(modifyBookingResponse.status()).toBe(403);
    console.log('✅ Cross-user modification blocked');
  }

  async testAdminAccess() {
    console.log('👨‍💼 Testing admin access controls...');
    
    await this.loginAsUser('admin@rivohome.com', 'adminpassword123');
    
    // Admin should have access to user management
    const usersResponse = await this.page.request.get(`${this.baseUrl}/api/admin/users`);
    expect(usersResponse.status()).toBe(200);
    console.log('✅ Admin access to user management verified');
    
    // But still shouldn't be able to access non-admin endpoints inappropriately
    const userPersonalResponse = await this.page.request.get(`${this.baseUrl}/api/user/personal-data?user_id=another_user`);
    expect(userPersonalResponse.status()).toBe(403);
    console.log('✅ Admin access properly scoped');
  }

  async testCrossUserDataAccess() {
    console.log('🚫 Testing cross-user data access prevention...');
    
    // Direct database query attempts (would be through API)
    const maliciousQueries = [
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM profiles WHERE id != auth.uid() --",
      "' OR 1=1 --"
    ];
    
    for (const query of maliciousQueries) {
      const response = await this.page.request.post(`${this.baseUrl}/api/properties`, {
        data: { address: query }
      });
      
      // Should not succeed or return other users' data
      expect(response.status()).toBeLessThan(500); // Should handle gracefully
      console.log(`✅ Malicious query "${query.substring(0, 20)}..." handled safely`);
    }
  }

  // Test input validation and sanitization
  async testInputValidation() {
    console.log('🧪 Testing Input Validation...');
    
    await this.testSQLInjectionPrevention();
    await this.testXSSPrevention();
    await this.testFileUploadSecurity();
    await this.testParameterValidation();
  }

  async testSQLInjectionPrevention() {
    console.log('💉 Testing SQL injection prevention...');
    
    await this.loginAsUser('homeowner@example.com', 'password123');
    
    const sqlInjectionAttempts = [
      "'; DROP TABLE properties; --",
      "' UNION SELECT password FROM auth.users --",
      "'; INSERT INTO properties (address) VALUES ('hacked') --",
      "' OR '1'='1"
    ];
    
    for (const injection of sqlInjectionAttempts) {
      // Test property creation with SQL injection
      const response = await this.page.request.post(`${this.baseUrl}/api/properties`, {
        data: {
          address: injection,
          year_built: 2000,
          property_type: 'house'
        }
      });
      
      // Should not succeed or cause database errors
      const responseData = await response.json();
      expect(responseData.error).not.toContain('SQL');
      expect(responseData.error).not.toContain('database');
      console.log(`✅ SQL injection attempt blocked: ${injection.substring(0, 20)}...`);
    }
  }

  async testXSSPrevention() {
    console.log('🕷️ Testing XSS prevention...');
    
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<svg onload="alert(1)">'
    ];
    
    for (const xss of xssAttempts) {
      // Test profile update with XSS
      const response = await this.page.request.put(`${this.baseUrl}/api/user/profile`, {
        data: { full_name: xss }
      });
      
      // Then retrieve and check if it's sanitized
      await this.page.goto(`${this.baseUrl}/dashboard/my-profile`);
      
      const profileName = await this.page.textContent('[data-testid="profile-name"]');
      expect(profileName).not.toContain('<script>');
      expect(profileName).not.toContain('<img');
      expect(profileName).not.toContain('javascript:');
      console.log(`✅ XSS attempt sanitized: ${xss.substring(0, 20)}...`);
    }
  }

  async testFileUploadSecurity() {
    console.log('📎 Testing file upload security...');
    
    await this.loginAsUser('provider@example.com', 'password123');
    await this.page.goto(`${this.baseUrl}/provider-onboarding/documents-upload`);
    
    // Test malicious file uploads
    const maliciousFiles = [
      'malicious.php',
      'script.js',
      'virus.exe',
      '../../../etc/passwd'
    ];
    
    for (const filename of maliciousFiles) {
      // Create a test file with malicious extension
      const fileContent = filename.includes('.php') ? '<?php echo "hacked"; ?>' : 'malicious content';
      
      const response = await this.page.request.post(`${this.baseUrl}/api/provider-documents/upload`, {
        multipart: {
          file: {
            name: filename,
            mimeType: 'application/octet-stream',
            buffer: Buffer.from(fileContent)
          },
          doc_type: 'license'
        }
      });
      
      // Should reject malicious files
      expect(response.status()).toBe(400);
      console.log(`✅ Malicious file rejected: ${filename}`);
    }
    
    // Test valid file upload
    const validResponse = await this.page.request.post(`${this.baseUrl}/api/provider-documents/upload`, {
      multipart: {
        file: {
          name: 'license.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('valid PDF content')
        },
        doc_type: 'license'
      }
    });
    
    expect(validResponse.status()).toBe(200);
    console.log('✅ Valid file upload accepted');
  }

  async testParameterValidation() {
    console.log('📝 Testing parameter validation...');
    
    // Test invalid data types
    const invalidRequests = [
      {
        endpoint: '/api/properties',
        data: { year_built: 'not_a_number' }
      },
      {
        endpoint: '/api/bookings',
        data: { start_ts: 'invalid_date' }
      },
      {
        endpoint: '/api/user/profile',
        data: { email: 'not_an_email' }
      }
    ];
    
    for (const req of invalidRequests) {
      const response = await this.page.request.post(`${this.baseUrl}${req.endpoint}`, {
        data: req.data
      });
      
      expect(response.status()).toBe(400);
      console.log(`✅ Invalid parameter rejected for ${req.endpoint}`);
    }
  }

  // Test database security
  async testDatabaseSecurity() {
    console.log('🧪 Testing Database Security...');
    
    await this.testRowLevelSecurity();
    await this.testDatabaseConnections();
    await this.testBackupSecurity();
  }

  async testRowLevelSecurity() {
    console.log('🔐 Testing Row Level Security (RLS)...');
    
    // Test that users can only see their own data
    await this.loginAsUser('user1@example.com', 'password123');
    
    // Try to query all profiles (should only return current user)
    const profilesResponse = await this.page.request.get(`${this.baseUrl}/api/test/profiles`);
    const profiles = await profilesResponse.json();
    
    expect(profiles.length).toBe(1);
    expect(profiles[0].email).toBe('user1@example.com');
    console.log('✅ RLS preventing cross-user data access');
    
    // Test provider data isolation
    await this.loginAsUser('provider1@example.com', 'password123');
    
    const bookingsResponse = await this.page.request.get(`${this.baseUrl}/api/test/bookings`);
    const bookings = await bookingsResponse.json();
    
    // Should only see bookings where user is provider or homeowner
    bookings.forEach(booking => {
      expect([booking.provider_id, booking.homeowner_id]).toContain('provider1_user_id');
    });
    console.log('✅ Provider booking data isolation verified');
  }

  async testDatabaseConnections() {
    console.log('🔌 Testing database connection security...');
    
    // Test that connection strings don't leak
    const response = await this.page.request.get(`${this.baseUrl}/api/test/config`);
    const config = await response.json();
    
    expect(config.database_url).toBeUndefined();
    expect(config.db_password).toBeUndefined();
    console.log('✅ Database credentials not exposed');
  }

  async testBackupSecurity() {
    console.log('💾 Testing backup security...');
    
    // Test that backup endpoints are protected
    const backupResponse = await this.page.request.get(`${this.baseUrl}/api/admin/backup`);
    expect(backupResponse.status()).toBe(401); // Should require admin auth
    
    // Test with admin credentials
    await this.loginAsUser('admin@rivohome.com', 'adminpassword123');
    
    const adminBackupResponse = await this.page.request.get(`${this.baseUrl}/api/admin/backup`);
    expect(adminBackupResponse.status()).toBe(200);
    console.log('✅ Backup access properly restricted to admins');
  }

  // Helper methods
  async loginAsUser(email, password) {
    await this.page.goto(`${this.baseUrl}/sign-in`);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForTimeout(2000); // Wait for login to complete
  }

  // Run all security tests
  async runAllTests() {
    console.log('🚀 Starting Security Tests...\n');
    
    const results = {
      success: true,
      errors: [],
      criticalIssues: [],
      warnings: []
    };
    
    try {
      await this.testAuthenticationSecurity();
      console.log('\n');
      
      await this.testAuthorizationControls();
      console.log('\n');
      
      await this.testInputValidation();
      console.log('\n');
      
      await this.testDatabaseSecurity();
      console.log('\n');
      
      console.log('✅ All Security Tests Completed Successfully!');
      
    } catch (error) {
      console.error('❌ Security Test Failed:', error.message);
      results.success = false;
      results.errors.push(error.message);
      
      // Classify security issues
      if (error.message.includes('SQL injection') || error.message.includes('XSS')) {
        results.criticalIssues.push(error.message);
      } else {
        results.warnings.push(error.message);
      }
    }
    
    return results;
  }
}

// Playwright test runner setup
test.describe('RivoHome Security Tests', () => {
  test('Complete Security Testing', async ({ page }) => {
    const securityTests = new SecurityTests(page);
    const results = await securityTests.runAllTests();
    
    // Report critical issues separately
    if (results.criticalIssues.length > 0) {
      console.error('🚨 CRITICAL SECURITY ISSUES FOUND:');
      results.criticalIssues.forEach(issue => console.error('  -', issue));
    }
    
    if (!results.success) {
      throw new Error(`Security tests failed: ${results.errors.join(', ')}`);
    }
  });
});

module.exports = SecurityTests; 