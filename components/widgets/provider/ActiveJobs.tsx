'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { formatDistance } from 'date-fns'

type Job = {
  id: string
  customer: {
    full_name: string
  }
  job_type: string
  scheduled_for: string
  priority: 'high' | 'normal'
}

type ActiveJobsProps = {
  providerId: string
}

export default function ActiveJobs({ providerId }: ActiveJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchActiveJobs() {
      try {
        if (!providerId) {
          setError('Provider ID not available')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('jobs')
          .select('id, customer:profiles(full_name), job_type, scheduled_for, priority')
          .eq('provider_id', providerId)
          .in('status', ['new', 'scheduled'])
          .order('scheduled_for', { ascending: true })

        if (error) {
          console.error('Error fetching jobs:', error)
          setError('Failed to load active jobs')
        } else {
          // Transform the data to match the Job type structure
          const formattedJobs = data?.map(job => ({
            id: job.id,
            customer: {
              full_name: job.customer?.[0]?.full_name || 'Unknown'
            },
            job_type: job.job_type,
            scheduled_for: job.scheduled_for,
            priority: job.priority
          })) || []
          
          setJobs(formattedJobs)
        }
      } catch (err) {
        console.error('Exception fetching jobs:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchActiveJobs()
  }, [providerId, supabase])

  function formatScheduledDate(dateString: string) {
    try {
      const date = new Date(dateString)
      return `${formatDistance(date, new Date(), { addSuffix: true })}`
    } catch (e) {
      return dateString || 'Not scheduled'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active Jobs</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Current service jobs that need your attention.</p>
        
        <div className="border-t pt-3">
          {loading ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">Loading active jobs...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No active jobs at this time.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className={`flex justify-between items-center p-3 border rounded-lg ${job.priority === 'high' ? 'bg-orange-50 border-orange-200' : ''}`}>
                  <div>
                    <p className="font-medium">{job.customer?.full_name || 'Customer'}</p>
                    <p className="text-sm text-gray-600">{job.job_type}</p>
                    <p className="text-xs text-gray-500 mt-1">Scheduled: {formatScheduledDate(job.scheduled_for)}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      job.priority === 'high' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    } mb-2`}>
                      {job.priority === 'high' ? 'High Priority' : 'Normal'}
                    </span>
                    <Link href={`/jobs/${job.id}`}>
                      <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">
                        View Details
                      </button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 