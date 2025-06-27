'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Clock, Trash2, CalendarDays, Save, ArrowLeft } from 'lucide-react'
import ProviderNavigationClient from '@/components/ProviderNavigationClient'


interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  buffer_mins: number
}

interface NewSlot {
  day_of_week: number
  start_time: string
  end_time: string
  buffer_mins: number
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export default function ManageAvailabilityPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSlot, setNewSlot] = useState<NewSlot>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    buffer_mins: 30
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUserAndAvailability()
  }, [])

  const loadUserAndAvailability = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('User authentication error:', userError)
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive',
        })
        router.push('/sign-in')
        return
      }

      setUser(currentUser)

      // Load availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', currentUser.id)
        .order('day_of_week', { ascending: true })

      if (availabilityError) {
        console.error('Error loading availability:', availabilityError)
        toast({
          title: 'Error',
          description: 'Failed to load availability',
          variant: 'destructive',
        })
      } else {
        setAvailability(availabilityData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load availability data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addAvailabilitySlot = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('provider_availability')
        .insert([{
          provider_id: user.id,
          ...newSlot
        }])
        .select()

      if (error) {
        console.error('Error adding availability slot:', error)
        toast({
          title: 'Error',
          description: `Failed to add availability slot: ${error.message}`,
          variant: 'destructive',
        })
      } else {
        setAvailability([...availability, ...(data || [])])
        setNewSlot({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          buffer_mins: 30
        })
        toast({
          title: 'Success',
          description: 'Availability slot added',
        })
      }
    } catch (error) {
      console.error('Error adding availability slot:', error)
      toast({
        title: 'Error',
        description: 'Failed to add availability slot',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteAvailabilitySlot = async (slotId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    try {
      const { error } = await supabase
        .from('provider_availability')
        .delete()
        .eq('id', slotId)
        .eq('provider_id', user.id) // Ensure user can only delete their own slots

      if (error) {
        console.error('Error deleting availability slot:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete availability slot',
          variant: 'destructive',
        })
      } else {
        setAvailability(availability.filter(slot => slot.id !== slotId))
        toast({
          title: 'Success',
          description: 'Availability slot deleted',
        })
      }
    } catch (error) {
      console.error('Error deleting availability slot:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete availability slot',
        variant: 'destructive',
      })
    }
  }

  const createQuickSchedule = async (type: 'weekdays' | 'weekends' | 'full-week') => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      let slotsToAdd: NewSlot[] = []

      switch (type) {
        case 'weekdays':
          slotsToAdd = [1, 2, 3, 4, 5].map(day => ({
            day_of_week: day,
            start_time: '09:00',
            end_time: '17:00',
            buffer_mins: 30
          }))
          break
        case 'weekends':
          slotsToAdd = [6, 7].map(day => ({
            day_of_week: day,
            start_time: '10:00',
            end_time: '16:00',
            buffer_mins: 30
          }))
          break
        case 'full-week':
          slotsToAdd = [1, 2, 3, 4, 5, 6, 7].map(day => ({
            day_of_week: day,
            start_time: '09:00',
            end_time: '17:00',
            buffer_mins: 30
          }))
          break
      }

      const slotsWithProviderId = slotsToAdd.map(slot => ({
        provider_id: user.id,
        ...slot
      }))

      const { data, error } = await supabase
        .from('provider_availability')
        .insert(slotsWithProviderId)
        .select()

      if (error) {
        console.error('Error saving quick schedule:', error)
        toast({
          title: 'Error',
          description: `Failed to save quick schedule: ${error.message}`,
          variant: 'destructive',
        })
      } else {
        setAvailability([...availability, ...(data || [])])
        toast({
          title: 'Success',
          description: `${type.replace('-', ' ')} schedule created`,
        })
      }
    } catch (error) {
      console.error('Error saving quick schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to save quick schedule',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const clearAllAvailability = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    try {
      const { error } = await supabase
        .from('provider_availability')
        .delete()
        .eq('provider_id', user.id) // Only delete current user's availability

      if (error) {
        console.error('Error clearing availability:', error)
        toast({
          title: 'Error',
          description: 'Failed to clear availability',
          variant: 'destructive',
        })
      } else {
        setAvailability([])
        toast({
          title: 'Success',
          description: 'All availability cleared',
        })
      }
    } catch (error) {
      console.error('Error clearing availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to clear availability',
        variant: 'destructive',
      })
    }
  }

  const getAvailabilityByDay = () => {
    const grouped: Record<number, AvailabilitySlot[]> = {}
    availability.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = []
      }
      grouped[slot.day_of_week].push(slot)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderNavigationClient 
          title="Manage Availability" 
          currentPage="my-schedule"
        />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  const availabilityByDay = getAvailabilityByDay()

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavigationClient 
        title="Manage Availability" 
        currentPage="my-schedule"
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Schedule
                </Button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Availability</h2>
              <p className="text-gray-600">Set your working hours and availability for bookings</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Schedule Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Quick Schedule Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button
                  onClick={() => createQuickSchedule('weekdays')}
                  disabled={saving}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-medium">Weekdays (Mon-Fri)</div>
                    <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
                  </div>
                </Button>

                <Button
                  onClick={() => createQuickSchedule('weekends')}
                  disabled={saving}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-medium">Weekends (Sat-Sun)</div>
                    <div className="text-sm text-gray-500">10:00 AM - 4:00 PM</div>
                  </div>
                </Button>

                <Button
                  onClick={() => createQuickSchedule('full-week')}
                  disabled={saving}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-medium">Full Week (Mon-Sun)</div>
                    <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
                  </div>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={clearAllAvailability}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Availability
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Custom Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Add Custom Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select
                    value={newSlot.day_of_week.toString()}
                    onValueChange={(value) => setNewSlot({...newSlot, day_of_week: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="buffer">Buffer Time (minutes)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    min="0"
                    max="120"
                    value={newSlot.buffer_mins}
                    onChange={(e) => setNewSlot({...newSlot, buffer_mins: parseInt(e.target.value) || 0})}
                    placeholder="30"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Time between bookings for travel/preparation
                  </p>
                </div>

                <Button 
                  onClick={addAvailabilitySlot}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Availability Slot
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Availability Display */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {availability.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No availability set</h3>
                <p className="text-gray-600">Add your working hours using the templates or custom slots above.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {DAYS_OF_WEEK.map(day => {
                  const daySlots = availabilityByDay[day.value] || []
                  return (
                    <div key={day.value} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{day.label}</h4>
                      {daySlots.length === 0 ? (
                        <p className="text-gray-500 text-sm">No availability</p>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                              <div className="flex items-center gap-4">
                                <span className="font-medium">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {slot.buffer_mins}min buffer
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteAvailabilitySlot(slot.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 