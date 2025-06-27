'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Home, CheckCircle2, Clock, AlertCircle, List, Grid } from 'lucide-react'
import HomeownerNavigationClient from '@/components/HomeownerNavigationClient'
import ProviderNavigationClient from '@/components/ProviderNavigationClient'
import ProviderScheduleView from '@/components/ProviderScheduleView'
import TaskCalendar from '@/components/TaskCalendar'
import { format, differenceInDays, isAfter, isBefore, isToday } from 'date-fns'
import { Badge } from '@/components/ui/badge'


interface UserTask {
  id: string
  task_name: string
  task_description: string
  completed: boolean
  due_date: string
  property_address: string
  property_type: string
  region: string
}

interface UserProfile {
  id: string
  role: string
  is_admin: boolean
}

export default function MySchedulePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  const [tasks, setTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('upcoming')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isProvider, setIsProvider] = useState(false)

  useEffect(() => {
    loadUserProfileAndData()
  }, [])

  const loadUserProfileAndData = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('User authentication error:', userError)
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive',
        })
        router.push('/sign-in')
        return
      }

      // Check if user is a provider by looking for provider profile
      const { data: providerProfile, error: providerError } = await supabase
        .from('provider_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (providerProfile && !providerError) {
        // User is a provider
        setIsProvider(true)
      } else {
        // User is a homeowner, load homeowner tasks
        setIsProvider(false)
        await loadTasks()
      }

      // Get user profile for additional role information if needed
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role, is_admin')
        .eq('id', user.id)
        .single()

      if (!profileError && profileData) {
        setUserProfile(profileData)
      }

    } catch (error) {
      console.error('Error loading user profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('view_user_tasks_with_details')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) {
        console.error('Error loading tasks:', error)
        toast({
          title: 'Error',
          description: 'Failed to load maintenance tasks',
          variant: 'destructive',
        })
      } else {
        setTasks(data || [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load maintenance tasks',
        variant: 'destructive',
      })
    }
  }

  const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId)

      if (error) {
        console.error('Error updating task:', error)
        toast({
          title: 'Error',
          description: 'Failed to update task',
          variant: 'destructive',
        })
      } else {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        ))
        toast({
          title: 'Success',
          description: !currentStatus ? 'Task marked as complete' : 'Task marked as incomplete',
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      })
    }
  }

  const getTaskStatus = (task: UserTask) => {
    if (task.completed) return 'completed'
    
    const dueDate = new Date(task.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    if (isBefore(dueDate, today)) return 'overdue'
    if (isToday(dueDate)) return 'due-today'
    
    const daysUntilDue = differenceInDays(dueDate, today)
    if (daysUntilDue <= 7) return 'due-soon'
    
    return 'upcoming'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      case 'due-today':
        return <Badge className="bg-orange-500">Due Today</Badge>
      case 'due-soon':
        return <Badge className="bg-yellow-500">Due Soon</Badge>
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const filteredTasks = tasks.filter(task => {
    const status = getTaskStatus(task)
    switch (filter) {
      case 'upcoming':
        return !task.completed && status !== 'overdue'
      case 'overdue':
        return status === 'overdue'
      case 'completed':
        return task.completed
      default:
        return true
    }
  })

  const taskCounts = {
    all: tasks.length,
    upcoming: tasks.filter(t => !t.completed && getTaskStatus(t) !== 'overdue').length,
    overdue: tasks.filter(t => getTaskStatus(t) === 'overdue').length,
    completed: tasks.filter(t => t.completed).length,
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

  // If user is a provider, show the provider schedule view
  if (isProvider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderNavigationClient 
          title="My Work Schedule" 
          currentPage="my-schedule"
        />
        <ProviderScheduleView />
      </div>
    )
  }

  // Default homeowner view
  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient 
        title="My Maintenance Schedule" 
        currentPage="my-schedule"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Tasks</h2>
              <p className="text-gray-600">Keep your home in top condition with regular maintenance</p>
            </div>
            
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
                <List className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Task Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', 'upcoming', 'overdue', 'completed'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-rivo-base text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)} ({taskCounts[filterType]})
              </button>
            ))}
          </div>

          {viewMode === 'calendar' ? (
            <div className="mt-6">
              <TaskCalendar />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {filter} tasks
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? "You don't have any maintenance tasks scheduled yet."
                      : `No ${filter} tasks at the moment.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredTasks.map((task) => {
                    const status = getTaskStatus(task)
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                          task.completed
                            ? 'bg-green-50 border-green-200'
                            : status === 'overdue'
                            ? 'bg-red-50 border-red-200'
                            : status === 'due-today'
                            ? 'bg-orange-50 border-orange-200'
                            : status === 'due-soon'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTaskComplete(task.id, task.completed)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-lg font-medium ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.task_name}
                              </h4>
                              <p className={`text-sm mt-1 ${
                                task.completed ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {task.task_description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Home className="h-4 w-4 mr-1" />
                                  {task.property_address}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 