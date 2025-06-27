import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="prose prose-slate mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">RivoHome – Privacy Policy</h1>
            
            <p className="text-sm text-gray-600 mb-8">
              Effective Date: This policy is effective as of the date you access this site.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. What We Collect</h2>
              <p>We may collect:</p>
              <ul className="list-disc pl-6">
                <li>Your name and email (e.g. waitlist signups or contact forms)</li>
                <li>Device information and browser type</li>
                <li>Anonymous usage data (e.g., pages visited, time on site)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use It</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6">
                <li>Communicate with you</li>
                <li>Improve the website and user experience</li>
                <li>Analyze usage for product development</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Services and Partners</h2>
              <p>
                We may use trusted third parties (like analytics providers or email tools) to help us operate the platform. 
                In the future, we may partner with service providers (e.g., insurance companies) to offer value-added services.
              </p>
              <p className="mt-4">
                These partners may be granted access to limited user data only to the extent necessary to deliver the service—but 
                we do not sell user data for marketing purposes. We will always disclose partnerships clearly and allow users to 
                opt in to such features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p>
                We use industry-standard safeguards, but no method of transmission or storage is 100% secure. RivoHome is not 
                liable for unauthorized access, breaches, or third-party failures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <p>You may:</p>
              <ul className="list-disc pl-6">
                <li>Access your personal data</li>
                <li>Request correction or deletion</li>
                <li>Opt out of communications</li>
              </ul>
              <p className="mt-4">
                Requests can be sent to <a href="mailto:support@rivohome.com" className="text-teal-600 hover:text-teal-700">
                support@rivohome.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Age Restrictions</h2>
              <p>
                RivoHome is intended for individuals 18 years of age or older. We do not knowingly collect data from anyone 
                under 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Policy Changes</h2>
              <p>
                We may update this Privacy Policy over time. You'll be notified of major changes via this page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 