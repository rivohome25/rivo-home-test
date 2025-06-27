'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, ChevronLeft, ChevronRight, User, Crown, AlertCircle } from 'lucide-react'
import { 
  getUserPlan, 
  canUserPerformAction, 
  getUpgradeMessage,
  type UserPlan 
} from '@/lib/getUserPlan'
import BookingImageUpload from '@/components/BookingImageUpload'

interface BookingCalendarProps {
  providerId: string
  providerName: string
  services: string[]
}

interface Slot {
  slot_start: string
  slot_end: string
}

interface SlotsByDate {
  [date: string]: Slot[]
}

export default function BookingCalendar({ providerId, providerName, services }: BookingCalendarProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<SlotsByDate>({})
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [bookingForm, setBookingForm] = useState({
    service_type: '',
    description: '',
    homeowner_notes: ''
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [canBook, setCanBook] = useState(false)
  const { toast } = useToast()

  // Check authentication status and load user plan
  useEffect(() => {
    const checkAuthAndPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      
      if (user) {
        const [planData, canCreateBooking] = await Promise.all([
          getUserPlan(),
          canUserPerformAction('create_booking')
        ])
        setUserPlan(planData)
        setCanBook(canCreateBooking)
      }
    }
    checkAuthAndPlan()
  }, [supabase])

  // Helper function to get start of week (Monday)
  function getWeekStart(date: Date): Date {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  // Generate week dates
  const getWeekDates = (weekStart: Date): Date[] => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeekStart)

  useEffect(() => {
    if (providerId) {
      loadAvailableSlots()
    }
  }, [providerId, currentWeekStart])

  const loadAvailableSlots = async () => {
    setLoading(true)
    try {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(currentWeekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const params = new URLSearchParams({
        provider_id: providerId,
        from: currentWeekStart.toISOString(),
        to: weekEnd.toISOString(),
        slot_mins: '30' // 30-minute slots
      })

      const response = await fetch(`/api/availability?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load available slots')
      }

      const responseData = await response.json()
      
      // Extract the slots array from the response
      const slotsArray = responseData.slots || []
      
      // Group slots by date
      const slotsByDate: SlotsByDate = {}
      slotsArray.forEach((slot: Slot) => {
        const date = slot.slot_start.split('T')[0] // Get date part (YYYY-MM-DD)
        if (!slotsByDate[date]) {
          slotsByDate[date] = []
        }
        slotsByDate[date].push(slot)
      })
      
      setAvailableSlots(slotsByDate)
    } catch (error) {
      console.error('Error loading slots:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load available time slots',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeekStart)
    setSelectedDate('')
    setSelectedSlot(null)
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const formatTime = (dateTimeString: string): string => {
    return new Date(dateTimeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDisplayDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString([], { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSlotSelect = (date: string, slot: Slot) => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to book an appointment',
        variant: 'destructive'
      })
      router.push('/auth/sign-in')
      return
    }

    if (!canBook) {
      const upgradeMsg = userPlan ? getUpgradeMessage(userPlan.name, 'bookings') : 'Upgrade to Premium to book appointments directly.';
      toast({
        title: 'Premium Required',
        description: upgradeMsg,
        variant: 'destructive'
      })
      return
    }

    setSelectedDate(date)
    setSelectedSlot(slot)
  }

  const bookSlot = async () => {
    if (!selectedSlot || !selectedDate || !bookingForm.service_type) {
      toast({
        title: 'Error',
        description: 'Please select a time slot and service type',
        variant: 'destructive'
      })
      return
    }

    if (!isAuthenticated) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to book an appointment',
        variant: 'destructive'
      })
      router.push('/auth/sign-in')
      return
    }

    // Double-check permission before booking
    const canBookNow = await canUserPerformAction('create_booking');
    if (!canBookNow) {
      const upgradeMsg = userPlan ? getUpgradeMessage(userPlan.name, 'bookings') : 'Upgrade to Premium to book appointments directly.';
      toast({
        title: 'Premium Required',
        description: upgradeMsg,
        variant: 'destructive'
      })
      return
    }

    setBooking(true)
    try {
      // Create FormData to handle both booking data and images
      const formData = new FormData()
      
      // Add booking data
      formData.append('provider_id', providerId)
      formData.append('slot_start', selectedSlot.slot_start)
      formData.append('slot_end', selectedSlot.slot_end)
      formData.append('service_type', bookingForm.service_type)
      formData.append('description', bookingForm.description || '')
      formData.append('homeowner_notes', bookingForm.homeowner_notes || '')
      
      // Add images if any
      selectedImages.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })
      formData.append('image_count', selectedImages.length.toString())

      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formData // Don't set Content-Type header, let browser set it with boundary
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment')
      }

      toast({
        title: 'Success',
        description: data.message || 'Appointment requested successfully! The provider will be notified.',
      })

      // Reset form and reload slots
      setSelectedDate('')
      setSelectedSlot(null)
      setBookingForm({ service_type: '', description: '', homeowner_notes: '' })
      setSelectedImages([])
      loadAvailableSlots()
    } catch (error: any) {
      console.error('Error booking slot:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to book appointment',
        variant: 'destructive'
      })
    } finally {
      setBooking(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book with {providerName}
          </CardTitle>
          <CardDescription>
            Select an available time slot to book your appointment
            {!isAuthenticated && (
              <span className="block text-orange-600 mt-1">
                Sign in required to book appointments
              </span>
            )}
            {isAuthenticated && !canBook && userPlan && (
              <span className="block text-amber-600 mt-1 flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Premium plan required for direct booking
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan upgrade warning for non-Premium users */}
          {isAuthenticated && !canBook && userPlan && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">
                      Premium Feature
                    </h3>
                    <p className="mt-1 text-sm text-amber-700">
                      {getUpgradeMessage(userPlan.name, 'bookings')}
                      <a href="/pricing" className="font-medium underline ml-1">
                        View Pricing Plans
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <div className="font-medium">
                {currentWeekStart.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </div>
              <div className="text-sm text-gray-600">
                Week of {currentWeekStart.toLocaleDateString()}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              Next Week
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-32 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDates.map((date) => {
                const dateString = formatDate(date)
                const slots = availableSlots[dateString] || []
                const isPast = date < today
                
                return (
                  <div key={dateString} className="space-y-2">
                    <div className={`text-center p-2 rounded-lg ${
                      selectedDate === dateString 
                        ? 'bg-blue-100 text-blue-800' 
                        : isPast 
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-gray-50'
                    }`}>
                      <div className="font-medium">{date.toLocaleDateString([], { weekday: 'short' })}</div>
                      <div className="text-sm">{date.getDate()}</div>
                    </div>
                    
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {slots.length > 0 ? (
                        slots.map((slot, index) => (
                          <Button
                            key={index}
                            variant={
                              selectedSlot?.slot_start === slot.slot_start && selectedDate === dateString
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="w-full text-xs py-1 h-auto"
                            onClick={() => handleSlotSelect(dateString, slot)}
                            disabled={isPast || !isAuthenticated || !canBook}
                          >
                            {formatTime(slot.slot_start)}
                            {!canBook && isAuthenticated && (
                              <Crown className="h-3 w-3 ml-1 text-amber-500" />
                            )}
                          </Button>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400 text-center py-2">
                          {isPast ? 'Past' : 'No slots'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Booking Form */}
          {selectedSlot && selectedDate && isAuthenticated && canBook && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Booking Details
                </CardTitle>
                <CardDescription>
                  Selected: {formatDisplayDate(selectedDate)} at {formatTime(selectedSlot.slot_start)} - {formatTime(selectedSlot.slot_end)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select 
                    value={bookingForm.service_type}
                    onValueChange={(value) => setBookingForm(prev => ({ ...prev, service_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you need help with..."
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or preferences..."
                    value={bookingForm.homeowner_notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, homeowner_notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Project Images (Optional)</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload photos to help the provider understand your project better. 
                    Maximum 5 images, 10MB each.
                  </p>
                  <BookingImageUpload
                    onImagesChange={setSelectedImages}
                    maxImages={5}
                    maxSizePerImage={10 * 1024 * 1024}
                    disabled={booking}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDate('')
                      setSelectedSlot(null)
                      setBookingForm({ service_type: '', description: '', homeowner_notes: '' })
                      setSelectedImages([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={bookSlot}
                    disabled={booking || !bookingForm.service_type}
                    className="flex-1"
                  >
                    {booking ? 'Booking...' : 'Request Appointment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sign-in prompt for unauthenticated users */}
          {selectedSlot && selectedDate && !isAuthenticated && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Sign In Required</span>
                </div>
                <p className="text-orange-700 mb-4">
                  Please sign in to complete your booking request for {formatDisplayDate(selectedDate)} at {formatTime(selectedSlot.slot_start)}
                </p>
                <Button onClick={() => router.push('/auth/sign-in')}>
                  Sign In to Book
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Premium upgrade prompt for non-Premium users */}
          {selectedSlot && selectedDate && isAuthenticated && !canBook && userPlan && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Premium Required</span>
                </div>
                <p className="text-amber-700 mb-4">
                  Direct booking for {formatDisplayDate(selectedDate)} at {formatTime(selectedSlot.slot_start)} requires a Premium plan. 
                  You're currently on the {userPlan.name} plan.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedDate('')
                      setSelectedSlot(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => router.push('/pricing')}>
                    Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 