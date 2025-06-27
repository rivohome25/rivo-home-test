'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Provider {
  id: string;
  name: string;
  service_type: string;
  description: string;
}

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsInProgress, setBookingsInProgress] = useState<string[]>([]);
  const [bookedProviders, setBookedProviders] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchProviders() {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('view_available_providers')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        setProviders(data as Provider[]);
      } catch (err: any) {
        console.error('Error fetching providers:', err);
        setError(err.message || 'Failed to load providers');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProviders();
  }, []);
  
  const handleBook = async (provider: Provider) => {
    // Don't allow booking if already in progress
    if (bookingsInProgress.includes(provider.id) || bookedProviders.includes(provider.id)) {
      return;
    }
    
    // Start booking process
    setBookingsInProgress(prev => [...prev, provider.id]);
    
    try {
      // Get current user
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      
      if (userErr || !user) {
        throw userErr || new Error('You must be signed in to book a provider');
      }
      
      // Create booking
      const { error: bookingErr } = await supabase
        .from('bookings')
        .insert([{ 
          homeowner_id: user.id, 
          provider_id: provider.id, 
          booking_date: new Date().toISOString() 
        }]);
      
      if (bookingErr) {
        throw bookingErr;
      }
      
      // Optimistically update UI
      setBookedProviders(prev => [...prev, provider.id]);
      
      // Show success message
      showToast(`Successfully booked ${provider.name}`);
      
    } catch (err: any) {
      console.error('Error booking provider:', err);
      setError(`Failed to book ${provider.name}: ${err.message}`);
    } finally {
      // Remove from in-progress state
      setBookingsInProgress(prev => prev.filter(id => id !== provider.id));
    }
  };
  
  // Simple toast function - you would replace this with your actual toast implementation
  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Providers</h3>
      
      {isLoading && (
        <div className="text-gray-500 py-4">Loading providers...</div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm py-2">{error}</div>
      )}
      
      {!isLoading && !error && (
        providers.length > 0 ? (
          <ul className="space-y-3">
            {providers.map((provider) => (
              <li key={provider.id} className="border-l-4 border-blue-500 pl-3 py-2 flex justify-between items-center">
                <div>
                  <div className="font-bold">{provider.name}</div>
                  <div className="text-sm text-gray-600">{provider.service_type}</div>
                </div>
                <button
                  onClick={() => handleBook(provider)}
                  disabled={bookingsInProgress.includes(provider.id) || bookedProviders.includes(provider.id)}
                  className={`px-3 py-1 rounded text-white text-sm ${
                    bookedProviders.includes(provider.id)
                      ? 'bg-green-500'
                      : bookingsInProgress.includes(provider.id)
                      ? 'bg-blue-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors focus:outline-none disabled:opacity-50`}
                >
                  {bookedProviders.includes(provider.id)
                    ? 'Booked'
                    : bookingsInProgress.includes(provider.id)
                    ? 'Booking...'
                    : 'Book'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic py-2">No providers available</p>
        )
      )}
    </div>
  );
} 