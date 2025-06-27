import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { validateStepAccess } from '@/lib/provider-onboarding-progress'
import BasicInfoForm from './BasicInfoForm'

export default async function BasicInfoStep() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get the current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/sign-in')
  }

  // Validate step access
  const redirectUrl = await validateStepAccess(user.id, 1)
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return <BasicInfoForm />
} 