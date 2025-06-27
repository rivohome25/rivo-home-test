import { test, expect } from '@playwright/test'

test.describe('Dashboard Pages', () => {
  test('should load main dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should either load dashboard or redirect to auth
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/dashboard')) {
      // If we're on dashboard, check for dashboard elements
      await expect(page).toHaveTitle(/RivoHome|Dashboard/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(dashboard|welcome|overview)/i)
    } else {
      // If redirected to auth, that's also valid behavior
      expect(currentUrl.includes('/sign-in') || currentUrl.includes('/auth')).toBeTruthy()
    }
  })

  test('should load find providers page', async ({ page }) => {
    await page.goto('/dashboard/find-providers')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/find-providers')) {
      await expect(page).toHaveTitle(/RivoHome|Find|Provider/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(provider|find|search|service)/i)
    }
  })

  test('should load my bookings page', async ({ page }) => {
    await page.goto('/dashboard/my-bookings')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/my-bookings')) {
      await expect(page).toHaveTitle(/RivoHome|Booking/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(booking|appointment|schedule)/i)
    }
  })

  test('should load provider bookings page', async ({ page }) => {
    await page.goto('/dashboard/provider-bookings')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/provider-bookings')) {
      await expect(page).toHaveTitle(/RivoHome|Provider|Booking/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(booking|request|appointment|provider)/i)
    }
  })

  test('should load manage availability page', async ({ page }) => {
    await page.goto('/dashboard/manage-availability')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/manage-availability')) {
      await expect(page).toHaveTitle(/RivoHome|Availability/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(availability|schedule|time|calendar)/i)
    }
  })

  test('should load my schedule page', async ({ page }) => {
    await page.goto('/dashboard/my-schedule')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/my-schedule')) {
      await expect(page).toHaveTitle(/RivoHome|Schedule/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(schedule|calendar|appointment)/i)
    }
  })

  test('should load properties page', async ({ page }) => {
    await page.goto('/dashboard/properties')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/properties')) {
      await expect(page).toHaveTitle(/RivoHome|Properties/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(property|properties|home|address)/i)
    }
  })

  test('should load documents page', async ({ page }) => {
    await page.goto('/dashboard/documents')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/documents')) {
      await expect(page).toHaveTitle(/RivoHome|Documents/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(document|file|upload|download)/i)
    }
  })

  test('should load DIY library page', async ({ page }) => {
    await page.goto('/dashboard/diy-library')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/diy-library')) {
      await expect(page).toHaveTitle(/RivoHome|DIY|Library/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(diy|library|guide|tutorial|how.?to)/i)
    }
  })
})

test.describe('Settings Pages', () => {
  test('should load main settings page', async ({ page }) => {
    await page.goto('/settings')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/settings')) {
      await expect(page).toHaveTitle(/RivoHome|Settings/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(settings|preference|account|profile)/i)
    }
  })

  test('should load billing settings page', async ({ page }) => {
    await page.goto('/settings/billing')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/billing')) {
      await expect(page).toHaveTitle(/RivoHome|Billing/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(billing|payment|subscription|plan)/i)
    }
  })

  test('should load notification settings page', async ({ page }) => {
    await page.goto('/settings/notifications')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/notifications')) {
      await expect(page).toHaveTitle(/RivoHome|Notifications/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(notification|email|alert|preference)/i)
    }
  })

  test('should load support page', async ({ page }) => {
    await page.goto('/settings/support')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/support')) {
      await expect(page).toHaveTitle(/RivoHome|Support/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(support|help|contact|ticket)/i)
    }
  })
}) 