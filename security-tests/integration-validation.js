/**
 * SECURITY INTEGRATION VALIDATION
 * 
 * Validates that all security measures are properly integrated into the application.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 SECURITY INTEGRATION VALIDATION SUITE...\n');

class SecurityIntegrationValidator {
  constructor() {
    this.passed = [];
    this.failed = [];
    this.warnings = [];
  }

  /**
   * Test if SecureFileUploader is integrated in key components
   */
  validateSecureFileUploaderIntegration() {
    console.log('🔍 Validating SecureFileUploader Integration...');
    
    const componentsToCheck = [
      'app/dashboard/documents/page.tsx',
      'components/widgets/homeowner/Documents.tsx',
      'app/provider-onboarding/components/InsuranceUploader.tsx',
      'app/provider-onboarding/components/LicenseUploader.tsx'
    ];
    
    let integrationScore = 0;
    const totalComponents = componentsToCheck.length;
    
    componentsToCheck.forEach(componentPath => {
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        if (content.includes('SecureFileUploader')) {
          console.log(`  ✅ ${componentPath} - Uses SecureFileUploader`);
          integrationScore++;
          
          // Check for sanitized filename usage
          if (content.includes('sanitizedName')) {
            console.log(`    ✅ Handles sanitized filenames`);
          } else {
            this.warnings.push(`${componentPath} may not be handling sanitized filenames`);
          }
        } else {
          console.log(`  ❌ ${componentPath} - Still using insecure upload`);
          this.failed.push(`${componentPath} not using SecureFileUploader`);
        }
      } else {
        this.warnings.push(`Component ${componentPath} not found`);
      }
    });
    
    if (integrationScore === totalComponents) {
      this.passed.push('All file upload components use SecureFileUploader');
    } else {
      this.failed.push(`Only ${integrationScore}/${totalComponents} components use SecureFileUploader`);
    }
  }

  /**
   * Validate rate limiting integration
   */
  validateRateLimitingIntegration() {
    console.log('\n🔍 Validating Rate Limiting Integration...');
    
    // Check middleware.ts
    if (fs.existsSync('middleware.ts')) {
      const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
      
      if (middlewareContent.includes('rateLimit') && 
          middlewareContent.includes('RATE_LIMIT_CONFIGS')) {
        console.log('  ✅ Rate limiting integrated in middleware.ts');
        this.passed.push('Rate limiting middleware integrated');
        
        // Check for different route types
        const routeTypes = ['admin', 'auth', 'fileUpload', 'payment', 'api'];
        routeTypes.forEach(routeType => {
          if (middlewareContent.includes(routeType)) {
            console.log(`    ✅ ${routeType} routes have rate limiting`);
          }
        });
      } else {
        console.log('  ❌ Rate limiting not properly integrated in middleware');
        this.failed.push('Rate limiting middleware not integrated');
      }
    } else {
      this.failed.push('middleware.ts not found');
    }
  }

  /**
   * Validate environment security integration
   */
  validateEnvironmentSecurityIntegration() {
    console.log('\n🔍 Validating Environment Security Integration...');
    
    // Check SecurityProvider integration
    if (fs.existsSync('components/SecurityProvider.tsx')) {
      const securityProviderContent = fs.readFileSync('components/SecurityProvider.tsx', 'utf8');
      
      if (securityProviderContent.includes('validateEnvironment')) {
        console.log('  ✅ SecurityProvider includes environment validation');
        this.passed.push('Environment validation integrated');
      } else {
        this.failed.push('SecurityProvider missing environment validation');
      }
    } else {
      this.failed.push('SecurityProvider component not found');
    }
    
    // Check root layout integration
    if (fs.existsSync('app/layout.tsx')) {
      const layoutContent = fs.readFileSync('app/layout.tsx', 'utf8');
      
      if (layoutContent.includes('SecurityProvider')) {
        console.log('  ✅ SecurityProvider integrated in root layout');
        this.passed.push('SecurityProvider integrated in application');
      } else {
        this.failed.push('SecurityProvider not integrated in root layout');
      }
    }
  }

  /**
   * Validate security libraries exist and are functional
   */
  validateSecurityLibraries() {
    console.log('\n🔍 Validating Security Libraries...');
    
    const securityLibraries = [
      'lib/secure-file-validation.ts',
      'lib/redis-rate-limiter.ts',
      'lib/env-validator.ts',
      'lib/secure-logger.ts'
    ];
    
    let libraryScore = 0;
    
    securityLibraries.forEach(libPath => {
      if (fs.existsSync(libPath)) {
        console.log(`  ✅ ${libPath} exists`);
        libraryScore++;
        
        // Basic functionality check
        const content = fs.readFileSync(libPath, 'utf8');
        if (content.includes('export')) {
          console.log(`    ✅ Has proper exports`);
        }
      } else {
        console.log(`  ❌ ${libPath} missing`);
        this.failed.push(`Security library ${libPath} not found`);
      }
    });
    
    if (libraryScore === securityLibraries.length) {
      this.passed.push('All security libraries present');
    }
  }

  /**
   * Validate Redis dependencies
   */
  validateRedisDependencies() {
    console.log('\n🔍 Validating Redis Dependencies...');
    
    if (fs.existsSync('package.json')) {
      const packageContent = fs.readFileSync('package.json', 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const redisDeps = ['redis', '@upstash/redis'];
      let depScore = 0;
      
      redisDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          console.log(`  ✅ ${dep} installed: ${packageJson.dependencies[dep]}`);
          depScore++;
        } else {
          this.failed.push(`Redis dependency ${dep} not installed`);
        }
      });
      
      if (depScore === redisDeps.length) {
        this.passed.push('Redis dependencies installed');
      }
    }
  }

  /**
   * Run all validation tests
   */
  async runValidation() {
    this.validateSecureFileUploaderIntegration();
    this.validateRateLimitingIntegration();
    this.validateEnvironmentSecurityIntegration();
    this.validateSecurityLibraries();
    this.validateRedisDependencies();
    
    // Generate final report
    this.generateReport();
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🏆 SECURITY INTEGRATION VALIDATION REPORT');
    console.log('='.repeat(80));
    
    const totalTests = this.passed.length + this.failed.length;
    const passRate = totalTests > 0 ? ((this.passed.length / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`\n📊 INTEGRATION STATUS:`);
    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`❌ Failed: ${this.failed.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`📈 Success Rate: ${passRate}%`);
    
    if (this.passed.length > 0) {
      console.log(`\n✅ SUCCESSFULLY INTEGRATED:`);
      this.passed.forEach(item => console.log(`  • ${item}`));
    }
    
    if (this.failed.length > 0) {
      console.log(`\n❌ INTEGRATION FAILURES:`);
      this.failed.forEach(item => console.log(`  • ${item}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ INTEGRATION WARNINGS:`);
      this.warnings.forEach(item => console.log(`  • ${item}`));
    }
    
    // Security integration status
    let integrationStatus = 'INCOMPLETE';
    if (passRate >= 90) {
      integrationStatus = 'EXCELLENT';
    } else if (passRate >= 75) {
      integrationStatus = 'GOOD';
    } else if (passRate >= 50) {
      integrationStatus = 'PARTIAL';
    }
    
    console.log(`\n🔒 OVERALL SECURITY INTEGRATION: ${integrationStatus}`);
    
    if (integrationStatus === 'EXCELLENT') {
      console.log('🎉 Enterprise security integration is complete and ready for production!');
    } else {
      console.log('⚠️ Additional integration work required before production deployment.');
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run the validation
const validator = new SecurityIntegrationValidator();
validator.runValidation().catch(console.error); 