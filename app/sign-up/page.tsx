import { SignUpForm } from '@/components/SignUpForm'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">
              Create a RivoHome Account
            </h1>
            <SignUpForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 