'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Application {
  user_id: string
  email: string
  full_name: string
  business_name: string
  phone: string
  zip_code: string
  bio: string
  logo_url: string
  review_status: string
  reviewed_by: string | null
  rejection_reason: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  provider_id: string
  doc_type: string
  doc_url: string
  metadata: any
  uploaded_at: string
}

interface Service {
  provider_id: string
  service_id: number
  radius_miles: number
  provider_services_master: {
    name: string
  }
}

interface ExternalReview {
  id: string
  provider_id: string
  platform: string
  url: string
  testimonial: string
  created_at: string
}

interface Agreement {
  provider_id: string
  agreement_name: string
  agreed: boolean
  agreed_at: string | null
}

interface StatusHistory {
  id: number
  provider_id: string
  status: string
  changed_by: string | null
  reason: string | null
  notes: string | null
  created_at: string
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const providerId = resolvedParams.id
  const router = useRouter()
  const { toast } = useToast()
  
  // Application data state
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [externalReviews, setExternalReviews] = useState<ExternalReview[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Fetch application data
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/applications/${providerId}`)
        
        if (!res.ok) {
          throw new Error('Failed to fetch application details')
        }
        
        const data = await res.json()
        
        // Set application data with safety checks
        if (data.application) {
          setApplication(data.application)
        }
        setDocuments(data.documents || [])
        setServices(data.services || [])
        setExternalReviews(data.externalReviews || [])
        setAgreements(data.agreements || [])
        setHistory(data.history || [])
        
      } catch (error) {
        console.error('Error fetching application details:', error)
        toast({
          title: 'Error',
          description: 'Failed to load application details',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchApplicationDetails()
  }, [providerId, toast])
  
  // Approve application
  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/applications/${providerId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: reviewNotes })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to approve application')
      }
      
      toast({
        title: 'Success',
        description: 'Application has been approved',
        variant: 'default'
      })
      
      // Close dialog and redirect back to applications list
      setIsApproveDialogOpen(false)
      router.push('/admin/applications')
      
    } catch (error: any) {
      console.error('Error approving application:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve application',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Reject application
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Required field',
        description: 'Please provide a rejection reason',
        variant: 'destructive'
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/applications/${providerId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason,
          notes: reviewNotes
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reject application')
      }
      
      toast({
        title: 'Success',
        description: 'Application has been rejected',
        variant: 'default'
      })
      
      // Close dialog and redirect back to applications list
      setIsRejectDialogOpen(false)
      router.push('/admin/applications')
      
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject application',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown Date'
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading application details...</h2>
          <p className="text-gray-500">Please wait while we fetch the provider information.</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Application not found</h2>
          <p className="text-gray-500 mb-4">The provider application you're looking for doesn't exist.</p>
          <Link href="/admin/applications" className="text-blue-600 hover:underline">
            Back to Applications
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header section with basic info and action buttons */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/admin/applications" 
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Applications
            </Link>
            <span className="text-gray-400">|</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${application.review_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                application.review_status === 'approved' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {application.review_status.charAt(0).toUpperCase() + application.review_status.slice(1)}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{application.full_name || 'Unknown Provider'}</h1>
          <h2 className="text-lg text-gray-600">{application.business_name || 'No Business Name'}</h2>
          <div className="mt-2 text-sm text-gray-500">
            Applied: {application.created_at ? formatDate(application.created_at) : 'Unknown Date'}
          </div>
        </div>
        
        <div className="flex gap-3">
          {application.review_status === 'pending' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsRejectDialogOpen(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button 
                onClick={() => setIsApproveDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
            </>
          )}
          {application.review_status === 'rejected' && (
            <Button 
              onClick={() => setIsApproveDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </Button>
          )}
          {application.review_status === 'approved' && (
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(true)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Reject
            </Button>
          )}
        </div>
      </div>
      
      {/* Application details in tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({externalReviews.length})</TabsTrigger>
          <TabsTrigger value="agreements">Agreements ({agreements.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Provider Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
              <p className="text-base">{application.full_name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Business Name</h4>
              <p className="text-base">{application.business_name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="text-base">{application.email}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
              <p className="text-base">{application.phone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">ZIP Code</h4>
              <p className="text-base">{application.zip_code}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Applied On</h4>
              <p className="text-base">{formatDate(application.created_at)}</p>
            </div>
          </div>
          
          {application.bio && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Bio</h4>
              <p className="text-base text-gray-700">{application.bio}</p>
            </div>
          )}
          
          {application.logo_url && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Logo</h4>
              <img 
                src={application.logo_url} 
                alt={`${application.business_name} logo`} 
                className="h-20 w-auto object-contain"
              />
            </div>
          )}
          
          {application.rejection_reason && (
            <div className="mt-6 p-4 bg-red-50 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason</h4>
              <p className="text-sm text-red-700">{application.rejection_reason}</p>
            </div>
          )}
          
          {application.review_notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Review Notes</h4>
              <p className="text-sm text-gray-600">{application.review_notes}</p>
            </div>
          )}
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services" className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
          {services.length === 0 ? (
            <p className="text-gray-500">No services added by this provider.</p>
          ) : (
            <div className="divide-y">
              {services.map((service) => (
                <div key={service.service_id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{service.provider_services_master.name}</p>
                    <p className="text-sm text-gray-500">Service radius: {service.radius_miles} miles</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded by this provider.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium capitalize">{doc.doc_type.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-500">Uploaded: {formatDate(doc.uploaded_at)}</p>
                    </div>
                    <a 
                      href={doc.doc_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Document
                    </a>
                  </div>
                  {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                    <div className="mt-3 text-sm">
                      <h5 className="font-medium text-gray-700 mb-1">Details:</h5>
                      <ul className="space-y-1">
                        {Object.entries(doc.metadata).map(([key, value]) => (
                          <li key={key} className="flex">
                            <span className="capitalize text-gray-600 w-1/3">{key.replace('_', ' ')}:</span>
                            <span className="text-gray-800">{String(value)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* External Reviews Tab */}
        <TabsContent value="reviews" className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">External Reviews & Testimonials</h3>
          {externalReviews.length === 0 ? (
            <p className="text-gray-500">No external reviews provided by this provider.</p>
          ) : (
            <div className="divide-y">
              {externalReviews.map((review) => (
                <div key={review.id} className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium capitalize">{review.platform}</h4>
                    <a 
                      href={review.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View on {review.platform}
                    </a>
                  </div>
                  {review.testimonial && (
                    <div className="bg-gray-50 p-3 rounded-md mt-2">
                      <p className="text-gray-700 italic">{review.testimonial}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Agreements Tab */}
        <TabsContent value="agreements" className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Agreements</h3>
          {agreements.length === 0 ? (
            <p className="text-gray-500">No agreements acknowledged by this provider.</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Agreement</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((agreement) => (
                  <tr key={agreement.agreement_name} className="border-b">
                    <td className="py-3 px-4 capitalize">{agreement.agreement_name.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${agreement.agreed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {agreement.agreed ? 'Agreed' : 'Not Agreed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {agreement.agreed_at ? formatDate(agreement.agreed_at) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Status History</h3>
          {history.length === 0 ? (
            <p className="text-gray-500">No status change history yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {history.map((item) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white bg-white z-10">
                      {item.status === 'approved' ? (
                        <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="h-3 w-3 rounded-full bg-red-500"></span>
                        </span>
                      ) : (
                        <span className="h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center">
                          <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium capitalize">{item.status}</h4>
                        <span className="text-sm text-gray-500">{formatDate(item.created_at)}</span>
                      </div>
                      
                      {item.reason && (
                        <div className="mb-2">
                          <h5 className="text-sm font-medium text-gray-700">Reason:</h5>
                          <p className="text-sm text-gray-600">{item.reason}</p>
                        </div>
                      )}
                      
                      {item.notes && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Notes:</h5>
                          <p className="text-sm text-gray-600">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              This will approve the service provider application and give the provider access to the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Notes (Optional)
            </label>
            <Textarea
              placeholder="Any additional notes about this approval"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="min-h-24"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Approving...' : 'Approve Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. The provider will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Why is this application being rejected?"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <Textarea
              placeholder="Any other details or instructions for the provider"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="min-h-24"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 