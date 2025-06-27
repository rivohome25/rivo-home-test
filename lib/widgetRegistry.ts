export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: string;
  roles: ('homeowner' | 'provider' | 'admin')[];
  minTier: number;
}

export const widgetRegistry: WidgetDefinition[] = [
  // Homeowner widgets
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Shows recent home maintenance activities',
    component: '@/components/widgets/homeowner/RecentActivity',
    roles: ['homeowner'],
    minTier: 0
  },
  {
    id: 'maintenance-schedule',
    name: 'Maintenance Schedule',
    description: 'Displays upcoming maintenance tasks',
    component: '@/components/widgets/homeowner/MaintenanceSchedule',
    roles: ['homeowner'],
    minTier: 0
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Access to important home documents',
    component: '@/components/widgets/homeowner/Documents',
    roles: ['homeowner'],
    minTier: 0
  },
  {
    id: 'diy-library',
    name: 'DIY Library',
    description: 'Library of DIY maintenance guides',
    component: '@/components/widgets/homeowner/DIYLibrary',
    roles: ['homeowner'],
    minTier: 1
  },
  
  // Provider widgets
  {
    id: 'job-summary',
    name: 'Job Summary',
    description: 'Overview of job metrics and statistics',
    component: '@/components/widgets/provider/JobSummary',
    roles: ['provider'],
    minTier: 0
  },
  {
    id: 'lead-management',
    name: 'Lead Management',
    description: 'Manage new service requests',
    component: '@/components/widgets/provider/LeadManagement',
    roles: ['provider'],
    minTier: 0
  },
  {
    id: 'upcoming-jobs',
    name: 'Upcoming Jobs',
    description: 'Jobs scheduled in the next two weeks',
    component: '@/components/widgets/provider/UpcomingJobs',
    roles: ['provider'],
    minTier: 0
  },
  {
    id: 'recent-reviews',
    name: 'Recent Reviews',
    description: 'Customer reviews and feedback',
    component: '@/components/widgets/provider/RecentReviews',
    roles: ['provider'],
    minTier: 0
  },
  {
    id: 'active-jobs',
    name: 'Active Jobs',
    description: 'Current service jobs',
    component: '@/components/widgets/provider/ActiveJobs',
    roles: ['provider'],
    minTier: 0
  },
  {
    id: 'job-history',
    name: 'Job History',
    description: 'History of completed jobs',
    component: '@/components/widgets/provider/JobHistory',
    roles: ['provider'],
    minTier: 0
  },
  {
    id: 'earnings',
    name: 'Earnings',
    description: 'Financial summary',
    component: '@/components/widgets/provider/Earnings',
    roles: ['provider'],
    minTier: 0
  },
  
  // Admin widgets
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Manage all users',
    component: '@/components/widgets/admin/UserManagement',
    roles: ['admin'],
    minTier: 0
  },
  {
    id: 'provider-applications',
    name: 'Provider Applications',
    description: 'Review provider applications',
    component: '@/components/widgets/admin/ProviderApplications',
    roles: ['admin'],
    minTier: 0
  },
  {
    id: 'system-analytics',
    name: 'System Analytics',
    description: 'Platform analytics and metrics',
    component: '@/components/widgets/admin/SystemAnalytics',
    roles: ['admin'],
    minTier: 0
  }
]; 