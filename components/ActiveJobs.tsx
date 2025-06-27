'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface Job {
  id: string;
  customer_name: string;
  service_type: string;
  scheduled_date: string;
}

export default function ActiveJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveJobs() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('view_provider_active_jobs')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        setJobs(data as Job[]);
      } catch (err: any) {
        console.error('Error fetching active jobs:', err);
        setError(err.message || 'Failed to load active jobs');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchActiveJobs();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Active Jobs</h3>
        <p className="text-gray-500">Loading active jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Active Jobs</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Active Jobs</h3>
      
      {jobs.length === 0 ? (
        <p className="text-gray-500 italic">No new leads.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map(job => (
            <li key={job.id} className="border-l-4 border-blue-500 pl-3 py-2">
              <div className="font-bold">{job.customer_name}</div>
              <div className="text-sm text-gray-600">{job.service_type}</div>
              <div className="text-sm">
                When: {format(parseISO(job.scheduled_date), 'MMM d, yyyy h:mm a')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 