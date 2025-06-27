/**
 * Authentication Security Tests
 * Tests for authentication vulnerabilities in RivoHome application
 * 
 * Tests: Brute force, weak passwords, session hijacking, privilege escalation
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

class AuthenticationTester {
  constructor() {
    this.vulnerabilities = [];
    this.testResults = [];
    
    // Regular client for normal auth tests
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Service role client for admin tests
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async testWeakPasswordPolicy() {
    console.log('\n🔍 Testing password policy enforcement...');
    
    const weakPasswords = [
      '123',           // Too short
      '123456',        // Minimum length but weak
      'password',      // Common password
      'admin',         // Admin password
      '111111',        // Sequential
      'qwerty',        // Keyboard pattern
      ''               // Empty password
    ];

    const testEmail = `test-weak-pwd-${Date.now()}@example.com`;

    for (const password of weakPasswords) {
      try {
        console.log(`Testing weak password: "${password}"`);
        
        const { data, error } = await this.supabase.auth.signUp({
          email: testEmail,
          password: password
        });
        
        if (!error && data.user) {
          this.vulnerabilities.push({
            type: 'WEAK_PASSWORD_ACCEPTED',
            severity: 'HIGH',
            password: password,
            result: 'ACCOUNT_CREATED',
            impact: 'Weak passwords allowed, enabling brute force attacks'
          });
          console.log(`❌ HIGH: Weak password "${password}" accepted!`);
          
          // Clean up test account
          await this.supabaseAdmin.auth.admin.deleteUser(data.user.id);
          
        } else {
          console.log(`✅ Password rejected: ${error?.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.log(`⚠️  Error: ${err.message}`);
      }
    }
  }

  async testBruteForceProtection() {
    console.log('\n🔍 Testing brute force protection...');
    
    // Create a test account first
    const testEmail = `test-brute-force-${Date.now()}@example.com`;
    const correctPassword = 'CorrectPassword123!';
    
    try {
      const { data: signupData, error: signupError } = await this.supabase.auth.signUp({
        email: testEmail,
        password: correctPassword
      });
      
      if (signupError) {
        console.log('⚠️  Could not create test account for brute force test');
        return;
      }

      const commonPasswords = [
        'password123',
        'admin123',
        '123456789',
        'password',
        'letmein',
        'welcome123',
        'admin',
        'qwerty123',
        'password1',
        'secret123'
      ];

      let attemptCount = 0;
      let lockoutDetected = false;

      for (const password of commonPasswords) {
        try {
          attemptCount++;
          console.log(`Brute force attempt ${attemptCount}: ${password}`);
          
          const startTime = Date.now();
          const { data, error } = await this.supabase.auth.signInWithPassword({
            email: testEmail,
            password: password
          });
          const endTime = Date.now();
          
          if (error) {
            if (error.message.includes('too many') || error.message.includes('rate limit')) {
              lockoutDetected = true;
              console.log(`✅ Rate limiting detected after ${attemptCount} attempts`);
              break;
            } else {
              console.log(`Attempt failed: ${error.message}`);
              
              // Check for artificial delays
              const responseTime = endTime - startTime;
              if (responseTime > 5000) {
                console.log(`✅ Slow response detected (${responseTime}ms) - potential throttling`);
              }
            }
          } else {
            console.log(`❌ Login successful with: ${password}`);
          }
          
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.log(`Error on attempt ${attemptCount}: ${err.message}`);
        }
      }

      if (!lockoutDetected) {
        this.vulnerabilities.push({
          type: 'NO_BRUTE_FORCE_PROTECTION',
          severity: 'HIGH',
          attempts: attemptCount,
          result: 'NO_LOCKOUT_DETECTED',
          impact: 'Account vulnerable to brute force attacks'
        });
        console.log(`❌ HIGH: No brute force protection detected after ${attemptCount} attempts!`);
      }

      // Clean up test account
      if (signupData.user) {
        await this.supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
      }
      
    } catch (err) {
      console.log(`Error in brute force test: ${err.message}`);
    }
  }

  async testAdminPrivilegeEscalation() {
    console.log('\n🔍 Testing admin privilege escalation...');
    
    // Create a regular user account
    const testEmail = `test-privilege-${Date.now()}@example.com`;
    const testPassword = 'RegularUser123!';
    
    try {
      const { data: signupData, error: signupError } = await this.supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (signupError) {
        console.log('⚠️  Could not create test account');
        return;
      }

      // Sign in as the regular user
      const { data: loginData, error: loginError } = await this.supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.log('⚠️  Could not sign in test account');
        return;
      }

      // Test 1: Try to directly update profile to admin
      try {
        console.log('Testing direct admin privilege escalation...');
        
        const { data, error } = await this.supabase
          .from('profiles')
          .update({ is_admin: true, role: 'admin' })
          .eq('id', loginData.user.id);
        
        if (!error) {
          this.vulnerabilities.push({
            type: 'PRIVILEGE_ESCALATION',
            severity: 'CRITICAL',
            method: 'DIRECT_PROFILE_UPDATE',
            result: 'ADMIN_ACCESS_GRANTED',
            impact: 'Regular users can escalate to admin privileges'
          });
          console.log('❌ CRITICAL: Direct admin escalation successful!');
        } else {
          console.log(`✅ Direct escalation blocked: ${error.message}`);
        }
      } catch (err) {
        console.log(`Direct escalation error: ${err.message}`);
      }

      // Test 2: Try to access admin endpoints
      try {
        console.log('Testing admin endpoint access...');
        
        const response = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/rest/v1/rpc/admin_delete_user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.session.access_token}`,
            'apikey': supabaseAnonKey
          },
          body: JSON.stringify({
            user_id: signupData.user.id
          })
        });
        
        if (response.ok) {
          this.vulnerabilities.push({
            type: 'UNAUTHORIZED_ADMIN_ACCESS',
            severity: 'CRITICAL',
            method: 'ADMIN_FUNCTION_ACCESS',
            result: 'ADMIN_FUNCTION_EXECUTED',
            impact: 'Regular users can execute admin functions'
          });
          console.log('❌ CRITICAL: Admin function access successful!');
        } else {
          console.log(`✅ Admin function access blocked: ${response.status}`);
        }
      } catch (err) {
        console.log(`Admin function test error: ${err.message}`);
      }

      // Test 3: Try SQL injection through user inputs
      try {
        console.log('Testing SQL injection through profile updates...');
        
        const maliciousInputs = [
          "'; UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = '" + testEmail + "'); --",
          "admin'; UPDATE profiles SET role = 'admin' WHERE id = auth.uid(); --"
        ];

        for (const input of maliciousInputs) {
          const { data, error } = await this.supabase
            .from('profiles')
            .update({ full_name: input })
            .eq('id', loginData.user.id);
          
          if (!error) {
            // Check if privilege escalation occurred
            const { data: checkData } = await this.supabase
              .from('profiles')
              .select('is_admin, role')
              .eq('id', loginData.user.id)
              .single();
            
            if (checkData && (checkData.is_admin || checkData.role === 'admin')) {
              this.vulnerabilities.push({
                type: 'SQL_INJECTION_PRIVILEGE_ESCALATION',
                severity: 'CRITICAL',
                input: input,
                result: 'ADMIN_PRIVILEGES_GAINED',
                impact: 'SQL injection leads to privilege escalation'
              });
              console.log('❌ CRITICAL: SQL injection privilege escalation successful!');
            }
          }
        }
      } catch (err) {
        console.log(`SQL injection test error: ${err.message}`);
      }

      // Clean up test account
      if (signupData.user) {
        await this.supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
      }
      
    } catch (err) {
      console.log(`Error in privilege escalation test: ${err.message}`);
    }
  }

  async testSessionSecurity() {
    console.log('\n🔍 Testing session security...');
    
    // Test session fixation and hijacking vulnerabilities
    const testEmail = `test-session-${Date.now()}@example.com`;
    const testPassword = 'SessionTest123!';
    
    try {
      // Create test account
      const { data: signupData, error: signupError } = await this.supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (signupError) {
        console.log('⚠️  Could not create test account');
        return;
      }

      // Sign in and get session
      const { data: loginData, error: loginError } = await this.supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.log('⚠️  Could not sign in test account');
        return;
      }

      const accessToken = loginData.session.access_token;
      const refreshToken = loginData.session.refresh_token;
      
      // Test 1: Check if JWT tokens are properly secured
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          
          // Check token expiration time
          const exp = payload.exp;
          const iat = payload.iat;
          const tokenLifetime = exp - iat;
          
          if (tokenLifetime > 86400) { // More than 24 hours
            this.vulnerabilities.push({
              type: 'LONG_LIVED_TOKEN',
              severity: 'MEDIUM',
              lifetime: tokenLifetime,
              result: 'EXCESSIVE_TOKEN_LIFETIME',
              impact: 'Long-lived tokens increase security risk'
            });
            console.log(`⚠️  MEDIUM: Token lifetime is ${tokenLifetime} seconds (${tokenLifetime/3600} hours)`);
          } else {
            console.log(`✅ Token lifetime is reasonable: ${tokenLifetime} seconds`);
          }
        }
      } catch (err) {
        console.log(`Token analysis error: ${err.message}`);
      }

      // Test 2: Try to use tokens after logout
      try {
        console.log('Testing token invalidation after logout...');
        
        // Logout
        await this.supabase.auth.signOut();
        
        // Try to use the old token
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseAnonKey
          }
        });
        
        if (response.ok) {
          this.vulnerabilities.push({
            type: 'TOKEN_NOT_INVALIDATED',
            severity: 'HIGH',
            result: 'TOKEN_STILL_VALID_AFTER_LOGOUT',
            impact: 'Tokens remain valid after logout'
          });
          console.log('❌ HIGH: Token still valid after logout!');
        } else {
          console.log('✅ Token properly invalidated after logout');
        }
      } catch (err) {
        console.log(`Token invalidation test error: ${err.message}`);
      }

      // Clean up
      if (signupData.user) {
        await this.supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
      }
      
    } catch (err) {
      console.log(`Error in session security test: ${err.message}`);
    }
  }

  async testPasswordResetSecurity() {
    console.log('\n🔍 Testing password reset security...');
    
    const testEmail = `test-reset-${Date.now()}@example.com`;
    
    try {
      // Test password reset enumeration
      console.log('Testing password reset enumeration...');
      
      // Try reset on non-existent account
      const { error: resetError1 } = await this.supabase.auth.resetPasswordForEmail(
        'nonexistent@example.com'
      );
      
      // Try reset on existing account (if any)
      const { error: resetError2 } = await this.supabase.auth.resetPasswordForEmail(testEmail);
      
      // Check if responses are different (enumeration vulnerability)
      if (resetError1?.message !== resetError2?.message) {
        this.vulnerabilities.push({
          type: 'PASSWORD_RESET_ENUMERATION',
          severity: 'MEDIUM',
          result: 'DIFFERENT_RESPONSES',
          impact: 'Attackers can enumerate valid email addresses'
        });
        console.log('⚠️  MEDIUM: Password reset enumeration possible');
      } else {
        console.log('✅ Password reset responses are consistent');
      }
      
      // Test rate limiting on password resets
      console.log('Testing password reset rate limiting...');
      
      let resetAttempts = 0;
      let rateLimitDetected = false;
      
      for (let i = 0; i < 10; i++) {
        try {
          resetAttempts++;
          const { error } = await this.supabase.auth.resetPasswordForEmail(testEmail);
          
          if (error && error.message.includes('rate limit')) {
            rateLimitDetected = true;
            console.log(`✅ Rate limiting detected after ${resetAttempts} attempts`);
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.log(`Reset attempt error: ${err.message}`);
        }
      }
      
      if (!rateLimitDetected) {
        this.vulnerabilities.push({
          type: 'NO_PASSWORD_RESET_RATE_LIMIT',
          severity: 'MEDIUM',
          attempts: resetAttempts,
          result: 'NO_RATE_LIMITING',
          impact: 'Password reset can be abused for spam/DoS'
        });
        console.log(`⚠️  MEDIUM: No rate limiting on password reset after ${resetAttempts} attempts`);
      }
      
    } catch (err) {
      console.log(`Error in password reset test: ${err.message}`);
    }
  }

  async runAllTests() {
    console.log('🚨 Starting Authentication Security Tests');
    console.log('==========================================');
    
    await this.testWeakPasswordPolicy();
    await this.testBruteForceProtection();
    await this.testAdminPrivilegeEscalation();
    await this.testSessionSecurity();
    await this.testPasswordResetSecurity();
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 AUTHENTICATION TEST RESULTS');
    console.log('================================');
    
    if (this.vulnerabilities.length > 0) {
      console.log(`❌ Found ${this.vulnerabilities.length} authentication vulnerabilities!`);
      
      const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
      const high = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
      const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
      
      console.log(`   Critical: ${critical}, High: ${high}, Medium: ${medium}`);
      
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n${index + 1}. ${vuln.type} - ${vuln.severity}`);
        console.log(`   Impact: ${vuln.impact}`);
        console.log(`   Result: ${vuln.result}`);
      });
      
      if (critical > 0) {
        console.log('\n🚨 CRITICAL VULNERABILITIES REQUIRE IMMEDIATE ATTENTION:');
        console.log('1. Implement strong password policies');
        console.log('2. Add MFA for admin accounts');
        console.log('3. Fix privilege escalation vulnerabilities');
        console.log('4. Implement proper session management');
      }
      
    } else {
      console.log('✅ No authentication vulnerabilities found');
    }
    
    // Save detailed report
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      testType: 'AUTHENTICATION',
      vulnerabilities: this.vulnerabilities,
      summary: {
        total: this.vulnerabilities.length,
        critical: this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        high: this.vulnerabilities.filter(v => v.severity === 'HIGH').length,
        medium: this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length
      }
    };
    
    fs.writeFileSync('auth-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Report saved to: auth-test-results.json');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AuthenticationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AuthenticationTester; 