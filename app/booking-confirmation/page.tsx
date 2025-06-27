'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BookingConfirmation() {
  const router = useRouter()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        
        if (!data.authenticated) {
          router.push('/sign-in')
        }
      } catch (err) {
        console.error('Auth check error:', err)
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <svg
            className="w-20 h-20 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your service request has been sent to the provider. They'll review your request
          and confirm the appointment soon.
        </p>
        
        <p className="text-gray-600 mb-8">
          You'll receive a notification when the provider accepts your booking.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/providers"
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
          >
            Find More Providers
          </Link>
        </div>
      </div>
    </div>
  )
} 