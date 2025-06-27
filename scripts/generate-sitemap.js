#!/usr/bin/env node

/**
 * Sitemap Generator and Validator Script
 * 
 * This script provides additional sitemap functionality beyond the built-in Next.js sitemap:
 * - Validates sitemap URLs
 * - Generates XML sitemap files
 * - Checks for broken links
 * - Provides sitemap statistics
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'
const OUTPUT_DIR = './public'

// Static routes from your Next.js app
const STATIC_ROUTES = [
  '',
  '/about',
  '/features', 
  '/how-it-works',
  '/privacy',
  '/terms',
  '/success',
  '/providers',
  '/resources',
  '/resources/pricing',
  '/resources/diy-library',
  '/dashboard/manage-availability'
]

/**
 * Generate sitemap XML content
 */
function generateSitemapXML(routes) {
  const urls = routes.map(route => {
    const url = `${BASE_URL}${route}`
    const priority = route === '' ? '1.0' : route.startsWith('/dashboard') ? '0.3' : '0.8'
    const changefreq = route === '' ? 'daily' : 'weekly'
    const lastmod = new Date().toISOString().split('T')[0]
    
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

/**
 * Check if a URL is accessible
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http
    
    const req = client.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode >= 200 && res.statusCode < 400
      })
    })
    
    req.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        accessible: false
      })
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({
        url,
        status: 'TIMEOUT',
        accessible: false
      })
    })
  })
}

/**
 * Validate all URLs in the sitemap
 */
async function validateSitemap(routes) {
  console.log('🔍 Validating sitemap URLs...\n')
  
  const results = []
  for (const route of routes) {
    const url = `${BASE_URL}${route}`
    const result = await checkUrl(url)
    results.push(result)
    
    const status = result.accessible ? '✅' : '❌'
    console.log(`${status} ${url} (${result.status})`)
  }
  
  const accessible = results.filter(r => r.accessible).length
  const total = results.length
  
  console.log(`\n📊 Validation Summary:`)
  console.log(`   Accessible: ${accessible}/${total}`)
  console.log(`   Success Rate: ${((accessible/total) * 100).toFixed(1)}%`)
  
  return results
}

/**
 * Generate sitemap statistics
 */
function generateStats(routes) {
  const stats = {
    total: routes.length,
    byType: {
      homepage: routes.filter(r => r === '').length,
      pages: routes.filter(r => r !== '' && !r.startsWith('/dashboard')).length,
      dashboard: routes.filter(r => r.startsWith('/dashboard')).length,
    },
    bySection: {}
  }
  
  // Count by section
  routes.forEach(route => {
    if (route === '') {
      stats.bySection['homepage'] = (stats.bySection['homepage'] || 0) + 1
    } else {
      const section = route.split('/')[1] || 'root'
      stats.bySection[section] = (stats.bySection[section] || 0) + 1
    }
  })
  
  return stats
}

/**
 * Main execution function
 */
async function main() {
  console.log('🗺️  Sitemap Generator\n')
  
  // Generate sitemap XML
  const sitemapXML = generateSitemapXML(STATIC_ROUTES)
  const sitemapPath = path.join(OUTPUT_DIR, 'sitemap-static.xml')
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  // Write sitemap file
  fs.writeFileSync(sitemapPath, sitemapXML)
  console.log(`✅ Static sitemap generated: ${sitemapPath}`)
  
  // Generate statistics
  const stats = generateStats(STATIC_ROUTES)
  console.log('\n📈 Sitemap Statistics:')
  console.log(`   Total URLs: ${stats.total}`)
  console.log(`   Homepage: ${stats.byType.homepage}`)
  console.log(`   Public Pages: ${stats.byType.pages}`)
  console.log(`   Dashboard Pages: ${stats.byType.dashboard}`)
  console.log('\n📂 By Section:')
  Object.entries(stats.bySection).forEach(([section, count]) => {
    console.log(`   ${section}: ${count}`)
  })
  
  // Validate URLs if requested
  if (process.argv.includes('--validate')) {
    console.log('\n')
    await validateSitemap(STATIC_ROUTES)
  }
  
  console.log('\n🎉 Sitemap generation complete!')
  console.log('\n💡 Tips:')
  console.log('   - Add --validate flag to check URL accessibility')
  console.log('   - Update STATIC_ROUTES array when adding new pages')
  console.log('   - Set NEXT_PUBLIC_BASE_URL environment variable for production')
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  generateSitemapXML,
  validateSitemap,
  generateStats,
  STATIC_ROUTES
} 