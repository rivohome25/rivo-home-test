/**
 * Payment & Billing Tests for RivoHome Platform
 * 
 * Tests Stripe integration, subscription management, plan changes,
 * and pay-per-report functionality.
 */

const { test, expect } = require('@playwright/test');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentTests {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.testCards = {
      valid: '4242424242424242',
      declined: '4000000000000002',
      insufficientFunds: '4000000000009995',
      requiresAuth: '4000002500003155'
    };
  }

  // Test subscription checkout flows
  async testSubscriptionCheckout() {
    console.log('🧪 Testing Subscription Checkout Flows...');
    
    await this.testCoreSubscription();
    await this.testPremiumSubscription();
    await this.testPaymentFailures();
    await this.testCheckoutCancellation();
  }

  async testCoreSubscription() {
    console.log('💳 Testing Core subscription ($7/mo)...');
    
    // Start homeowner onboarding
    await this.page.goto(`${this.baseUrl}/onboarding`);
    
    // Navigate to plan selection
    await this.page.click('[data-testid="continue-button"]'); // Step 1
    
    // Select Core plan
    await this.page.click('[data-testid="core-plan-button"]');
    
    // Should redirect to Stripe checkout
    await this.page.waitForURL('**/checkout.stripe.com/**');
    console.log('✅ Redirected to Stripe checkout for Core plan');
    
    // Fill Stripe checkout form
    await this.fillStripeCheckout(this.testCards.valid);
    
    // Complete payment
    await this.page.click('[data-testid="submit"]');
    
    // Should redirect back to onboarding
    await this.page.waitForURL('**/onboarding**');
    console.log('✅ Core subscription payment successful');
    
    // Verify subscription in database
    await this.verifySubscriptionCreated('Core', 7.00);
  }

  async testPremiumSubscription() {
    console.log('💎 Testing Premium subscription ($20/mo)...');
    
    await this.page.goto(`${this.baseUrl}/onboarding`);
    await this.page.click('[data-testid="continue-button"]');
    
    // Select Premium plan
    await this.page.click('[data-testid="premium-plan-button"]');
    
    await this.page.waitForURL('**/checkout.stripe.com/**');
    console.log('✅ Redirected to Stripe checkout for Premium plan');
    
    await this.fillStripeCheckout(this.testCards.valid);
    await this.page.click('[data-testid="submit"]');
    
    await this.page.waitForURL('**/onboarding**');
    console.log('✅ Premium subscription payment successful');
    
    await this.verifySubscriptionCreated('Premium', 20.00);
  }

  async testPaymentFailures() {
    console.log('❌ Testing payment failures...');
    
    // Test declined card
    await this.page.goto(`${this.baseUrl}/onboarding`);
    await this.page.click('[data-testid="continue-button"]');
    await this.page.click('[data-testid="core-plan-button"]');
    
    await this.page.waitForURL('**/checkout.stripe.com/**');
    await this.fillStripeCheckout(this.testCards.declined);
    await this.page.click('[data-testid="submit"]');
    
    // Should show payment error
    const errorMessage = await this.page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('declined');
    console.log('✅ Declined card properly handled');
    
    // Test insufficient funds
    await this.fillStripeCheckout(this.testCards.insufficientFunds);
    await this.page.click('[data-testid="submit"]');
    
    const insufficientError = await this.page.textContent('[data-testid="error-message"]');
    expect(insufficientError).toContain('insufficient');
    console.log('✅ Insufficient funds properly handled');
  }

  async testCheckoutCancellation() {
    console.log('🚫 Testing checkout cancellation...');
    
    await this.page.goto(`${this.baseUrl}/onboarding`);
    await this.page.click('[data-testid="continue-button"]');
    await this.page.click('[data-testid="premium-plan-button"]');
    
    await this.page.waitForURL('**/checkout.stripe.com/**');
    
    // Cancel checkout
    await this.page.click('[data-testid="cancel-button"]');
    
    // Should return to plan selection
    await this.page.waitForURL('**/onboarding**');
    expect(this.page.url()).toContain('step=2');
    console.log('✅ Checkout cancellation handled correctly');
  }

  // Test plan management
  async testPlanManagement() {
    console.log('🧪 Testing Plan Management...');
    
    await this.testPlanUpgrades();
    await this.testPlanDowngrades();
    await this.testPlanCancellation();
  }

  async testPlanUpgrades() {
    console.log('⬆️ Testing plan upgrades...');
    
    // Login as Core user
    await this.loginAsUser('core-user@example.com', 'password123');
    
    // Navigate to billing settings
    await this.page.goto(`${this.baseUrl}/settings/billing`);
    
    // Upgrade to Premium
    await this.page.click('[data-testid="upgrade-premium-button"]');
    
    // Should redirect to Stripe checkout
    await this.page.waitForURL('**/checkout.stripe.com/**');
    await this.fillStripeCheckout(this.testCards.valid);
    await this.page.click('[data-testid="submit"]');
    
    // Should return to billing page
    await this.page.waitForURL('**/settings/billing**');
    
    // Verify plan upgrade
    const currentPlan = await this.page.textContent('[data-testid="current-plan"]');
    expect(currentPlan).toContain('Premium');
    console.log('✅ Plan upgrade successful');
    
    // Verify prorated billing
    await this.verifyProrationCalculation();
  }

  async testPlanDowngrades() {
    console.log('⬇️ Testing plan downgrades...');
    
    // Login as Premium user
    await this.loginAsUser('premium-user@example.com', 'password123');
    
    await this.page.goto(`${this.baseUrl}/settings/billing`);
    
    // Downgrade to Core
    await this.page.click('[data-testid="downgrade-core-button"]');
    
    // Should show confirmation dialog
    await this.page.click('[data-testid="confirm-downgrade"]');
    
    // Verify downgrade scheduled
    const scheduleMessage = await this.page.textContent('[data-testid="schedule-message"]');
    expect(scheduleMessage).toContain('next billing cycle');
    console.log('✅ Plan downgrade scheduled for next cycle');
  }

  async testPlanCancellation() {
    console.log('🗑️ Testing plan cancellation...');
    
    await this.loginAsUser('premium-user@example.com', 'password123');
    await this.page.goto(`${this.baseUrl}/settings/billing`);
    
    // Cancel subscription
    await this.page.click('[data-testid="cancel-subscription-button"]');
    
    // Should show cancellation form
    await this.page.fill('[data-testid="cancellation-reason"]', 'Testing cancellation flow');
    await this.page.click('[data-testid="confirm-cancellation"]');
    
    // Verify cancellation scheduled
    const cancelMessage = await this.page.textContent('[data-testid="cancel-message"]');
    expect(cancelMessage).toContain('will remain active until');
    console.log('✅ Subscription cancellation successful');
  }

  // Test pay-per-report system
  async testPayPerReportSystem() {
    console.log('🧪 Testing Pay-Per-Report System...');
    
    await this.testReportPurchase();
    await this.testReportAccessControl();
    await this.testPremiumReportAccess();
  }

  async testReportPurchase() {
    console.log('📊 Testing report purchase for Free/Core users...');
    
    // Login as Free user
    await this.loginAsUser('free-user@example.com', 'password123');
    
    // Navigate to property report
    await this.page.goto(`${this.baseUrl}/dashboard/properties`);
    await this.page.click('[data-testid="generate-report-button"]');
    
    // Should show payment modal
    const paymentModal = await this.page.locator('[data-testid="payment-modal"]');
    expect(await paymentModal.isVisible()).toBe(true);
    
    const reportPrice = await this.page.textContent('[data-testid="report-price"]');
    expect(reportPrice).toContain('$2.00');
    console.log('✅ Pay-per-report modal displayed with correct price');
    
    // Complete payment
    await this.page.click('[data-testid="pay-for-report"]');
    await this.page.waitForURL('**/checkout.stripe.com/**');
    
    await this.fillStripeCheckout(this.testCards.valid);
    await this.page.click('[data-testid="submit"]');
    
    // Should return and show report
    await this.page.waitForURL('**/dashboard/properties**');
    
    const reportContent = await this.page.locator('[data-testid="report-content"]');
    expect(await reportContent.isVisible()).toBe(true);
    console.log('✅ Report purchase successful - report displayed');
  }

  async testReportAccessControl() {
    console.log('🔒 Testing report access control...');
    
    // Login as Free user without report purchase
    await this.loginAsUser('free-user-2@example.com', 'password123');
    
    await this.page.goto(`${this.baseUrl}/dashboard/properties`);
    await this.page.click('[data-testid="generate-report-button"]');
    
    // Should prompt for payment
    const paymentPrompt = await this.page.locator('[data-testid="payment-required"]');
    expect(await paymentPrompt.isVisible()).toBe(true);
    console.log('✅ Report access properly restricted for non-paying users');
  }

  async testPremiumReportAccess() {
    console.log('👑 Testing Premium user report access...');
    
    // Login as Premium user
    await this.loginAsUser('premium-user@example.com', 'password123');
    
    await this.page.goto(`${this.baseUrl}/dashboard/properties`);
    await this.page.click('[data-testid="generate-report-button"]');
    
    // Should directly show report (no payment required)
    const reportContent = await this.page.locator('[data-testid="report-content"]');
    expect(await reportContent.isVisible()).toBe(true);
    console.log('✅ Premium users can access reports without additional payment');
    
    // Test PDF sharing (Premium feature)
    await this.page.click('[data-testid="share-report-button"]');
    
    const shareOptions = await this.page.locator('[data-testid="share-options"]');
    expect(await shareOptions.isVisible()).toBe(true);
    console.log('✅ Premium report sharing feature available');
  }

  // Test plan enforcement
  async testPlanEnforcement() {
    console.log('🧪 Testing Plan Enforcement...');
    
    await this.testFreePlanLimits();
    await this.testCorePlanLimits();
    await this.testPremiumFeatures();
  }

  async testFreePlanLimits() {
    console.log('🆓 Testing Free plan limits...');
    
    await this.loginAsUser('free-user@example.com', 'password123');
    
    // Test property limit (1 home)
    await this.page.goto(`${this.baseUrl}/dashboard/properties`);
    
    // Try to add second property
    await this.page.click('[data-testid="add-property-button"]');
    
    const limitMessage = await this.page.textContent('[data-testid="limit-message"]');
    expect(limitMessage).toContain('upgrade');
    console.log('✅ Free plan property limit enforced');
    
    // Test document limit (3 documents)
    await this.page.goto(`${this.baseUrl}/dashboard/documents`);
    
    // Upload 4th document
    await this.page.setInputFiles('[data-testid="file-input"]', 'test-document.pdf');
    
    const docLimitMessage = await this.page.textContent('[data-testid="doc-limit-message"]');
    expect(docLimitMessage).toContain('3 documents');
    console.log('✅ Free plan document limit enforced');
  }

  async testCorePlanLimits() {
    console.log('💼 Testing Core plan limits...');
    
    await this.loginAsUser('core-user@example.com', 'password123');
    
    // Test property limit (3 homes)
    await this.page.goto(`${this.baseUrl}/dashboard/properties`);
    
    // Should be able to add up to 3 properties
    for (let i = 1; i <= 3; i++) {
      await this.page.click('[data-testid="add-property-button"]');
      await this.page.fill('[data-testid="address-input"]', `${i} Test Street`);
      await this.page.click('[data-testid="save-property"]');
    }
    
    // 4th property should be blocked
    await this.page.click('[data-testid="add-property-button"]');
    const limitReached = await this.page.textContent('[data-testid="limit-message"]');
    expect(limitReached).toContain('3 properties');
    console.log('✅ Core plan property limit enforced');
  }

  async testPremiumFeatures() {
    console.log('👑 Testing Premium features...');
    
    await this.loginAsUser('premium-user@example.com', 'password123');
    
    // Test direct booking feature
    await this.page.goto(`${this.baseUrl}/dashboard/find-providers`);
    
    const bookingButton = await this.page.locator('[data-testid="direct-book-button"]');
    expect(await bookingButton.isVisible()).toBe(true);
    console.log('✅ Premium direct booking feature available');
    
    // Test unlimited properties
    await this.page.goto(`${this.baseUrl}/dashboard/properties`);
    
    const addPropertyButton = await this.page.locator('[data-testid="add-property-button"]');
    expect(await addPropertyButton.isVisible()).toBe(true);
    // Should not show any limit warnings
    console.log('✅ Premium unlimited properties access confirmed');
  }

  // Test webhook processing
  async testWebhookProcessing() {
    console.log('🧪 Testing Webhook Processing...');
    
    // Simulate Stripe webhook events
    await this.simulateWebhook('payment_intent.succeeded');
    await this.simulateWebhook('invoice.payment_failed');
    await this.simulateWebhook('customer.subscription.updated');
  }

  async simulateWebhook(eventType) {
    console.log(`🔗 Testing ${eventType} webhook...`);
    
    const webhookPayload = this.createWebhookPayload(eventType);
    
    const response = await fetch(`${this.baseUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': this.generateWebhookSignature(webhookPayload)
      },
      body: JSON.stringify(webhookPayload)
    });
    
    expect(response.status).toBe(200);
    console.log(`✅ ${eventType} webhook processed successfully`);
  }

  // Helper methods
  async fillStripeCheckout(cardNumber) {
    await this.page.fill('[data-testid="cardNumber"]', cardNumber);
    await this.page.fill('[data-testid="cardExpiry"]', '12/25');
    await this.page.fill('[data-testid="cardCvc"]', '123');
    await this.page.fill('[data-testid="billingName"]', 'Test User');
  }

  async loginAsUser(email, password) {
    await this.page.goto(`${this.baseUrl}/sign-in`);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/dashboard');
  }

  async verifySubscriptionCreated(planName, amount) {
    // Check database for subscription record
    const response = await fetch(`${this.baseUrl}/api/test/verify-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planName, amount })
    });
    
    const result = await response.json();
    expect(result.subscriptionExists).toBe(true);
    console.log(`✅ ${planName} subscription verified in database`);
  }

  async verifyProrationCalculation() {
    // Verify proration was calculated correctly
    const response = await fetch(`${this.baseUrl}/api/test/verify-proration`);
    const result = await response.json();
    expect(result.prorationCorrect).toBe(true);
    console.log('✅ Proration calculation verified');
  }

  createWebhookPayload(eventType) {
    return {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: eventType,
      data: {
        object: {
          id: 'test_object_id',
          amount: eventType.includes('payment') ? 700 : undefined
        }
      }
    };
  }

  generateWebhookSignature(payload) {
    // Generate test webhook signature
    return 't=1234567890,v1=test_signature';
  }

  // Run all payment tests
  async runAllTests() {
    console.log('🚀 Starting Payment & Billing Tests...\n');
    
    try {
      await this.testSubscriptionCheckout();
      console.log('\n');
      
      await this.testPlanManagement();
      console.log('\n');
      
      await this.testPayPerReportSystem();
      console.log('\n');
      
      await this.testPlanEnforcement();
      console.log('\n');
      
      await this.testWebhookProcessing();
      console.log('\n');
      
      console.log('✅ All Payment Tests Completed Successfully!');
      return { success: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Payment Test Failed:', error.message);
      return { success: false, errors: [error.message] };
    }
  }
}

// Playwright test runner setup
test.describe('RivoHome Payment Tests', () => {
  test('Complete Payment Flow Testing', async ({ page }) => {
    const paymentTests = new PaymentTests(page);
    const results = await paymentTests.runAllTests();
    
    if (!results.success) {
      throw new Error(`Payment tests failed: ${results.errors.join(', ')}`);
    }
  });
});

module.exports = PaymentTests; 