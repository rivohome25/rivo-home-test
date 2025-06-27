'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import NewTaskModal from './NewTaskModal';
import { useToast } from './ui/use-toast';
import { Check, Trash2, Clock, AlertTriangle, Calendar, TrendingUp, Plus } from 'lucide-react';

interface Task { 
  id: string;
  title: string; 
  description: string; 
  due_date: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  property_address?: string;
  task_type?: 'maintenance' | 'custom';
}

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string|undefined>();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Fetch maintenance tasks from view_user_tasks_with_details
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('view_user_tasks_with_details')
        .select('*')
        .eq('completed', false)
        .not('due_date', 'is', null)
        .gte('due_date', new Date().toISOString().split('T')[0]); // Today or future
      
      if (maintenanceError) {
        console.error('❌ Maintenance tasks error:', maintenanceError);
        throw maintenanceError;
      }

      // Fetch custom tasks from tasks table
      const { data: customTasks, error: customError } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .not('due_date', 'is', null)
        .gte('due_date', new Date().toISOString().split('T')[0]); // Today or future

      if (customError) {
        console.error('❌ Custom tasks error:', customError);
        throw customError;
      }

      // Combine and normalize both types of tasks
      const allTasks: Task[] = [
        // Maintenance tasks
        ...(maintenanceTasks || []).map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          completed: task.completed,
          priority: task.priority || 'medium',
          property_address: task.property_address,
          task_type: 'maintenance' as const
        })),
        // Custom tasks
        ...(customTasks || []).map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          due_date: task.due_date?.split('T')[0] || task.due_date, // Convert to date format
          completed: task.status === 'completed',
          priority: 'medium' as const, // Default priority for custom tasks
          property_address: undefined,
          task_type: 'custom' as const
        }))
      ];

      // Sort by due date and limit to 5
      const sortedTasks = allTasks
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5);

      setTasks(sortedTasks);
    } catch (error: any) {
      console.error('❌ UpcomingTasks error:', error);
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (taskId: string) => {
    // Don't allow multiple actions at once
    if (actionInProgress) return;
    
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
  
  const handleDelete = async (taskId: string) => {
    // Don't allow multiple actions at once
    if (actionInProgress) return;
    
    setActionInProgress(taskId);
    
    // Find the task to determine which table to delete from
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      setActionInProgress(null);
      return;
    }
    
    // Optimistically update UI
    setTasks((prevTasks) => prevTasks.filter(task => task.id !== taskId));
    
    try {
      let deleteError;
      
      if (task.task_type === 'custom') {
        // Delete from tasks table
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
        deleteError = error;
      } else {
        // Delete from user_tasks table
        const { error } = await supabase
          .from('user_tasks')
          .delete()
          .eq('id', taskId);
        deleteError = error;
      }
      
      if (deleteError) {
        throw deleteError;
      }
      
      toast({
        title: "Task deleted",
        description: "The task has been removed.",
      });
      
    } catch (error: any) {
      console.error('❌ Delete task error:', error);
      
      // Revert optimistic update on error
      fetchTasks();
      
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const getTaskUrgency = (dueDate: string) => {
    const due = parseISO(dueDate);
    if (isPast(due) && !isToday(due)) {
      return { level: 'overdue', color: 'border-red-500 bg-red-50', icon: AlertTriangle, iconColor: 'text-red-500' };
    } else if (isToday(due)) {
      return { level: 'today', color: 'border-orange-500 bg-orange-50', icon: Clock, iconColor: 'text-orange-500' };
    } else if (isTomorrow(due)) {
      return { level: 'tomorrow', color: 'border-yellow-500 bg-yellow-50', icon: Calendar, iconColor: 'text-yellow-500' };
    } else {
      return { level: 'upcoming', color: 'border-blue-500 bg-blue-50', icon: TrendingUp, iconColor: 'text-blue-500' };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md';
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  useEffect(() => {
    fetchTasks();

    // Listen for task completion events from the global modal
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      // Optimistically remove the completed task from the list
      setTasks((prevTasks) => prevTasks.filter(task => task.id !== taskId));
    };

    window.addEventListener('taskCompleted', handleTaskCompleted as EventListener);

    return () => {
      window.removeEventListener('taskCompleted', handleTaskCompleted as EventListener);
    };
  }, []);

  if (errorMsg) {
    return (
      <div className="enterprise-kpi-card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-h3 text-gray-900">Upcoming Tasks</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-kpi-card group">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-rivo-500 to-rivo-600 rounded-xl shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-h2 text-gray-900 font-semibold">Upcoming Tasks</h3>
            <p className="text-sm text-gray-600">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} requiring attention
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>Priority sorted</span>
          </div>
          <NewTaskModal onSuccess={fetchTasks} />
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Tasks List */}
      {!isLoading && (
        <div className="space-y-4">
          {tasks.map((task, index) => {
            const urgency = getTaskUrgency(task.due_date);
            const UrgencyIcon = urgency.icon;
            
            return (
              <div 
                key={task.id} 
                className={`group/task relative overflow-hidden rounded-xl border-l-4 ${urgency.color} bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-1px]`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Task Content */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Urgency Indicator */}
                    <div className={`p-2 rounded-lg ${urgency.color.replace('bg-', 'bg-').replace('-50', '-100')}`}>
                      <UrgencyIcon className={`h-5 w-5 ${urgency.iconColor}`} />
                    </div>
                    
                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 group-hover/task:text-rivo-600 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      
                      {/* Task Meta */}
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyle(task.priority)}`}>
                          {task.priority.toUpperCase()} PRIORITY
                        </span>
                        
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Due {formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
                        </span>
                        
                        {task.property_address && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Calendar className="h-3 w-3 mr-1" />
                            {task.property_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover/task:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={actionInProgress === task.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                      title="Mark as complete"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={actionInProgress === task.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                      title="Delete task"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      urgency.level === 'overdue' ? 'bg-red-500' :
                      urgency.level === 'today' ? 'bg-orange-500' :
                      urgency.level === 'tomorrow' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(20, 100 - (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) * 10)}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          {/* Empty State */}
          {tasks.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
              <p className="text-gray-600 mb-4">No upcoming tasks. Great job on staying on top of your home maintenance.</p>
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
          className="inline-flex items-center text-sm font-medium text-rivo-600 hover:text-rivo-700 transition-colors group"
        >
          View all tasks
          <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
} 