import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="prose prose-slate mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">RivoHome – Terms of Service</h1>
            
            <p className="text-sm text-gray-600 mb-8">
              Effective Date: These terms are effective upon visiting this site.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance</h2>
              <p>
                By accessing the RivoHome site, you agree to these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Use of Our Services</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6">
                <li>Access or use RivoHome in a manner that violates any law</li>
                <li>Attempt to reverse engineer, copy, resell, or commercially exploit the platform</li>
                <li>Interfere with servers, databases, or networks</li>
                <li>Use bots, scrapers, or automated systems to extract data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. No Warranties</h2>
              <p>
                RivoHome is provided "as is" and "as available." We do not guarantee:
              </p>
              <ul className="list-disc pl-6">
                <li>That the service will be uninterrupted or error-free</li>
                <li>That information is always accurate or complete</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
              <p>
                RivoHome and its owners are not liable for any damages resulting from:
              </p>
              <ul className="list-disc pl-6">
                <li>Service outages or delays</li>
                <li>Loss of data</li>
                <li>Security breaches or hacks</li>
                <li>Third-party service disruptions</li>
              </ul>
              <p className="mt-4">
                Use the service at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p>
                All logos, content, designs, and systems are property of RivoHome or its licensors. 
                You may not reproduce or reuse these without written permission or consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Governing Law</h2>
              <p>
                These terms are governed by the laws of the State of Texas, USA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Updates to Terms</h2>
              <p>
                We may modify these terms at any time. Continued use means you accept any updates.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 