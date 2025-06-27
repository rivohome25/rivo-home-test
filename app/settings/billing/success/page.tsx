'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function BillingSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your subscription...')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      setStatus('error')
      setMessage('No session ID found. Please try again.')
      return
    }

    // The webhook should handle updating the user's plan automatically
    // We just need to show a success message and redirect
    const timer = setTimeout(() => {
      setStatus('success')
      setMessage('Your subscription has been activated successfully!')
      
      // Redirect to billing page after 3 seconds
      setTimeout(() => {
        router.push('/settings/billing')
      }, 3000)
    }, 2000)

    return () => clearTimeout(timer)
  }, [searchParams, router])

  const handleReturnToBilling = () => {
    router.push('/settings/billing')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircleIcon className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Processing Subscription'}
            {status === 'success' && 'Subscription Successful!'}
            {status === 'error' && 'Something went wrong'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                You will be redirected to your billing page in a few seconds...
              </p>
              <Button onClick={handleReturnToBilling}>
                Go to Billing Now
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <Button onClick={handleReturnToBilling} variant="outline">
              Return to Billing
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  )
} 