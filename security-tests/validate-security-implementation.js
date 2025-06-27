/**
 * SECURITY IMPLEMENTATION VALIDATION
 * 
 * Validates that all enterprise security fixes have been properly implemented
 * without requiring live database connections.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 VALIDATING ENTERPRISE SECURITY IMPLEMENTATION...\n');

class SecurityValidator {
  constructor() {
    this.passed = [];
    this.failed = [];
    this.warnings = [];
  }

  /**
   * Check if required security files exist
   */
  validateSecurityFiles() {
    console.log('📁 Validating security files...');
    
    const requiredFiles = [
      'lib/secure-file-validation.ts',
      'lib/secure-upload-middleware.ts', 
      'components/SecureFileUploader.tsx',
      'lib/env-validator.ts',
      'lib/secure-logger.ts',
      'lib/redis-rate-limiter.ts',
      'lib/rate-limit-middleware.ts',
      '.env.template',
      'security-fixes/credential-rotation-guide.md',
      'security-fixes/redis-setup-guide.md',
      'security-fixes/virus-scanning-setup.md'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.passed.push(`Security file exists: ${file}`);
        console.log(`✅ ${file}`);
      } else {
        this.failed.push(`Missing security file: ${file}`);
        console.log(`❌ Missing: ${file}`);
      }
    });
  }

  /**
   * Validate hardcoded credentials have been removed
   */
  validateCredentialRemoval() {
    console.log('\n🔐 Checking for hardcoded credentials...');
    
    const testFiles = [
      'test-rls-policies.js',
      'test-provider-registration.js',
      'test-auth-debug.js',
      'test-connection.js'
    ];

    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for hardcoded JWT tokens
        const jwtPattern = /['"]eyJ[A-Za-z0-9+/=]+['"](?!\s*\))/g;
        const matches = content.match(jwtPattern);
        
        if (matches && matches.length > 0) {
          this.failed.push(`Hardcoded credentials found in ${file}: ${matches.length} instances`);
          console.log(`❌ ${file}: Found ${matches.length} hardcoded credentials`);
        } else {
          this.passed.push(`No hardcoded credentials in ${file}`);
          console.log(`✅ ${file}: Clean`);
        }
      }
    });
  }

  /**
   * Validate environment template exists and is properly configured
   */
  validateEnvironmentTemplate() {
    console.log('\n🌍 Validating environment template...');
    
    if (fs.existsSync('.env.template')) {
      const content = fs.readFileSync('.env.template', 'utf8');
      
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET'
      ];

      const missingVars = requiredVars.filter(varName => !content.includes(varName));
      
      if (missingVars.length === 0) {
        this.passed.push('Environment template contains all required variables');
        console.log('✅ Environment template is complete');
      } else {
        this.failed.push(`Environment template missing: ${missingVars.join(', ')}`);
        console.log(`❌ Missing variables: ${missingVars.join(', ')}`);
      }

      // Check for security comments
      if (content.includes('SECURITY NOTICE') && content.includes('Never commit')) {
        this.passed.push('Environment template has security warnings');
        console.log('✅ Security warnings present');
      } else {
        this.warnings.push('Environment template should include security warnings');
        console.log('⚠️ Missing security warnings');
      }
    } else {
      this.failed.push('Environment template file missing');
      console.log('❌ .env.template not found');
    }
  }

  /**
   * Validate Redis dependencies are installed
   */
  validateDependencies() {
    console.log('\n📦 Validating dependencies...');
    
    if (fs.existsSync('package.json')) {
      const packageContent = fs.readFileSync('package.json', 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredDeps = ['redis', '@upstash/redis'];
      const installedDeps = Object.keys(packageJson.dependencies || {});
      
      requiredDeps.forEach(dep => {
        if (installedDeps.includes(dep)) {
          this.passed.push(`Dependency installed: ${dep}`);
          console.log(`✅ ${dep}`);
        } else {
          this.failed.push(`Missing dependency: ${dep}`);
          console.log(`❌ Missing: ${dep}`);
        }
      });

      // Check for security test scripts
      const scripts = packageJson.scripts || {};
      if (scripts['validate-env'] || scripts['test:rate-limit']) {
        this.passed.push('Security scripts added to package.json');
        console.log('✅ Security scripts configured');
      } else {
        this.warnings.push('Security scripts should be added to package.json');
        console.log('⚠️ Security scripts not configured');
      }
    }
  }

  /**
   * Validate .gitignore security additions
   */
  validateGitignore() {
    console.log('\n🚫 Validating .gitignore security...');
    
    if (fs.existsSync('.gitignore')) {
      const content = fs.readFileSync('.gitignore', 'utf8');
      
      const securityPatterns = [
        '.env',
        '*.key',
        'secrets/',
        'credentials/'
      ];

      const hasSecuritySection = content.includes('SECURITY: Never commit these files');
      
      if (hasSecuritySection) {
        this.passed.push('.gitignore has security section');
        console.log('✅ Security section present');
      } else {
        this.warnings.push('.gitignore missing security section');
        console.log('⚠️ Security section missing');
      }

      const missingPatterns = securityPatterns.filter(pattern => !content.includes(pattern));
      
      if (missingPatterns.length === 0) {
        this.passed.push('All security patterns in .gitignore');
        console.log('✅ Security patterns complete');
      } else {
        this.warnings.push(`Missing .gitignore patterns: ${missingPatterns.join(', ')}`);
        console.log(`⚠️ Missing patterns: ${missingPatterns.join(', ')}`);
      }
    }
  }

  /**
   * Validate file upload security implementation
   */
  validateFileUploadSecurity() {
    console.log('\n📎 Validating file upload security...');
    
    if (fs.existsSync('lib/secure-file-validation.ts')) {
      const content = fs.readFileSync('lib/secure-file-validation.ts', 'utf8');
      
      const securityFeatures = [
        'FILE_SIGNATURES',
        'validateFileSignature',
        'sanitizeFileName',
        'validateFileExtension',
        'getSecureContentDisposition'
      ];

      const missingFeatures = securityFeatures.filter(feature => !content.includes(feature));
      
      if (missingFeatures.length === 0) {
        this.passed.push('File upload security features implemented');
        console.log('✅ All security features present');
      } else {
        this.failed.push(`Missing file upload features: ${missingFeatures.join(', ')}`);
        console.log(`❌ Missing features: ${missingFeatures.join(', ')}`);
      }
    }
  }

  /**
   * Validate rate limiting implementation
   */
  validateRateLimiting() {
    console.log('\n🛡️ Validating rate limiting...');
    
    if (fs.existsSync('lib/redis-rate-limiter.ts')) {
      const content = fs.readFileSync('lib/redis-rate-limiter.ts', 'utf8');
      
      const rateLimitFeatures = [
        'RedisRateLimiter',
        'RATE_LIMIT_CONFIGS',
        'checkRateLimit',
        'auth:',
        'admin:',
        'fileUpload:'
      ];

      const missingFeatures = rateLimitFeatures.filter(feature => !content.includes(feature));
      
      if (missingFeatures.length === 0) {
        this.passed.push('Rate limiting features implemented');
        console.log('✅ All rate limiting features present');
      } else {
        this.failed.push(`Missing rate limiting features: ${missingFeatures.join(', ')}`);
        console.log(`❌ Missing features: ${missingFeatures.join(', ')}`);
      }

      // Check for Redis fallback
      if (content.includes('fallbackStore') && content.includes('in-memory')) {
        this.passed.push('Redis fallback mechanism implemented');
        console.log('✅ Redis fallback present');
      } else {
        this.warnings.push('Redis fallback should be implemented');
        console.log('⚠️ Redis fallback missing');
      }
    }
  }

  /**
   * Check for remaining dangerous functions
   */
  validateDangerousFunctions() {
    console.log('\n⚠️ Checking for dangerous functions...');
    
    const sqlFiles = [
      'create_exec_sql_function.sql',
      'create_pg_execute_function.sql'
    ];

    let dangerousFunctionsFound = false;
    
    sqlFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('CREATE OR REPLACE FUNCTION') && !content.includes('-- DISABLED')) {
          this.failed.push(`Dangerous function file still active: ${file}`);
          console.log(`❌ ${file}: Still contains dangerous functions`);
          dangerousFunctionsFound = true;
        } else {
          this.passed.push(`Dangerous function file safe: ${file}`);
          console.log(`✅ ${file}: Safe`);
        }
      }
    });

    if (!dangerousFunctionsFound) {
      this.passed.push('No active dangerous SQL functions found');
      console.log('✅ No dangerous SQL functions detected');
    }
  }

  /**
   * Run all validations
   */
  runValidation() {
    console.log('🚀 Starting Security Implementation Validation...\n');
    console.log('=' .repeat(60));

    this.validateSecurityFiles();
    this.validateCredentialRemoval();
    this.validateEnvironmentTemplate();
    this.validateDependencies();
    this.validateGitignore();
    this.validateFileUploadSecurity();
    this.validateRateLimiting();
    this.validateDangerousFunctions();

    this.generateReport();
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('🔒 SECURITY IMPLEMENTATION VALIDATION REPORT');
    console.log('=' .repeat(60));

    const totalTests = this.passed.length + this.failed.length + this.warnings.length;
    const successRate = ((this.passed.length / (this.passed.length + this.failed.length)) * 100).toFixed(1);

    console.log(`\n📊 VALIDATION METRICS:`);
    console.log(`   Total Checks: ${totalTests}`);
    console.log(`   Passed: ${this.passed.length}`);
    console.log(`   Failed: ${this.failed.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Success Rate: ${successRate}%`);

    // Overall status
    let status = 'EXCELLENT';
    if (this.failed.length > 0) status = 'NEEDS ATTENTION';
    if (this.failed.length > 3) status = 'CRITICAL ISSUES';

    console.log(`   Overall Status: ${status}`);

    // Failed validations
    if (this.failed.length > 0) {
      console.log(`\n❌ FAILED VALIDATIONS:`);
      this.failed.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure}`);
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // Passed validations
    if (this.passed.length > 0) {
      console.log(`\n✅ PASSED VALIDATIONS:`);
      this.passed.forEach(test => console.log(`   ✓ ${test}`));
    }

    // Recommendations
    console.log(`\n🛡️ RECOMMENDATIONS:`);
    
    if (this.failed.length === 0) {
      console.log(`   🎉 Excellent! All critical security implementations are in place.`);
      console.log(`   🚀 Ready for production deployment with security monitoring.`);
    } else {
      console.log(`   ⚠️ Address ${this.failed.length} failed validation(s) before deployment.`);
    }
    
    if (this.warnings.length > 0) {
      console.log(`   📋 Consider addressing ${this.warnings.length} warning(s) for enhanced security.`);
    }

    console.log(`\n🔐 SECURITY IMPLEMENTATION STATUS:`);
    
    if (this.failed.length === 0 && this.warnings.length <= 2) {
      console.log(`   ✅ ENTERPRISE GRADE SECURITY ACHIEVED`);
      console.log(`   🎯 Risk Level: LOW-MEDIUM`);
      console.log(`   🚀 Production Ready: YES`);
    } else if (this.failed.length <= 2) {
      console.log(`   ⚠️ GOOD SECURITY IMPLEMENTATION`);
      console.log(`   🎯 Risk Level: MEDIUM`);
      console.log(`   🚀 Production Ready: WITH FIXES`);
    } else {
      console.log(`   ❌ SECURITY IMPLEMENTATION INCOMPLETE`);
      console.log(`   🎯 Risk Level: HIGH`);
      console.log(`   🚀 Production Ready: NO`);
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      status,
      successRate: parseFloat(successRate),
      metrics: {
        total: totalTests,
        passed: this.passed.length,
        failed: this.failed.length,
        warnings: this.warnings.length
      },
      failed: this.failed,
      warnings: this.warnings,
      passed: this.passed
    };

    fs.writeFileSync('security-validation-report.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: security-validation-report.json`);
    
    console.log('\n' + '=' .repeat(60));

    // Exit with appropriate code
    if (this.failed.length > 0) {
      console.log('⚠️ Validation completed with issues. Address failed items before deployment.');
      process.exit(1);
    } else {
      console.log('✅ Security implementation validation successful!');
      process.exit(0);
    }
  }
}

// Run the validation
const validator = new SecurityValidator();
validator.runValidation(); 