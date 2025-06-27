import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * Delete account API endpoint
 * This endpoint deletes a user's account from Supabase authentication
 * and all associated data through database cascading deletion
 */
export const runtime = 'nodejs'

export async function DELETE(req: Request) {
  // 1) user-bound client (for fetching the session)
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Output what URLs/keys we're using for debugging
  console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined')
  console.log('Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined')

  // 2) admin client, built from your service_role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )

  // 3) get the logged-in user
  const { data: { user }, error: userErr } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 4) call the Admin API to delete that user
  const userId = user.id
  console.log('Attempting to delete user:', userId)
  
  try {
    // First, delete the user's profile data to handle cascading deletions
    console.log('Deleting profile data first...')
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    // Next, ensure user is signed out everywhere
    console.log('Signing out user from all sessions...')
    await supabaseAdmin.auth.admin.signOut(userId)
    
    // Delete from auth.users using low-level SQL
    console.log('Attempting low-level SQL deletion...')
    // Cast the user_id parameter to UUID explicitly to fix type mismatch
    const { error: sqlErr } = await supabaseAdmin.rpc('admin_delete_user', { 
      user_id: userId 
    })
    
    if (sqlErr) {
      console.error('❌ SQL deletion failed:', JSON.stringify(sqlErr, null, 2))
      
      // If SQL deletion fails, try the standard admin delete method
      console.log('Trying standard deleteUser admin API...')
      const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (deleteErr) {
        console.error('❌ Standard deleteUser failed:', JSON.stringify(deleteErr, null, 2))
        
        // Direct DB cleanup as last resort
        console.log('Attempting direct database cleanup...')
        await supabaseAdmin.from('user_plans').delete().eq('user_id', userId)
        await supabaseAdmin.from('user_tasks').delete().eq('user_id', userId)
        await supabaseAdmin.from('user_onboarding').delete().eq('user_id', userId)
        await supabaseAdmin.from('properties').delete().eq('user_id', userId)
        await supabaseAdmin.from('tasks').delete().eq('user_id', userId)
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId)
        await supabaseAdmin.from('documents').delete().eq('user_id', userId)
        await supabaseAdmin.from('maintenance').delete().eq('property_user_id', userId)
        await supabaseAdmin.from('jobs').delete().eq('customer_id', userId)
        await supabaseAdmin.from('jobs').delete().eq('provider_id', userId)
        
        // Last resort: Delete auth data directly
        const { error: authSqlErr } = await supabaseAdmin.rpc('force_delete_auth_user', { 
          target_user_id: userId 
        })
        
        if (authSqlErr) {
          console.error('❌ Force delete failed:', JSON.stringify(authSqlErr, null, 2))
          
          // Mark user as deleted in metadata if all else fails
          console.log('Falling back to metadata approach...')
          await supabaseAdmin.auth.admin.updateUserById(userId, { 
            user_metadata: { 
              deleted: true, 
              deletedAt: new Date().toISOString(),
              email: `deleted-${userId}@deleted.com`  // Change email to prevent sign-in
            },
            app_metadata: { 
              deleted: true,
              provider: 'deleted'
            },
            email: `deleted-${userId}@deleted.com`  // Change email in auth record
          })
          
          // Disable user account directly
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: '87600h' // 10 years
          })
          
          // Create response with cookie clearing
          const response = NextResponse.json(
            { 
              warning: 'Could not fully delete account. User marked as deleted and disabled.', 
              originalError: deleteErr.message 
            },
            { status: 202 }
          )
          
          // Clear auth cookies
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
          
          return response
        }
      }
    }

    // Success - create response with cookie clearing
    const response = NextResponse.json({ success: true }, { status: 200 })
    
    // Clear auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  } catch (e) {
    console.error('❌ Exception in delete operation:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
} 