'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export default function ServicesOfferedStep() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [options, setOptions] = useState<{ id: number; name: string }[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [radius, setRadius] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  
  // New state for other services
  const [otherServices, setOtherServices] = useState<string[]>([])
  const [newServiceInput, setNewServiceInput] = useState('')

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Fetch master list
  useEffect(() => {
    supabase.from('provider_services_master')
      .select('id,name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setOptions(data || [])
      })
  }, [supabase])

  // Fetch existing selections for this provider
  useEffect(() => {
    if (!user) return
    
    supabase.from('provider_services')
      .select('service_id, radius_miles')
      .eq('provider_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        
        if (data && data.length > 0) {
          // Extract service IDs from existing selections
          setSelected(data.map(s => s.service_id))
          
          // Use the radius from the first service (assuming same radius for all)
          setRadius(data[0].radius_miles || 10)
        }
      })
  }, [supabase, user])

  // Handle adding a new custom service
  const handleAddOtherService = () => {
    const trimmedService = newServiceInput.trim()
    if (trimmedService && !otherServices.includes(trimmedService)) {
      setOtherServices([...otherServices, trimmedService])
      setNewServiceInput('')
    }
  }

  // Handle removing a custom service
  const handleRemoveOtherService = (serviceToRemove: string) => {
    setOtherServices(otherServices.filter(service => service !== serviceToRemove))
  }

  // Handle Enter key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddOtherService()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return setError('Not authenticated')
    if (selected.length === 0 && otherServices.length === 0) {
      return setError('Select at least one service or add a custom service')
    }

    setLoading(true)
    setError(null)

    const res = await fetch(
      '/api/provider-onboarding/services-offered',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_type_ids: selected, 
          radius_miles: radius,
          other_services: otherServices
        })
      }
    )
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unknown error')
      setLoading(false)
      return
    }
    router.push('/provider-onboarding/documents-upload')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Step 2: Services Offered</h1>
      {error && <p className="text-red-600">{error}</p>}

      <fieldset>
        <legend className="font-medium">Select services you provide:</legend>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {options.map(opt => (
            <label key={opt.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                value={opt.id}
                checked={selected.includes(opt.id)}
                onChange={e => {
                  const id = Number(e.target.value)
                  setSelected(sel =>
                    e.target.checked
                      ? [...sel, id]
                      : sel.filter(x => x !== id)
                  )
                }}
                className="h-5 w-5 text-blue-500 rounded"
              />
              <span>{opt.name}</span>
            </label>
          ))}
        </div>
        {options.length === 0 && !error && (
          <p className="text-gray-500 italic mt-2">Loading services...</p>
        )}
      </fieldset>

      {/* Other Services Section */}
      <fieldset>
        <legend className="font-medium">Other Services Not Listed:</legend>
        <div className="mt-2 space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newServiceInput}
              onChange={(e) => setNewServiceInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a service not listed above"
              className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddOtherService}
              disabled={!newServiceInput.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          
          {/* Display added custom services */}
          {otherServices.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Added custom services:</p>
              <div className="flex flex-wrap gap-2">
                {otherServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-blue-100 border border-blue-300 rounded-md px-3 py-1"
                  >
                    <span className="text-sm">{service}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOtherService(service)}
                      className="text-red-500 hover:text-red-700 font-bold text-sm"
                      aria-label={`Remove ${service}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <label className="block">
        <span className="font-medium">Service radius (miles):</span>
        <input
          type="number"
          min={1}
          max={100}
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
          className="mt-1 block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </label>

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
          disabled={loading || (selected.length === 0 && otherServices.length === 0)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </form>
  )
} 