"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock, Twitter, Linkedin } from "lucide-react"
import { motion } from "framer-motion"

interface Author {
  name: string
  avatar?: string
}

interface BlogPostLayoutProps {
  title: string
  author: Author
  date: string
  readingTime?: string
  featuredImage?: string
  children: React.ReactNode
}

export function BlogPostLayout({
  title,
  author,
  date,
  readingTime,
  featuredImage,
  children
}: BlogPostLayoutProps) {
  // Format date properly
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  // Handler for social sharing
  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out this article: ${title}`
    
    if (platform === 'twitter') {
      window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
    }
  }

  return (
    <article className="bg-[#F9FAFB] min-h-screen pb-16">
      {/* Hero Section */}
      <header className="w-full bg-gradient-to-r from-rivo-teal to-rivo-dark-blue text-white py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            <Link 
              href="/blog" 
              className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Back to blog</span>
            </Link>
            
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                variants={itemVariants}
              >
                {title}
              </motion.h1>
              
              <motion.div 
                className="flex items-center space-x-4 mb-6"
                variants={itemVariants}
              >
                {author.avatar && (
                  <Image 
                    src={author.avatar} 
                    alt={author.name}
                    width={40} 
                    height={40} 
                    className="rounded-full"
                  />
                )}
                <div>
                  <span className="block text-sm md:text-base font-medium">{author.name}</span>
                  <div className="flex items-center text-xs md:text-sm text-white/80">
                    <span>{formattedDate}</span>
                    {readingTime && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {readingTime}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Featured Image (if provided) */}
      {featuredImage && (
        <div className="w-full relative -mt-8 mb-12">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-4xl mx-auto relative">
              <div className="relative rounded-xl overflow-hidden shadow-xl aspect-[16/9]">
                <Image
                  src={featuredImage}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Content */}
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-prose mx-auto">
          {/* Social Sharing */}
          <div className="flex justify-end items-center mb-8 space-x-3">
            <span className="text-sm text-rivo-subtext">Share:</span>
            <button 
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter className="h-4 w-4 text-rivo-teal" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-4 w-4 text-rivo-teal" />
            </button>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg mx-auto text-rivo-text">
            {/* Styling for blog content */}
            <style jsx global>{`
              .prose a {
                color: #4AB5A8;
                text-decoration: none;
                font-weight: 500;
                transition: border-bottom-color 0.2s;
                border-bottom: 1px solid transparent;
              }
              
              .prose a:hover {
                border-bottom-color: #4AB5A8;
              }
              
              .prose blockquote {
                border-left-color: #4AB5A8;
                background-color: rgba(74, 181, 168, 0.05);
                padding: 1rem 1.5rem;
                font-style: italic;
              }
              
              .prose h1,
              .prose h2,
              .prose h3,
              .prose h4,
              .prose h5,
              .prose h6 {
                color: #1F2937;
                font-weight: 700;
                margin-top: 2em;
                margin-bottom: 1em;
              }
              
              .prose h2 {
                font-size: 1.75em;
              }
              
              .prose h3 {
                font-size: 1.5em;
              }
              
              .prose img {
                border-radius: 0.5rem;
              }
              
              .prose code {
                background-color: #F3F4F6;
                padding: 0.2em 0.4em;
                border-radius: 0.25em;
                font-size: 0.875em;
              }
              
              .prose pre {
                background-color: #1F2937;
                border-radius: 0.5rem;
                overflow-x: auto;
              }
              
              .prose pre code {
                background-color: transparent;
                padding: 0;
                font-size: 0.875em;
              }
            `}</style>
            
            {children}
          </div>
          
          {/* Author Bio */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-start md:items-center flex-col md:flex-row">
              {author.avatar && (
                <Image 
                  src={author.avatar} 
                  alt={author.name} 
                  width={64} 
                  height={64} 
                  className="rounded-full mr-4 mb-4 md:mb-0"
                />
              )}
              <div>
                <p className="font-medium text-lg text-rivo-text">About {author.name}</p>
                <p className="text-rivo-subtext mt-1">
                  Content writer at RivoHome, passionate about home maintenance and smart living solutions.
                </p>
              </div>
            </div>
          </div>
          
          {/* Related Articles (optional placeholder) */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-rivo-text mb-6">You might also like</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Placeholder for related article cards */}
              <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <Link href="#" className="hover:no-underline">
                  <h4 className="font-medium text-rivo-text hover:text-rivo-teal transition-colors">
                    5 Essential Home Maintenance Tasks for Spring
                  </h4>
                  <p className="text-sm text-rivo-subtext mt-2">
                    Prepare your home for warmer weather with these important maintenance tips.
                  </p>
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <Link href="#" className="hover:no-underline">
                  <h4 className="font-medium text-rivo-text hover:text-rivo-teal transition-colors">
                    How Smart Home Technology Can Save You Money
                  </h4>
                  <p className="text-sm text-rivo-subtext mt-2">
                    Learn how modern smart home solutions can reduce your utility bills.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
} 