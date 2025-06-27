'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
}

export default function RecentReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentReviews() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('view_provider_recent_reviews')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        setReviews(data as Review[]);
      } catch (err: any) {
        console.error('Error fetching recent reviews:', err);
        setError(err.message || 'Failed to load recent reviews');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecentReviews();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Recent Reviews</h3>
        <p className="text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Recent Reviews</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Recent Reviews</h3>
      
      {reviews.length === 0 ? (
        <p className="text-gray-500 italic">No recent reviews.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.slice(0, 3).map(review => (
            <li key={review.id} className="border-l-4 border-blue-500 pl-3 py-2">
              <div className="font-bold">{review.reviewer_name}</div>
              <div className="text-yellow-500">
                {Array.from({ length: review.rating }, (_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <div className="text-sm italic mt-1">"{review.comment}"</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 