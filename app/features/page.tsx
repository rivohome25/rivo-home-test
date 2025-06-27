import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FeaturesHero } from "@/components/features-hero"
import { CoreFeatures } from "@/components/core-features"
import { PremiumFeatures } from "@/components/premium-features"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features - RivoHome",
  description: "Discover all the powerful features that RivoHome offers to simplify your home maintenance experience.",
};

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <FeaturesHero />
        <CoreFeatures />
        <PremiumFeatures />
      </main>
      <Footer />
    </div>
  )
} 