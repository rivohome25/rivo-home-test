import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProviderHero } from "@/components/ProviderHero"
import { ProviderFeatures } from "@/components/ProviderFeatures"
import { ProviderHowItWorks } from "@/components/ProviderHowItWorks"
import { ProviderCTAForm } from "@/components/ProviderCTAForm"

export const metadata = {
  title: "For Providers | RivoHome",
  description: "Join RivoHome's network of trusted service providers and grow your business.",
}

export default function ProvidersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ProviderHero />
        <ProviderFeatures />
        <ProviderHowItWorks />
        <ProviderCTAForm />
      </main>
      <Footer />
    </div>
  )
}

