/**
 * ReportCTA Component - Call-to-action section for the RivoReport page
 * 
 * Encourages users to sign up for the newsletter to get updates about RivoReport
 * and positions it as a future extension of the RivoHome platform
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { NewsletterSection } from "@/components/newsletter-section"

const benefits = [
  "Will integrate comprehensive maintenance tracking with RivoHome's service network",
  "Planned maintenance calendar personalized for your home and region",
  "Designed to provide maintenance alerts to help prevent costly repairs",
  "Will track property care activities and maintenance completion over time",
  "Seamless connection with RivoHome's trusted local service provider network"
]

export function ReportCTA() {
  return (
    <>
      {/* Newsletter Signup Section */}
      <NewsletterSection 
        headline="Ready for RivoReport?"
        description="Be among the first to know when comprehensive property documentation becomes available as part of the RivoHome platform. Join our waitlist for exclusive early access updates."
      />
    </>
  )
} 