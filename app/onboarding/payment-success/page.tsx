'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPaymentAndContinueOnboarding = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setError('No payment session found. Redirecting to onboarding...');
          setTimeout(() => router.push('/onboarding?step=2'), 3000);
          return;
        }

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError('Authentication error. Please sign in again.');
          setTimeout(() => router.push('/sign-in'), 3000);
          return;
        }

        // Verify payment was successful by checking user_plans
        // The webhook should have already updated the user's plan
        let retries = 0;
        const maxRetries = 10; // Wait up to 10 seconds for webhook processing
        
        while (retries < maxRetries) {
          const { data: userPlan, error: planError } = await supabase
            .from('user_plans')
            .select(`
              plan_id,
              subscription_status,
              stripe_subscription_id,
              plans (
                name,
                price
              )
            `)
            .eq('user_id', user.id)
            .single();

          if (planError && planError.code !== 'PGRST116') {
            console.error('Error checking user plan:', planError);
            setError('Error verifying payment. Please contact support.');
            return;
          }

          // Check if payment was processed (subscription_status should be 'active' for paid plans)
          if (userPlan && userPlan.subscription_status === 'active' && userPlan.stripe_subscription_id) {
            // Payment successful! Update onboarding to continue to step 3
            const { error: onboardingError } = await supabase
              .from('user_onboarding')
              .upsert({ 
                user_id: user.id, 
                current_step: 3 
              }, { 
                onConflict: ['user_id'] 
              });

            if (onboardingError) {
              console.error('Error updating onboarding:', onboardingError);
              setError('Payment successful, but error updating onboarding. Please contact support.');
              return;
            }

            setSuccess(true);
            setLoading(false);
            
            // Redirect to onboarding step 3 after showing success message
            setTimeout(() => {
              router.push('/onboarding');
            }, 3000);
            return;
          }

          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }

        // If we get here, payment verification timed out
        setError('Payment verification is taking longer than expected. Please check your billing settings or contact support.');
        
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError('Error verifying payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyPaymentAndContinueOnboarding();
  }, [searchParams, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
          <p className="text-gray-600">
            Please wait while we confirm your payment and set up your account...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/onboarding?step=2')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Plan Selection
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your subscription has been activated. Continuing with your onboarding...
          </p>
          <div className="animate-pulse text-blue-600">
            Redirecting in a few seconds...
          </div>
        </div>
      </div>
    );
  }

  return null;
} 