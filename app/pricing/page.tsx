'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

export default function PricingPage() {
  const [user, setUser] = useState<any>(null)
  const [currentTier, setCurrentTier] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (user && !error) {
        setUser(user)
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setCurrentTier(profile.tier)
        }
      }
      
      setLoading(false)
    }
    
    getUser()
  }, [supabase])

  const handleUpgrade = async (tier: number, price: string) => {
    if (!user) {
      router.push('/sign-in?redirect=/pricing')
      return
    }
    
    try {
      // Call your API to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          tier, 
          user_id: user.id,
          price_id: tier === 1 ? 'price_core' : 'price_premium', // Replace with your actual Stripe price IDs
          email: user.email
        })
      })
      
      const { url } = await response.json()
      
      // Redirect to Stripe checkout
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
  }

  const getTierButton = (tier: number, price: string) => {
    if (!user) {
      return (
        <button 
          onClick={() => handleUpgrade(tier, price)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Subscribe
        </button>
      )
    }
    
    if (currentTier === null) {
      return (
        <button 
          className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          disabled
        >
          Loading...
        </button>
      )
    }
    
    if (currentTier >= tier) {
      return (
        <button 
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg cursor-not-allowed"
          disabled
        >
          Current Plan
        </button>
      )
    }
    
    return (
      <button 
        onClick={() => handleUpgrade(tier, price)}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        Upgrade
      </button>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="w-full py-20 bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Unlock premium features to manage your home maintenance more effectively.
              Start with our free tier or upgrade for additional benefits.
            </p>
            {!user && (
              <Link href="/sign-in" className="inline-block bg-white text-rivo-dark hover:bg-gray-100 px-8 py-3 rounded-full font-medium">
                Sign In to Upgrade
              </Link>
            )}
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="w-full bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                RivoHome Pricing Packages
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Choose the plan that's right for you and unlock the full potential of your home maintenance management
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="relative flex flex-col rounded-2xl border border-gray-200 p-8 shadow-sm bg-white">
                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Free Plan (Starter)</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="mt-4 text-center text-gray-600">
                    Perfect for first-time homeowners or home renters exploring home maintenance
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
                    <span className="ml-2 text-gray-600">Limited document storage (3 files)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600">DIY video library access</span>
                  </li>
                </ul>

                {getTierButton(0, "free")}
              </div>
              
              {/* Core Plan */}
              <div className="relative flex flex-col rounded-2xl border-2 border-rivo-base p-8 shadow-lg bg-white -mt-4 md:-mt-8">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-rivo-base text-white text-xs font-bold py-1 px-4 rounded-full">
                  MOST POPULAR
                </div>
                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Core Plan</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$7</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="mt-4 text-center text-gray-600">
                    Ideal for everyday homeowners who want to stay organized
                  </p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600"><strong>Everything in Free</strong>, plus:</span>
                  </li>
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
                    <span className="ml-2 text-gray-600">Document storage (up to 50 files)</span>
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
                    <span className="ml-2 text-gray-600">In-Platform Rivo Report (non-shareable)</span>
                  </li>
                </ul>

                {getTierButton(1, "price_core")}
              </div>
              
              {/* Premium Plan */}
              <div className="relative flex flex-col rounded-2xl border border-gray-200 p-8 shadow-sm bg-white">
                <div className="mb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-gray-900">Premium Plan (RivoPro)</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$20</span>
                    <span className="ml-1 text-lg text-gray-500">/month</span>
                  </div>
                  <p className="mt-4 text-center text-gray-600">
                    Built for power homeowners, sellers, and realtors managing multiple homes
                  </p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-600"><strong>Everything in Core</strong>, plus:</span>
                  </li>
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
                    <span className="ml-2 text-gray-600">Unlimited document vault</span>
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
                    <span className="ml-2 text-gray-600">Shareable Rivo Report (PDF format)</span>
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

                {getTierButton(2, "price_premium")}
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
                  We accept all major credit cards, including Visa, Mastercard, and American Express.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I cancel my subscription?</h3>
                <p className="text-gray-600">
                  You can cancel your subscription anytime from your account settings. Your plan will remain active until the end of your current billing period.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Is there a long-term contract?</h3>
                <p className="text-gray-600">
                  No, all plans are billed monthly and you can cancel at any time. We also offer discounted annual plans for longer commitments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 