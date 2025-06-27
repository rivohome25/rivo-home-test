"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FAQSection } from "@/components/faq-section"
import { WaitlistCTASection } from "@/components/waitlist-cta-section"
import { MaintenanceChecklistSection } from "@/components/maintenance-checklist-section"
import { ResourcesHero } from "@/components/ResourcesHero"
import { DiyVideoPreview } from "@/components/diy-video-preview"
import { SilentLoadingScreen } from "@/components/SilentLoadingScreen"

export default function ResourcesPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading delay to ensure video data loads properly
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex min-h-screen flex-col">
      <SilentLoadingScreen isLoading={isLoading} />
      <Navbar />
      <main className="flex-1">
        <ResourcesHero />
        <MaintenanceChecklistSection />
        <DiyVideoPreview />

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="container px-4 md:px-6">
            <FAQSection />
          </div>
        </section>
        
        {/* Get Notified Section */}
        <WaitlistCTASection />
      </main>
      <Footer />
    </div>
  )
}

