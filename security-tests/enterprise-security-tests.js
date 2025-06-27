/**
 * ENTERPRISE SECURITY TEST SUITE
 * 
 * Comprehensive security testing to validate all implemented fixes
 * and identify remaining vulnerabilities.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testDomain: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  maxRetries: 3,
  timeout: 30000
};

console.log('🔒 ENTERPRISE SECURITY TEST SUITE STARTING...\n');

class EnterpriseSecurityTester {
  constructor() {
    this.vulnerabilities = [];
    this.passed = [];
    this.failed = [];
    
    // Initialize Supabase clients
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.supabaseAdmin = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  /**
   * 1. FILE UPLOAD SECURITY TESTS
   */
  async testFileUploadSecurity() {
    console.log('🔍 Testing File Upload Security...\n');
    
    // Test 1: Malicious file upload (simulated)
    try {
      const maliciousFiles = [
        { name: 'malware.exe', type: 'application/x-executable', content: 'MZ\x90\x00\x03' },
        { name: 'script.php', type: 'application/x-php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: '../../../etc/passwd', type: 'text/plain', content: 'root:x:0:0:root' },
        { name: 'virus.txt', type: 'text/plain', content: '<script>alert("XSS")</script>' }
      ];

      for (const file of maliciousFiles) {
        const formData = new FormData();
        const blob = new Blob([file.content], { type: file.type });
        formData.append('file', blob, file.name);

        try {
          const response = await fetch(`${TEST_CONFIG.testDomain}/api/test-upload`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            this.vulnerabilities.push({
              type: 'MALICIOUS_FILE_UPLOAD',
              severity: 'CRITICAL',
              file: file.name,
              result: 'UPLOAD_ACCEPTED',
              impact: 'Server compromise via malicious file execution'
            });
            console.log(`❌ CRITICAL: Malicious file ${file.name} was accepted!`);
          } else {
            this.passed.push(`File validation blocked: ${file.name}`);
            console.log(`✅ File validation correctly blocked: ${file.name}`);
          }
        } catch (error) {
          console.log(`⚠️ Upload test failed for ${file.name}: ${error.message}`);
        }
      }

      // Test 2: File size limits
      const largeFileContent = 'A'.repeat(50 * 1024 * 1024); // 50MB
      const largeFormData = new FormData();
      const largeBlob = new Blob([largeFileContent], { type: 'text/plain' });
      largeFormData.append('file', largeBlob, 'large.txt');

      try {
        const response = await fetch(`${TEST_CONFIG.testDomain}/api/test-upload`, {
          method: 'POST',
          body: largeFormData
        });

        if (response.ok) {
          this.vulnerabilities.push({
            type: 'FILE_SIZE_BYPASS',
            severity: 'HIGH',
            result: 'LARGE_FILE_ACCEPTED',
            impact: 'DoS via storage exhaustion'
          });
          console.log('❌ HIGH: Large file size limit bypass detected!');
        } else {
          this.passed.push('File size limits working');
          console.log('✅ File size limits are enforced');
        }
      } catch (error) {
        console.log(`⚠️ Large file test failed: ${error.message}`);
      }

    } catch (error) {
      console.error('File upload security test failed:', error);
    }
  }

  /**
   * 2. RATE LIMITING TESTS
   */
  async testRateLimiting() {
    console.log('🔍 Testing Rate Limiting Implementation...\n');

    const endpoints = [
      { path: '/api/auth/signin', limit: 5, window: '15 minutes' },
      { path: '/api/admin/users', limit: 10, window: '5 minutes' },
      { path: '/api/stripe/webhook', limit: 5, window: '10 minutes' },
      { path: '/api/test-endpoint', limit: 100, window: '15 minutes' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing rate limits for: ${endpoint.path}`);
        
        let rateLimitDetected = false;
        let requestCount = 0;

        // Make rapid requests to test rate limiting
        for (let i = 0; i < 20; i++) {
          requestCount++;
          
          try {
            const response = await fetch(`${TEST_CONFIG.testDomain}${endpoint.path}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ test: true })
            });

            if (response.status === 429) {
              rateLimitDetected = true;
              console.log(`✅ Rate limiting activated after ${requestCount} requests`);
              break;
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.log(`Request ${i + 1} failed: ${error.message}`);
          }
        }

        if (!rateLimitDetected) {
          this.vulnerabilities.push({
            type: 'INSUFFICIENT_RATE_LIMITING',
            severity: 'HIGH',
            endpoint: endpoint.path,
            requests: requestCount,
            result: 'NO_RATE_LIMITING',
            impact: 'Brute force and DoS attacks possible'
          });
          console.log(`❌ HIGH: No rate limiting detected for ${endpoint.path}!`);
        } else {
          this.passed.push(`Rate limiting working for ${endpoint.path}`);
        }

      } catch (error) {
        console.error(`Rate limiting test failed for ${endpoint.path}:`, error);
      }
    }
  }

  /**
   * 3. AUTHENTICATION SECURITY TESTS
   */
  async testAuthenticationSecurity() {
    console.log('🔍 Testing Authentication Security...\n');

    // Test 1: Weak password acceptance
    const weakPasswords = ['123456', 'password', '12345', 'qwerty', 'abc123'];
    
    for (const password of weakPasswords) {
      try {
        const testEmail = `test-weak-${Date.now()}@example.com`;
        
        const { data, error } = await this.supabase.auth.signUp({
          email: testEmail,
          password: password
        });

        if (data.user && !error) {
          this.vulnerabilities.push({
            type: 'WEAK_PASSWORD_ACCEPTED',
            severity: 'HIGH',
            password: password,
            result: 'SIGNUP_SUCCESSFUL',
            impact: 'Account takeover via brute force'
          });
          console.log(`❌ HIGH: Weak password '${password}' was accepted!`);
          
          // Clean up
          if (data.user.id) {
            await this.supabaseAdmin.auth.admin.deleteUser(data.user.id);
          }
        } else {
          this.passed.push(`Weak password rejected: ${password}`);
          console.log(`✅ Weak password correctly rejected: ${password}`);
        }
      } catch (error) {
        console.log(`Password test failed for '${password}': ${error.message}`);
      }
    }

    // Test 2: Account enumeration via different response times
    console.log('Testing account enumeration prevention...');
    
    const validEmail = 'test@example.com';
    const invalidEmail = 'nonexistent@example.com';
    
    const times = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await this.supabase.auth.signInWithPassword({
        email: i % 2 === 0 ? validEmail : invalidEmail,
        password: 'wrongpassword'
      });
      const endTime = Date.now();
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    
    if (variance > 1000) { // Significant variance in response times
      this.vulnerabilities.push({
        type: 'ACCOUNT_ENUMERATION',
        severity: 'MEDIUM',
        variance: variance,
        result: 'TIMING_ATTACK_POSSIBLE',
        impact: 'Valid email addresses can be enumerated'
      });
      console.log('⚠️ MEDIUM: Account enumeration via timing attack possible');
    } else {
      this.passed.push('Account enumeration prevention working');
      console.log('✅ Account enumeration prevention appears effective');
    }
  }

  /**
   * 4. DATABASE SECURITY TESTS
   */
  async testDatabaseSecurity() {
    console.log('🔍 Testing Database Security...\n');

    // Test 1: Check for dangerous functions
    try {
      const { data, error } = await this.supabaseAdmin
        .from('pg_proc')
        .select('proname')
        .in('proname', ['exec_sql', 'pg_execute', 'eval', 'system']);

      if (data && data.length > 0) {
        this.vulnerabilities.push({
          type: 'DANGEROUS_FUNCTIONS_EXIST',
          severity: 'CRITICAL',
          functions: data.map(f => f.proname),
          result: 'SQL_INJECTION_POSSIBLE',
          impact: 'Complete database compromise'
        });
        console.log('❌ CRITICAL: Dangerous SQL functions still exist!');
      } else {
        this.passed.push('Dangerous SQL functions removed');
        console.log('✅ Dangerous SQL functions have been removed');
      }
    } catch (error) {
      console.log('Could not check for dangerous functions:', error.message);
    }

    // Test 2: RLS Policy bypass attempts
    console.log('Testing RLS policy enforcement...');
    
    try {
      // Try to access other users' data
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .neq('id', 'current-user-id');

      if (data && data.length > 0) {
        this.vulnerabilities.push({
          type: 'RLS_POLICY_BYPASS',
          severity: 'HIGH',
          records: data.length,
          result: 'UNAUTHORIZED_DATA_ACCESS',
          impact: 'User data exposure'
        });
        console.log(`❌ HIGH: RLS policy bypass - accessed ${data.length} unauthorized records!`);
      } else {
        this.passed.push('RLS policies enforced');
        console.log('✅ RLS policies are properly enforced');
      }
    } catch (error) {
      console.log('RLS test completed with expected error:', error.message);
      this.passed.push('RLS policies enforced (access denied)');
    }
  }

  /**
   * 5. API SECURITY TESTS
   */
  async testApiSecurity() {
    console.log('🔍 Testing API Security...\n');

    // Test 1: Admin endpoint access without authentication
    try {
      const response = await fetch(`${TEST_CONFIG.testDomain}/api/admin/users`, {
        method: 'GET'
      });

      if (response.ok) {
        this.vulnerabilities.push({
          type: 'ADMIN_ENDPOINT_UNPROTECTED',
          severity: 'CRITICAL',
          endpoint: '/api/admin/users',
          result: 'UNAUTHORIZED_ACCESS',
          impact: 'Admin privilege escalation'
        });
        console.log('❌ CRITICAL: Admin endpoint accessible without authentication!');
      } else if (response.status === 401 || response.status === 403) {
        this.passed.push('Admin endpoints protected');
        console.log('✅ Admin endpoints properly protected');
      }
    } catch (error) {
      console.log('Admin endpoint test failed:', error.message);
    }

    // Test 2: CORS configuration
    try {
      const response = await fetch(`${TEST_CONFIG.testDomain}/api/test-endpoint`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        }
      });

      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      
      if (corsHeader === '*') {
        this.vulnerabilities.push({
          type: 'PERMISSIVE_CORS',
          severity: 'MEDIUM',
          header: corsHeader,
          result: 'CORS_WILDCARD',
          impact: 'Cross-origin attacks possible'
        });
        console.log('⚠️ MEDIUM: Permissive CORS configuration detected');
      } else {
        this.passed.push('CORS properly configured');
        console.log('✅ CORS configuration appears secure');
      }
    } catch (error) {
      console.log('CORS test failed:', error.message);
    }

    // Test 3: SQL injection in API endpoints
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users (email) VALUES ('hacked@test.com'); --",
      "' UNION SELECT * FROM auth.users --"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await fetch(`${TEST_CONFIG.testDomain}/api/test-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: payload })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.includes('users') || data.includes('error'))) {
            this.vulnerabilities.push({
              type: 'SQL_INJECTION',
              severity: 'CRITICAL',
              payload: payload,
              result: 'INJECTION_SUCCESSFUL',
              impact: 'Database compromise'
            });
            console.log(`❌ CRITICAL: SQL injection successful with payload: ${payload}`);
          }
        }
      } catch (error) {
        // Expected for properly protected endpoints
      }
    }
  }

  /**
   * 6. ENVIRONMENT SECURITY TESTS
   */
  async testEnvironmentSecurity() {
    console.log('🔍 Testing Environment Security...\n');

    // Test 1: Check for exposed credentials in client-side
    try {
      const response = await fetch(`${TEST_CONFIG.testDomain}/_next/static/chunks/pages/_app.js`);
      const content = await response.text();

      const sensitivePatterns = [
        /sk_[a-zA-Z0-9_]{24,}/g,  // Stripe secret keys
        /eyJ[A-Za-z0-9+/=]{100,}/g, // Long JWT tokens (service keys)
        /password.*[:=]\s*["']([^"']+)["']/gi,
        /secret.*[:=]\s*["']([^"']+)["']/gi
      ];

      let exposedSecrets = [];
      
      sensitivePatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          exposedSecrets.push(...matches);
        }
      });

      if (exposedSecrets.length > 0) {
        this.vulnerabilities.push({
          type: 'CLIENT_SIDE_SECRET_EXPOSURE',
          severity: 'CRITICAL',
          secrets: exposedSecrets.slice(0, 3), // Don't log all secrets
          result: 'CREDENTIALS_IN_CLIENT_CODE',
          impact: 'Complete system compromise'
        });
        console.log('❌ CRITICAL: Secrets exposed in client-side code!');
      } else {
        this.passed.push('No secrets in client-side code');
        console.log('✅ No secrets found in client-side code');
      }
    } catch (error) {
      console.log('Client-side secret test failed:', error.message);
    }

    // Test 2: Environment variable validation
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.vulnerabilities.push({
        type: 'MISSING_ENVIRONMENT_VARIABLES',
        severity: 'HIGH',
        variables: missingVars,
        result: 'CONFIGURATION_ERROR',
        impact: 'Service malfunction or insecure defaults'
      });
      console.log(`❌ HIGH: Missing environment variables: ${missingVars.join(', ')}`);
    } else {
      this.passed.push('All required environment variables present');
      console.log('✅ All required environment variables are present');
    }
  }

  /**
   * 7. RUN ALL TESTS
   */
  async runAllTests() {
    console.log('🚀 Starting Enterprise Security Test Suite...\n');
    console.log('=' .repeat(60));

    const tests = [
      { name: 'File Upload Security', method: this.testFileUploadSecurity },
      { name: 'Rate Limiting', method: this.testRateLimiting },
      { name: 'Authentication Security', method: this.testAuthenticationSecurity },
      { name: 'Database Security', method: this.testDatabaseSecurity },
      { name: 'API Security', method: this.testApiSecurity },
      { name: 'Environment Security', method: this.testEnvironmentSecurity }
    ];

    for (const test of tests) {
      try {
        console.log(`\n🔍 Running ${test.name} Tests...`);
        await test.method.call(this);
        console.log(`✅ ${test.name} tests completed\n`);
      } catch (error) {
        console.error(`❌ ${test.name} tests failed:`, error.message);
        this.failed.push(`${test.name}: ${error.message}`);
      }
    }

    this.generateReport();
  }

  /**
   * 8. GENERATE SECURITY REPORT
   */
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('🔒 ENTERPRISE SECURITY TEST REPORT');
    console.log('=' .repeat(60));

    // Calculate risk score
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumCount = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    
    const riskScore = (criticalCount * 9) + (highCount * 6) + (mediumCount * 3);
    const maxScore = 50; // Theoretical maximum
    const riskPercentage = Math.min(100, (riskScore / maxScore) * 100);

    console.log(`\n📊 SECURITY METRICS:`);
    console.log(`   Risk Score: ${riskScore}/50 (${riskPercentage.toFixed(1)}%)`);
    console.log(`   Tests Passed: ${this.passed.length}`);
    console.log(`   Vulnerabilities Found: ${this.vulnerabilities.length}`);
    console.log(`   Critical: ${criticalCount} | High: ${highCount} | Medium: ${mediumCount}`);

    // Risk assessment
    let riskLevel = 'LOW';
    if (criticalCount > 0) riskLevel = 'CRITICAL';
    else if (highCount > 2) riskLevel = 'HIGH';
    else if (highCount > 0 || mediumCount > 3) riskLevel = 'MEDIUM';

    console.log(`   Overall Risk Level: ${riskLevel}`);

    // Detailed vulnerabilities
    if (this.vulnerabilities.length > 0) {
      console.log(`\n🚨 VULNERABILITIES FOUND:`);
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n${index + 1}. ${vuln.type} (${vuln.severity})`);
        console.log(`   Impact: ${vuln.impact}`);
        console.log(`   Result: ${vuln.result}`);
        if (vuln.endpoint) console.log(`   Endpoint: ${vuln.endpoint}`);
      });
    }

    // Recommendations
    console.log(`\n🛡️ SECURITY RECOMMENDATIONS:`);
    
    if (criticalCount > 0) {
      console.log(`   ⚠️ IMMEDIATE ACTION REQUIRED - ${criticalCount} critical vulnerabilities!`);
      console.log(`   🔒 Do not deploy to production until critical issues are resolved`);
    }
    
    if (highCount > 0) {
      console.log(`   📋 Address ${highCount} high-severity vulnerabilities within 24-48 hours`);
    }
    
    if (mediumCount > 0) {
      console.log(`   📝 Plan remediation for ${mediumCount} medium-severity issues within 1 week`);
    }

    console.log(`\n✅ SECURITY CONTROLS WORKING:`);
    this.passed.forEach(test => console.log(`   ✓ ${test}`));

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      riskScore,
      riskLevel,
      metrics: {
        total: this.vulnerabilities.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        passed: this.passed.length
      },
      vulnerabilities: this.vulnerabilities,
      passed: this.passed,
      failed: this.failed
    };

    fs.writeFileSync('enterprise-security-test-results.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: enterprise-security-test-results.json`);
    
    console.log('\n' + '=' .repeat(60));
  }
}

// Run the tests
(async () => {
  try {
    const tester = new EnterpriseSecurityTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('Security test suite failed:', error);
    process.exit(1);
  }
})(); 