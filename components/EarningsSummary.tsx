'use client'
import { useState, useEffect } from 'react'

interface EarningData {
  period: string;
  amount: number;
  jobs: number;
}

interface EarningsApiResponse {
  earnings: {
    this_week: { amount: number; jobs: number };
    this_month: { amount: number; jobs: number };
    year_to_date: { amount: number; jobs: number };
  };
  success: boolean;
}

export default function EarningsSummary({ providerId }: { providerId: string }) {
  const [earnings, setEarnings] = useState<EarningData[]>([
    { period: 'This Week', amount: 0, jobs: 0 },
    { period: 'This Month', amount: 0, jobs: 0 },
    { period: 'Year to Date', amount: 0, jobs: 0 }
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEarnings() {
      try {
        console.log('EarningsSummary: Starting fetch for provider:', providerId)
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/provider/earnings', {
          method: 'GET',
          credentials: 'include', // Important for including cookies
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('EarningsSummary: API response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('EarningsSummary: API error:', errorData)
          throw new Error(errorData.error || `API request failed with status ${response.status}`)
        }
        
        const data: EarningsApiResponse = await response.json()
        console.log('EarningsSummary: API response data:', data)
        
        if (data.success && data.earnings) {
          const transformedEarnings = [
            { 
              period: 'This Week', 
              amount: data.earnings.this_week.amount, 
              jobs: data.earnings.this_week.jobs 
            },
            { 
              period: 'This Month', 
              amount: data.earnings.this_month.amount, 
              jobs: data.earnings.this_month.jobs 
            },
            { 
              period: 'Year to Date', 
              amount: data.earnings.year_to_date.amount, 
              jobs: data.earnings.year_to_date.jobs 
            }
          ]
          
          setEarnings(transformedEarnings)
          console.log('EarningsSummary: Successfully set earnings data:', transformedEarnings)
        } else {
          console.log('EarningsSummary: No earnings data in response, using default values')
          // Keep default zero values if no data
        }
      } catch (err: any) {
        console.error('EarningsSummary: Error fetching earnings:', err)
        const errorMessage = err?.message || err?.toString() || 'Failed to load earnings data'
        setError(errorMessage)
        
        // Keep default zero values on error
        console.log('EarningsSummary: Using default zero values due to error')
        setEarnings([
          { period: 'This Week', amount: 0, jobs: 0 },
          { period: 'This Month', amount: 0, jobs: 0 },
          { period: 'Year to Date', amount: 0, jobs: 0 }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    if (providerId) {
      fetchEarnings()
    } else {
      console.error('EarningsSummary: No providerId provided')
      setError('Provider ID is required')
      setIsLoading(false)
    }
  }, [providerId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Earnings</h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Earnings</h2>
      <div className="space-y-4">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Data Loading Issue:</strong> {error}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Showing default values. This may be normal if you haven't completed any paid jobs yet.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-gray-500 text-sm">Your financial summary as a service provider.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {earnings.map((item) => (
            <div key={item.period} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">{item.period}</p>
              <p className="text-2xl font-bold">${item.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{item.jobs} completed jobs</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t pt-4">
          <h3 className="text-md font-medium mb-2">Next Payouts</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">January 15, 2025</span>
              <span className="text-sm font-medium">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">January 31, 2025</span>
              <span className="text-sm font-medium">$0.00 (estimated)</span>
            </div>
          </div>
        </div>
        
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
          View Detailed Reports →
        </button>
      </div>
    </div>
  )
} 