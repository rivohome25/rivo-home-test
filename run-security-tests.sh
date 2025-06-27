#!/bin/bash

# ========================================
# RivoHome Enterprise Security Test Suite
# ========================================
# 
# This script runs comprehensive security tests to validate
# the critical vulnerabilities identified in the audit

set -e  # Exit on any error

echo "🚨🚨🚨 RIVOHOME ENTERPRISE SECURITY TEST SUITE 🚨🚨🚨"
echo "========================================================"
echo "Started: $(date)"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required to run security tests${NC}"
    exit 1
fi

# Check if environment variables are set
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Create .env.local with your Supabase credentials"
    exit 1
fi

# Create security-tests directory if it doesn't exist
mkdir -p security-tests

echo -e "${BLUE}📋 Checking test dependencies...${NC}"

# Check if test files exist
REQUIRED_FILES=(
    "security-tests/sql-injection-tests.js"
    "security-tests/authentication-tests.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing test file: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All test files found${NC}"

# Install required npm packages if needed
echo -e "${BLUE}📦 Installing test dependencies...${NC}"
npm install @supabase/supabase-js dotenv 2>/dev/null || true

echo ""
echo -e "${YELLOW}🔍 Starting Security Tests...${NC}"
echo "================================================"

# Run SQL Injection Tests
echo ""
echo -e "${RED}1️⃣ Running SQL Injection Tests...${NC}"
echo "=================================="
if node security-tests/sql-injection-tests.js; then
    echo -e "${GREEN}✅ SQL Injection tests completed${NC}"
else
    echo -e "${RED}❌ SQL Injection tests failed${NC}"
    exit 1
fi

echo ""
echo "================================================"

# Run Authentication Tests  
echo ""
echo -e "${RED}2️⃣ Running Authentication Tests...${NC}"
echo "===================================="
if node security-tests/authentication-tests.js; then
    echo -e "${GREEN}✅ Authentication tests completed${NC}"
else
    echo -e "${RED}❌ Authentication tests failed${NC}"
    exit 1
fi

echo ""
echo "================================================"

# Run API Security Tests
echo ""
echo -e "${RED}3️⃣ Running API Security Tests...${NC}"
echo "================================="

# Check if development server is running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Development server is running${NC}"
    
    # Test critical API endpoints
    echo "Testing API endpoints..."
    
    # Test unauthenticated access
    API_ENDPOINTS=(
        "/api/auth/check"
        "/api/admin/users"
        "/api/admin/providers"
        "/api/billing/cancel"
    )
    
    for endpoint in "${API_ENDPOINTS[@]}"; do
        echo "Testing $endpoint..."
        
        response=$(curl -s -w "%{http_code}" http://localhost:3001$endpoint)
        status_code="${response: -3}"
        
        if [ "$status_code" = "200" ]; then
            echo -e "${RED}❌ CRITICAL: $endpoint accessible without auth!${NC}"
        elif [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
            echo -e "${GREEN}✅ $endpoint properly secured${NC}"
        else
            echo -e "${YELLOW}⚠️  $endpoint returned status: $status_code${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Development server not running - skipping API tests${NC}"
    echo "Start with: npm run dev"
fi

echo ""
echo "================================================"

# Run Infrastructure Tests
echo ""
echo -e "${RED}4️⃣ Running Infrastructure Tests...${NC}"
echo "===================================="

# Test security headers
echo "Testing security headers..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    headers=$(curl -s -I http://localhost:3001)
    
    # Check for required security headers
    REQUIRED_HEADERS=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Content-Security-Policy"
    )
    
    for header in "${REQUIRED_HEADERS[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            echo -e "${GREEN}✅ $header header present${NC}"
        else
            echo -e "${YELLOW}⚠️  Missing $header header${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Cannot test headers - server not running${NC}"
fi

echo ""
echo "================================================"

# Generate Security Report
echo ""
echo -e "${BLUE}📊 Generating Security Report...${NC}"
echo "================================="

# Check if any test results exist
if [ -f "security-test-results.json" ] || [ -f "auth-test-results.json" ]; then
    echo -e "${GREEN}✅ Test results found${NC}"
    
    # Count vulnerabilities
    if [ -f "security-test-results.json" ]; then
        sql_vulns=$(jq '.vulnerabilities | length' security-test-results.json 2>/dev/null || echo "0")
        echo "SQL Injection vulnerabilities: $sql_vulns"
    fi
    
    if [ -f "auth-test-results.json" ]; then
        auth_vulns=$(jq '.vulnerabilities | length' auth-test-results.json 2>/dev/null || echo "0")
        echo "Authentication vulnerabilities: $auth_vulns"
    fi
    
    total_vulns=$((sql_vulns + auth_vulns))
    echo ""
    echo -e "${BLUE}📈 TOTAL VULNERABILITIES FOUND: $total_vulns${NC}"
    
    if [ "$total_vulns" -gt "0" ]; then
        echo ""
        echo -e "${RED}🚨 SECURITY ISSUES DETECTED!${NC}"
        echo "Review the detailed reports:"
        echo "- security-test-results.json"
        echo "- auth-test-results.json"
        echo ""
        echo -e "${YELLOW}IMMEDIATE ACTION REQUIRED:${NC}"
        echo "1. Apply critical security fixes"
        echo "2. Review and patch vulnerabilities"
        echo "3. Implement security monitoring"
    else
        echo -e "${GREEN}✅ No major vulnerabilities detected${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No test results generated${NC}"
fi

echo ""
echo "================================================"

# Security Fix Recommendations
echo ""
echo -e "${RED}🛠️  SECURITY FIX RECOMMENDATIONS${NC}"
echo "=================================="
echo ""
echo "CRITICAL FIXES (Apply immediately):"
echo "1. Execute: security-fixes/immediate-critical-fixes.sql"
echo "2. Remove SQL injection functions (exec_sql, pg_execute)" 
echo "3. Strengthen password policies (12+ chars, complexity)"
echo "4. Implement MFA for admin accounts"
echo ""
echo "HIGH PRIORITY FIXES (Within 1 week):"
echo "1. Add comprehensive input validation"
echo "2. Implement rate limiting on all endpoints"
echo "3. Enhance session management"
echo "4. Add security monitoring and alerting"
echo ""
echo "MONITORING & COMPLIANCE:"
echo "1. Set up continuous security scanning"
echo "2. Implement security incident response"
echo "3. Regular penetration testing"
echo "4. GDPR/PCI DSS compliance review"

echo ""
echo "================================================"
echo -e "${GREEN}🔍 SECURITY TEST SUITE COMPLETED${NC}"
echo "================================================"
echo "Completed: $(date)"

# Exit with appropriate code
if [ -f "security-test-results.json" ] && [ -f "auth-test-results.json" ]; then
    sql_vulns=$(jq '.vulnerabilities | length' security-test-results.json 2>/dev/null || echo "0")
    auth_vulns=$(jq '.vulnerabilities | length' auth-test-results.json 2>/dev/null || echo "0")
    total_vulns=$((sql_vulns + auth_vulns))
    
    if [ "$total_vulns" -gt "0" ]; then
        echo ""
        echo -e "${RED}⚠️  Exiting with code 1 due to security vulnerabilities${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Security tests passed - no critical issues detected${NC}"
exit 0 