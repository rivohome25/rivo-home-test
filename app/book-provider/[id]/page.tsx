'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type Provider = {
  user_id: string
  full_name: string
  business_name: string
  zip_code: string
  services: string[]
  min_radius: number
  logo_url: string | null
  bio: string | null
}

type Availability = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type BookingFormData = {
  service: string
  date: string
  time: string
  description: string
}

const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BookProvider({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const providerId = resolvedParams.id
  
  const [provider, setProvider] = useState<Provider | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<BookingFormData>({
    service: '',
    date: '',
    time: '',
    description: ''
  })
  
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  
  // Fetch provider details
  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        // Fetch provider
        const providerRes = await fetch(`/api/providers/${providerId}`)
        if (!providerRes.ok) {
          throw new Error('Failed to fetch provider details')
        }
        const providerData = await providerRes.json()
        setProvider(providerData)
        
        // Set default service if provider has services
        if (providerData.services && providerData.services.length > 0) {
          setFormData(prev => ({ ...prev, service: providerData.services[0] }))
        }
        
        // Fetch availability
        const availabilityRes = await fetch(`/api/providers/${providerId}/availability`)
        if (!availabilityRes.ok) {
          throw new Error('Failed to fetch provider availability')
        }
        const availabilityData = await availabilityRes.json()
        setAvailability(availabilityData)
        
        // Generate available dates (next 14 days that match provider's days of week)
        const availableDays = new Set(availabilityData.map((slot: Availability) => slot.day_of_week))
        const dates: string[] = []
        
        const today = new Date()
        for (let i = 0; i < 14; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          
          if (availableDays.has(date.getDay())) {
            dates.push(date.toISOString().split('T')[0])
          }
        }
        
        setAvailableDates(dates)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProviderDetails()
  }, [providerId])
  
  // Update available times when date changes
  useEffect(() => {
    if (formData.date && availability.length > 0) {
      const selectedDate = new Date(formData.date)
      const dayOfWeek = selectedDate.getDay()
      
      // Find slots for this day of week
      const daySlots = availability.filter(slot => slot.day_of_week === dayOfWeek)
      
      // Generate time options at 30-minute intervals
      const times: string[] = []
      daySlots.forEach(slot => {
        const start = new Date(`2000-01-01T${slot.start_time}`)
        const end = new Date(`2000-01-01T${slot.end_time}`)
        
        let current = new Date(start)
        while (current < end) {
          times.push(current.toTimeString().slice(0, 5))
          current.setMinutes(current.getMinutes() + 30)
        }
      })
      
      setAvailableTimes(times)
      
      // Set default time if available
      if (times.length > 0 && !formData.time) {
        setFormData(prev => ({ ...prev, time: times[0] }))
      }
    }
  }, [formData.date, availability])
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service || !formData.date || !formData.time) {
      alert('Please fill out all required fields')
      return
    }
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          service_type: formData.service,
          scheduled_date: `${formData.date}T${formData.time}:00`,
          description: formData.description
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to create booking')
      }
      
      // Redirect to confirmation page
      router.push('/booking-confirmation')
    } catch (err) {
      console.error('Error creating booking:', err)
      alert('There was an error processing your booking. Please try again.')
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <p>Loading provider details...</p>
      </div>
    )
  }
  
  if (error || !provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600 mb-4">
          {error || 'Provider not found'}
        </div>
        <Link href="/providers" className="text-blue-600 hover:underline">
          Back to Providers
        </Link>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/providers" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Providers
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Provider Info */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              {provider.logo_url ? (
                <Image
                  src={provider.logo_url}
                  alt={provider.business_name}
                  width={80}
                  height={80}
                  className="rounded-full mr-4"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full mr-4 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">
                    {provider.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{provider.business_name}</h1>
                <p className="text-gray-600">{provider.full_name}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h2 className="font-semibold text-lg mb-2">About</h2>
              <p className="text-gray-700">{provider.bio || 'No bio provided'}</p>
            </div>
            
            <div className="mb-4">
              <h2 className="font-semibold text-lg mb-2">Services</h2>
              <ul className="list-disc list-inside text-gray-700">
                {provider.services.map(service => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="font-semibold text-lg mb-2">Availability</h2>
              <ul className="text-gray-700">
                {availability.length > 0 ? (
                  [...new Set(availability.map(slot => slot.day_of_week))]
                    .sort()
                    .map(day => (
                      <li key={day} className="mb-1">
                        <span className="font-medium">{dayMapping[day]}:</span>{' '}
                        {availability
                          .filter(slot => slot.day_of_week === day)
                          .map(slot => `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`)
                          .join(', ')}
                      </li>
                    ))
                ) : (
                  <li className="text-yellow-600">No availability information.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Booking Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Book this Provider</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="service" className="block text-gray-700 font-medium mb-2">
                  Service Type*
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a Service</option>
                  {provider.services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
                  Date*
                </label>
                <select
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a Date</option>
                  {availableDates.map(date => {
                    const displayDate = new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })
                    return (
                      <option key={date} value={date}>
                        {displayDate}
                      </option>
                    )
                  })}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="time" className="block text-gray-700 font-medium mb-2">
                  Time*
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                  disabled={!formData.date}
                >
                  <option value="">Select a Time</option>
                  {availableTimes.map(time => {
                    // Convert 24h time to 12h format for display
                    const [hours, minutes] = time.split(':')
                    const hour = parseInt(hours, 10)
                    const ampm = hour >= 12 ? 'PM' : 'AM'
                    const hour12 = hour % 12 || 12
                    const displayTime = `${hour12}:${minutes} ${ampm}`
                    
                    return (
                      <option key={time} value={time}>
                        {displayTime}
                      </option>
                    )
                  })}
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md h-32"
                  placeholder="Describe your service need in detail..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition font-medium"
              >
                Book Service
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 