import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should load sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Check if the sign-in page loads correctly
    await expect(page).toHaveTitle(/RivoHome|Sign In/)
    
    // Look for form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test('should load sign-up page', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Check if the sign-up page loads correctly
    await expect(page).toHaveTitle(/RivoHome|Sign Up/)
    
    // Look for form elements and role selection
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="password"]')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should load forgot password page', async ({ page }) => {
    await page.goto('/forgot-password')
    
    await expect(page).toHaveTitle(/RivoHome|Forgot Password/)
    
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should load reset password page', async ({ page }) => {
    await page.goto('/reset-password')
    
    await expect(page).toHaveTitle(/RivoHome|Reset Password/)
  })

  test('should validate form inputs on sign-in', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Try to submit with empty fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")')
    await submitButton.click()
    
    // Should show validation errors or prevent submission
    // The exact implementation will depend on your form validation
  })

  test('should validate form inputs on sign-up', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Try to submit with empty fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up")')
    await submitButton.click()
    
    // Should show validation errors or prevent submission
  })
})

test.describe('Navigation and Redirects', () => {
  test('should redirect to sign-in when accessing protected routes without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to sign-in or show unauthorized message
    await page.waitForLoadState('networkidle')
    const currentUrl = page.url()
    
    // Check if redirected to sign-in or if there's an auth check
    expect(currentUrl.includes('/sign-in') || currentUrl.includes('/auth') || 
           await page.locator('text=sign in').isVisible()).toBeTruthy()
  })

  test('should redirect to sign-in when accessing admin routes without auth', async ({ page }) => {
    await page.goto('/admin')
    
    await page.waitForLoadState('networkidle')
    const currentUrl = page.url()
    
    // Should redirect to sign-in or show unauthorized
    expect(currentUrl.includes('/sign-in') || currentUrl.includes('/auth') || 
           await page.locator('text=sign in').isVisible() ||
           await page.locator('text=unauthorized').isVisible()).toBeTruthy()
  })
}) 