# Sitemap Generator

This project includes a comprehensive sitemap generation system for SEO optimization and search engine discoverability.

## 🚀 Features

- **Dynamic Next.js Sitemap**: Automatically generated at `/sitemap.xml`
- **Robots.txt**: Automatically generated at `/robots.txt`
- **Static Sitemap Generator**: Node.js script for additional functionality
- **URL Validation**: Check if all sitemap URLs are accessible
- **Statistics**: Get insights about your sitemap structure
- **AI Bot Protection**: Blocks common AI crawlers in robots.txt

## 📁 Files Structure

```
├── app/
│   ├── sitemap.ts          # Next.js dynamic sitemap generator
│   └── robots.ts           # Next.js robots.txt generator
├── scripts/
│   └── generate-sitemap.js # Advanced sitemap utilities
└── public/
    └── sitemap-static.xml  # Generated static sitemap (optional)
```

## 🛠️ Usage

### 1. Next.js Built-in Sitemap (Recommended)

The sitemap is automatically available at:
- **Sitemap**: `https://yourdomain.com/sitemap.xml`
- **Robots.txt**: `https://yourdomain.com/robots.txt`

### 2. Generate Static Sitemap

```bash
# Generate sitemap and show statistics
npm run sitemap:generate

# Generate sitemap and validate all URLs
npm run sitemap:validate
```

### 3. Manual Script Usage

```bash
# Basic generation
node scripts/generate-sitemap.js

# With URL validation
node scripts/generate-sitemap.js --validate
```

## ⚙️ Configuration

### Environment Variables

Set your base URL in your environment:

```bash
# .env.local
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Adding New Routes

When you add new pages to your app, update the routes in two places:

1. **app/sitemap.ts** - Update the `staticRoutes` array
2. **scripts/generate-sitemap.js** - Update the `STATIC_ROUTES` array

Example:
```typescript
const staticRoutes = [
  '',
  '/about',
  '/features',
  '/new-page',  // Add your new route here
  // ... other routes
]
```

### Dynamic Routes

For dynamic routes (like `/resources/[slug]`), uncomment and implement the dynamic route logic in `app/sitemap.ts`:

```typescript
// Uncomment and implement this function
async function getDynamicResourceSlugs(): Promise<string[]> {
  // Fetch from your database, CMS, or API
  const response = await fetch('your-api-endpoint')
  const data = await response.json()
  return data.map(item => item.slug)
}
```

## 🔧 Customization

### Sitemap Priorities

Current priority settings:
- **Homepage** (`/`): 1.0 (highest)
- **Public pages**: 0.8
- **Dashboard pages**: 0.3 (lowest, private)

### Change Frequencies

- **Homepage**: daily
- **Other pages**: weekly

### Robots.txt Rules

The robots.txt blocks:
- `/api/` - API routes
- `/dashboard/` - Private dashboard pages
- `/_next/` - Next.js internal files
- `/admin/` - Admin pages
- AI bots: GPTBot, ChatGPT-User, CCBot, anthropic-ai

## 📊 Sitemap Statistics

The generator provides detailed statistics:

```
📈 Sitemap Statistics:
   Total URLs: 12
   Homepage: 1
   Public Pages: 10
   Dashboard Pages: 1

📂 By Section:
   homepage: 1
   about: 1
   features: 1
   resources: 3
   dashboard: 1
```

## 🔍 URL Validation

The validation feature checks:
- HTTP status codes
- Response times (5-second timeout)
- Accessibility of each URL

Example output:
```
🔍 Validating sitemap URLs...

✅ https://yourdomain.com (200)
✅ https://yourdomain.com/about (200)
❌ https://yourdomain.com/broken-page (404)

📊 Validation Summary:
   Accessible: 11/12
   Success Rate: 91.7%
```

## 🚀 SEO Benefits

This sitemap system provides:

1. **Better Indexing**: Search engines can discover all your pages
2. **Crawl Efficiency**: Helps search engines understand your site structure
3. **Priority Signals**: Indicates which pages are most important
4. **Update Frequency**: Tells crawlers how often to check for changes
5. **Bot Management**: Controls which bots can access your content

## 🔄 Automation

### Build-time Generation

Add to your build process:

```json
{
  "scripts": {
    "build": "npm run sitemap:generate && next build"
  }
}
```

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# Example GitHub Actions step
- name: Generate Sitemap
  run: npm run sitemap:validate
```

## 🐛 Troubleshooting

### Common Issues

1. **404 on sitemap.xml**
   - Ensure `app/sitemap.ts` exists
   - Check Next.js version (requires 13.3+)

2. **Wrong base URL**
   - Set `NEXT_PUBLIC_BASE_URL` environment variable
   - Update default URL in sitemap files

3. **Missing routes**
   - Update route arrays in both sitemap files
   - Check for typos in route paths

4. **Validation failures**
   - Ensure your dev server is running for local validation
   - Check network connectivity for remote validation

## 📚 Resources

- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Google Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)

---

**Pro Tip**: Run `npm run sitemap:validate` regularly to catch broken links before they affect your SEO! 🎯 