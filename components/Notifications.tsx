'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from './ui/use-toast';
import { Loader2, Bell, AlertTriangle, Info, CheckCircle, AlertCircle, X, BellRing } from 'lucide-react';

interface Notification { 
  id: string;
  title: string;
  message: string;
  notification_type: string;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string|undefined>();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_unread_notifications')
        .select(`id, title, message, notification_type, created_at`);
      
      if (error) {
        console.error('❌ Notifications error:', error);
        setErrorMsg(error.message);
      } else {
        setNotifications(data as Notification[]);
      }
    } catch (error: any) {
      console.error('❌ Notifications error:', error);
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    // Prevent multiple actions at once
    if (actionInProgress) return;
    
    setActionInProgress(id);
    
    // Optimistically update UI
    setNotifications(prevNotifications => 
      prevNotifications.filter(n => n.id !== id)
    );
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Notification marked as read",
        description: "The notification has been removed from your list.",
      });
      
      // Re-fetch notifications to ensure the list is up-to-date
      await fetchNotifications();
      
    } catch (error: any) {
      console.error('❌ Mark as read error:', error);
      
      // Restore the list on error
      fetchNotifications();
      
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          accentColor: 'border-l-green-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          accentColor: 'border-l-yellow-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          accentColor: 'border-l-red-500'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          accentColor: 'border-l-blue-500'
        };
    }
  };

  if (errorMsg) {
    return (
      <div className="enterprise-kpi-card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-h3 text-gray-900">Notifications</h3>
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
          <div className="relative p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Bell className="h-6 w-6 text-white" />
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{notifications.length}</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-h3 text-gray-900 font-semibold">Notifications</h3>
            <p className="text-sm text-gray-600">
              {notifications.length === 0 ? 'All caught up' : `${notifications.length} unread`}
            </p>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <BellRing className="h-4 w-4" />
            <span className="hidden sm:inline">Recent alerts</span>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Notifications List */}
      {!isLoading && (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const style = getNotificationStyle(notification.notification_type);
            const NotificationIcon = style.icon;
            
            return (
              <div 
                key={notification.id}
                className={`group/notification relative overflow-hidden rounded-xl border-l-4 ${style.accentColor} ${style.bgColor} border ${style.borderColor} p-4 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-3">
                  {/* Notification Icon */}
                  <div className={`p-2 rounded-lg ${style.bgColor.replace('bg-', 'bg-').replace('-50', '-100')}`}>
                    <NotificationIcon className={`h-5 w-5 ${style.iconColor}`} />
                  </div>
                  
                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover/notification:text-rivo-600 transition-colors">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {/* Timestamp */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                      </span>
                      
                      {/* Mark as Read Button */}
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        disabled={actionInProgress === notification.id}
                        className="opacity-0 group-hover/notification:opacity-100 transition-all duration-200 inline-flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionInProgress === notification.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Reading...</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" />
                            <span>Mark read</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Notification Type Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    notification.notification_type === 'success' ? 'bg-green-100 text-green-700' :
                    notification.notification_type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    notification.notification_type === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {notification.notification_type.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Empty State */}
          {notifications.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
              <p className="text-gray-600 text-sm">No unread notifications at the moment.</p>
              <div className="mt-3 inline-flex items-center text-sm text-green-600 font-medium">
                <Bell className="h-4 w-4 mr-1" />
                You're up to date
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 