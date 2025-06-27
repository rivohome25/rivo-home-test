/**
 * Booking & Scheduling Tests for RivoHome Platform
 * 
 * Tests the complete booking flow including provider availability,
 * booking requests, confirmations, cancellations, and review system.
 */

const { test, expect } = require('@playwright/test');

class BookingTests {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  // Test provider availability management
  async testProviderAvailability() {
    console.log('🧪 Testing Provider Availability Management...');
    
    await this.testSetWeeklySchedule();
    await this.testAddUnavailability();
    await this.testHolidayPreferences();
    await this.testAvailabilityConflicts();
  }

  async testSetWeeklySchedule() {
    console.log('📅 Testing weekly schedule setup...');
    
    // Login as provider
    await this.loginAsProvider('provider@example.com', 'password123');
    
    // Navigate to availability management
    await this.page.goto(`${this.baseUrl}/dashboard/manage-availability`);
    
    // Set Monday schedule
    await this.page.click('[data-testid="monday-toggle"]');
    await this.page.fill('[data-testid="monday-start-time"]', '09:00');
    await this.page.fill('[data-testid="monday-end-time"]', '17:00');
    
    // Save schedule
    await this.page.click('[data-testid="save-schedule-button"]');
    
    // Verify success message
    const successMessage = await this.page.textContent('[data-testid="success-message"]');
    expect(successMessage).toContain('saved');
    console.log('✅ Weekly schedule set successfully');
  }

  // Helper methods
  async loginAsProvider(email, password) {
    await this.page.goto(`${this.baseUrl}/sign-in`);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/dashboard');
  }

  // Run all booking tests
  async runAllTests() {
    console.log('🚀 Starting Booking & Scheduling Tests...\n');
    
    try {
      await this.testProviderAvailability();
      console.log('\n');
      
      console.log('✅ All Booking Tests Completed Successfully!');
      return { success: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Booking Test Failed:', error.message);
      return { success: false, errors: [error.message] };
    }
  }
}

module.exports = BookingTests;
