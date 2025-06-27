'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, User, Calendar, ExternalLink } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

interface MyReview {
  id: string
  booking_id: string
  provider_id: string
  rating: number
  comment: string
  created_at: string
  provider_name?: string
  service_type?: string
  booking_date?: string
}

export default function MyReviews() {
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchMyReviews()
  }, [])

  const fetchMyReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch reviews written by the current user with additional booking/provider info
      const response = await fetch('/api/reviews?my_reviews=true', {
        credentials: 'include', // Ensure cookies are included
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          // Authentication error - don't show scary error, just show empty state
          setReviews([])
          return
        }
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      // If no reviews, data.reviews might be an empty array
      if (!data.reviews || data.reviews.length === 0) {
        setReviews([])
        return
      }

      // Transform the data to include provider info
      const reviewsWithDetails = await Promise.all(
        data.reviews.map(async (review: any) => {
          // Get provider name
          const { data: providerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.provider_id)
            .single()

          return {
            ...review,
            provider_name: providerData?.full_name || 'Unknown Provider',
            service_type: review.provider_bookings?.service_type || 'General Service',
            booking_date: review.provider_bookings?.start_ts
          }
        })
      )

      setReviews(reviewsWithDetails)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      // For most errors, just show empty state rather than scary error message
      setReviews([])
      setError(null) // Clear error to show empty state instead
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-800'
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>My Reviews</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your reviews...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>My Reviews</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              <p className="font-medium">Error loading reviews</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>My Reviews</span>
          </div>
          <Badge variant="outline">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 text-sm mb-4">
              Once you complete bookings with service providers, you can leave reviews here.
            </p>
            <p className="text-blue-600 text-sm font-medium">
              📝 Ready to help others by sharing your experience!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    {renderStars(review.rating)}
                    <Badge className={getRatingBadgeColor(review.rating)}>
                      {review.rating} star{review.rating !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(parseISO(review.created_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-3">
                  <blockquote className="text-gray-700 italic leading-relaxed">
                    "{review.comment}"
                  </blockquote>
                </div>

                {/* Provider and Service Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">Provider:</span>
                      <span className="text-gray-600 ml-1">{review.provider_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">Service:</span>
                      <span className="text-gray-600 ml-1">{review.service_type}</span>
                    </div>
                  </div>
                  {review.booking_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="font-medium text-gray-900">Date:</span>
                        <span className="text-gray-600 ml-1">
                          {new Date(review.booking_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {reviews.length > 3 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Showing {Math.min(reviews.length, 3)} of {reviews.length} reviews
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 