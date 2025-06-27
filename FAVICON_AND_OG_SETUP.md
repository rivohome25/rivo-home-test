# Favicon and OG Images Setup for RivoHome

## Overview
This guide will help you create and set up the necessary favicon and Open Graph (OG) images for the RivoHome website to ensure proper branding across all platforms and social media sharing.

## Required Files

### Favicon Files (to be created)
Place these files in the `/public` directory:

- `favicon.ico` (16x16, 32x32, 48x48 - multi-resolution ICO file)
- `favicon-16x16.png` (16x16 PNG)
- `favicon-32x32.png` (32x32 PNG)
- `apple-touch-icon.png` (180x180 PNG for iOS)
- `android-chrome-192x192.png` (192x192 PNG for Android)
- `android-chrome-512x512.png` (512x512 PNG for Android)
- `safari-pinned-tab.svg` (Already created - monochrome SVG)

### OG Images (to be created)
- `og-image.png` (1200x630 PNG - for social media sharing)
- `og-image-square.png` (1200x1200 PNG - for platforms that prefer square images)

## Design Guidelines

### Favicon Design
- Use the RivoHome logo or a simplified version
- Ensure it works well at small sizes (16x16 pixels)
- Use brand colors: Primary blue (#2775A6), Light blue (#4AB5A8)
- Should be recognizable and clean at all sizes
- Consider a simple house icon if the full logo doesn't work at small sizes

### OG Image Design
- Dimensions: 1200x630 pixels (16:8.4 aspect ratio)
- Include RivoHome logo and tagline: "Never Forget Home Maintenance Again"
- Use brand gradient: from #4AB5A8 to #2775A6
- Ensure text is readable when shared on social media
- Include visual elements that represent home maintenance

### Square OG Image Design
- Dimensions: 1200x1200 pixels
- Similar design to the main OG image but adapted for square format
- Ensure logo and text remain prominent

## Generation Steps

### Step 1: Create the Source Image
1. Use the existing RivoHome logo (`RivoHome-logo-transparent.png`)
2. Create a square version suitable for favicon generation
3. Ensure the image has a transparent background or solid color background

### Step 2: Generate Favicons
Use one of these online tools:

**Option 1: RealFaviconGenerator (Recommended)**
1. Go to https://realfavicongenerator.net/
2. Upload your RivoHome logo
3. Configure settings for each platform:
   - iOS: Use the logo with proper padding
   - Android: Use theme color #2775A6
   - Windows: Use background color #2775A6
   - Safari: Use the existing SVG or upload a monochrome version
4. Download the generated package
5. Replace the placeholder files in `/public`

**Option 2: Favicon.io**
1. Go to https://favicon.io/favicon-converter/
2. Upload your RivoHome logo (square, minimum 256x256)
3. Download the generated files
4. Place them in the `/public` directory

### Step 3: Create OG Images
Create two images using design software (Figma, Canva, Photoshop, etc.):

**Main OG Image (1200x630)**
- Background: RivoHome gradient (from #4AB5A8 to #2775A6)
- RivoHome logo (prominent but not overwhelming)
- Tagline: "Never Forget Home Maintenance Again"
- Subtitle: "The smart home maintenance platform"
- Visual elements: Clean, professional home maintenance imagery

**Square OG Image (1200x1200)**
- Same design elements as main OG image
- Adapted layout for square format
- Ensure all text remains readable

### Step 4: Update Verification Codes
In `app/layout.tsx`, replace the placeholder verification codes:
```tsx
verification: {
  google: 'your-actual-google-verification-code',
  yandex: 'your-actual-yandex-verification-code', // or remove if not needed
  yahoo: 'your-actual-yahoo-verification-code',   // or remove if not needed
},
```

## Files Already Configured

### ✅ Completed Files
- `site.webmanifest` - PWA manifest with RivoHome branding
- `robots.txt` - Search engine crawling instructions
- `safari-pinned-tab.svg` - Safari pinned tab icon
- `app/layout.tsx` - Comprehensive metadata and SEO setup

### Metadata Includes
- Open Graph tags for social media sharing
- Twitter Card tags
- Favicon references for all platforms
- SEO optimization tags
- PWA support
- Schema.org structured data ready

## Testing

After adding the files, test using:

1. **Favicon Testing**
   - Visit https://realfavicongenerator.net/favicon_checker
   - Enter your domain to check all favicon implementations

2. **OG Image Testing**
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

3. **SEO Testing**
   - Google Search Console
   - PageSpeed Insights
   - Lighthouse audit

## Maintenance

- Update OG images when branding changes
- Regenerate favicons if logo updates significantly
- Test social media sharing periodically
- Monitor favicon display across different browsers and devices

## Brand Assets Used

- Primary Color: #2775A6 (RivoHome Blue)
- Secondary Color: #4AB5A8 (RivoHome Light Blue)
- Logo: `RivoHome-logo-transparent.png`
- Tagline: "Never Forget Home Maintenance Again"
- Description: "The smart home maintenance platform that helps homeowners stay on top of seasonal tasks, find trusted professionals, and maintain their homes with confidence." 