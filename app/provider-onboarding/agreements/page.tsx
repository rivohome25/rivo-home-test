'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const REQUIRED = [
  { key: 'Provider Agreement',       url: '#', modal: true },
  { key: 'Code of Conduct',          url: '#', modal: true },
  { key: 'Non-Discrimination Policy', url: '#', modal: true }
] as const

function ProviderAgreementModal() {
  return (
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center">Service Provider Agreement</DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-6 text-gray-800">
        <section>
          <h3 className="text-lg font-semibold mb-2">Independent Contractor Status</h3>
          <p>The Provider acknowledges that they are an independent contractor and not an employee, agent, joint venture, or partner of RivoHome. Nothing in this agreement shall be construed to create a partnership, joint venture, or employer-employee relationship.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Services Offered</h3>
          <p>The Provider is solely responsible for the quality, timing, legality, and results of the services they offer. RivoHome does not supervise, control, or direct the Provider's work.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Insurance & Licensing</h3>
          <p>Provider must maintain valid business licenses and insurance coverage required by law. Failure to do so may result in immediate removal from the RivoHome platform.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Indemnification</h3>
          <p>The Provider agrees to indemnify, defend, and hold harmless RivoHome, its affiliates, officers, agents, and employees from and against any and all claims, liabilities, damages, losses, and expenses arising out of or in any way connected with: (a) Provider's services; (b) breach of this Agreement; or (c) any negligent or willful act or omission by the Provider.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Platform Authority</h3>
          <p>RivoHome reserves the right to remove, suspend, or restrict access to any Provider at its sole discretion if any part of this agreement is violated or if the Provider engages in any activity deemed unsafe, unprofessional, or fraudulent.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
          <p>RivoHome is not liable for any loss or damage arising out of services rendered by Providers, including but not limited to service quality, missed appointments, or personal/property injury. All interactions are at the risk of the participating parties.</p>
        </section>
      </div>
    </DialogContent>
  )
}

function CodeOfConductModal() {
  return (
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center">Code of Conduct</DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-6 text-gray-800">
        <section>
          <h3 className="text-lg font-semibold mb-2">Professional Standards</h3>
          <p>Providers agree to conduct themselves with professionalism and integrity. This includes: honoring appointments, using respectful communication, and delivering agreed-upon services.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Misrepresentation</h3>
          <p>Knowingly submitting false information or credentials is grounds for immediate removal and potential legal action.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Safety & Conduct</h3>
          <p>Providers must: follow all applicable safety and building regulations, treat homeowners and their property with respect, and not engage in harassment, intimidation, or illegal activity.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Reporting Violations</h3>
          <p>RivoHome reserves the right to take immediate action, including account suspension or termination, in response to violations of this code. RivoHome also reserves the right to notify affected parties or law enforcement when appropriate.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Liability Shield</h3>
          <p>RivoHome assumes no responsibility for on-site behavior, pricing, or task fulfillment. Providers act under their own discretion and responsibility.</p>
        </section>
      </div>
    </DialogContent>
  )
}

function NonDiscriminationPolicyModal() {
  return (
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center">Non-Discrimination Policy</DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-6 text-gray-800">
        <section>
          <h3 className="text-lg font-semibold mb-2">Equal Access Commitment</h3>
          <p>RivoHome is committed to providing a platform free of discrimination. Providers must not refuse services based on race, ethnicity, gender, sexual orientation, religion, disability, age, or any other protected characteristic.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Complaints and Enforcement</h3>
          <p>Complaints about discriminatory behavior will be investigated by RivoHome. Confirmed violations will result in disciplinary action, up to and including permanent removal from the platform.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">Decision Authority</h3>
          <p>RivoHome retains full authority to determine, at its sole discretion, whether a Provider's conduct violates this policy.</p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold mb-2">No Platform Liability</h3>
          <p>While RivoHome enforces this policy in good faith, it shall not be held liable for the actions of any Provider. All users acknowledge that RivoHome is a third-party facilitator and not a direct party to service transactions.</p>
        </section>
      </div>
    </DialogContent>
  )
}

export default function AgreementsStep() {
  const supabase = useSupabaseClient()
  const user     = useUser()
  const router   = useRouter()

  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(REQUIRED.map(r => [r.key, false]))
  )
  const [error, setError]     = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch existing agreements
  useEffect(() => {
    if (!user) return
    
    supabase
      .from('provider_agreements')
      .select('agreement_name,agreed')
      .eq('provider_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const existingAgreements = data.reduce((acc, agreement) => {
            if (agreement.agreed) {
              acc[agreement.agreement_name] = true
            }
            return acc
          }, {} as Record<string, boolean>)
          
          setChecked(prev => ({
            ...prev,
            ...existingAgreements
          }))
        }
      })
  }, [supabase, user])

  const allChecked = REQUIRED.every(r => checked[r.key])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return setError('Not authenticated')
    if (!allChecked) return setError('Please agree to all documents')

    setLoading(true)
    setError(null)

    // 1) Save agreements
    const res = await fetch(
      '/api/provider-onboarding/agreements',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreed: REQUIRED.map(r => r.key)
        })
      }
    )
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unknown error')
      setLoading(false)
      return
    }

    // 2) Submit for review
    const reviewRes = await fetch('/api/provider-onboarding/submit-for-review', { 
      method: 'POST' 
    })
    
    if (!reviewRes.ok) {
      const reviewJson = await reviewRes.json()
      setError(reviewJson.error || 'Failed to submit for review')
      setLoading(false)
      return
    }

    // 3) Redirect to awaiting-review page
    router.push('/provider-onboarding/awaiting-review')
  }

  const getModalComponent = (key: string) => {
    switch (key) {
      case 'Provider Agreement':
        return <ProviderAgreementModal />;
      case 'Code of Conduct':
        return <CodeOfConductModal />;
      case 'Non-Discrimination Policy':
        return <NonDiscriminationPolicyModal />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Step 7: Agreements</h1>
      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        {REQUIRED.map(({ key, url, modal }) => (
          <div key={key} className="flex items-start p-4 border rounded-md">
            <input
              type="checkbox"
              id={key}
              checked={checked[key]}
              onChange={e =>
                setChecked(prev => ({ ...prev, [key]: e.target.checked }))
              }
              className="mt-1 h-5 w-5 text-blue-500 rounded"
            />
            <label htmlFor={key} className="ml-3">
              <span className="block font-medium">I agree to the</span>
              {modal ? (
                <Dialog>
                  <DialogTrigger className="text-blue-600 hover:underline">
                    {key}
                  </DialogTrigger>
                  {getModalComponent(key)}
                </Dialog>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {key}
                </a>
              )}
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!allChecked || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  )
} 