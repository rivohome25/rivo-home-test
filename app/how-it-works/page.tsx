import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HowItWorksHero } from "@/components/how-it-works-hero"
import { HowItWorksFeatureGrid } from "@/components/how-it-works-feature-grid"
import { HowItWorksCTA } from "@/components/how-it-works-cta"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works - RivoHome",
  description: "Learn how RivoHome simplifies your home maintenance routine in four easy steps.",
};

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HowItWorksHero />
        <HowItWorksFeatureGrid />
        <HowItWorksCTA />
      </main>
      <Footer />
    </div>
  )
} 