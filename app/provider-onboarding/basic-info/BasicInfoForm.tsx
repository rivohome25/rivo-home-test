'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BasicInfoForm() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [businessName, setBusiness] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // POST to our API
    const res = await fetch('/api/provider-onboarding/basic-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        business_name: businessName,
        phone,
        zip_code: zip
      })
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unknown error')
      setLoading(false)
      return
    }

    // Advance to Step 2
    router.push('/provider-onboarding/services-offered')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Step 1: Basic Info</h1>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Full Name</span>
          <input
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Business Name</span>
          <input
            required
            value={businessName}
            onChange={e => setBusiness(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Phone</span>
          <input
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Zip Code</span>
          <input
            required
            value={zip}
            onChange={e => setZip(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </form>
  )
} 