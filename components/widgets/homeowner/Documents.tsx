'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Upload, Download, Trash2, FileText, Eye, AlertCircle, Crown } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  getUserPlan, 
  canUserPerformAction, 
  getDocumentLimit, 
  getPlanLimits,
  getUpgradeMessage,
  type UserPlan 
} from '@/lib/getUserPlan'
import SecureFileUploader from '@/components/SecureFileUploader'
import { validateUploadedFile } from '@/lib/secure-file-validation'

interface Document {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file_name?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [canUpload, setCanUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Use the auth helpers client for better SSR compatibility
  const supabase = createClientComponentClient()

  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) setError('Authentication error. Please refresh the page.')
          return
        }
        
        if (!session?.user) {
          // Try to get user directly as a fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error('User error:', userError)
            if (mounted) setError('Please sign in to access your documents')
            return
          }
          
          if (mounted) setUserId(user.id)
        } else {
          if (mounted) setUserId(session.user.id)
        }
        
        // Load user plan, documents, and permissions in parallel
        if (mounted && (session?.user?.id || userId)) {
          const currentUserId = session?.user?.id || userId;
          const [planData, canUploadDoc] = await Promise.all([
            getUserPlan(),
            canUserPerformAction('upload_document'),
            fetchDocuments(currentUserId)
          ]);
          if (mounted) {
            setUserPlan(planData);
            setCanUpload(canUploadDoc);
          }
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err)
        if (mounted) setError('Authentication failed. Please try refreshing the page.')
      }
    }
    
    initializeAuth()
    
    return () => {
      mounted = false
    }
  }, [])

  const fetchDocuments = async (userIdParam?: string) => {
    const currentUserId = userIdParam || userId
    
    if (!currentUserId) {
      setError('User not authenticated')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load documents')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File, sanitizedName: string) => {
    if (!userId) {
      setError('User not authenticated')
      return
    }
    
    // Double-check permission before upload
    const canUploadNow = await canUserPerformAction('upload_document');
    if (!canUploadNow) {
      const upgradeMsg = userPlan ? getUpgradeMessage(userPlan.name, 'documents') : 'Upgrade your plan to upload more documents.';
      toast({
        title: "Upload Limit Reached",
        description: upgradeMsg,
        variant: "destructive",
      })
      return
    }

    // File size limit (10MB) - redundant but good practice
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Create a secure file path with sanitized name
      const fileExt = sanitizedName.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Insert record in the documents table
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          title: sanitizedName, // Use sanitized name
          description: '',
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          file_name: sanitizedName // Use sanitized name
        })

      if (insertError) throw insertError

      // Refresh the document list and permissions
      await fetchDocuments()
      const newCanUpload = await canUserPerformAction('upload_document');
      setCanUpload(newCanUpload);
      
      toast({
        title: "Success",
        description: "Document uploaded securely",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to upload document')
      console.error('Error uploading document:', err)
      toast({
        title: "Error",
        description: err.message || 'Failed to upload document',
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      setError(null)
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])
      
      if (storageError) {
        console.warn('Storage deletion error:', storageError)
        // Continue with database deletion even if storage fails
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
      
      if (dbError) throw dbError
      
      // Update state to remove the deleted document
      setDocuments(documents.filter(doc => doc.id !== docId))
      
      // Refresh permissions after deleting
      const newCanUpload = await canUserPerformAction('upload_document');
      setCanUpload(newCanUpload);
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to delete document')
      console.error('Error deleting document:', err)
      toast({
        title: "Error",
        description: err.message || 'Failed to delete document',
        variant: "destructive",
      })
    }
  }

  const handleView = async (filePath: string, fileName: string) => {
    try {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)
      
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank')
      } else {
        setError('Unable to generate document URL')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to view document')
      console.error('Error viewing document:', err)
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath)
      
      if (error) throw error
      
      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Failed to download document')
      console.error('Error downloading document:', err)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPlanStatusText = () => {
    if (!userPlan) return '';
    
    const limits = getPlanLimits(userPlan);
    if (limits.documents === null) {
      return 'Unlimited documents';
    }
    return `${documents.length}/${limits.documents} documents used`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Access and manage your important home documents.</p>
          <p className="text-sm text-gray-500">Loading documents...</p>
        </div>
      </div>
    )
  }

  // Show authentication error
  if (!userId && error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Access and manage your important home documents.</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          {userPlan && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              {userPlan.name === 'Premium' && <Crown className="w-4 h-4 text-yellow-500" />}
              {userPlan.name} Plan: {getPlanStatusText()}
            </p>
          )}
        </div>
        <Link 
          href="/dashboard/documents" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Access and manage your important home documents.</p>
        
        {error && (
          <p className="text-sm text-red-600">
            Error: {error}
          </p>
        )}

        {/* Plan limit warning */}
        {!canUpload && userPlan && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">
                    Document Limit Reached
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">
                    {getUpgradeMessage(userPlan.name, 'documents')}
                    <Link href="/pricing" className="font-medium underline ml-1">
                      View Pricing Plans
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={doc.file_name || doc.title}>
                        {doc.file_name || doc.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleView(doc.file_path, doc.file_name || doc.title)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc.file_path, doc.file_name || doc.title)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload important home documents like warranties, manuals, and receipts.
              </p>
            </div>
          )}
          
          <div className="mt-4">
            <SecureFileUploader
              onUpload={handleUpload}
              acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
              maxSize={10 * 1024 * 1024}
              disabled={uploading || !userId || !canUpload}
            />
            {!canUpload && (
              <p className="text-xs text-gray-500 mt-2">
                {userPlan ? getUpgradeMessage(userPlan.name, 'documents') : 'Upgrade to upload more documents'}
              </p>
            )}
          </div>
        </>
      </div>
    </div>
  )
} 