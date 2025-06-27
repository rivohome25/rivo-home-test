"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HomeHero } from "@/components/home-hero"
import { KeyFeaturesSection } from "@/components/key-features-section"

import { WaitlistCTASection } from "@/components/waitlist-cta-section"
import { HowItWorksCombined } from "@/components/how-it-works-combined"
import { LoadingScreen } from "@/components/LoadingScreen"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // 2 seconds loading time

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <LoadingScreen isLoading={isLoading} />
      <Navbar />
      <main className="flex-1">
        <HomeHero />
        <KeyFeaturesSection />
        <HowItWorksCombined />
        <WaitlistCTASection />
      </main>
      <Footer />
    </div>
  )
}

