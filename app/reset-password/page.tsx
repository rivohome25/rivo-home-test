import { ResetPassword } from '@/components/ResetPassword'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

// Make the reset password page static to prevent any middleware issues
export const dynamic = 'force-static'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
            <ResetPassword />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 