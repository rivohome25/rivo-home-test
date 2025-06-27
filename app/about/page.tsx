import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AboutHero } from "@/components/about-hero"
import { AboutMission } from "@/components/about-mission"
import { FAQSection } from "@/components/faq-section"
import { NewsletterSection } from "@/components/newsletter-section"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AboutHero />
        <AboutMission />
        <FAQSection />
        <NewsletterSection
          headline="Stay Updated"
          description="Join our newsletter to get the latest updates and news about RivoHome."
        />
      </main>
      <Footer />
    </div>
  )
}

