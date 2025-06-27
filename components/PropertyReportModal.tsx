/**
 * PropertyReportModal.tsx
 * Modal component for displaying comprehensive property Rivo reports
 * Includes ownership timeline, maintenance history, trust scores, and PDF download with watermark protection
 */

"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { X, Download, FileText, CheckCircle, AlertTriangle, XCircle, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getUserPlan, type UserPlan } from "@/lib/getUserPlan";

// Data interfaces
interface PropertyReport {
  property_id: string;
  address: string;
  rivo_id: string;
  property_type: string;
  square_footage: number | null;
  purchase_date: string | null;
  region: string;
  year_built: number;
  home_health_score: number;
  upcoming_tasks_count: number;
  overdue_tasks_count: number;
  owners: PropertyOwner[] | null;
}

interface PropertyOwner {
  owner_name: string;
  start_date: string;
  end_date?: string;
  notes: string;
}

interface TaskHistoryItem {
  id: string;
  task_type: string;
  task_date: string;
  source: 'verified_pro' | 'verified_external' | 'diy_upload' | 'self_reported';
  verification_level: number;
  notes: string | null;
  media_url: string | null;
}

interface TrustScoreData {
  verification_source: string;
  task_count: number;
  weight: number;
  contribution: number;
}

interface PropertyReportModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyReportModal({ propertyId, isOpen, onClose }: PropertyReportModalProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [reportData, setReportData] = useState<PropertyReport | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([]);
  const [trustScoreData, setTrustScoreData] = useState<TrustScoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadReportData();
      loadUserInfo();
      loadUserPlan();
      checkForPendingDownload();
    }
  }, [isOpen, propertyId]);

  // Check if user just completed payment and should auto-download
  const checkForPendingDownload = () => {
    const params = new URLSearchParams(window.location.search);
    const downloadPropertyId = params.get('download_report');
    const reportId = params.get('report_id');
    
    if (downloadPropertyId === propertyId && reportId) {
      // Auto-trigger download after modal loads
      setTimeout(() => {
        triggerPaidDownload();
      }, 1000);
    }
  };

  const triggerPaidDownload = async () => {
    if (!reportData) return;
    
    setGeneratingPdf(true);
    try {
      const { generatePropertyReportPDF } = await import('@/lib/pdfGenerator');
      await generatePropertyReportPDF({
        reportData,
        taskHistory,
        trustScoreData,
        reportId: generateReportId(),
        userInfo
      });
      
      toast({
        title: "Success", 
        description: "Your purchased report has been downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate your purchased report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const loadUserPlan = async () => {
    try {
      const plan = await getUserPlan();
      setUserPlan(plan);
    } catch (error) {
      console.error('Error loading user plan:', error);
    } finally {
      setLoadingPlan(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get user profile for full name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        setUserInfo({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadReportData = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      // Fetch property report summary
      const { data: reportSummary, error: reportError } = await supabase
        .from('view_property_report_summary')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (reportError) {
        console.error('Error loading report data:', reportError);
        toast({
          title: "Error",
          description: "Failed to load property report data",
          variant: "destructive",
        });
        return;
      }

      setReportData(reportSummary);

      // Fetch task history
      const { data: history, error: historyError } = await supabase
        .from('user_task_history')
        .select('*')
        .eq('property_id', propertyId)
        .order('task_date', { ascending: false });

      if (historyError) {
        console.error('Error loading task history:', historyError);
      } else {
        setTaskHistory(history || []);
      }

      // Fetch trust score data using RPC function
      const { data: trustData, error: trustError } = await supabase
        .rpc('get_property_report_data', { p_property_id: propertyId });

      if (trustError) {
        console.error('Error loading trust score data:', trustError);
      } else {
        setTrustScoreData(trustData || []);
      }

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Error",
        description: "Failed to load property report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReportId = () => {
    return `RIV-RPT-${Date.now().toString(36).toUpperCase()}`;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'verified_pro':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'verified_external':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'diy_upload':
        return <Upload className="h-4 w-4 text-purple-600" />;
      case 'self_reported':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'verified_pro':
        return 'Rivo Pro – CleanFlow';
      case 'verified_external':
        return 'CoolTech HVAC';
      case 'diy_upload':
        return 'Homeowner';
      case 'self_reported':
        return 'Homeowner';
      case 'overdue':
        return '—';
      default:
        return source;
    }
  };

  const getSourceDescription = (source: string) => {
    switch (source) {
      case 'verified_pro':
        return 'Verified RivoHome Pro';
      case 'verified_external':
        return 'Verified Homeowner-Pro Technician';
      case 'diy_upload':
        return 'DIY + Upload';
      case 'self_reported':
        return 'Self-Reported';
      case 'overdue':
        return 'Overdue/Skipped';
      default:
        return source;
    }
  };

  const handleGenerateLink = async () => {
    if (!reportData) return;
    
    setGeneratingLink(true);
    try {
      const response = await fetch("/api/shared-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          property_id: reportData.property_id, 
          days_valid: 7 
        }),
      });
      
      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.error || "Could not generate link");
      }
      
      // Copy to clipboard and show success message
      await navigator.clipboard.writeText(json.url);
      toast({
        title: "Success",
        description: "Shareable link copied to clipboard! Link expires in 7 days.",
      });
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast({
        title: "Error",
        description: error.message || "Could not generate shareable link",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportData || loadingPlan) return;

    // Check if user has Premium plan
    if (userPlan?.name === 'Premium') {
      // Premium users: Direct download
      setGeneratingPdf(true);
      try {
        const { generatePropertyReportPDF } = await import('@/lib/pdfGenerator');
        await generatePropertyReportPDF({
          reportData,
          taskHistory,
          trustScoreData,
          reportId: generateReportId(),
          userInfo
        });
        
        toast({
          title: "Success",
          description: "Property report downloaded successfully",
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Failed to generate PDF report",
          variant: "destructive",
        });
      } finally {
        setGeneratingPdf(false);
      }
    } else {
      // Free/Core users: Redirect to payment
      setGeneratingPdf(true);
      try {
        const reportId = generateReportId();
        const response = await fetch('/api/reports/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            propertyId: reportData.property_id,
            reportId 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe checkout
        window.location.href = data.url;
      } catch (error: any) {
        console.error('Checkout error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to start checkout process",
          variant: "destructive",
        });
        setGeneratingPdf(false);
      }
    }
  };

  // Get download button text based on user plan
  const getDownloadButtonText = () => {
    if (loadingPlan) return 'Loading...';
    if (generatingPdf) return 'Processing...';
    if (userPlan?.name === 'Premium') return 'Download PDF';
    return 'Purchase & Download ($2.00)';
  };

  // Enhanced service recommendations logic
  const generateServiceRecommendations = () => {
    const recommendations: string[] = [];
    
    // Check for overdue tasks
    if (reportData && reportData.overdue_tasks_count > 0) {
      recommendations.push(`${reportData.overdue_tasks_count} overdue task${reportData.overdue_tasks_count > 1 ? 's' : ''} – schedule to maintain seasonal protection.`);
    }
    
    // Check for self-reported tasks without verification
    const selfReportedTasks = taskHistory.filter(t => t.source === 'self_reported');
    if (selfReportedTasks.length > 0) {
      recommendations.push('Several tasks were last self-reported with no verification – we recommend scheduling a verified service to ensure optimal system life.');
    }
    
    // Check for missing seasonal tasks (example based on feedback)
    const lastYearTasks = taskHistory.filter(t => {
      const taskDate = new Date(t.task_date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return taskDate < oneYearAgo;
    });
    
    // Check for specific task types that might be missing
    const hasPestControl = taskHistory.some(t => t.task_type.toLowerCase().includes('pest'));
    if (!hasPestControl) {
      recommendations.push('Pest control task not recorded last year – schedule to maintain seasonal protection.');
    }
    
    // If no specific recommendations, provide a general one
    if (recommendations.length === 0) {
      recommendations.push('Continue your excellent maintenance routine to preserve your home\'s health score.');
    }
    
    return recommendations;
  };

  // Get grade based on score
  const getGradeFromScore = (score: number) => {
    if (score >= 90) return { grade: 'A', description: 'Excellent upkeep' };
    if (score >= 80) return { grade: 'B', description: 'Good upkeep, minimal issues' };
    if (score >= 70) return { grade: 'C', description: 'Average upkeep, room for improvement' };
    if (score >= 60) return { grade: 'D', description: 'Below average upkeep, several skipped/' };
    return { grade: 'F', description: 'Poor upkeep, significant neglect' };
  };

  // Check if there are verified professional tasks
  const hasVerifiedProTasks = taskHistory.some(t => 
    t.source === 'verified_pro' || t.source === 'verified_external'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Watermark overlay for modal */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Main diagonal watermark */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-5">
            <div className="text-4xl font-bold text-blue-600 whitespace-nowrap text-center leading-tight">
              CONFIDENTIAL<br/>
              RIVO PROPERTY REPORT<br/>
              {reportData?.rivo_id}<br/>
              <span className="text-2xl">{userInfo?.full_name || userInfo?.email || 'AUTHORIZED USER'}</span>
            </div>
          </div>
          
          {/* Corner watermarks */}
          <div className="absolute top-4 left-4 opacity-8 transform rotate-[-45deg]">
            <span className="text-xs text-blue-600 font-bold">CONFIDENTIAL</span>
          </div>
          <div className="absolute top-4 right-4 opacity-8 transform rotate-[45deg]">
            <span className="text-xs text-blue-600 font-bold">{reportData?.rivo_id}</span>
          </div>
          <div className="absolute bottom-4 left-4 opacity-8 transform rotate-[-45deg]">
            <span className="text-xs text-blue-600 font-bold">{format(new Date(), 'MM/dd/yyyy HH:mm')}</span>
          </div>
          <div className="absolute bottom-4 right-4 opacity-8 transform rotate-[45deg]">
            <span className="text-xs text-blue-600 font-bold">RIVO PROTECTED</span>
          </div>
          
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-2"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 60px,
                  rgba(37, 99, 235, 0.1) 60px,
                  rgba(37, 99, 235, 0.1) 65px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 60px,
                  rgba(37, 99, 235, 0.1) 60px,
                  rgba(37, 99, 235, 0.1) 65px
                )
              `
            }}
          />
        </div>

        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 relative z-20">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Property Report</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateLink}
              disabled={!reportData || generatingLink}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {generatingLink ? 'Generating...' : 'Share Report'}
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={!reportData || generatingPdf || loadingPlan}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              {getDownloadButtonText()}
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 relative z-20"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !reportData ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Unable to load property report data.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Report Header */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">
                  Rivo Report – Ownership Timeline Sample
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Property:</strong> {reportData.address}</p>
                  <p><strong>Rivo ID:</strong> {reportData.rivo_id}</p>
                  <p><strong>Report ID:</strong> {generateReportId()}</p>
                  <p><strong>Report Generated:</strong> {format(new Date(), 'MMMM d, yyyy')}</p>
                  <p><strong>Generated for:</strong> {userInfo?.full_name || userInfo?.email || 'Authorized User'}</p>
                </div>
              </div>

              {/* Summary Snapshot */}
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4">Summary Snapshot</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Home Health Score:</strong> {reportData.home_health_score >= 80 ? 'B+' : reportData.home_health_score >= 60 ? 'C' : 'D'} ({reportData.home_health_score}/100)</p>
                    <p><strong>Verified Tasks:</strong> {taskHistory.filter(t => t.source === 'verified_pro').length}</p>
                    <p><strong>Verified External Tasks:</strong> {taskHistory.filter(t => t.source === 'verified_external').length}</p>
                    <p><strong>DIY with Upload:</strong> {taskHistory.filter(t => t.source === 'diy_upload').length}</p>
                  </div>
                  <div>
                    <p><strong>Self-Reported:</strong> {taskHistory.filter(t => t.source === 'self_reported').length}</p>
                    <p><strong>Overdue:</strong> {reportData.overdue_tasks_count}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <p><strong>% of Tasks Verified:</strong> {taskHistory.length > 0 ? Math.round((taskHistory.filter(t => t.source === 'verified_pro' || t.source === 'verified_external').length / taskHistory.length) * 100) : 0}%</p>
                  <p><strong>Next Maintenance Due:</strong> Change Air filter (June 2025)</p>
                </div>
              </div>

              {/* Ownership Timeline */}
              {reportData.owners && reportData.owners.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-blue-600 mb-4">Ownership Timeline</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">Owner</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Date Range</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.owners.map((owner, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2">{owner.owner_name}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              {format(new Date(owner.start_date), 'yyyy-MM-dd')}
                              {owner.end_date ? ` - ${format(new Date(owner.end_date), 'yyyy-MM-dd')}` : ' - Present'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">{owner.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Maintenance History */}
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4">Maintenance History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Task</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Status</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Source</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Notes</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-300 px-3 py-2 text-center text-gray-500">
                            No maintenance history available
                          </td>
                        </tr>
                      ) : (
                        taskHistory.map((task) => (
                          <tr key={task.id}>
                            <td className="border border-gray-300 px-3 py-2">
                              {format(new Date(task.task_date), 'MM/dd/yyyy')}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">{task.task_type}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className="flex items-center gap-2">
                                {getSourceIcon(task.source)}
                                Verified
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">{getSourceLabel(task.source)}</td>
                            <td className="border border-gray-300 px-3 py-2">{task.notes || '—'}</td>
                            <td className="border border-gray-300 px-3 py-2">Current</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trust Score Breakdown */}
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4">Trust Score Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Task Source</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Count</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Weight</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Score Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trustScoreData.map((score) => (
                        <tr key={score.verification_source}>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center gap-2">
                              {getSourceIcon(score.verification_source)}
                              {getSourceDescription(score.verification_source)}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">{score.task_count}</td>
                          <td className="border border-gray-300 px-3 py-2">{score.weight.toFixed(1)}</td>
                          <td className="border border-gray-300 px-3 py-2">{score.contribution} pts</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="border border-gray-300 px-3 py-2">Total Score</td>
                        <td className="border border-gray-300 px-3 py-2">—</td>
                        <td className="border border-gray-300 px-3 py-2">—</td>
                        <td className="border border-gray-300 px-3 py-2">{reportData.home_health_score}/100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Score */}
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-gray-900">
                  Total Score: {reportData.home_health_score}/100
                </div>
              </div>

              {/* Report Label for Homeowner-Verified Professionals */}
              {hasVerifiedProTasks && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">*Report Label for Homeowner-Verified Professionals:</h3>
                  <p className="text-sm text-gray-700">
                    This task was completed by the homeowner, a verified [Electrician/HVAC Tech], and meets 
                    professional self-service standards.
                  </p>
                </div>
              )}

              {/* Service Recommendations */}
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4">Service Recommendations</h2>
                <div className="text-sm space-y-2">
                  {generateServiceRecommendations().map((recommendation, index) => (
                    <p key={index}>- {recommendation}</p>
                  ))}
                </div>
              </div>

              {/* Grade Range */}
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4">Grade Range</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Score Range</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Grade</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">90-100</td>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">A</td>
                        <td className="border border-gray-300 px-3 py-2">Excellent upkeep</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">80-89</td>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">B</td>
                        <td className="border border-gray-300 px-3 py-2">Good upkeep, minimal issues</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">70-79</td>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">C</td>
                        <td className="border border-gray-300 px-3 py-2">Average upkeep, room for improvement</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">60-69</td>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">D</td>
                        <td className="border border-gray-300 px-3 py-2">Below average upkeep, several skipped/missed</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">Below 60</td>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">F</td>
                        <td className="border border-gray-300 px-3 py-2">Poor upkeep, significant neglect</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How Total Score is Calculated */}
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4">How Total Score is Calculated:</h2>
                <div className="text-sm space-y-2">
                  <p className="font-mono bg-gray-100 p-2 rounded">
                    [(Sum of score contribution)/(Sum of count * 10)] * 100
                  </p>
                  <p className="font-mono bg-gray-100 p-2 rounded">
                    ({trustScoreData.reduce((sum, item) => sum + item.contribution, 0)}/
                    {trustScoreData.reduce((sum, item) => sum + (item.task_count * 10), 0)}) * 100 = {reportData.home_health_score}
                  </p>
                </div>
              </div>

              {/* Footer Notes */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-lg font-bold text-blue-600 mb-4">Footer Notes</h2>
                <div className="text-sm space-y-3">
                  <p><strong>Powered by RivoHome</strong><br />Trusted by homeowners and professionals nationwide.</p>
                  
                  <p><strong>Privacy & Trust Balance:</strong> Maintenance tasks are labeled by verification level. Personal identifiers from prior owners are anonymized upon transfer.</p>
                  
                  <p><strong>Disclaimer:</strong> This report is based on user-submitted or third-party data. RivoHome is not liable for missed tasks, inaccurate entries, or technology disruptions affecting data integrity. Use this report as a tool—not a substitute—for professional inspections.</p>
                  
                  <p>View the live, most recent version of this report: <span className="text-blue-600">www.rivohome.com/report/{reportData.rivo_id}</span></p>
                </div>
              </div>

              {/* Add protection notice at bottom */}
              <div className="pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p><strong>CONFIDENTIAL DOCUMENT:</strong> This report is generated exclusively for {userInfo?.full_name || userInfo?.email || 'authorized user'} and contains proprietary information. 
                  Unauthorized distribution, copying, or modification is strictly prohibited and may be subject to legal action.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 