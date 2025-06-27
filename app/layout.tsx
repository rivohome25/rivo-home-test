import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/react"
import SupabaseProvider from "@/components/supabase-provider"
import SecurityProvider from "@/components/SecurityProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "RivoHome - Never Forget Home Maintenance Again",
  description: "The smart home maintenance platform that helps homeowners stay on top of seasonal tasks, find trusted professionals, and maintain their homes with confidence.",
  keywords: ["home maintenance", "home care", "property management", "seasonal maintenance", "home services", "trusted professionals"],
  authors: [{ name: "RivoHome" }],
  creator: "RivoHome",
  publisher: "RivoHome",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rivohome.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "RivoHome - Never Forget Home Maintenance Again",
    description: "The smart home maintenance platform that helps homeowners stay on top of seasonal tasks, find trusted professionals, and maintain their homes with confidence.",
    url: 'https://rivohome.com',
    siteName: 'RivoHome',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RivoHome - Smart Home Maintenance Platform',
      },
      {
        url: '/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: 'RivoHome - Smart Home Maintenance Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "RivoHome - Never Forget Home Maintenance Again",
    description: "The smart home maintenance platform that helps homeowners stay on top of seasonal tasks, find trusted professionals, and maintain their homes with confidence.",
    images: ['/og-image.png'],
    creator: '@rivohome',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#2775A6'
      }
    ]
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link href="//cdn-images.mailchimp.com/embedcode/classic-061523.css" rel="stylesheet" type="text/css" />
        <style type="text/css" dangerouslySetInnerHTML={{
          __html: `
            #mc_embed_signup {
              background: #fff;
              clear: left;
              font: 14px Helvetica, Arial, sans-serif;
              width: 600px;
            }
            /* Add your own Mailchimp form style overrides in your site stylesheet or in this style block.
               We recommend moving this block and the preceding CSS link to the HEAD of your HTML file. */
          `
        }} />
      </head>
      <body className="font-sans">
        <SecurityProvider>
          <SupabaseProvider>
            {/* Dark mode support planned for future release */}
            {children}
            <Analytics />
          </SupabaseProvider>
        </SecurityProvider>
        
        {/* Stripe.js script */}
        <Script 
          src="https://js.stripe.com/v3/" 
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}