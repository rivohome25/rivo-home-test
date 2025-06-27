'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export default function BackgroundCheckConsentStep() {
  const supabase = useSupabaseClient()
  const user     = useUser()
  const router   = useRouter()
  
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string|null>(null)
  
  // Fetch existing consent if available
  useEffect(() => {
    if (!user) return
    
    supabase
      .from('provider_profiles')
      .select('background_check_consent')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data && data.background_check_consent) {
          setConsent(true)
        }
      })
  }, [supabase, user])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return setError('Not authenticated')
    if (!consent) return setError('You must consent to continue')

    setLoading(true)
    setError(null)

    const res = await fetch(
      '/api/provider-onboarding/background-check-consent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent })
      }
    )
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unknown error')
      setLoading(false)
      return
    }

    router.push('/provider-onboarding/agreements')
  }
  
  return (
    <form onSubmit={handleSubmit}
          className="max-w-lg mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-semibold">
        Step 6: Background Check Consent
      </h1>
      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h2 className="font-medium text-blue-800 mb-2">Why We Require Background Checks</h2>
          <p className="text-blue-700 text-sm">
            To ensure safety and trust, you must consent to a background
            check. This includes review of publicly available records up
            to 7 years back.
          </p>
        </div>
        
        <div className="p-4 border rounded-md">
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="h-5 w-5 text-blue-500 rounded"
            />
            <span className="text-gray-700">I consent to a background check</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !consent}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </form>
  )
} 