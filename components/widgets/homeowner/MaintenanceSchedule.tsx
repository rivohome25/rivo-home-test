'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, formatDistanceToNow, parseISO, isToday, isTomorrow } from 'date-fns';
import { Calendar, CheckCircle, Clock, AlertTriangle, Home, TrendingUp, CalendarDays, Zap } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  property_address?: string;
}

export default function MaintenanceSchedule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch tasks due in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await supabase
        .from('view_user_tasks_with_details')
        .select('*')
        .not('due_date', 'is', null)
        .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .order('priority', { ascending: true }) // high priority first
        .limit(6); // Show 6 most relevant tasks
      
      if (error) {
        throw error;
      }
      
      setTasks(data as Task[]);
    } catch (err: any) {
      console.error('Error fetching maintenance schedule:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Trigger global modal
    window.dispatchEvent(new CustomEvent('openCompletionModal', {
      detail: {
        id: task.id,
        title: task.title,
        description: task.description
      }
    }));
  };

  const formatDueDate = (dueDateString: string) => {
    const dueDate = parseISO(dueDateString);
    
    if (isToday(dueDate)) {
      return { 
        text: 'Due today', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        urgency: 'critical',
        icon: AlertTriangle
      };
    } else if (isTomorrow(dueDate)) {
      return { 
        text: 'Due tomorrow', 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        urgency: 'high',
        icon: Clock
      };
    } else {
      const distance = formatDistanceToNow(dueDate, { addSuffix: true });
      const isPast = dueDate < new Date();
      
      if (isPast) {
        return { 
          text: `Overdue (${distance})`, 
          color: 'bg-red-100 text-red-800 border-red-200', 
          urgency: 'overdue',
          icon: AlertTriangle
        };
      } else {
        return { 
          text: `Due ${distance}`, 
          color: 'bg-green-100 text-green-800 border-green-200', 
          urgency: 'normal',
          icon: Calendar
        };
      }
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
          textColor: 'text-white',
          icon: Zap
        };
      case 'medium':
        return {
          bgColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          textColor: 'text-white',
          icon: TrendingUp
        };
      case 'low':
        return {
          bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
          textColor: 'text-white',
          icon: CheckCircle
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
          textColor: 'text-white',
          icon: CheckCircle
        };
    }
  };

  const getUrgencyCardStyle = (urgency: string) => {
    switch (urgency) {
      case 'critical':
      case 'overdue':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 hover:bg-orange-100';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  useEffect(() => {
    fetchTasks();

    // Listen for task completion events from the global modal
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      // Remove the completed task from the list
      setTasks(prev => prev.filter(task => task.id !== taskId));
    };

    window.addEventListener('taskCompleted', handleTaskCompleted as EventListener);

    return () => {
      window.removeEventListener('taskCompleted', handleTaskCompleted as EventListener);
    };
  }, []);

  if (error) {
    return (
      <div className="enterprise-kpi-card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Calendar className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-h3 text-gray-900">Maintenance Schedule</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200">Error loading schedule: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-kpi-card group">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-h3 text-gray-900 font-semibold">Maintenance Schedule</h2>
            <p className="text-sm text-gray-600">
              {tasks.filter(task => !task.completed).length === 0 ? 'All tasks complete' : `${tasks.filter(task => !task.completed).length} upcoming tasks`}
            </p>
          </div>
        </div>
        
        {tasks.filter(task => !task.completed).length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Next 30 days</span>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border-l-4 border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.filter(task => !task.completed).map((task, index) => {
            const dueDateInfo = formatDueDate(task.due_date);
            const priorityStyle = getPriorityStyle(task.priority);
            const cardStyle = getUrgencyCardStyle(dueDateInfo.urgency);
            const DueDateIcon = dueDateInfo.icon;
            const PriorityIcon = priorityStyle.icon;
            
            return (
              <div 
                key={task.id} 
                className={`group/task relative overflow-hidden rounded-xl border-l-4 ${cardStyle} border border-gray-200 p-5 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Task Content */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Calendar Icon */}
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 group-hover/task:shadow-md transition-shadow">
                      <DueDateIcon className={`h-6 w-6 ${
                        dueDateInfo.urgency === 'critical' || dueDateInfo.urgency === 'overdue' ? 'text-red-500' :
                        dueDateInfo.urgency === 'high' ? 'text-orange-500' :
                        'text-blue-500'
                      }`} />
                    </div>
                    
                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 group-hover/task:text-purple-600 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      
                      {/* Task Meta */}
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${dueDateInfo.color}`}>
                          <DueDateIcon className="h-3 w-3 mr-1" />
                          {dueDateInfo.text}
                        </span>
                        
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityStyle.bgColor} ${priorityStyle.textColor} shadow-sm`}>
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {task.priority.toUpperCase()}
                        </span>
                        
                        {task.property_address && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            <Home className="h-3 w-3 mr-1" />
                            {task.property_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Complete Button */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTaskComplete(task.id)}
                      className="opacity-0 group-hover/task:opacity-100 transition-all duration-200 p-3 text-green-600 hover:bg-green-50 rounded-lg hover:scale-110 border border-transparent hover:border-green-200"
                      title="Mark as complete"
                    >
                      <CheckCircle className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      dueDateInfo.urgency === 'critical' || dueDateInfo.urgency === 'overdue' ? 'bg-red-500' :
                      dueDateInfo.urgency === 'high' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.max(10, 
                        100 - (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) * 3
                      ))}%` 
                    }}
                  />
                </div>
                
                {/* Urgency Indicator */}
                {(dueDateInfo.urgency === 'critical' || dueDateInfo.urgency === 'overdue') && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Empty State */}
          {tasks.filter(task => !task.completed).length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">All scheduled tasks complete!</h4>
              <p className="text-gray-600 text-sm mb-4">Great job staying on top of your home maintenance.</p>
              <div className="inline-flex items-center text-sm text-green-600 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                You're ahead of schedule
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <a 
          href="/dashboard/my-schedule" 
          className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors group"
        >
          View full schedule
          <CalendarDays className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
} 