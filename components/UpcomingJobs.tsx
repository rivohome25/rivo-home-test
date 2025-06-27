'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, parseISO } from 'date-fns';

interface Job {
  id: string;
  homeowner_name: string;
  service_type: string;
  start_ts: string;
  end_ts: string;
  status: string;
}

export default function UpcomingJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUpcomingJobs() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch confirmed bookings from provider_bookings table
        const { data, error } = await supabase
          .from('view_provider_bookings')
          .select('*')
          .eq('status', 'confirmed')
          .gte('start_ts', new Date().toISOString())
          .order('start_ts', { ascending: true })
          .limit(5);
        
        if (error) {
          throw error;
        }
        
        setJobs(data as Job[]);
      } catch (err: any) {
        console.error('Error fetching upcoming jobs:', err);
        setError(err.message || 'Failed to load upcoming jobs');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUpcomingJobs();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Upcoming Jobs</h3>
        <p className="text-gray-500">Loading upcoming jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Upcoming Jobs</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Upcoming Jobs</h3>
      
      {jobs.length === 0 ? (
        <p className="text-gray-500 italic">No upcoming confirmed jobs.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map(job => (
            <li key={job.id} className="border-l-4 border-green-500 pl-3 py-2">
              <div className="font-bold">{job.homeowner_name}</div>
              <div className="text-sm text-gray-600">{job.service_type}</div>
              <div className="text-sm">
                When: {format(parseISO(job.start_ts), 'MMM d, yyyy h:mm a')}
              </div>
              {job.end_ts && (
                <div className="text-xs text-gray-500">
                  Until: {format(parseISO(job.end_ts), 'h:mm a')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 