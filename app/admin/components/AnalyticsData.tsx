'use client'

import { useState, useEffect } from 'react'

export type AnalyticsData = {
  totalUsers: number
  totalProviders: number
  activeSubscribers: number
  pendingApplications: number
  dailySignups: Array<{ day: string; signup_count: number }>
  recentSignupsCount: number
}

type AnalyticsProps = {
  children: (data: AnalyticsData | null, loading: boolean, error: string | null) => React.ReactNode
}

export default function AnalyticsData({ children }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return children(data, loading, error)
} 