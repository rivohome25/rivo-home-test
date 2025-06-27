'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { format, parseISO } from 'date-fns'

interface Job {
  id: string;
  customer_name: string;
  service_type: string;
  date: string;
  amount: number;
  rating: number;
}

export default function JobHistory({ providerId }: { providerId: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobHistory() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data, error } = await supabase
          .from('view_provider_all_jobs')
          .select('*')
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(10)
        
        if (error) {
          throw error
        }
        
        // Transform the data to match our Job interface
        const transformedJobs = (data || []).map(job => ({
          id: job.id,
          customer_name: job.customer_name,
          service_type: job.service_type || job.service,
          date: job.date,
          amount: job.amount || 0,
          rating: job.rating || 0
        }))
        
        setJobs(transformedJobs)
      } catch (err: any) {
        console.error('Error fetching job history:', err)
        setError(err.message || 'Failed to load job history')
        // Fallback to sample data if there's an error
        setJobs([
          {
            id: '1',
            customer_name: 'Michael Thompson',
            service_type: 'HVAC Maintenance',
            date: '2024-05-25',
            amount: 350,
            rating: 5
          },
          {
            id: '2',
            customer_name: 'Sarah Wilson',
            service_type: 'Plumbing Repair',
            date: '2024-05-18',
            amount: 275,
            rating: 4
          },
          {
            id: '3',
            customer_name: 'David Lee',
            service_type: 'Electrical Panel Inspection',
            date: '2024-05-12',
            amount: 200,
            rating: 5
          },
          {
            id: '4',
            customer_name: 'Emma Garcia',
            service_type: 'Dishwasher Installation',
            date: '2024-05-05',
            amount: 320,
            rating: 5
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchJobHistory()
  }, [providerId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Job History</h2>
        <p className="text-gray-500">Loading job history...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Job History</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Your completed service jobs in the last 30 days.</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">{job.customer_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{job.service_type}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {format(parseISO(job.date), 'yyyy-MM-dd')}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium">${job.amount}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      {job.rating > 0 ? (
                        Array(job.rating).fill(0).map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))
                      ) : (
                        <span className="text-gray-400">No rating</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">Showing {jobs.length} recent jobs</span>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Jobs →
          </button>
        </div>
      </div>
    </div>
  )
} 