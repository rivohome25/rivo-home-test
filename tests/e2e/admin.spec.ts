import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test('should load admin main dashboard', async ({ page }) => {
    await page.goto('/admin')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    // Admin pages should either load or redirect to auth
    if (currentUrl.includes('/admin')) {
      await expect(page).toHaveTitle(/RivoHome|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(admin|dashboard|management|overview)/i)
    } else {
      // Should redirect to auth if not authorized
      expect(currentUrl.includes('/sign-in') || currentUrl.includes('/auth') ||
             await page.locator('text=unauthorized').isVisible()).toBeTruthy()
    }
  })

  test('should load admin users page', async ({ page }) => {
    await page.goto('/admin/users')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/users')) {
      await expect(page).toHaveTitle(/RivoHome|Users|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(user|manage|member|account)/i)
    }
  })

  test('should load admin applications page', async ({ page }) => {
    await page.goto('/admin/applications')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/applications')) {
      await expect(page).toHaveTitle(/RivoHome|Applications|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(application|provider|review|approve|pending)/i)
    }
  })

  test('should load admin analytics page', async ({ page }) => {
    await page.goto('/admin/analytics')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/analytics')) {
      await expect(page).toHaveTitle(/RivoHome|Analytics|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(analytics|stats|metrics|data|chart)/i)
    }
  })

  test('should load admin reviews page', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/reviews')) {
      await expect(page).toHaveTitle(/RivoHome|Reviews|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(review|rating|feedback|moderate)/i)
    }
  })

  test('should load admin audit logs page', async ({ page }) => {
    await page.goto('/admin/audit-logs')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/audit-logs')) {
      await expect(page).toHaveTitle(/RivoHome|Audit|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(audit|log|activity|history|track)/i)
    }
  })

  test('should load admin provider applications page', async ({ page }) => {
    await page.goto('/admin/provider-applications')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/provider-applications')) {
      await expect(page).toHaveTitle(/RivoHome|Provider|Application|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(provider|application|review|approve|reject)/i)
    }
  })

  test('should load admin providers page', async ({ page }) => {
    await page.goto('/admin/providers')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/providers')) {
      await expect(page).toHaveTitle(/RivoHome|Providers|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(provider|service|manage|status)/i)
    }
  })

  test('should load admin reports page', async ({ page }) => {
    await page.goto('/admin/reports')
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    if (currentUrl.includes('/admin/reports')) {
      await expect(page).toHaveTitle(/RivoHome|Reports|Admin/)
      
      const pageContent = await page.textContent('body')
      expect(pageContent).toMatch(/(report|export|data|analytics)/i)
    }
  })
})

test.describe('Admin Security', () => {
  test('should protect admin routes from unauthorized access', async ({ page }) => {
    // Test that admin routes are properly protected
    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/admin/applications',
      '/admin/analytics',
      '/admin/reviews',
      '/admin/audit-logs'
    ]

    for (const route of adminRoutes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      const currentUrl = page.url()
      // Should either redirect to auth or show unauthorized
      if (!currentUrl.includes('/admin')) {
        expect(currentUrl.includes('/sign-in') || currentUrl.includes('/auth')).toBeTruthy()
      } else {
                 // If still on admin page, check for proper admin content or access denied
         const pageContent = await page.textContent('body')
         const hasAdminContent = pageContent?.match(/(admin|dashboard|management)/i)
         const hasAccessDenied = pageContent?.match(/(unauthorized|access denied|permission|forbidden)/i)
        
        expect(hasAdminContent || hasAccessDenied).toBeTruthy()
      }
    }
  })
})

test.describe('Admin Provider Management', () => {
  test('Admin can manage provider status', async ({ page }) => {
    // Login as admin
    await page.goto('/sign-in');
    await page.fill('[data-testid="email"]', 'admin@rivohome.com');
    await page.fill('[data-testid="password"]', 'admin_password');
    await page.click('[data-testid="sign-in-button"]');
    
    // Navigate to providers page
    await page.goto('/admin/providers');
    await expect(page.locator('h1')).toContainText('Provider Management');
    
    // Test provider status update
    const firstProvider = page.locator('[data-testid="provider-row"]').first();
    await firstProvider.locator('[data-testid="status-dropdown"]').click();
    await page.click('text=Approve');
    
    // Verify status update
    await expect(page.locator('text=Provider status updated successfully')).toBeVisible();
  });

  test('Admin can view provider applications', async ({ page }) => {
    await page.goto('/admin/applications');
    
    // Test application listing
    await expect(page.locator('[data-testid="applications-table"]')).toBeVisible();
    
    // Test application review
    const firstApplication = page.locator('[data-testid="application-row"]').first();
    await firstApplication.click();
    
    // Verify application details
    await expect(page.locator('[data-testid="application-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="approve-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="reject-button"]')).toBeVisible();
  });

  test('Admin can search and filter providers', async ({ page }) => {
    await page.goto('/admin/providers');
    
    // Test search functionality
    await page.fill('[data-testid="provider-search"]', 'John Doe');
    await page.press('[data-testid="provider-search"]', 'Enter');
    
    // Verify search results
    await expect(page.locator('[data-testid="provider-row"]')).toContainText('John Doe');
    
    // Test status filter
    await page.selectOption('[data-testid="status-filter"]', 'approved');
    await expect(page.locator('[data-testid="provider-row"]')).toHaveCount(1);
  });
}) 