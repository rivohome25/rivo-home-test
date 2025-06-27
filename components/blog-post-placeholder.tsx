"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { CalendarIcon, Clock, ArrowLeft, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface BlogPostPlaceholderProps {
  slug: string
}

export function BlogPostPlaceholder({ slug }: BlogPostPlaceholderProps) {
  // This would normally fetch the post data based on the slug
  // For now, we'll use placeholder content
  const post = {
    title: "How to Properly Maintain Your Home Throughout the Year",
    excerpt:
      "A comprehensive guide to keeping your home in top condition with seasonal maintenance tips and checklists.",
    image: "/placeholder.svg?height=600&width=1200",
    category: "Maintenance",
    date: "April 12, 2023",
    readTime: "8 min read",
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=100&width=100",
      title: "Home Maintenance Expert",
    },
    content: `
      <p>Regular home maintenance is essential for preserving your property's value and preventing costly repairs. This guide will help you create a year-round maintenance schedule to keep your home in excellent condition.</p>
      
      <h2>Spring Maintenance Tasks</h2>
      
      <p>As the weather warms up, it's time to assess any damage from winter and prepare for the summer months:</p>
      
      <ul>
        <li>Inspect and clean gutters and downspouts</li>
        <li>Check the roof for damaged or missing shingles</li>
        <li>Service your air conditioning system</li>
        <li>Inspect windows and doors for cracks or air leaks</li>
        <li>Check for water damage or mold in the attic</li>
        <li>Clean or replace HVAC filters</li>
      </ul>
      
      <h2>Summer Maintenance Tasks</h2>
      
      <p>Summer is the perfect time to focus on outdoor maintenance:</p>
      
      <ul>
        <li>Inspect and clean outdoor cooking equipment</li>
        <li>Check and maintain lawn equipment</li>
        <li>Inspect and repair decks, patios, and outdoor structures</li>
        <li>Check sprinkler and irrigation systems</li>
        <li>Inspect pool equipment and maintain water chemistry</li>
      </ul>
      
      <h2>Fall Maintenance Tasks</h2>
      
      <p>Fall is the time to prepare your home for the colder months ahead:</p>
      
      <ul>
        <li>Clean gutters and downspouts again</li>
        <li>Schedule a heating system inspection</li>
        <li>Check and clean the chimney</li>
        <li>Seal cracks and gaps in windows and doors</li>
        <li>Drain and shut off outdoor water systems</li>
        <li>Clean or replace HVAC filters</li>
      </ul>
      
      <h2>Winter Maintenance Tasks</h2>
      
      <p>During winter, focus on indoor tasks and preventing cold-weather damage:</p>
      
      <ul>
        <li>Check for ice dams and icicles</li>
        <li>Test smoke and carbon monoxide detectors</li>
        <li>Inspect the basement for water leaks during thaws</li>
        <li>Monitor your heating system's performance</li>
        <li>Check insulation in attic and basement</li>
      </ul>
      
      <h2>Monthly Maintenance Tasks</h2>
      
      <p>Some tasks should be performed monthly regardless of the season:</p>
      
      <ul>
        <li>Test smoke and carbon monoxide detectors</li>
        <li>Check and replace HVAC filters as needed</li>
        <li>Clean kitchen sink disposal</li>
        <li>Clean range hood filters</li>
        <li>Inspect fire extinguishers</li>
      </ul>
      
      <p>By following this maintenance schedule, you'll keep your home in excellent condition year-round and avoid costly emergency repairs. Remember that preventive maintenance is always less expensive than emergency repairs!</p>
    `,
  }

  return (
    <>
      <section className="section pt-8 md:pt-12">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all articles
            </Link>

            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                {post.category}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="container mb-8"
      >
        <div className="relative aspect-[21/9] overflow-hidden rounded-lg">
          <Image
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            width={1200}
            height={600}
            className="object-cover"
            priority
          />
        </div>
      </motion.div>

      <section className="section pt-0">
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-8"
            >
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-4"
            >
              <div className="sticky top-20">
                <div className="rounded-lg border bg-background p-6">
                  <h3 className="text-lg font-medium mb-4">About the Author</h3>
                  <div className="flex items-center gap-4">
                    <Image
                      src={post.author.avatar || "/placeholder.svg"}
                      alt={post.author.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                    <div>
                      <h4 className="font-medium">{post.author.name}</h4>
                      <p className="text-sm text-muted-foreground">{post.author.title}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border bg-background p-6">
                  <h3 className="text-lg font-medium mb-4">Share this article</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      <span className="sr-only">Facebook</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                      <span className="sr-only">Twitter</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect width="4" height="12" x="2" y="9"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Copy Link</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border bg-accent p-6">
                  <h3 className="text-lg font-medium mb-4">Never miss an update</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Subscribe to our newsletter for the latest home maintenance tips and guides.
                  </p>
                  <Button className="w-full">Subscribe</Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

