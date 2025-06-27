'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Lead {
  id: string
  job_type: string
  customer: { full_name: string }
  scheduled_for: string | null
}

export function LeadManagement({ providerId }: { providerId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [error, setError] = useState<string>()

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_type,
          customer:profiles!jobs_customer_id_fkey(full_name)
        `)
        .eq('provider_id', providerId)
        .eq('status', 'new')
        .order('created_at', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setLeads(data ?? [])
      }
    })()
  }, [providerId])

  const respond = async (id: string, accept: boolean) => {
    await supabase
      .from('jobs')
      .update({ status: accept ? 'scheduled' : 'cancelled' })
      .eq('id', id)
    // refresh list
    setLeads(leads.filter(l => l.id !== id))
  }

  if (error) return <p className="text-red-600">Failed to load active jobs</p>
  if (!leads.length) return <p>No new leads.</p>

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {leads.map(l => (
        <div key={l.id} className="flex justify-between items-center">
          <div>
            <p className="font-medium">{l.job_type}</p>
            <p className="text-sm text-gray-600">{l.customer.full_name}</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => respond(l.id, true)}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Accept
            </button>
            <button
              onClick={() => respond(l.id, false)}
              className="px-3 py-1 border rounded"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 