'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Summary { newLeads: number; scheduled: number; completed: number }

export function JobSummary({ providerId }: { providerId: string }) {
  const [counts, setCounts] = useState<Summary>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    async function load() {
      try {
        // helper to fetch count by status
        const countFor = async (status: string) => {
          const { count, error } = await supabase
            .from('jobs')
            .select('id', { count: 'exact' })
            .eq('provider_id', providerId)
            .eq('status', status)
          if (error) throw error
          return count ?? 0
        }

        const [newLeads, scheduled, completed] = await Promise.all([
          countFor('new'),
          countFor('scheduled'),
          countFor('completed'),
        ])

        setCounts({ newLeads, scheduled, completed })
      } catch (err: any) {
        setError(err.message)
      }
    }
    load()
  }, [providerId])

  if (error) return <p className="text-red-600">Failed to load summary</p>
  if (!counts) return <p>Loading summary…</p>

  return (
    <div className="bg-white rounded-lg shadow p-6 flex justify-between text-center">
      <div>
        <h3 className="text-3xl font-bold text-green-600">{counts.newLeads}</h3>
        <p className="text-sm">New Leads</p>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-green-600">{counts.scheduled}</h3>
        <p className="text-sm">Scheduled</p>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-green-600">{counts.completed}</h3>
        <p className="text-sm">Completed</p>
      </div>
    </div>
  )
} 