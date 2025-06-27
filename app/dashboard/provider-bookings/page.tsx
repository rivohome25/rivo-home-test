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
import { CheckCircle, XCircle, Clock, Calendar, User, AlertTriangle } from 'lucide-react'
import ProviderNavigationClient from '@/components/ProviderNavigationClient'


type Booking = {
  id: string
  homeowner_id: string
  homeowner_name: string
  homeowner_email: string
  start_ts: string
  end_ts: string
  status: 'pending' | 'confirmed' | 'cancelled'
  description: string | null
  service_type: string
  provider_notes: string | null
  created_at: string
}

export default function ProviderBookingsPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [groupedBookings, setGroupedBookings] = useState<{
    pending: Booking[]
    confirmed: Booking[]
    cancelled: Booking[]
  }>({ pending: [], confirmed: [], cancelled: [] })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Cancellation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false)

  // Predefined cancellation reasons for quick selection
  const cancellationReasons = [
    'Emergency came up',
    'Illness/Health issue',
    'Equipment failure/breakdown',
    'Weather conditions',
    'Scheduling conflict',
    'Unable to complete work as described',
    'Safety concerns at property',
    'Client requested changes beyond scope',
    'Other (specify below)'
  ]

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/provider/bookings')
      
      if (response.status === 401) {
        router.push('/auth/sign-in')
        return
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings')
      }

      setBookings(data.bookings)
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

  // Update booking status (approve/reject)
  const updateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled', providerNotes?: string) => {
    try {
      setUpdating(bookingId)

      const response = await fetch(`/api/provider/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          provider_notes: providerNotes 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking')
      }

      toast({
        title: 'Success',
        description: data.message || `Booking ${newStatus} successfully!`
      })

      // Refresh bookings
      fetchBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update booking',
        variant: 'destructive'
      })
    } finally {
      setUpdating(null)
    }
  }

  // Handle cancellation dialog
  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setCancellationReason('')
    setShowCancelDialog(true)
  }

  const submitCancellation = async () => {
    if (!selectedBooking || !cancellationReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for cancellation',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmittingCancellation(true)
      await updateBookingStatus(selectedBooking.id, 'cancelled', cancellationReason)
      setShowCancelDialog(false)
      setSelectedBooking(null)
      setCancellationReason('')
    } catch (error) {
      // Error handling is already done in updateBookingStatus
    } finally {
      setIsSubmittingCancellation(false)
    }
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
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const startDateTime = formatDateTime(booking.start_ts)
    const endDateTime = formatDateTime(booking.end_ts)

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-semibold">{booking.homeowner_name}</span>
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
              <div className="font-medium">{booking.service_type}</div>
            </div>
          </div>

          {booking.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Description</div>
              <div className="text-sm">{booking.description}</div>
            </div>
          )}

          {booking.provider_notes && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 font-medium">Provider Notes:</div>
              <div className="text-sm text-blue-600">{booking.provider_notes}</div>
            </div>
          )}

          {/* Action buttons based on status */}
          {booking.status === 'pending' && (
            <div className="flex space-x-2">
              <Button
                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                disabled={updating === booking.id}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {updating === booking.id ? 'Updating...' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                onClick={() => updateBookingStatus(booking.id, 'cancelled', 'Declined by provider')}
                disabled={updating === booking.id}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <div className="font-medium">Cancellation Policy</div>
                    <div>If you need to cancel this confirmed appointment, please provide a clear reason to maintain transparency with the homeowner.</div>
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
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading bookings...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <ProviderNavigationClient 
        title="Manage Bookings" 
        currentPage="provider-bookings"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{groupedBookings.pending.length}</div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{groupedBookings.confirmed.length}</div>
            <div className="text-sm text-gray-600">Confirmed Bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{bookings.length}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({groupedBookings.pending.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({groupedBookings.confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({groupedBookings.cancelled.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({bookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {groupedBookings.pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No pending booking requests
              </CardContent>
            </Card>
          ) : (
            <div>
              {groupedBookings.pending.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          {groupedBookings.confirmed.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No confirmed bookings
              </CardContent>
            </Card>
          ) : (
            <div>
              {groupedBookings.confirmed.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {groupedBookings.cancelled.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No cancelled bookings
              </CardContent>
            </Card>
          ) : (
            <div>
              {groupedBookings.cancelled.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No bookings yet
              </CardContent>
            </Card>
          ) : (
            <div>
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Cancel Confirmed Appointment</span>
            </DialogTitle>
            <DialogDescription>
              Please provide a clear reason for cancelling this appointment. This information will be shared with the homeowner to maintain transparency and trust.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="font-medium text-gray-900">Appointment Details:</div>
              <div className="text-sm text-gray-600 mt-1">
                <div>Homeowner: {selectedBooking.homeowner_name}</div>
                <div>Service: {selectedBooking.service_type}</div>
                <div>Date: {formatDateTime(selectedBooking.start_ts).date}</div>
                <div>Time: {formatDateTime(selectedBooking.start_ts).time} - {formatDateTime(selectedBooking.end_ts).time}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Quick Reasons (click to select):
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {cancellationReasons.map((reason, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={cancellationReason === reason ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCancellationReason(reason)}
                    className="text-xs"
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="cancellation-reason" className="text-sm font-medium text-gray-700">
                Detailed Explanation <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Please provide a detailed explanation for the cancellation. This helps maintain trust and may assist with future bookings."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-2 min-h-[100px]"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {cancellationReason.length}/500 characters
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
                    Providing clear cancellation reasons helps build trust with homeowners, improves your professional reputation, and helps the platform maintain quality standards for all users.
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
              disabled={isSubmittingCancellation || !cancellationReason.trim()}
              variant="destructive"
            >
              {isSubmittingCancellation ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 