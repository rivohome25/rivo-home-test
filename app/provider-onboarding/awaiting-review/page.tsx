'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export default function AwaitingReviewPage() {
  const supabase = useSupabaseClient()
  const user     = useUser()
  const router   = useRouter()
  const [status, setStatus] = useState<string>('pending')
  const [error, setError]   = useState<string|null>(null)

  // Poll every 10s for status changes
  useEffect(() => {
    if (!user) return
    let iv: NodeJS.Timer

    async function fetchStatus() {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('onboarding_status')
        .eq('user_id', user.id)
        .single()
      if (error) {
        setError(error.message)
        return
      }
      const s = data.onboarding_status
      setStatus(s)
      if (s === 'approved') {
        router.push('/dashboard')
      } else if (s === 'rejected') {
        setError('Your application was rejected. Please contact support.')
        clearInterval(iv)
      }
    }

    // first fetch + start polling
    fetchStatus()
    iv = setInterval(fetchStatus, 10_000)
    return () => clearInterval(iv)
  }, [supabase, user, router])

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold">Awaiting Review</h1>
        <p className="text-red-600 mt-4">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Your Application Is Pending</h1>
      <p className="text-gray-700">
        We've received your provider application and will review it shortly.
      </p>
      <p className="text-sm text-gray-500">
        (This page will auto-refresh when your status changes.)
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      >
        Refresh Now
      </button>
    </div>
  )
} 