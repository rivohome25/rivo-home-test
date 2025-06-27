'use client';

import { useState, useEffect } from 'react';
import { useRouter }   from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Available review platforms
const REVIEW_PLATFORMS = [
  {
    id: 'google',
    name: 'Google Business',
    placeholder: 'https://www.google.com/maps/place/...',
    description: 'Your Google Business Profile reviews',
    icon: '🔍'
  },
  {
    id: 'yelp',
    name: 'Yelp',
    placeholder: 'https://www.yelp.com/biz/...',
    description: 'Your Yelp business page reviews',
    icon: '⭐'
  },
  {
    id: 'angi',
    name: 'Angi (Angie\'s List)',
    placeholder: 'https://www.angi.com/companydetail/...',
    description: 'Your Angi service provider profile',
    icon: '🏠'
  },
  {
    id: 'bbb',
    name: 'Better Business Bureau',
    placeholder: 'https://www.bbb.org/us/...',
    description: 'Your BBB business profile',
    icon: '🛡️'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'https://www.facebook.com/...',
    description: 'Your Facebook business page reviews',
    icon: '📘'
  },
  {
    id: 'other',
    name: 'Other',
    placeholder: 'https://www.example.com/your-business-profile',
    description: 'Any other review platform or website',
    icon: '🌐'
  }
];

interface ReviewEntry {
  platform: string;
  url: string;
  testimonial: string;
  enabled: boolean;
}

export default function ExternalReviewsStep() {
  const supabase = createClientComponentClient();
  const router   = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [reviewEntries, setReviewEntries] = useState<ReviewEntry[]>(
    REVIEW_PLATFORMS.map(platform => ({
      platform: platform.id,
      url: '',
      testimonial: '',
      enabled: false
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  // Check authentication and fetch existing entries
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/sign-in');
        return;
      }
      
      setUser(user);
      
      // Fetch existing entries
      const { data, error: fetchErr } = await supabase
        .from('provider_external_reviews')
        .select('platform,url,testimonial')
        .eq('provider_id', user.id);
        
      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }
      
      // Update state with existing data
      if (data && data.length > 0) {
        setReviewEntries(prev => prev.map(entry => {
          const existingEntry = data.find(d => d.platform === entry.platform);
          if (existingEntry) {
            return {
              ...entry,
              url: existingEntry.url || '',
              testimonial: existingEntry.testimonial || '',
              enabled: true // If data exists, platform was previously enabled
            };
          }
          return entry;
        }));
      }
    };
    
    checkAuth();
  }, [supabase, router]);

  const updateReviewEntry = (platform: string, field: keyof ReviewEntry, value: string | boolean) => {
    setReviewEntries(prev => prev.map(entry => 
      entry.platform === platform 
        ? { ...entry, [field]: value }
        : entry
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('Not authenticated');
    
    // Check if at least one platform is enabled with a URL
    const enabledEntries = reviewEntries.filter(entry => entry.enabled && entry.url.trim());
    if (enabledEntries.length === 0) {
      setError('Please enable and provide at least one review platform link');
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare data for API
    const reviewData: Record<string, string> = {};
    enabledEntries.forEach(entry => {
      reviewData[`${entry.platform}_url`] = entry.url;
      reviewData[`${entry.platform}_testimonial`] = entry.testimonial;
    });

    const res = await fetch(
      '/api/provider-onboarding/external-reviews',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Unknown error');
      setLoading(false);
      return;
    }
    router.push('/provider-onboarding/background-check-consent');
  };

  const enabledCount = reviewEntries.filter(entry => entry.enabled).length;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Step 5: External Reviews</h1>
        <p className="text-gray-600 mt-2">
          Select the review platforms where customers can find your business and add links to your profiles. 
          This helps build trust with potential customers.
        </p>
        <div className="mt-2 text-sm text-blue-600">
          {enabledCount > 0 ? `${enabledCount} platform${enabledCount !== 1 ? 's' : ''} selected` : 'No platforms selected'}
        </div>
      </div>
      
      {error && <p className="text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

      <div className="space-y-4">
        {REVIEW_PLATFORMS.map((platform) => {
          const entry = reviewEntries.find(e => e.platform === platform.id);
          if (!entry) return null;

          return (
            <div key={platform.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`enable-${platform.id}`}
                    checked={entry.enabled}
                    onChange={(e) => updateReviewEntry(platform.id, 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{platform.icon}</span>
                    <label 
                      htmlFor={`enable-${platform.id}`}
                      className="font-medium text-gray-900 cursor-pointer"
                    >
                      {platform.name}
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
                  
                  {entry.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profile URL *
                        </label>
                        <input
                          type="url"
                          placeholder={platform.placeholder}
                          value={entry.url}
                          onChange={(e) => updateReviewEntry(platform.id, 'url', e.target.value)}
                          required={entry.enabled}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Featured Testimonial (optional)
                        </label>
                        <textarea
                          placeholder="Share a positive review or testimonial from this platform..."
                          value={entry.testimonial}
                          onChange={(e) => updateReviewEntry(platform.id, 'testimonial', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-500">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Tips for External Reviews
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Choose platforms where you have the most positive reviews</li>
                <li>Make sure your profile URLs are public and accessible</li>
                <li>Featured testimonials help showcase your best work</li>
                <li>You can always add more platforms later</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || enabledCount === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </form>
  );
} 