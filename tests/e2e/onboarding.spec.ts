import { test, expect } from '@playwright/test'

test.describe('Homeowner Onboarding', () => {
  test('should load homeowner onboarding page', async ({ page }) => {
    await page.goto('/onboarding')
    
    await expect(page).toHaveTitle(/RivoHome|Onboarding/)
    
    // Should show plan selection or first step
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(plan|onboarding|welcome|get started)/i)
  })

  test('should display plan options', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Look for plan selection elements
    const planElements = await page.locator('[data-testid*="plan"], .plan, [class*="plan"]').count()
    
    // Should have at least the main plans (Free, Core, Premium)
    expect(planElements).toBeGreaterThan(0)
  })

  test('should handle plan selection', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Try to click on a plan (if visible)
    const freePlan = page.locator('text=Free, button:has-text("Free"), [data-plan="free"]').first()
    const corePlan = page.locator('text=Core, button:has-text("Core"), [data-plan="core"]').first()
    
    if (await freePlan.isVisible()) {
      await freePlan.click()
    } else if (await corePlan.isVisible()) {
      await corePlan.click()
    }
    
    // Should proceed to next step or show confirmation
    await page.waitForTimeout(1000) // Wait for any transitions
  })
})

test.describe('Provider Onboarding', () => {
  test('should load provider onboarding main page', async ({ page }) => {
    await page.goto('/provider-onboarding')
    
    await expect(page).toHaveTitle(/RivoHome|Provider/)
    
    // Should show onboarding start or step 1
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(provider|onboarding|get started|basic info)/i)
  })

  test('should load basic info step', async ({ page }) => {
    await page.goto('/provider-onboarding/basic-info')
    
    await expect(page).toHaveTitle(/RivoHome|Basic Info/)
    
    // Should have form fields for basic information
    const inputs = await page.locator('input, select, textarea').count()
    expect(inputs).toBeGreaterThan(0)
  })

  test('should load business profile step', async ({ page }) => {
    await page.goto('/provider-onboarding/business-profile')
    
    await expect(page).toHaveTitle(/RivoHome|Business Profile/)
    
    // Should have business-related form fields
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(business|profile|description|bio)/i)
  })

  test('should load document upload step', async ({ page }) => {
    await page.goto('/provider-onboarding/documents-upload')
    
    await expect(page).toHaveTitle(/RivoHome|Documents/)
    
    // Should have file upload elements
    const fileInputs = await page.locator('input[type="file"]').count()
    expect(fileInputs).toBeGreaterThan(0)
    
    // Should mention license, insurance, etc.
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(license|insurance|document|upload)/i)
  })

  test('should load services offered step', async ({ page }) => {
    await page.goto('/provider-onboarding/services-offered')
    
    await expect(page).toHaveTitle(/RivoHome|Services/)
    
    // Should have service selection elements
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(service|offer|select|type)/i)
  })

  test('should load external reviews step', async ({ page }) => {
    await page.goto('/provider-onboarding/external-reviews')
    
    await expect(page).toHaveTitle(/RivoHome|Reviews/)
    
    // Should mention Google, Yelp, or external reviews
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(review|google|yelp|external|testimonial)/i)
  })

  test('should load background check consent step', async ({ page }) => {
    await page.goto('/provider-onboarding/background-check-consent')
    
    await expect(page).toHaveTitle(/RivoHome|Background/)
    
    // Should have consent/agreement elements
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(background|check|consent|agree)/i)
  })

  test('should load agreements step', async ({ page }) => {
    await page.goto('/provider-onboarding/agreements')
    
    await expect(page).toHaveTitle(/RivoHome|Agreement/)
    
    // Should have legal agreements
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(agreement|terms|policy|consent|sign)/i)
  })

  test('should load awaiting review page', async ({ page }) => {
    await page.goto('/provider-onboarding/awaiting-review')
    
    await expect(page).toHaveTitle(/RivoHome|Review/)
    
    // Should show waiting/pending status
    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/(review|waiting|pending|submitted)/i)
  })

  test('Provider can upload insurance documents', async ({ page }) => {
    await page.goto('/provider-onboarding/documents-upload');
    
    // Test InsuranceUploader component
    const insuranceUpload = page.locator('[data-testid="insurance-uploader"]');
    await expect(insuranceUpload).toBeVisible();
    
    // Test file upload functionality
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('public/docs/test-insurance.pdf');
    
    // Verify upload success
    await expect(page.locator('text=Insurance document uploaded successfully')).toBeVisible();
  });

  test('Provider can upload license documents', async ({ page }) => {
    await page.goto('/provider-onboarding/documents-upload');
    
    // Test LicenseUploader component
    const licenseUpload = page.locator('[data-testid="license-uploader"]');
    await expect(licenseUpload).toBeVisible();
    
    // Test file upload functionality
    const fileInput = page.locator('input[type="file"]').nth(1);
    await fileInput.setInputFiles('public/docs/test-license.pdf');
    
    // Verify upload success
    await expect(page.locator('text=License document uploaded successfully')).toBeVisible();
  });

  test('Provider can upload other documents', async ({ page }) => {
    await page.goto('/provider-onboarding/documents-upload');
    
    // Test OtherDocumentsUploader component
    const otherUpload = page.locator('[data-testid="other-documents-uploader"]');
    await expect(otherUpload).toBeVisible();
    
    // Test custom document title
    await page.fill('[data-testid="document-title-input"]', 'Certification Document');
    
    // Test file upload functionality
    const fileInput = page.locator('input[type="file"]').nth(2);
    await fileInput.setInputFiles('public/docs/test-certification.pdf');
    
    // Verify upload success
    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();
  });
})

test.describe('Onboarding Navigation', () => {
  test('should maintain state between steps', async ({ page }) => {
    // This would test that form data persists between onboarding steps
    // Implementation depends on how state is managed
    await page.goto('/provider-onboarding/basic-info')
    
    // Fill out some basic info
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Provider')
    }
    
    // Navigate to next step (if there's a next button)
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first()
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Check if we can navigate back and data is preserved
    const backButton = page.locator('button:has-text("Back"), button:has-text("Previous")').first()
    if (await backButton.isVisible()) {
      await backButton.click()
      await page.waitForTimeout(1000)
      
      // Check if the name is still there
      if (await nameInput.isVisible()) {
        const value = await nameInput.inputValue()
        expect(value).toBe('Test Provider')
      }
         }
   })
}) 