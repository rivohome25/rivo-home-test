import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WaitlistCTASection } from "@/components/waitlist-cta-section"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Pricing - RivoHome",
  description: "Explore our affordable pricing plans and choose the right option for your home maintenance needs.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="w-full py-20 bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              With pricing starting under $10/month, we offer flexible plans to meet your needs. Start with our free option and upgrade as you grow.
            </p>
            <Link href="#notify-section" className="inline-block bg-white text-rivo-dark hover:bg-gray-100 px-8 py-3 rounded-full font-medium">
              Join the Waitlist
            </Link>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="w-full bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                RivoHome Pricing Packages
                <br />
                <span className="text-2xl">For Homeowners</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Free Plan */}
              <div className="relative flex flex-col rounded-2xl border border-gray-200 p-8 shadow-sm bg-white">
                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Free Plan (Starter)</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="mt-4 text-center text-gray-600">
                    Perfect for first-time homeowners or home renters exploring home maintenance.
                  </p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600">1 home profile</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600">Up to 10 maintenance reminders</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600">Basic maintenance guide</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600">Limited document storage (100 mb)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600">DIY video library</span>
                  </li>
                </ul>
              </div>
              
              {/* Core Plan */}
              <div className="relative flex flex-col rounded-2xl border border-rivo-base p-8 shadow-sm bg-white">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-rivo-base text-white text-xs font-bold py-1 px-4 rounded-full">
                  Most Popular
                </div>
                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Core Plan</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$7</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">or $70/year</p>
                  <p className="mt-4 text-center text-gray-600">
                    Ideal for everyday homeowners who want to stay organized.
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Everything in Free, plus:</p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Up to 3 home profiles</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Unlimited reminders & smart alerts</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Complete seasonal maintenance checklist</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Home maintenance calendar</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Document storage (up to 1GB)</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Search and message service providers</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Basic maintenance history tracking</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="relative flex flex-col rounded-2xl border border-gray-200 p-8 shadow-sm bg-white">
                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Premium Plan (RivoPro)</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$20</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">or $200/year</p>
                  <p className="mt-4 text-center text-gray-600">
                    Built for power homeowners, sellers, and realtors managing multiple homes.
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Everything in Core, plus:</p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Unlimited home profiles</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Unlimited storage</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Direct booking with verified service providers</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">RivoReport access (when available)</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Priority customer support</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">Early access to beta features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RivoReport Feature Preview Section */}
        <section className="w-full bg-blue-50 py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon: RivoReport</h3>
            <p className="text-lg text-gray-600 mb-6">
              We're developing RivoReport as an advanced property documentation feature that will integrate seamlessly with your RivoHome maintenance tracking.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Core Plan Integration</h4>
                <p className="text-gray-600 text-sm">Basic maintenance history tracking and documentation will be included in the Core plan.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-rivo-base">
                <h4 className="font-semibold text-gray-900 mb-2">Premium RivoReport</h4>
                <p className="text-gray-600 text-sm">Full RivoReport generation, sharing capabilities, and advanced property documentation features for Premium subscribers.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Service Provider Benefits</h4>
                <p className="text-gray-600 text-sm">Service providers will contribute to RivoReport verification and gain visibility through completed work documentation.</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Join our waitlist to be notified when RivoReport becomes available as part of your RivoHome subscription.
            </p>
          </div>
        </section>

        {/* Service Providers Pricing Section */}
        <section className="w-full bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Service Providers</h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Specialized pricing for local service providers who want to grow their business and connect with homeowners
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <div className="relative flex flex-col rounded-2xl border border-rivo-base/30 p-8 shadow-sm bg-white">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-rivo-base text-white text-xs font-bold py-1 px-4 rounded-full">
                  First 3 Months Free
                </div>
                
                {/* Limited Time Offer Banner */}
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-amber-800 font-medium text-sm">
                      Limited Time: This pricing is only available for the first 150 service providers who sign up
                    </span>
                  </div>
                </div>

                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Founding Provider Plan</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$99</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-rivo-base font-medium mt-1">First 3 months free</p>
                  <p className="mt-4 text-center text-gray-600">
                    Join RivoHome as a founding service provider and grow your business by connecting with homeowners in your area
                  </p>
                </div>

                <div className="mb-8">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-gray-700 text-lg">Local profile listing</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-gray-700 text-lg">Leads from homeowners in your area</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-gray-700 text-lg">Priority access to bookings</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-gray-700 text-lg">Reviews & ratings collection</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-gray-700 text-lg">Lifetime discount eligibility</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-gray-700 text-lg">'Founding Provider' badge</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
              <p className="text-lg text-gray-600">
                Have more questions? Contact our customer support team at <a href="mailto:support@rivohome.com" className="text-rivo-base hover:underline">support@rivohome.com</a>
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I switch plans later?</h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be applied to your next billing cycle.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What payment methods do you accept?</h3>
                <p className="text-gray-600">
                  We accept all major credit cards, including Visa, Mastercard, and American Express. We also support PayPal.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How does the free trial work?</h3>
                <p className="text-gray-600">
                  All paid plans include a 14-day free trial. You can cancel anytime before the trial ends and won't be charged.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Is there a long-term contract?</h3>
                <p className="text-gray-600">
                  No, all plans are billed monthly and you can cancel at any time. We also offer discounted annual plans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Get Notified Section */}
        <WaitlistCTASection />
      </main>
      <Footer />
    </div>
  )
} 