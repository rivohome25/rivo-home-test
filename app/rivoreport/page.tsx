/**
 * RivoReport Page - Showcase the comprehensive home inspection reports
 * 
 * This page demonstrates the detailed reports that homeowners receive
 * after a RivoHome inspection, highlighting features like maintenance
 * schedules, issue tracking, and seasonal recommendations.
 */

import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ReportHero } from "@/components/report-hero"
import { ReportPreviewSection } from "@/components/report-preview-section"
import { RivoReportHowItWorks } from "@/components/rivoreport-how-it-works"
import { ReportCTA } from "@/components/report-cta"

export const metadata: Metadata = {
  title: "RivoReport - Future Property Documentation | RivoHome",
  description: "Learn about RivoReport, our planned comprehensive property documentation feature designed to integrate with RivoHome's maintenance platform. Join our waitlist for early access.",
  keywords: "property documentation, maintenance history, home care tracking, future features, property reports, RivoHome platform",
  openGraph: {
    title: "RivoReport - Future Property Documentation Platform",
    description: "Discover RivoReport, the planned property documentation feature that will integrate with RivoHome's maintenance platform to create comprehensive property care records.",
    type: "website",
  },
}

export default function RivoReportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ReportHero />
        <ReportPreviewSection />
        <RivoReportHowItWorks />
        <ReportCTA />
      </main>
      <Footer />
    </div>
  )
} 