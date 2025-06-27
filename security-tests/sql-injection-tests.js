/**
 * SQL Injection Security Tests
 * Tests for SQL injection vulnerabilities in RivoHome application
 * 
 * CRITICAL: These tests validate extremely dangerous SQL injection vulnerabilities
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class SQLInjectionTester {
  constructor() {
    this.vulnerabilities = [];
    this.testResults = [];
  }

  async testExecSQLFunction() {
    console.log('\n🔍 Testing exec_sql function for SQL injection...');
    
    const maliciousPayloads = [
      // Basic SQL injection
      "'; DROP TABLE users; --",
      "UNION SELECT password FROM auth.users",
      "'; INSERT INTO profiles (id, role) VALUES (gen_random_uuid(), 'admin'); --",
      
      // Data exfiltration attempts
      "'; SELECT * FROM auth.users; --",
      "'; SELECT email, encrypted_password FROM auth.users; --",
      
      // Privilege escalation
      "'; UPDATE profiles SET is_admin = true WHERE id = auth.uid(); --",
      "'; CREATE USER attacker WITH SUPERUSER PASSWORD 'hacked'; --"
    ];

    for (const payload of maliciousPayloads) {
      try {
        console.log(`Testing payload: ${payload.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          query: payload
        });
        
        if (!error) {
          this.vulnerabilities.push({
            type: 'SQL_INJECTION',
            severity: 'CRITICAL',
            function: 'exec_sql',
            payload: payload,
            result: 'EXECUTION_SUCCESSFUL',
            impact: 'Arbitrary SQL execution possible'
          });
          console.log('❌ CRITICAL: SQL injection successful!');
        } else {
          console.log(`✅ Blocked: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Error: ${err.message}`);
      }
    }
  }

  async testPgExecuteFunction() {
    console.log('\n🔍 Testing pg_execute function for SQL injection...');
    
    const maliciousPayloads = [
      "SELECT * FROM auth.users",
      "DELETE FROM profiles WHERE role = 'admin'",
      "CREATE TABLE attacker_backdoor (id UUID DEFAULT gen_random_uuid())",
      "INSERT INTO audit_log (action, details) VALUES ('HACKED', '{\"attacker\": \"present\"}')"
    ];

    for (const payload of maliciousPayloads) {
      try {
        console.log(`Testing pg_execute with: ${payload.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('pg_execute', {
          sql_statement: payload
        });
        
        if (!error) {
          this.vulnerabilities.push({
            type: 'SQL_INJECTION',
            severity: 'CRITICAL',
            function: 'pg_execute',
            payload: payload,
            result: 'EXECUTION_SUCCESSFUL',
            impact: 'Arbitrary SQL execution possible'
          });
          console.log('❌ CRITICAL: SQL injection successful!');
        } else {
          console.log(`✅ Blocked: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Error: ${err.message}`);
      }
    }
  }

  async testParameterizedQueries() {
    console.log('\n🔍 Testing parameterized query safety...');
    
    // Test if regular queries are properly parameterized
    const testQueries = [
      {
        query: "SELECT * FROM profiles WHERE full_name = $1",
        params: ["'; DROP TABLE profiles; --"]
      },
      {
        query: "UPDATE profiles SET full_name = $1 WHERE id = $2", 
        params: ["<script>alert('xss')</script>", "invalid-uuid'; DROP TABLE profiles; --"]
      }
    ];

    for (const test of testQueries) {
      try {
        console.log(`Testing parameterized query safety...`);
        
        // This should be safe if properly parameterized
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('full_name', test.params[0]);
        
        if (error) {
          console.log(`✅ Query rejected: ${error.message}`);
        } else {
          console.log(`✅ Query executed safely (parameterized)`);
        }
      } catch (err) {
        console.log(`⚠️  Error: ${err.message}`);
      }
    }
  }

  async testStringConcatenationVulnerabilities() {
    console.log('\n🔍 Testing string concatenation vulnerabilities...');
    
    // Test functions that use string concatenation
    const testInputs = [
      "'; DROP TABLE properties; --",
      "texas'; UPDATE profiles SET is_admin = true; --",
      "12345'; DELETE FROM user_plans; --"
    ];

    for (const input of testInputs) {
      try {
        console.log(`Testing generate_rivo_id with malicious input...`);
        
        const { data, error } = await supabase.rpc('generate_rivo_id', {
          p_region: input,
          p_address: "123 Safe St"
        });
        
        if (!error && data) {
          console.log(`⚠️  Function executed with suspicious input: ${data}`);
        } else if (error) {
          console.log(`✅ Function rejected input: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️  Error: ${err.message}`);
      }
    }
  }

  async testDataExfiltration() {
    console.log('\n🔍 Testing data exfiltration vulnerabilities...');
    
    try {
      // Try to access sensitive auth data through vulnerable functions
      const sensitiveQueries = [
        "SELECT email, encrypted_password FROM auth.users LIMIT 5",
        "SELECT * FROM auth.sessions",
        "SELECT user_id, stripe_customer_id FROM user_plans",
        "SELECT * FROM profiles WHERE is_admin = true"
      ];

      for (const query of sensitiveQueries) {
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            query: query
          });
          
          if (!error && data) {
            this.vulnerabilities.push({
              type: 'DATA_EXFILTRATION',
              severity: 'CRITICAL',
              query: query,
              result: 'SENSITIVE_DATA_ACCESSED',
              impact: 'Sensitive user data exposed'
            });
            console.log(`❌ CRITICAL: Sensitive data accessed!`);
          }
        } catch (err) {
          console.log(`✅ Access denied: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`Error testing data exfiltration: ${err.message}`);
    }
  }

  async runAllTests() {
    console.log('🚨 Starting SQL Injection Security Tests');
    console.log('========================================');
    
    await this.testExecSQLFunction();
    await this.testPgExecuteFunction();
    await this.testParameterizedQueries();
    await this.testStringConcatenationVulnerabilities();
    await this.testDataExfiltration();
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 SQL INJECTION TEST RESULTS');
    console.log('===============================');
    
    if (this.vulnerabilities.length > 0) {
      console.log(`❌ CRITICAL: Found ${this.vulnerabilities.length} vulnerabilities!`);
      
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n${index + 1}. ${vuln.type} - ${vuln.severity}`);
        console.log(`   Function: ${vuln.function || 'N/A'}`);
        console.log(`   Impact: ${vuln.impact}`);
        if (vuln.payload) {
          console.log(`   Payload: ${vuln.payload.substring(0, 100)}...`);
        }
      });
      
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('1. Disable exec_sql and pg_execute functions');
      console.log('2. Review all SECURITY DEFINER functions');
      console.log('3. Implement parameterized queries only');
      console.log('4. Add comprehensive input validation');
      
    } else {
      console.log('✅ No SQL injection vulnerabilities found');
    }
    
    console.log('\n📄 Report saved to: security-test-results.json');
    
    // Save detailed report
    require('fs').writeFileSync(
      'security-test-results.json',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        testType: 'SQL_INJECTION',
        vulnerabilities: this.vulnerabilities,
        summary: {
          total: this.vulnerabilities.length,
          critical: this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
          high: this.vulnerabilities.filter(v => v.severity === 'HIGH').length
        }
      }, null, 2)
    );
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SQLInjectionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SQLInjectionTester; 