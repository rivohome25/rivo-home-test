'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface JobCount {
  pending_jobs: number;
  active_jobs: number;
  completed_jobs: number;
}

export default function JobCounts() {
  const [counts, setCounts] = useState<JobCount>({
    pending_jobs: 0,
    active_jobs: 0,
    completed_jobs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobCounts() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('view_provider_job_counts')
          .select('*')
          .single();
        
        if (error) {
          throw error;
        }
        
        setCounts(data as JobCount);
      } catch (err: any) {
        console.error('Error fetching job counts:', err);
        setError(err.message || 'Failed to load job counts');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchJobCounts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Job Counts</h3>
        <p className="text-gray-500">Loading counts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Job Counts</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Job Counts</h3>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2">
          <div className="text-2xl font-bold text-blue-600">{counts.pending_jobs}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        
        <div className="p-2">
          <div className="text-2xl font-bold text-green-600">{counts.active_jobs}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        
        <div className="p-2">
          <div className="text-2xl font-bold text-gray-600">{counts.completed_jobs}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
      </div>
    </div>
  );
} 