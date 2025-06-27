'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Tutorial {
  id: string;
  title: string;
  type: string;
  url: string;
}

export default function DIYLibrary() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTutorials() {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('view_popular_tutorials')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        setTutorials(data as Tutorial[]);
      } catch (err: any) {
        console.error('Error fetching tutorials:', err);
        setError(err.message || 'Failed to load tutorials');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTutorials();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <h3 className="font-semibold mb-2">DIY Library</h3>
      
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm py-2">{error}</div>
      )}
      
      {!isLoading && !error && (
        tutorials.length > 0 ? (
          <ul className="space-y-3">
            {tutorials.slice(0, 5).map((tutorial) => (
              <li key={tutorial.id} className="border-l-4 border-blue-500 pl-3 py-2">
                <div className="font-bold">{tutorial.title}</div>
                <div className="text-sm text-gray-600 italic">{tutorial.type}</div>
                <div className="mt-1">
                  <a 
                    href={tutorial.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                  >
                    {tutorial.type.toLowerCase().includes('video') ? 'Watch' : 'Read'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic py-2">No tutorials available</p>
        )
      )}
    </div>
  );
} 