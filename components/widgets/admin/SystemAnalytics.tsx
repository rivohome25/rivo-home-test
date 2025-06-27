'use client'
import { useState } from 'react'

interface AnalyticsData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export default function SystemAnalytics() {
  const [metrics] = useState<AnalyticsData[]>([
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
  
  const [timeframe, setTimeframe] = useState('month')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">System Analytics</h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-sm border rounded-md px-2 py-1"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last 12 Months</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <div className="flex items-end gap-2">
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
      
      <div className="space-y-4">
        <h3 className="text-md font-medium">Top Providers (Last 30 Days)</h3>
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium">Elite Electrical Solutions</td>
                <td className="px-4 py-2 text-sm">24</td>
                <td className="px-4 py-2 text-sm">$5,280</td>
                <td className="px-4 py-2 text-sm">4.9</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium">Acme Plumbing Services</td>
                <td className="px-4 py-2 text-sm">18</td>
                <td className="px-4 py-2 text-sm">$4,320</td>
                <td className="px-4 py-2 text-sm">4.8</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium">Superior Roofing Co.</td>
                <td className="px-4 py-2 text-sm">12</td>
                <td className="px-4 py-2 text-sm">$8,640</td>
                <td className="px-4 py-2 text-sm">4.7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View Detailed Analytics →
        </button>
      </div>
    </div>
  )
} 