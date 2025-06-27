'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Review = {
  id: number
  rating: number
  comment: string
  reviewer: {
    full_name: string
  }
  created_at: string
}

type RecentReviewsProps = {
  providerId: string
}

export default function RecentReviews({ providerId }: RecentReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchRecentReviews() {
      try {
        if (!providerId) {
          setError('Provider ID not available')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviews_reviewer_id_fkey(full_name)
          `)
          .eq('subject_id', providerId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) {
          console.error('Error fetching recent reviews:', error)
          setError('Failed to load reviews')
        } else {
          setReviews(data || [])
        }
      } catch (err) {
        console.error('Exception fetching reviews:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentReviews()
  }, [providerId, supabase])

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Recent feedback from your customers.</p>
        
        <div className="border-t pt-3">
          {loading ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">Loading reviews...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex text-yellow-500 mr-2">
                      {'★'.repeat(Math.floor(review.rating))}{'☆'.repeat(5 - Math.floor(review.rating))}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                  </div>
                  <p className="italic my-2">"{review.comment}"</p>
                  <p className="text-xs text-gray-500">– {review.reviewer.full_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 