/**
 * User Plan Utility Functions
 * Provides functions to check user plan limits and permissions
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserPlan {
  name: string
  max_homes: number | null
  price: number
  unlimited_reminders: boolean
  report_access: boolean
  priority_support: boolean
}

export interface PlanLimits {
  properties: number | null // null = unlimited
  documents: number | null // null = unlimited
  canCreateBookings: boolean
}

/**
 * Get the current user's plan details
 */
export async function getUserPlan(): Promise<UserPlan | null> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_plans')
      .select(`
        plans (
          name,
          max_homes,
          price,
          unlimited_reminders,
          report_access,
          priority_support
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (error || !data?.plans) {
      // Default to Free plan if no plan assigned
      return {
        name: 'Free',
        max_homes: 1,
        price: 0,
        unlimited_reminders: false,
        report_access: false,
        priority_support: false
      }
    }

    return data.plans as UserPlan
  } catch (error) {
    console.error('Error fetching user plan:', error)
    return null
  }
}

/**
 * Check if user can perform a specific action based on their plan
 */
export async function canUserPerformAction(action: 'add_property' | 'upload_document' | 'create_booking'): Promise<boolean> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('can_user_perform_action', {
      user_uuid: user.id,
      action_type: action
    })

    if (error) {
      console.error('Error checking user permissions:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error checking user permissions:', error)
    return false
  }
}

/**
 * Get current usage counts for the user
 */
export async function getUserUsage(): Promise<{
  properties: number
  documents: number
} | null> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get properties count
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get documents count from storage
    const { data: documents } = await supabase.storage
      .from('documents')
      .list(user.id, { limit: 1000 })

    return {
      properties: propertiesCount || 0,
      documents: documents?.length || 0
    }
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return null
  }
}

/**
 * Get plan limits based on plan type
 */
export function getPlanLimits(plan: UserPlan): PlanLimits {
  switch (plan.name) {
    case 'Free':
      return {
        properties: 1,
        documents: 3,
        canCreateBookings: false
      }
    case 'Core':
      return {
        properties: 3,
        documents: 50,
        canCreateBookings: false
      }
    case 'Premium':
      return {
        properties: null, // unlimited
        documents: null, // unlimited
        canCreateBookings: true
      }
    default:
      return {
        properties: 1,
        documents: 3,
        canCreateBookings: false
      }
  }
}

/**
 * Get document limit for current user's plan
 */
export function getDocumentLimit(plan: UserPlan): number | null {
  const limits = getPlanLimits(plan)
  return limits.documents
}

/**
 * Check if user has reached their plan limit for a specific resource
 */
export async function hasReachedLimit(resource: 'properties' | 'documents'): Promise<boolean> {
  const [plan, usage] = await Promise.all([
    getUserPlan(),
    getUserUsage()
  ])

  if (!plan || !usage) return true // Err on the side of caution

  const limits = getPlanLimits(plan)
  
  switch (resource) {
    case 'properties':
      return limits.properties !== null && usage.properties >= limits.properties
    case 'documents':
      return limits.documents !== null && usage.documents >= limits.documents
    default:
      return false
  }
}

/**
 * Get upgrade message for when user hits a limit
 */
export function getUpgradeMessage(currentPlan: string, limitType: 'properties' | 'documents' | 'bookings'): string {
  switch (limitType) {
    case 'properties':
      if (currentPlan === 'Free') {
        return 'Upgrade to Core to manage up to 3 properties, or Premium for unlimited properties.'
      }
      return 'Upgrade to Premium for unlimited properties.'
    
    case 'documents':
      if (currentPlan === 'Free') {
        return 'Upgrade to Core for 50 documents, or Premium for unlimited document storage.'
      }
      return 'Upgrade to Premium for unlimited document storage.'
    
    case 'bookings':
      return 'Upgrade to Premium to book services directly through RivoHome.'
    
    default:
      return 'Upgrade your plan to access this feature.'
  }
} 