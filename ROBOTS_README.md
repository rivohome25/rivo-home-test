# Robots.txt Configuration

This document explains the robots.txt configuration for the RivoHome website, implemented using Next.js dynamic robots.txt generation.

## 🤖 Overview

The robots.txt file is automatically generated at `https://rivohome.com/robots.txt` using the `app/robots.ts` file. This configuration controls how search engines and web crawlers interact with your website.

## 📁 Implementation

- **File**: `app/robots.ts`
- **Type**: Dynamic Next.js robots.txt generation
- **URL**: `https://rivohome.com/robots.txt`

## 🛡️ Security & Bot Management

### Blocked Directories

The following directories are blocked from all crawlers:
- `/api/` - API endpoints (sensitive)
- `/dashboard/` - User dashboard (private)
- `/_next/` - Next.js internal files
- `/admin/` - Admin panel (if exists)
- `/_vercel/` - Vercel deployment files
- `/private/` - Private content
- `*.json` - JSON configuration files
- `/temp/` - Temporary files

### AI Training Bot Protection

The following AI training bots are completely blocked:
- **GPTBot** - OpenAI's web crawler
- **ChatGPT-User** - ChatGPT browsing
- **CCBot** - Common Crawl bot
- **anthropic-ai** - Anthropic's crawler
- **Claude-Web** - Claude web browsing
- **Bard** - Google Bard crawler
- **Google-Extended** - Google's AI training crawler

### SEO/Marketing Bot Protection

The following SEO and marketing bots are blocked:
- **SemrushBot** - SEMrush crawler
- **AhrefsBot** - Ahrefs crawler
- **MJ12bot** - Majestic crawler
- **DotBot** - Moz crawler

## 🔍 Search Engine Optimization

### Allowed Search Engines

**Googlebot** (Google Search):
- ✅ Allowed to crawl all public pages
- ⏱️ Crawl delay: 1 second
- 🚫 Blocked from: `/api/`, `/dashboard/`, `/_next/`, `/admin/`

**Bingbot** (Microsoft Bing):
- ✅ Allowed to crawl all public pages
- ⏱️ Crawl delay: 2 seconds
- 🚫 Blocked from: `/api/`, `/dashboard/`, `/_next/`, `/admin/`

### General Rules

**All other bots** (`User-agent: *`):
- ✅ Allowed to crawl public pages
- 🚫 Blocked from sensitive directories
- ⚠️ No specific crawl delay (uses default)

## 📊 Current Configuration Summary

```
Total rules: 14
Host: https://rivohome.com
Sitemap: https://rivohome.com/sitemap.xml
Blocked bots: 11
Specifically allowed bots: 2 (Googlebot, Bingbot)
```

## 🔧 Configuration Details

### Host Declaration
```
Host: https://rivohome.com
```
Specifies the canonical domain for the website.

### Sitemap Reference
```
Sitemap: https://rivohome.com/sitemap.xml
```
Points crawlers to the XML sitemap for efficient indexing.

### Crawl Delays
- **Googlebot**: 1 second (fast, trusted crawler)
- **Bingbot**: 2 seconds (moderate delay)
- **Others**: No delay specified (uses default)

## 🚀 SEO Benefits

1. **Improved Crawl Efficiency**: Directs bots to important content
2. **Resource Protection**: Prevents crawling of sensitive areas
3. **AI Training Protection**: Blocks content scraping for AI training
4. **Server Load Management**: Crawl delays prevent server overload
5. **SEO Tool Blocking**: Prevents competitor analysis tools

## 🔄 Maintenance

### Adding New Blocked Bots

To block additional bots, add them to the `rules` array in `app/robots.ts`:

```typescript
{
  userAgent: 'NewBotName',
  disallow: '/',
},
```

### Adding New Protected Directories

Add new directories to the main disallow array:

```typescript
disallow: [
  '/api/',
  '/dashboard/',
  '/new-private-directory/', // Add here
  // ... other directories
],
```

### Updating Crawl Delays

Modify the `crawlDelay` property for specific bots:

```typescript
{
  userAgent: 'Googlebot',
  allow: '/',
  crawlDelay: 1, // Adjust this value
  // ...
},
```

## 🧪 Testing

### Manual Testing

Visit `https://rivohome.com/robots.txt` to see the generated file.

### Development Testing

```bash
# Start development server
npm run dev

# Test robots.txt (when server is running)
curl http://localhost:3000/robots.txt
```

### Build Testing

```bash
# Build the project
npm run build

# The robots.txt route will be included in the build output
```

## 📈 Monitoring

### Google Search Console

1. Submit your robots.txt to Google Search Console
2. Monitor crawl errors and blocked URLs
3. Check if important pages are accidentally blocked

### Bing Webmaster Tools

1. Verify robots.txt in Bing Webmaster Tools
2. Monitor crawl statistics
3. Check for any crawl issues

## ⚠️ Important Notes

1. **Dynamic Generation**: The robots.txt is generated dynamically by Next.js
2. **No Static File**: Removed `public/robots.txt` to avoid conflicts
3. **Environment Variables**: Uses `NEXT_PUBLIC_BASE_URL` or defaults to `https://rivohome.com`
4. **Case Sensitive**: Bot names are case-sensitive
5. **Wildcard Support**: Uses `*.json` to block all JSON files

## 🔗 Related Files

- `app/robots.ts` - Main robots.txt configuration
- `app/sitemap.ts` - XML sitemap generation
- `SITEMAP_README.md` - Sitemap documentation

## 📚 Resources

- [Google Robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)
- [Next.js Robots.txt Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Robots.txt Testing Tool](https://www.google.com/webmasters/tools/robots-testing-tool)

---

**Last Updated**: December 2024  
**Configuration Version**: 1.0  
**Status**: ✅ Active and Optimized 