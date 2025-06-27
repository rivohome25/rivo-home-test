/**
 * Provider Onboarding Progress Tracking Utilities
 * 
 * This module provides utilities for tracking and managing provider onboarding progress
 * through the 9-step onboarding flow.
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface OnboardingProgress {
  user_id: string
  current_step: number
  completed: boolean
  steps_completed: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface StepMapping {
  [key: number]: {
    name: string
    path: string
    title: string
  }
}

// Define the 7 steps of provider onboarding (not 9)
export const ONBOARDING_STEPS: StepMapping = {
  1: { name: 'basic-info', path: '/provider-onboarding/basic-info', title: 'Basic Information' },
  2: { name: 'services-offered', path: '/provider-onboarding/services-offered', title: 'Services Offered' },
  3: { name: 'documents-upload', path: '/provider-onboarding/documents-upload', title: 'Documents Upload' },
  4: { name: 'business-profile', path: '/provider-onboarding/business-profile', title: 'Business Profile' },
  5: { name: 'external-reviews', path: '/provider-onboarding/external-reviews', title: 'External Reviews' },
  6: { name: 'background-check-consent', path: '/provider-onboarding/background-check-consent', title: 'Background Check Consent' },
  7: { name: 'agreements', path: '/provider-onboarding/agreements', title: 'Agreements' }
}

export const TOTAL_STEPS = 7

/**
 * Get the current onboarding progress for a user
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data, error } = await supabase
    .from('provider_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching onboarding progress:', error)
    return null
  }

  return data
}

/**
 * Initialize onboarding progress for a new provider
 */
export async function initializeOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data, error } = await supabase
    .from('provider_onboarding')
    .upsert({
      user_id: userId,
      current_step: 1,
      completed: false,
      steps_completed: {}
    })
    .select()
    .single()

  if (error) {
    console.error('Error initializing onboarding progress:', error)
    return null
  }

  return data
}

/**
 * Update onboarding progress to the next step
 */
export async function updateOnboardingProgress(
  userId: string, 
  stepNumber: number, 
  stepCompleted: boolean = true
): Promise<OnboardingProgress | null> {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current progress
  const currentProgress = await getOnboardingProgress(userId)
  
  if (!currentProgress) {
    // Initialize if not exists
    await initializeOnboardingProgress(userId)
  }

  // Update steps_completed object
  const stepsCompleted = currentProgress?.steps_completed || {}
  if (stepCompleted) {
    const stepName = ONBOARDING_STEPS[stepNumber]?.name
    if (stepName) {
      stepsCompleted[stepName] = true
    }
  }

  // Determine next step and completion status
  const nextStep = stepCompleted && stepNumber < TOTAL_STEPS ? stepNumber + 1 : stepNumber
  const isCompleted = stepNumber === TOTAL_STEPS && stepCompleted  // Only complete when finishing final step

  console.log(`📊 Updating progress: Step ${stepNumber} completed=${stepCompleted}, nextStep=${nextStep}, isCompleted=${isCompleted}`)

  const { data, error } = await supabase
    .from('provider_onboarding')
    .upsert({
      user_id: userId,
      current_step: nextStep,
      completed: isCompleted,
      steps_completed: stepsCompleted,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating onboarding progress:', error)
    return null
  }

  return data
}

/**
 * Mark a specific step as completed without advancing to next step
 */
export async function markStepCompleted(
  userId: string, 
  stepNumber: number
): Promise<OnboardingProgress | null> {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current progress
  let currentProgress = await getOnboardingProgress(userId)
  
  if (!currentProgress) {
    // Initialize if not exists
    currentProgress = await initializeOnboardingProgress(userId)
    if (!currentProgress) return null
  }

  // Update steps_completed object
  const stepsCompleted = { ...currentProgress.steps_completed }
  const stepName = ONBOARDING_STEPS[stepNumber]?.name
  if (stepName) {
    stepsCompleted[stepName] = true
  }

  const { data, error } = await supabase
    .from('provider_onboarding')
    .update({
      steps_completed: stepsCompleted,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error marking step as completed:', error)
    return null
  }

  return data
}

/**
 * Get the next step URL based on current progress
 */
export function getNextStepUrl(progress: OnboardingProgress | null): string {
  if (!progress) {
    return ONBOARDING_STEPS[1].path
  }

  if (progress.completed) {
    return '/provider-onboarding/pending'
  }

  const stepInfo = ONBOARDING_STEPS[progress.current_step]
  return stepInfo ? stepInfo.path : ONBOARDING_STEPS[1].path
}

/**
 * Check if a specific step is completed
 */
export function isStepCompleted(progress: OnboardingProgress | null, stepNumber: number): boolean {
  if (!progress) return false
  
  const stepName = ONBOARDING_STEPS[stepNumber]?.name
  if (!stepName) return false
  
  return progress.steps_completed[stepName] === true
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(progress: OnboardingProgress | null): number {
  if (!progress) return 0
  
  const completedSteps = Object.values(progress.steps_completed).filter(Boolean).length
  return Math.round((completedSteps / TOTAL_STEPS) * 100)
}

/**
 * Validate that the user can access a specific step and redirect if needed
 * This should be called at the beginning of each step page
 */
export async function validateStepAccess(userId: string, targetStepNumber: number): Promise<string | null> {
  // Get current progress
  const progress = await getOnboardingProgress(userId)
  
  // If no progress exists, they should start at step 1
  if (!progress) {
    if (targetStepNumber === 1) {
      return null // They can access step 1
    }
    return '/provider-onboarding/basic-info' // Redirect to step 1
  }
  
  // If onboarding is completed, redirect to pending
  if (progress.completed) {
    return '/provider-onboarding/pending'
  }
  
  // If they're trying to access a step beyond their current progress, redirect to current step
  if (targetStepNumber > progress.current_step) {
    const stepInfo = ONBOARDING_STEPS[progress.current_step]
    return stepInfo ? stepInfo.path : '/provider-onboarding/basic-info'
  }
  
  // They can access this step
  return null
}

/**
 * Validate that the user can access a specific step
 */
export function canAccessStep(progress: OnboardingProgress | null, stepNumber: number): boolean {
  if (!progress) return stepNumber === 1
  
  // Can always access current step or any previous step
  return stepNumber <= progress.current_step
} 