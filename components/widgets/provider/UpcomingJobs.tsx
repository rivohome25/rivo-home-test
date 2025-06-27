'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { format } from 'date-fns'

type Job = {
  id: string
  job_type: string
  scheduled_for: string
  customer: {
    full_name: string
  }
}

type UpcomingJobsProps = {
  providerId: string
}

export default function UpcomingJobs({ providerId }: UpcomingJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchUpcomingJobs() {
      try {
        if (!providerId) {
          setError('Provider ID not available')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('jobs')
          .select('id, job_type, scheduled_for, customer:profiles(full_name)')
          .eq('provider_id', providerId)
          .eq('status', 'scheduled')
          .gte('scheduled_for', new Date().toISOString())
          .order('scheduled_for', { ascending: true })
          .limit(5)

        if (error) {
          console.error('Error fetching upcoming jobs:', error)
          setError('Failed to load upcoming jobs')
        } else {
          // Transform the data to match the Job type structure
          const formattedJobs = data?.map(job => ({
            id: job.id,
            job_type: job.job_type,
            scheduled_for: job.scheduled_for,
            customer: {
              full_name: job.customer?.[0]?.full_name || 'Unknown'
            }
          })) || []
          
          setJobs(formattedJobs)
        }
      } catch (err) {
        console.error('Exception fetching upcoming jobs:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingJobs()
  }, [providerId, supabase])

  function formatScheduledDate(dateString: string) {
    try {
      const date = new Date(dateString)
      return format(date, 'MMM d, yyyy h:mm a')
    } catch (e) {
      return dateString || 'Not scheduled'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Upcoming Jobs</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Service jobs scheduled for the future.</p>
        
        <div className="border-t pt-3">
          {loading ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">Loading upcoming jobs...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No upcoming jobs scheduled.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{job.customer?.full_name || 'Customer'}</p>
                    <p className="text-sm text-gray-600">{job.job_type}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatScheduledDate(job.scheduled_for)}</p>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">
                      View Details
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 