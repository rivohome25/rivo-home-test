'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, MessageSquare, User, Calendar, Search, Filter, TrendingUp, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  provider_id: string
  rating: number
  comment: string
  created_at: string
  reviewer_name?: string
  provider_name?: string
  service_type?: string
}

interface ReviewStats {
  total: number
  average_rating: number
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    filterAndSortReviews()
  }, [reviews, searchTerm, ratingFilter, sortBy])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      
      // Fetch all reviews with related data
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name),
          provider:profiles!reviews_provider_id_fkey(full_name),
          booking:bookings(service_type)
        `)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError

      // Transform data
      const transformedReviews = reviewsData?.map(review => ({
        ...review,
        reviewer_name: review.reviewer?.full_name || 'Unknown',
        provider_name: review.provider?.full_name || 'Unknown',
        service_type: review.booking?.service_type || 'General Service'
      })) || []

      setReviews(transformedReviews)

      // Calculate stats
      if (transformedReviews.length > 0) {
        const total = transformedReviews.length
        const average_rating = transformedReviews.reduce((sum, r) => sum + r.rating, 0) / total
        const ratingCounts = transformedReviews.reduce((counts, r) => {
          counts[r.rating] = (counts[r.rating] || 0) + 1
          return counts
        }, {} as Record<number, number>)

        setStats({
          total,
          average_rating: Math.round(average_rating * 10) / 10,
          five_star: ratingCounts[5] || 0,
          four_star: ratingCounts[4] || 0,
          three_star: ratingCounts[3] || 0,
          two_star: ratingCounts[2] || 0,
          one_star: ratingCounts[1] || 0,
        })
      }

    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortReviews = () => {
    let filtered = [...reviews]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'high') {
        filtered = filtered.filter(review => review.rating >= 4)
      } else if (ratingFilter === 'low') {
        filtered = filtered.filter(review => review.rating <= 2)
      } else {
        filtered = filtered.filter(review => review.rating === parseInt(ratingFilter))
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'highest':
          return b.rating - a.rating
        case 'lowest':
          return a.rating - b.rating
        default:
          return 0
      }
    })

    setFilteredReviews(filtered)
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 animate-pulse text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage all customer reviews across your platform</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-green-600">{stats.average_rating}</div>
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.five_star}</div>
                <div className="text-sm text-gray-600">5 Star</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.four_star}</div>
                <div className="text-sm text-gray-600">4 Star</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.three_star}</div>
                <div className="text-sm text-gray-600">3 Star</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.two_star + stats.one_star}</div>
                <div className="text-sm text-gray-600">Low Ratings</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search reviews, providers, or customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="high">High (4-5 stars)</SelectItem>
                  <SelectItem value="low">Low (1-2 stars)</SelectItem>
                  <SelectItem value="5">5 stars</SelectItem>
                  <SelectItem value="4">4 stars</SelectItem>
                  <SelectItem value="3">3 stars</SelectItem>
                  <SelectItem value="2">2 stars</SelectItem>
                  <SelectItem value="1">1 star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest">Highest rating</SelectItem>
                  <SelectItem value="lowest">Lowest rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-600">
                  {searchTerm || ratingFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No reviews have been submitted yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <Badge className={getRatingBadgeColor(review.rating)}>
                          {review.rating} star{review.rating !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mb-4">
                    <blockquote className="text-gray-700 italic text-lg leading-relaxed">
                      "{review.comment}"
                    </blockquote>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Customer</div>
                        <div className="text-gray-600">{review.reviewer_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Provider</div>
                        <div className="text-gray-600">{review.provider_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Service</div>
                        <div className="text-gray-600">{review.service_type}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 