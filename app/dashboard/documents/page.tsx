'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, Download, Crown, AlertCircle } from 'lucide-react';
import HomeownerNavigationClient from '@/components/HomeownerNavigationClient';
import { 
  getUserPlan, 
  canUserPerformAction, 
  getUserUsage,
  getPlanLimits,
  getUpgradeMessage,
  type UserPlan 
} from '@/lib/getUserPlan';
import SecureFileUploader from '@/components/SecureFileUploader';
import { validateUploadedFile } from '@/lib/secure-file-validation';

interface FileObject {
  id: string;
  name: string;
  size: number;
  updated_at: string;
  metadata?: { user_id: string };
}

export default function DocumentsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();

  const [files, setFiles] = useState<FileObject[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [canUpload, setCanUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Load user's plan, files, and check permissions in parallel
      const [planData, filesResult, canUploadDoc] = await Promise.all([
        getUserPlan(),
        supabase.storage
          .from('documents')
          .list(user.id, { 
            limit: 100, 
            offset: 0, 
            sortBy: { column: 'updated_at', order: 'desc' } 
          }),
        canUserPerformAction('upload_document')
      ]);

      setUserPlan(planData);
      setCanUpload(canUploadDoc);
      
      if (filesResult.error) {
        console.error('Error loading files:', filesResult.error);
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive",
        });
      } else {
        setFiles(filesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, sanitizedName: string) => {
    // Check file size (max 10MB) - redundant but good practice
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Double-check permission before uploading
    const canUploadNow = await canUserPerformAction('upload_document');
    if (!canUploadNow) {
      const upgradeMsg = userPlan ? getUpgradeMessage(userPlan.name, 'documents') : 'Upgrade your plan to upload more documents.';
      toast({
        title: "Upgrade Required",
        description: upgradeMsg,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use sanitized filename for security
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error",
          description: uploadError.message || "Failed to upload document",
          variant: "destructive",
        });
      } else {
        // Refresh the list and permissions
        await loadData();
        
        toast({
          title: "Success",
          description: "Document uploaded securely",
        });
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.storage
        .from('documents')
        .remove([`${user.id}/${fileName}`]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      } else {
        // Refresh the list and permissions
        await loadData();
        
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from('documents')
        .download(`${user.id}/${fileName}`);

      if (error) {
        console.error('Download error:', error);
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive",
        });
        return;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getPlanStatusText = () => {
    if (!userPlan) return '';
    
    const limits = getPlanLimits(userPlan);
    if (limits.documents === null) {
      return 'Unlimited documents';
    }
    return `${files.length}/${limits.documents} documents used`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient 
        title="My Documents" 
        currentPage="documents"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Documents Header with Plan Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Documents</h2>
              <p className="text-gray-600">Securely store and manage your property documents</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Plan Status */}
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {getPlanStatusText()}
                </span>
              </div>
              
              {/* Upload Button */}
              {canUpload ? (
                <SecureFileUploader
                  onUpload={handleUpload}
                  acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg']}
                  maxSize={10 * 1024 * 1024}
                  disabled={uploading}
                />
              ) : (
                <div className="text-center">
                  <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-md mb-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </button>
                  <p className="text-xs text-gray-500">
                    {userPlan ? getUpgradeMessage(userPlan.name, 'documents') : 'Upgrade to upload more documents'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {files.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-6">
                Upload your first document to keep important property files organized and accessible.
              </p>
              {canUpload && (
                <div>
                  <input
                    type="file"
                    id="file-upload-empty"
                    className="sr-only"
                    onChange={handleUpload}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload-empty"
                    className="rivo-button flex items-center gap-2 cursor-pointer inline-flex"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Your First Document
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((file) => (
              <Card key={file.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <CardTitle className="text-sm line-clamp-2 break-words">
                        {file.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file.name)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Size: {formatFileSize(file.size)}</p>
                    <p>Uploaded: {new Date(file.updated_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div></div>
  );
} 