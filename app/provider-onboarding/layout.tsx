'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

// Define our onboarding steps
const STEPS = [
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'services-offered', label: 'Services Offered' },
  { id: 'documents-upload', label: 'Documents' },
  { id: 'business-profile', label: 'Bio & Logo' },
  { id: 'external-reviews', label: 'External Reviews' },
  { id: 'background-check-consent', label: 'Background Check' },
  { id: 'agreements', label: 'Agreements' },
  { id: 'awaiting-review', label: 'Review' },
]

export default function ProviderOnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  
  // Extract current step from path
  useEffect(() => {
    const currentPath = pathname.split('/').pop()
    const currentIdx = STEPS.findIndex(step => step.id === currentPath)
    if (currentIdx >= 0) {
      setCurrentStepIdx(currentIdx)
    }
  }, [pathname])
  
  // Skip stepper for /pending page
  const isPendingPage = pathname === '/provider-onboarding/pending'
  
  // Don't show stepper on pending page
  if (isPendingPage) {
    return <>{children}</>
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Provider Registration
          </h1>
          <SignOutButton variant="link" showIcon={true} className="text-gray-600 hover:text-gray-800" />
        </div>
        
        {/* Stepper */}
        <div className="mb-12 overflow-x-auto pb-2">
          <div className="flex items-center min-w-max">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                {/* Line connector (not for first step) */}
                {idx > 0 && (
                  <div 
                    className={`w-12 h-1 ${
                      idx < currentStepIdx 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                )}
                
                {/* Step circle */}
                <div 
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full 
                    ${idx < currentStepIdx
                      ? 'bg-blue-500 text-white'
                      : idx === currentStepIdx
                        ? 'border-2 border-blue-500 text-blue-500'
                        : 'bg-gray-300 text-gray-700'
                    }
                  `}
                >
                  {idx < currentStepIdx ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                
                {/* Step label */}
                <span 
                  className={`ml-2 text-sm whitespace-nowrap ${
                    idx === currentStepIdx 
                      ? 'font-medium text-blue-500' 
                      : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {children}
        </div>
      </div>
    </div>
  )
} 