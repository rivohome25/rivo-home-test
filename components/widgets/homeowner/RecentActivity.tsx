'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { CheckCircle, Activity, Award, TrendingUp, Calendar, Home, Zap } from 'lucide-react';

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  completed_at: string;
  priority: 'high' | 'medium' | 'low';
  property_address?: string;
}

export default function RecentActivity() {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchRecentActivity = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch recently completed tasks (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('view_user_tasks_with_details')
        .select('*')
        .eq('completed', true)
        .not('completed_at', 'is', null)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(5); // Show 5 most recent completed tasks
      
      if (error) {
        throw error;
      }
      
      setCompletedTasks(data as CompletedTask[]);
    } catch (err: any) {
      console.error('Error fetching recent activity:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: Zap
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: TrendingUp
        };
      case 'low':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: CheckCircle
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: CheckCircle
        };
    }
  };

  const getCompletionBadge = (priority: string, index: number) => {
    if (index === 0) {
      return { text: 'Latest', color: 'bg-green-500 text-white', icon: Award };
    }
    if (priority === 'high') {
      return { text: 'High Impact', color: 'bg-red-500 text-white', icon: Zap };
    }
    return null;
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  if (error) {
    return (
      <div className="enterprise-kpi-card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Activity className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-h3 text-gray-900">Recent Activity</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200">Error loading activity: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-kpi-card group">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-h3 text-gray-900 font-semibold">Recent Activity</h2>
            <p className="text-sm text-gray-600">
              {completedTasks.length === 0 ? 'No recent completions' : `${completedTasks.length} tasks completed`}
            </p>
          </div>
        </div>
        
        {completedTasks.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          {completedTasks.length > 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-green-300 to-green-100"></div>
          )}
          
          {/* Activity Items */}
          <div className="space-y-4">
            {completedTasks.map((task, index) => {
              const priorityStyle = getPriorityStyle(task.priority);
              const badge = getCompletionBadge(task.priority, index);
              const PriorityIcon = priorityStyle.icon;
              
              return (
                <div 
                  key={task.id} 
                  className="relative group/activity"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Timeline Node */}
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover/activity:scale-110 transition-transform duration-200">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      {badge && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                          <Award className="h-3 w-3 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    
                    {/* Activity Content */}
                    <div className="flex-1 min-w-0 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group-hover/activity:translate-y-[-1px]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 group-hover/activity:text-green-600 transition-colors">
                              {task.title}
                            </h4>
                            {badge && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                <badge.icon className="h-3 w-3 mr-1" />
                                {badge.text}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                          
                          {/* Task Meta */}
                          <div className="flex items-center flex-wrap gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityStyle.bgColor} ${priorityStyle.textColor}`}>
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {task.priority.toUpperCase()}
                            </span>
                            
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(parseISO(task.completed_at), { addSuffix: true })}
                            </span>
                            
                            {task.property_address && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                <Home className="h-3 w-3 mr-1" />
                                {task.property_address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Completion Indicator */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover/activity:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Empty State */}
          {completedTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Activity className="h-10 w-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h4>
              <p className="text-gray-600 text-sm mb-4">Complete some maintenance tasks to see your activity here.</p>
              <div className="inline-flex items-center text-sm text-gray-500 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                Start completing tasks to build your timeline
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <a 
          href="/dashboard/my-schedule" 
          className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors group"
        >
          View all completed tasks
          <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
} 