"use client"

import { motion } from "framer-motion"
import { BlogCard } from "@/components/blog-card"

// Sample blog post data
const blogPosts = [
  {
    id: 1,
    title: "10 Essential HVAC Maintenance Tips for Every Season",
    excerpt: "Keep your heating and cooling systems running efficiently year-round with these expert maintenance tips.",
    image: "/placeholder.svg?height=400&width=600",
    category: "HVAC",
    date: "May 15, 2023",
    slug: "hvac-maintenance-tips",
  },
  {
    id: 2,
    title: "How Often Should You Really Change Your Air Filters?",
    excerpt:
      "The definitive guide to air filter replacement schedules based on your home environment and usage patterns.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Air Quality",
    date: "June 2, 2023",
    slug: "air-filter-replacement-guide",
  },
  {
    id: 3,
    title: "The Ultimate Home Maintenance Calendar for Homeowners",
    excerpt:
      "Stay on top of your home maintenance with this month-by-month guide to keeping your home in perfect condition.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Planning",
    date: "June 18, 2023",
    slug: "home-maintenance-calendar",
  },
  {
    id: 4,
    title: "5 Warning Signs Your Plumbing Needs Immediate Attention",
    excerpt:
      "Learn to recognize these early warning signs of plumbing issues before they become expensive emergencies.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Plumbing",
    date: "July 5, 2023",
    slug: "plumbing-warning-signs",
  },
  {
    id: 5,
    title: "How to Prepare Your Home for Winter: A Complete Checklist",
    excerpt: "Protect your home from cold weather damage with this comprehensive winterization checklist.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Seasonal",
    date: "August 12, 2023",
    slug: "winter-home-preparation",
  },
  {
    id: 6,
    title: "DIY vs. Professional: When to Call in the Experts",
    excerpt:
      "A practical guide to knowing which home maintenance tasks you can handle yourself and when to call professionals.",
    image: "/placeholder.svg?height=400&width=600",
    category: "DIY",
    date: "September 3, 2023",
    slug: "diy-vs-professional",
  },
  {
    id: 7,
    title: "Smart Home Devices That Actually Save You Money",
    excerpt:
      "Discover which smart home investments pay for themselves through energy savings and maintenance prevention.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Smart Home",
    date: "September 28, 2023",
    slug: "smart-home-savings",
  },
  {
    id: 8,
    title: "The Complete Guide to Home Warranty Coverage",
    excerpt:
      "Everything you need to know about home warranties: what they cover, what they don't, and if they're worth it.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Planning",
    date: "October 15, 2023",
    slug: "home-warranty-guide",
  },
  {
    id: 9,
    title: "How to Extend the Life of Your Major Home Appliances",
    excerpt:
      "Simple maintenance tips that can add years to the lifespan of your refrigerator, washer, dryer, and more.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Appliances",
    date: "November 7, 2023",
    slug: "appliance-lifespan-tips",
  },
]

export function BlogGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <section className="section">
      <div className="container">
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

