'use client'
import { useState } from 'react'

interface EarningData {
  period: string;
  amount: number;
  jobs: number;
}

export default function Earnings({ providerId }: { providerId: string }) {
  const [earnings] = useState<EarningData[]>([
    { period: 'This Week', amount: 850, jobs: 3 },
    { period: 'This Month', amount: 3250, jobs: 12 },
    { period: 'Year to Date', amount: 22640, jobs: 84 }
  ])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Earnings</h2>
      <div className="space-y-4">
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
              <span className="text-sm">June 15, 2024</span>
              <span className="text-sm font-medium">$1,250.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">June 30, 2024</span>
              <span className="text-sm font-medium">$2,000.00 (estimated)</span>
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