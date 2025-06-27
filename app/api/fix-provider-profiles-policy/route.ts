import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  // 1) Bind Supabase to the incoming cookies
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // 2) SQL to fix the policy
  const sqlFix = `
    -- Drop the policy if it exists (idempotent)
    DROP POLICY IF EXISTS "Provider can insert own profile" ON public.provider_profiles;
    
    -- Create the INSERT policy for provider_profiles
    CREATE POLICY "Provider can insert own profile"
      ON public.provider_profiles FOR INSERT
      WITH CHECK (user_id = auth.uid());
  `

  try {
    // 3) First try to execute the SQL directly (this might work if the RPC is not available)
    let result = await supabase.from('_temp_policy_fix').select('*').limit(1)
    if (result.error && result.error.message.includes('does not exist') && !result.error.message.includes('permission denied')) {
      // This error is expected, it means we can execute SQL but the table doesn't exist
      // Now try to create the policy
      const { error } = await supabase.rpc('pg_execute', { 
        sql_query: sqlFix 
      })
      
      if (error) {
        console.error('Error applying SQL fix with pg_execute:', error)
        // Try another variant of the RPC name
        const result2 = await supabase.rpc('exec_sql', { 
          sql_string: sqlFix 
        })
        
        if (result2.error) {
          console.error('Error applying SQL fix with exec_sql:', result2.error)
          return NextResponse.json({
            success: false, 
            error: 'Failed to execute SQL fix. Try applying the SQL directly in Supabase SQL Editor.',
            sql: sqlFix
          })
        }
      }
    }
    
    // 4) Return success
    return NextResponse.json({ 
      success: true,
      message: 'Provider profiles INSERT policy creation was attempted. Please check if the error is fixed.'
    })
  } catch (err: any) {
    console.error('Error:', err)
    return NextResponse.json({
      success: false, 
      error: err.message || 'Unknown error',
      sql: sqlFix
    })
  }
} 