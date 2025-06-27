'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ReportSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const propertyId = searchParams.get('property_id');
    const reportId = searchParams.get('report_id');

    if (!sessionId || !propertyId || !reportId) {
      setStatus('error');
      setMessage('Missing payment information. Please try again.');
      return;
    }

    async function verifyAndDownload() {
      try {
        // Wait a moment for webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        const res = await fetch('/api/reports/verify-and-get-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, propertyId, reportId }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        setStatus('success');
        setMessage('Payment successful! You can now download your report.');

      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Payment verification failed');
      }
    }

    verifyAndDownload();
  }, [searchParams]);

  const handleDownloadReport = async () => {
    const propertyId = searchParams.get('property_id');
    const reportId = searchParams.get('report_id');

    try {
      // Redirect back to properties page and trigger download
      router.push(`/dashboard/properties?download_report=${propertyId}&report_id=${reportId}`);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleReturnToProperties = () => {
    router.push('/dashboard/properties');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Issue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-3">
              <Button 
                onClick={handleDownloadReport}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report Now
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReturnToProperties}
                className="w-full"
              >
                Return to Properties
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleReturnToProperties}
                className="w-full"
              >
                Return to Properties
              </Button>
              <p className="text-sm text-gray-500">
                If this issue persists, please contact support with your payment information.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ReportSuccessContent />
    </Suspense>
  );
} 