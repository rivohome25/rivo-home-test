"use client";

import { format, parseISO } from "date-fns";
import { CheckCircle, AlertTriangle, XCircle, Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

// Data interfaces (matching PropertyReportModal)
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
  source: string;
  notes: string | null;
  property_id: string;
}

interface TrustScoreData {
  verification_source: string;
  task_count: number;
  weight: number;
  contribution: number;
}

interface SharedReportData {
  property: PropertyReport;
  taskHistory: TaskHistoryItem[];
  trustScoreData: TrustScoreData[];
}

interface SharedReportClientProps {
  reportData: SharedReportData;
  expiresAt: string;
}

export default function SharedReportClient({ reportData, expiresAt }: SharedReportClientProps) {
  const { property, taskHistory, trustScoreData } = reportData;

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

  const downloadPDF = async () => {
    try {
      // Import PDF generation dynamically since it's client-side only
      const { generatePropertyReportPDF } = await import('@/lib/pdfGenerator');
      await generatePropertyReportPDF({
        reportData: property,
        taskHistory,
        trustScoreData,
        reportId: generateReportId(),
        userInfo: {
          email: 'SHARED REPORT ACCESS',
          full_name: 'External Viewer'
        }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    }
  };

  // Enhanced service recommendations logic
  const generateServiceRecommendations = () => {
    const recommendations: string[] = [];
    
    // Check for overdue tasks
    if (property && property.overdue_tasks_count > 0) {
      recommendations.push(`${property.overdue_tasks_count} overdue task${property.overdue_tasks_count > 1 ? 's' : ''} – schedule to maintain seasonal protection.`);
    }
    
    // Check for self-reported tasks without verification
    const selfReportedTasks = taskHistory.filter(t => t.source === 'self_reported');
    if (selfReportedTasks.length > 0) {
      recommendations.push('Several tasks were last self-reported with no verification – we recommend scheduling a verified service to ensure optimal system life.');
    }
    
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

  // Check if there are verified professional tasks
  const hasVerifiedProTasks = taskHistory.some(t => 
    t.source === 'verified_pro' || t.source === 'verified_external'
  );

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Watermark overlay for shared report */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Main diagonal watermark */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-3">
          <div className="text-6xl font-bold text-blue-600 whitespace-nowrap text-center leading-tight">
            SHARED RIVO REPORT<br/>
            {property?.rivo_id}<br/>
            <span className="text-3xl">EXTERNAL ACCESS</span><br/>
            <span className="text-2xl">EXPIRES: {format(parseISO(expiresAt), "MM/dd/yyyy")}</span>
          </div>
        </div>
        
        {/* Corner watermarks */}
        <div className="absolute top-4 left-4 opacity-10 transform rotate-[-45deg]">
          <span className="text-sm text-blue-600 font-bold">SHARED REPORT</span>
        </div>
        <div className="absolute top-4 right-4 opacity-10 transform rotate-[45deg]">
          <span className="text-sm text-blue-600 font-bold">{property?.rivo_id}</span>
        </div>
        <div className="absolute bottom-4 left-4 opacity-10 transform rotate-[-45deg]">
          <span className="text-sm text-blue-600 font-bold">EXPIRES: {format(parseISO(expiresAt), "MM/dd")}</span>
        </div>
        <div className="absolute bottom-4 right-4 opacity-10 transform rotate-[45deg]">
          <span className="text-sm text-blue-600 font-bold">EXTERNAL ACCESS</span>
        </div>
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-2"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 100px,
                rgba(37, 99, 235, 0.1) 100px,
                rgba(37, 99, 235, 0.1) 105px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 100px,
                rgba(37, 99, 235, 0.1) 100px,
                rgba(37, 99, 235, 0.1) 105px
              )
            `
          }}
        />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 relative z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shared Property Report</h1>
                <p className="text-sm text-gray-600">
                  Expires: {format(parseISO(expiresAt), "PPpp")}
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  ⚠️ This is a temporary shared link with limited access
                </p>
              </div>
            </div>
            <Button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Report Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              Rivo Report – Ownership Timeline Sample
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Property:</strong> {property.address}</p>
              <p><strong>Rivo ID:</strong> {property.rivo_id}</p>
              <p><strong>Report ID:</strong> {generateReportId()}</p>
              <p><strong>Report Generated:</strong> {format(new Date(), 'MMMM d, yyyy')}</p>
              <p><strong>Access Type:</strong> Shared External Link</p>
            </div>
          </div>

          {/* Summary Snapshot */}
          <div>
            <h2 className="text-lg font-bold text-blue-600 mb-4">Summary Snapshot</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Home Health Score:</strong> {property.home_health_score >= 80 ? 'B+' : property.home_health_score >= 60 ? 'C' : 'D'} ({property.home_health_score}/100)</p>
                <p><strong>Verified Tasks:</strong> {taskHistory.filter(t => t.source === 'verified_pro').length}</p>
                <p><strong>Verified External Tasks:</strong> {taskHistory.filter(t => t.source === 'verified_external').length}</p>
                <p><strong>DIY with Upload:</strong> {taskHistory.filter(t => t.source === 'diy_upload').length}</p>
              </div>
              <div>
                <p><strong>Self-Reported:</strong> {taskHistory.filter(t => t.source === 'self_reported').length}</p>
                <p><strong>Overdue:</strong> {property.overdue_tasks_count}</p>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p><strong>% of Tasks Verified:</strong> {taskHistory.length > 0 ? Math.round((taskHistory.filter(t => t.source === 'verified_pro' || t.source === 'verified_external').length / taskHistory.length) * 100) : 0}%</p>
              <p><strong>Next Maintenance Due:</strong> Change Air filter (June 2025)</p>
            </div>
          </div>

          {/* Ownership Timeline */}
          {property.owners && property.owners.length > 0 && (
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
                    {property.owners.map((owner, index) => (
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
                    <td className="border border-gray-300 px-3 py-2">{property.home_health_score}/100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Score */}
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-gray-900">
              Total Score: {property.home_health_score}/100
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
                {trustScoreData.reduce((sum, item) => sum + (item.task_count * 10), 0)}) * 100 = {property.home_health_score}
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
              
              <p>View the live, most recent version of this report: <span className="text-blue-600">www.rivohome.com/report/{property.rivo_id}</span></p>
            </div>
          </div>

          {/* Add shared report notice */}
          <div className="pt-6 border-t border-orange-200 bg-orange-50 p-4 rounded">
            <div className="text-sm text-orange-800">
              <p className="font-bold mb-2">🔗 SHARED REPORT NOTICE:</p>
              <p>This report is being accessed via a temporary shared link that expires on {format(parseISO(expiresAt), "PPP")}. 
              This document contains confidential property information and should not be redistributed. 
              For the most current version of this report, contact the property owner directly.</p>
            </div>
          </div>
          
          <div className="pt-4 text-center">
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p><strong>CONFIDENTIAL SHARED DOCUMENT:</strong> This report contains proprietary information and is shared for limited review purposes only. 
              Unauthorized distribution, copying, or modification is strictly prohibited. Shared link expires {format(parseISO(expiresAt), "PPP")}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 