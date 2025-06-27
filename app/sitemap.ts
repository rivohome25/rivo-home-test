import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'
  
  // Static routes
  const staticRoutes = [
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

  // Generate sitemap entries for static routes
  const staticSitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('/dashboard') ? 0.3 : 0.8,
  }))

  // TODO: Add dynamic routes here when you have dynamic content
  // Example for dynamic resource pages:
  // const dynamicResourceRoutes = await getDynamicResourceSlugs()
  // const dynamicSitemapEntries = dynamicResourceRoutes.map(slug => ({
  //   url: `${baseUrl}/resources/${slug}`,
  //   lastModified: new Date(),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticSitemapEntries,
    // ...dynamicSitemapEntries, // Uncomment when you add dynamic routes
  ]
}

// Helper function to get dynamic resource slugs (implement based on your data source)
// async function getDynamicResourceSlugs(): Promise<string[]> {
//   // This would typically fetch from your database or CMS
//   // For now, return empty array
//   return []
// } 