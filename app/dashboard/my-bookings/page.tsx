'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, User, MapPin, XCircle, CheckCircle, Edit3, AlertTriangle, Star } from 'lucide-react'
import HomeownerNavigationClient from '@/components/HomeownerNavigationClient'
import BookingImageGallery from '@/components/BookingImageGallery'
import ReviewModal from '@/components/ReviewModal'

type Booking = {
  id: string
  provider_id: string
  provider_name: string
  provider_business_name: string
  start_ts: string
  end_ts: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  description: string | null
  service_type: string
  homeowner_notes: string | null
  provider_notes: string | null
  created_at: string
  image_urls?: string[]
  image_count?: number
  has_review?: boolean
}

export default function MyBookingsPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [groupedBookings, setGroupedBookings] = useState<{
    pending: Booking[]
    confirmed: Booking[]
    cancelled: Booking[]
  }>({ pending: [], confirmed: [], cancelled: [] })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesForm, setNotesForm] = useState('')

  // Cancellation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false)
  
  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

  // Predefined cancellation reasons for homeowners
  const cancellationReasons = [
    "Schedule conflict - need to reschedule",
    "Found another provider",
    "No longer need the service", 
    "Emergency came up",
    "Financial constraints",
    "Provider response time too slow",
    "Changed scope of work needed",
    "Seasonal postponement",
    "Other - will specify in details"
  ]

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/homeowner/bookings')
      
      if (response.status === 401) {
        router.push('/auth/sign-in')
        return
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings')
      }

      setBookings(data.bookings)
      setUpcomingBookings(data.upcoming)
      setPastBookings(data.past)
      setGroupedBookings(data.grouped)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookings. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle cancellation dialog
  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setCancellationReason('')
    setShowCancelDialog(true)
  }

  // Submit cancellation with reason
  const submitCancellation = async () => {
    if (!selectedBooking || !cancellationReason.trim()) return

    try {
      setIsSubmittingCancellation(true)

      const response = await fetch(`/api/homeowner/bookings/${selectedBooking.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cancellationReason: cancellationReason 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }

      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled and the provider has been notified of the reason.'
      })

      // Close dialog and refresh bookings
      setShowCancelDialog(false)
      setSelectedBooking(null)
      setCancellationReason('')
      fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel booking',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingCancellation(false)
    }
  }

  // Update booking notes
  const updateBookingNotes = async (bookingId: string) => {
    try {
      setUpdating(bookingId)

      const response = await fetch(`/api/homeowner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeowner_notes: notesForm })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update notes')
      }

      toast({
        title: 'Success',
        description: 'Notes updated successfully!'
      })

      // Reset editing state and refresh
      setEditingNotes(null)
      setNotesForm('')
      fetchBookings()
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update notes',
        variant: 'destructive'
      })
    } finally {
      setUpdating(null)
    }
  }

  const startEditingNotes = (booking: Booking) => {
    setEditingNotes(booking.id)
    setNotesForm(booking.homeowner_notes || '')
  }

  const cancelEditingNotes = () => {
    setEditingNotes(null)
    setNotesForm('')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'confirmed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleReviewClose = (submitted: boolean = false) => {
    setReviewBooking(null)
    if (submitted) {
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!'
      })
      fetchBookings() // Refresh to update has_review flag
    }
  }

  const canCancelBooking = (booking: Booking) => {
    const now = new Date()
    const bookingStart = new Date(booking.start_ts)
    return booking.status !== 'cancelled' && bookingStart > now
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const startDateTime = formatDateTime(booking.start_ts)
    const endDateTime = formatDateTime(booking.end_ts)
    const isEditing = editingNotes === booking.id

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-semibold">{booking.provider_name}</span>
              {getStatusBadge(booking.status)}
            </div>
            <div className="text-sm text-gray-500">
              Requested: {formatDateTime(booking.created_at).date}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{startDateTime.date}</div>
                <div className="text-sm text-gray-600">
                  {startDateTime.time} - {endDateTime.time}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Service Type</div>
              <div className="font-medium">{booking.service_type || 'General Service'}</div>
            </div>
          </div>

          {booking.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Description</div>
              <div className="text-sm">{booking.description}</div>
            </div>
          )}

          {booking.image_urls && booking.image_urls.length > 0 && (
            <div className="mb-4">
              <BookingImageGallery images={booking.image_urls} />
            </div>
          )}

          {booking.provider_notes && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Provider Notes</div>
              <div className="text-sm bg-blue-50 p-2 rounded">{booking.provider_notes}</div>
            </div>
          )}

          {/* Cancellation Reason Section for Cancelled Bookings */}
          {booking.status === 'cancelled' && booking.homeowner_notes && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-red-800">Cancellation Reason</div>
                    <div className="text-red-700 mt-1">{booking.homeowner_notes}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Homeowner Notes Section - Hide for cancelled bookings since cancellation reason is shown above */}
          {booking.status !== 'cancelled' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">Your Notes</div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditingNotes(booking)}
                    className="text-xs"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={notesForm}
                  onChange={(e) => setNotesForm(e.target.value)}
                  placeholder="Add your notes about this booking..."
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => updateBookingNotes(booking.id)}
                    disabled={updating === booking.id}
                  >
                    {updating === booking.id ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditingNotes}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm bg-gray-50 p-2 rounded min-h-[3rem] flex items-center">
                {booking.homeowner_notes || (
                  <span className="text-gray-400 italic">No notes added</span>
                )}
              </div>
            )}
            </div>
          )}

          {/* Action Buttons */}
          {booking.status === 'confirmed' && canCancelBooking(booking) && (
            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <div className="font-medium">Cancellation Policy</div>
                    <div>If you need to cancel this confirmed appointment, please provide a clear reason to maintain transparency with your provider.</div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => handleCancelBooking(booking)}
                disabled={updating === booking.id}
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel Appointment
              </Button>
            </div>
          )}

          {/* Review Button for Completed Bookings */}
          {booking.status === 'completed' && !booking.has_review && (
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <div className="font-medium">Service Completed</div>
                    <div>How was your experience? Your feedback helps other homeowners and improves our platform.</div>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setReviewBooking(booking)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Star className="w-4 h-4 mr-1" />
                Leave a Review
              </Button>
            </div>
          )}

          {/* Already Reviewed Message */}
          {booking.status === 'completed' && booking.has_review && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="text-sm text-green-700">
                  <div className="font-medium">Review Submitted</div>
                  <div>Thank you for your feedback!</div>
                </div>
              </div>
            </div>
          )}

          {(booking.status === 'pending' || (booking.status !== 'confirmed' && canCancelBooking(booking))) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelBooking(booking)}
                disabled={updating === booking.id}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {updating === booking.id ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient 
        title="My Appointments" 
        currentPage="my-bookings"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Appointments</h2>
              <p className="text-gray-600">Track and manage your service provider appointments</p>
            </div>
            
            <Button 
              onClick={() => router.push('/dashboard/find-providers')}
              className="rivo-button"
            >
              Book New Service
            </Button>
          </div>
        </div>

        {/* Bookings Content */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-600 mb-6">
                Book your first service provider appointment to get started.
              </p>
              <Button 
                onClick={() => router.push('/dashboard/find-providers')}
                className="rivo-button"
              >
                Find Service Providers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="active">Active ({bookings.filter(b => b.status !== 'cancelled').length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.filter(b => b.status !== 'cancelled').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({groupedBookings.pending.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({groupedBookings.confirmed.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({bookings.filter(b => b.status === 'cancelled').length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastBookings.filter(b => b.status !== 'cancelled').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <div className="grid gap-4">
                {bookings.filter(b => b.status !== 'cancelled').map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              <div className="grid gap-4">
                {upcomingBookings.filter(b => b.status !== 'cancelled').map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="grid gap-4">
                {groupedBookings.pending.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              <div className="grid gap-4">
                {groupedBookings.confirmed.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {bookings.filter(b => b.status === 'cancelled').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No cancelled appointments</h3>
                    <p className="text-gray-600">
                      Great! You haven't cancelled any appointments yet. This shows reliability and helps build trust with providers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-red-800">Cancelled Appointments</div>
                        <div className="text-red-700 mt-1">
                          These appointments were cancelled. Cancellation reasons are shared with providers to maintain transparency.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {bookings.filter(b => b.status === 'cancelled').map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              <div className="grid gap-4">
                {pastBookings.filter(b => b.status !== 'cancelled').map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Cancel Appointment</span>
            </DialogTitle>
            <DialogDescription>
              Please provide a clear reason for cancelling this appointment. This information will be shared with the provider to maintain transparency and help improve their service.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="font-medium text-gray-900">Appointment Details:</div>
              <div className="text-sm text-gray-600 mt-1">
                <div>Provider: {selectedBooking.provider_name}</div>
                <div>Service: {selectedBooking.service_type}</div>
                <div>Date: {formatDateTime(selectedBooking.start_ts).date}</div>
                <div>Time: {formatDateTime(selectedBooking.start_ts).time} - {formatDateTime(selectedBooking.end_ts).time}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-reason" className="text-sm font-medium">
                Reason for Cancellation <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 space-y-2">
                {cancellationReasons.map((reason) => (
                  <label key={reason} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="cancellation_reason"
                      value={reason}
                      checked={cancellationReason.startsWith(reason.split(' - ')[0])}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="detailed-reason" className="text-sm font-medium">
                Additional Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="detailed-reason"
                placeholder="Please provide additional details about your cancellation reason. This helps the provider understand and improve their service. (Required - minimum 20 characters)"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
              <div className="text-xs text-gray-500 mt-1">
                Characters: {cancellationReason.length}/20 minimum
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-blue-800">Why transparency matters:</div>
                  <div className="text-blue-700 mt-1">
                    Providing clear cancellation reasons helps providers improve their services, better understand homeowner needs, and builds trust within the RivoHome community.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isSubmittingCancellation}
            >
              Keep Appointment
            </Button>
            <Button 
              onClick={submitCancellation}
              disabled={isSubmittingCancellation || !cancellationReason.trim() || cancellationReason.length < 20}
              variant="destructive"
            >
              {isSubmittingCancellation ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          bookingId={reviewBooking.id}
          providerId={reviewBooking.provider_id}
          providerName={reviewBooking.provider_name || reviewBooking.provider_business_name}
          onClose={handleReviewClose}
        />
      )}</div>
  )
} 