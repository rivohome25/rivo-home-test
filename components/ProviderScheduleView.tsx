'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' 
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
import { Calendar, Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, ChevronLeft, ChevronRight, Settings, AlertTriangle } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, parseISO } from 'date-fns'
import BookingImageGallery from '@/components/BookingImageGallery'

interface ProviderBooking {
  id: string
  homeowner_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  service_type: string
  description: string | null
  scheduled_date: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  provider_notes: string | null
  created_at: string
  property_address: string
  image_urls?: string[]
  image_count?: number
}

interface ProviderAvailability {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  buffer_mins: number
}

export default function ProviderScheduleView() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()
  
  const [bookings, setBookings] = useState<ProviderBooking[]>([])
  const [availability, setAvailability] = useState<ProviderAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentWeek, setCurrentWeek] = useState(new Date())

  // Cancellation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<ProviderBooking | null>(null)
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

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    loadProviderData()
  }, [])

  const loadProviderData = async () => {
    try {
      setLoading(true)

      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        throw new Error('Authentication required')
      }

      console.log('ProviderScheduleView: Loading data for user:', user.id)

      // Load bookings filtered by current provider
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('provider_bookings')
        .select(`
          id, 
          homeowner_id, 
          start_ts, 
          end_ts, 
          service_type, 
          description, 
          status, 
          provider_notes, 
          created_at
        `)
        .eq('provider_id', user.id)
        .order('start_ts', { ascending: true })

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError)
        throw bookingsError
      }

      console.log('ProviderScheduleView: Loaded bookings:', bookingsData?.length || 0)

      // Get homeowner profile information separately for each booking
      const homeownerIds = bookingsData?.map(b => b.homeowner_id).filter(Boolean) || []
      let homeownerProfiles: Record<string, any> = {}
      
      if (homeownerIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', homeownerIds)

        if (!profileError && profileData) {
          homeownerProfiles = profileData.reduce((acc, profile) => {
            acc[profile.id] = profile
            return acc
          }, {} as Record<string, any>)
        }
      }

      // Transform bookings data with profile information
      const transformedBookings = bookingsData?.map((booking: any) => ({
        id: booking.id,
        homeowner_id: booking.homeowner_id,
        customer_name: homeownerProfiles[booking.homeowner_id]?.full_name || 'Unknown',
        customer_email: '', // Email requires auth.users access, skip for now
        customer_phone: homeownerProfiles[booking.homeowner_id]?.phone || null,
        service_type: booking.service_type,
        description: booking.description,
        scheduled_date: booking.start_ts,
        status: booking.status,
        provider_notes: booking.provider_notes,
        created_at: booking.created_at,
        property_address: 'Address not available' // This would require a property table join
      })) || []

      setBookings(transformedBookings)

      // Load availability filtered by current provider
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', user.id)
        .order('day_of_week', { ascending: true })

      if (availabilityError) {
        console.error('Error loading availability:', availabilityError)
        // Don't throw here, availability is not critical
      } else {
        console.log('ProviderScheduleView: Loaded availability:', availabilityData?.length || 0)
        setAvailability(availabilityData || [])
      }

    } catch (error) {
      console.error('Error loading provider data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load schedule data. Please try refreshing the page.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled', providerNotes?: string) => {
    try {
      const { error } = await supabase
        .from('provider_bookings')
        .update({ 
          status,
          provider_notes: providerNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) {
        console.error('Error updating booking:', error)
        toast({
          title: 'Error',
          description: 'Failed to update booking status',
          variant: 'destructive',
        })
      } else {
        setBookings(bookings.map(booking => 
          booking.id === bookingId ? { 
            ...booking, 
            status, 
            provider_notes: providerNotes || booking.provider_notes 
          } : booking
        ))
        toast({
          title: 'Success',
          description: `Booking ${status} successfully`,
        })
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      })
    }
  }

  // Handle cancellation dialog
  const handleCancelBooking = (booking: ProviderBooking) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => 
      isSameDay(parseISO(booking.scheduled_date), day)
    )
  }

  const getAvailabilityForDay = (day: Date) => {
    const dayOfWeek = day.getDay()
    // Convert Sunday (0) to 7 to match our database schema
    const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
    return availability.filter(avail => avail.day_of_week === dbDayOfWeek)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1))
  }

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
          <div className="grid grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Work Schedule</h2>
            <p className="text-gray-600">Manage your bookings and availability</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Manage Availability Button */}
            <Button
              onClick={() => router.push('/dashboard/manage-availability')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Availability
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigateWeek('prev')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Week
              </Button>
              
              <h3 className="text-lg font-semibold text-gray-900">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </h3>
              
              <Button
                variant="outline"
                onClick={() => navigateWeek('next')}
                className="flex items-center gap-2"
              >
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dayBookings = getBookingsForDay(day)
                const dayAvailability = getAvailabilityForDay(day)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[300px] border rounded-lg p-3 ${
                      isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="mb-3">
                      <div className={`text-sm font-medium ${
                        isCurrentDay ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {format(day, 'EEE')}
                      </div>
                      <div className={`text-lg font-bold ${
                        isCurrentDay ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                    </div>

                    {/* Availability Display */}
                    {dayAvailability.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Available:</div>
                        {dayAvailability.map((avail) => (
                          <div key={avail.id} className="text-xs text-gray-600 bg-green-100 px-2 py-1 rounded mb-1">
                            {avail.start_time} - {avail.end_time}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bookings */}
                    <div className="space-y-2">
                      {dayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`p-2 rounded text-xs border ${
                            booking.status === 'pending'
                              ? 'bg-yellow-50 border-yellow-200'
                              : booking.status === 'confirmed'
                              ? 'bg-green-50 border-green-200'
                              : booking.status === 'cancelled'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="font-medium text-gray-900 mb-1">
                            {booking.service_type}
                          </div>
                          <div className="text-gray-600 mb-1">
                            {booking.customer_name}
                          </div>
                          <div className="text-gray-500 mb-2">
                            {format(parseISO(booking.scheduled_date), 'h:mm a')}
                          </div>
                          <div className="flex items-center justify-between">
                            {getStatusBadge(booking.status)}
                            {booking.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="h-6 px-2 text-xs"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled', 'Declined by provider')}
                                  className="h-6 px-2 text-xs"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelBooking(booking)}
                                className="h-6 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Bookings</h3>
          
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings scheduled
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{booking.customer_name}</h4>
                          <p className="text-sm text-gray-600">{booking.customer_email}</p>
                          {booking.customer_phone && (
                            <p className="text-sm text-gray-600">{booking.customer_phone}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(booking.status)}
                        {booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled', 'Declined by provider')}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelBooking(booking)}
                            className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(parseISO(booking.scheduled_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(parseISO(booking.scheduled_date), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {booking.property_address}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-1">Service Type:</h5>
                      <p className="text-sm text-gray-600">{booking.service_type}</p>
                    </div>
                    
                    {booking.description && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <h5 className="font-medium text-gray-900 mb-1">Service Description:</h5>
                        <p className="text-gray-600 text-sm">{booking.description}</p>
                      </div>
                    )}

                    {booking.image_urls && booking.image_urls.length > 0 && (
                      <div className="mb-4">
                        <BookingImageGallery images={booking.image_urls} />
                      </div>
                    )}

                    {booking.provider_notes && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-1">Provider Notes:</h5>
                        <p className="text-blue-600 text-sm">{booking.provider_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

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
                <div>Homeowner: {selectedBooking.customer_name}</div>
                <div>Service: {selectedBooking.service_type}</div>
                <div>Date: {format(parseISO(selectedBooking.scheduled_date), 'MMM d, yyyy')}</div>
                <div>Time: {format(parseISO(selectedBooking.scheduled_date), 'h:mm a')}</div>
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