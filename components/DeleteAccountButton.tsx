'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function DeleteAccountButton() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("This is permanent. Delete your account?")) return
    
    try {
      setIsDeleting(true)
      
      const res = await fetch('/api/delete-account', { 
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert('Error deleting account: ' + (data.error || 'Unknown error'))
        return
      }
      
      // Account was deleted on the server, now handle client-side cleanup
      try {
        // Let the server handle the signOut via cookies
        // Just redirect to sign-in page after a brief delay
        setTimeout(() => {
          // Force a hard navigation to clear all client state and reload the page
          window.location.href = '/sign-in'
        }, 500)
      } catch (signOutErr) {
        console.error('Error during post-deletion handling:', signOutErr)
        // Force redirect anyway
        window.location.href = '/sign-in'
      }
    } catch (err) {
      console.error('Error during account deletion:', err)
      alert('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isDeleting ? 'Deleting...' : 'Delete My Account'}
    </button>
  )
} 