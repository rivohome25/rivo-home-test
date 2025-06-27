'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ONBOARDING_STEPS, getCompletionPercentage, type OnboardingProgress } from '@/lib/provider-onboarding-progress'

interface ProgressTrackerProps {
  currentStep?: number
  className?: string
}

export default function ProgressTracker({ currentStep, className = '' }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchProgress() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('provider_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching progress:', error)
          return
        }

        setProgress(data)
      } catch (error) {
        console.error('Error fetching progress:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [supabase])

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage(progress)
  const currentStepNumber = currentStep || progress?.current_step || 1

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Onboarding Progress</h3>
          <span className="text-sm font-medium text-blue-600">{completionPercentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(ONBOARDING_STEPS).map(([stepNum, stepInfo]) => {
          const stepNumber = parseInt(stepNum)
          const isCompleted = progress?.steps_completed?.[stepInfo.name] === true
          const isCurrent = stepNumber === currentStepNumber
          const isAccessible = stepNumber <= (progress?.current_step || 1)

          return (
            <div 
              key={stepNumber}
              className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                isCurrent ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : isCurrent 
                    ? 'bg-blue-100 text-blue-800'
                    : isAccessible
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-50 text-gray-400'
              }`}>
                {isCompleted ? '✓' : stepNumber}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isCompleted 
                    ? 'text-green-800' 
                    : isCurrent 
                      ? 'text-blue-800'
                      : isAccessible
                        ? 'text-gray-900'
                        : 'text-gray-400'
                }`}>
                  {stepInfo.title}
                </p>
              </div>

              {isCurrent && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {progress?.completed && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">
            🎉 Onboarding completed! Your application is under review.
          </p>
        </div>
      )}
    </div>
  )
} 