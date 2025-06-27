'use client'

import { useState, useEffect } from 'react'

type AnalyticsData = {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

type TopProvider = {
  name: string
  jobs: number
  revenue: number
  rating: number
}

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsData[]>([
    {
      label: 'Total Users',
      value: 2456,
      change: 12.5,
      trend: 'up'
    },
    {
      label: 'Active Providers',
      value: 187,
      change: 8.3,
      trend: 'up'
    },
    {
      label: 'Jobs Scheduled',
      value: 342,
      change: 15.7,
      trend: 'up'
    },
    {
      label: 'Revenue (MTD)',
      value: 34680,
      change: -2.1,
      trend: 'down'
    }
  ])
  
  const [topProviders, setTopProviders] = useState<TopProvider[]>([
    {
      name: 'Elite Electrical Solutions',
      jobs: 24,
      revenue: 5280,
      rating: 4.9
    },
    {
      name: 'Acme Plumbing Services',
      jobs: 18,
      revenue: 4320,
      rating: 4.8
    },
    {
      name: 'Superior Roofing Co.',
      jobs: 12,
      revenue: 8640,
      rating: 4.7
    }
  ])
  
  const [timeframe, setTimeframe] = useState('month')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  /* Uncomment when API is ready
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || res.statusText)
        } 
        const data = await res.json()
        setMetrics(data.metrics)
        setTopProviders(data.topProviders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [timeframe])
  */

  if (loading) return <p>Loading analytics...</p>
  if (error) return <p className="text-red-600">Error: {error}</p>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Analytics</h1>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last 12 Months</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-2xl font-bold">
                {metric.label.includes('Revenue') ? '$' : ''}{metric.value.toLocaleString()}
              </p>
              <div className={`flex items-center ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {metric.trend === 'up' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                ) : metric.trend === 'down' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <span>-</span>
                )}
                <span className="text-sm">{Math.abs(metric.change)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">User Growth</h2>
        </div>
        <div className="p-6 h-64 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Chart placeholder - User growth over time</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Top Providers (Last 30 Days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProviders.map((provider) => (
                <tr key={provider.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{provider.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.jobs}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${provider.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t text-right">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View All Providers →
          </button>
        </div>
      </div>
    </div>
  )
} 