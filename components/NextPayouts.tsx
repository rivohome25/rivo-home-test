'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

interface Payouts {
  this_month_date: string;
  this_month_amount: number;
  next_month_date: string;
  next_month_amount: number;
}

export default function NextPayouts() {
  const [payouts, setPayouts] = useState<Payouts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPayouts() {
      try {
        setIsLoading(true);
        
        const { data: payouts, error } = await supabase
          .from('view_provider_next_payouts')
          .select('*')
          .single();
        
        if (error) {
          throw error;
        }
        
        setPayouts(payouts as Payouts);
      } catch (err: any) {
        console.error('Error fetching payouts:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPayouts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Next Payouts</h3>
        <p className="text-gray-500">Loading payouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Next Payouts</h3>
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  if (!payouts) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Next Payouts</h3>
        <p className="text-gray-500">No payout information available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">Next Payouts</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>This Month:</span>
          <span>{format(new Date(payouts.this_month_date), 'MMMM d, yyyy')}</span>
          <span>${payouts.this_month_amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Next Month:</span>
          <span>{format(new Date(payouts.next_month_date), 'MMMM d, yyyy')}</span>
          <span>${payouts.next_month_amount.toFixed(2)} <em>(estimated)</em></span>
        </div>
      </div>
    </div>
  );
} 