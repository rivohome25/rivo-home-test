/**
 * report-preview-section.tsx
 * Component to showcase Rivo property reports on the home page
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye,
  Star,
  Home,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoReportData, generateDemoReportId } from "@/lib/demoReportData";
import { format } from "date-fns";

export function ReportPreviewSection() {
  const [showModal, setShowModal] = useState(false);
  const { property, taskHistory, trustScoreData, maintenanceInsights } = demoReportData;

  // Disable common keyboard shortcuts for content theft
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+C, Ctrl+P
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'A')) ||
        (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'upcoming':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      {/* Main Preview Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              See Your Home's Story Unfold
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Every Rivo report tells the complete story of your home's maintenance journey, 
              from day one to today. See how we track, protect, and enhance your investment.
            </p>
            
            <Button 
              onClick={() => setShowModal(true)}
              size="lg"
              className="bg-rivo-base hover:bg-rivo-dark text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Eye className="h-5 w-5 mr-2" />
              View Sample Report
            </Button>
          </motion.div>


        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden select-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onSelectStart={(e) => e.preventDefault()}
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserDrag: 'none',
              KhtmlUserSelect: 'none'
            }}
          >
            {/* Modal Header */}
            <div className="bg-rivo-base text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Sample Rivo Property Report</h2>
                <p className="text-rivo-light opacity-90">{property.address}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content with Watermarks */}
            <div className="p-6 overflow-y-auto max-h-[70vh] relative">
              {/* Enhanced Multi-Layer Watermarks */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Primary diagonal watermark */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-8xl font-black text-red-500 opacity-40 select-none">
                  DEMO ONLY
                </div>
                
                {/* Secondary diagonal watermark */}
                <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 rotate-45 text-6xl font-bold text-blue-600 opacity-30 select-none">
                  RIVO SAMPLE
                </div>
                
                {/* Third diagonal watermark */}
                <div className="absolute top-2/3 left-2/3 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 text-5xl font-bold text-gray-600 opacity-35 select-none">
                  NOT FOR USE
                </div>
                
                {/* Corner watermarks - more prominent */}
                <div className="absolute top-2 right-2 text-lg font-bold text-red-600 opacity-70 select-none bg-yellow-200 px-2 py-1 rounded">
                  DEMO REPORT
                </div>
                <div className="absolute bottom-2 left-2 text-lg font-bold text-red-600 opacity-70 select-none bg-yellow-200 px-2 py-1 rounded">
                  SAMPLE ONLY
                </div>
                <div className="absolute top-2 left-2 text-sm font-bold text-blue-600 opacity-60 select-none">
                  © RIVOHOME 2025
                </div>
                <div className="absolute bottom-2 right-2 text-sm font-bold text-blue-600 opacity-60 select-none">
                  UNAUTHORIZED USE PROHIBITED
                </div>
                
                {/* Repeating pattern watermarks */}
                <div className="absolute top-16 left-16 text-2xl font-bold text-gray-400 opacity-25 select-none transform -rotate-12">
                  DEMO
                </div>
                <div className="absolute top-32 right-16 text-2xl font-bold text-gray-400 opacity-25 select-none transform rotate-12">
                  SAMPLE
                </div>
                <div className="absolute top-48 left-32 text-2xl font-bold text-gray-400 opacity-25 select-none transform -rotate-12">
                  DEMO
                </div>
                <div className="absolute top-64 right-32 text-2xl font-bold text-gray-400 opacity-25 select-none transform rotate-12">
                  SAMPLE
                </div>
                <div className="absolute top-80 left-48 text-2xl font-bold text-gray-400 opacity-25 select-none transform -rotate-12">
                  DEMO
                </div>
                
                {/* Vertical watermarks */}
                <div className="absolute left-1/4 top-0 bottom-0 flex items-center justify-center">
                  <div className="transform rotate-90 text-3xl font-bold text-purple-600 opacity-20 select-none">
                    RIVO DEMO REPORT
                  </div>
                </div>
                <div className="absolute right-1/4 top-0 bottom-0 flex items-center justify-center">
                  <div className="transform -rotate-90 text-3xl font-bold text-purple-600 opacity-20 select-none">
                    SAMPLE NOT FOR USE
                  </div>
                </div>
                
                {/* Timestamp watermark */}
                <div className="absolute top-1/2 right-4 transform -rotate-90 text-xs text-gray-500 opacity-50 select-none">
                  Generated: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')} | DEMO VERSION
                </div>
              </div>

              {/* Report Header */}
              <div className="text-center mb-6 relative z-20">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">Rivo Report – Ownership Timeline Sample</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Property:</strong> {property.address}</div>
                  <div><strong>Rivo ID:</strong> {property.rivo_id}</div>
                  <div><strong>Report ID:</strong> RIV-RPT-MC5R5SM</div>
                  <div><strong>Report Generated:</strong> {format(new Date(), 'MMMM dd, yyyy')}</div>
                </div>
              </div>

              {/* Summary Snapshot */}
              <div className="mb-6 relative z-20">
                <h2 className="text-lg font-bold text-blue-600 mb-3">Summary Snapshot</h2>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <div><strong>Home Health Score:</strong> B+ (97/100)</div>
                    <div><strong>Verified Tasks:</strong> 2</div>
                    <div><strong>Verified External Tasks:</strong> 0</div>
                    <div><strong>DIY with Upload:</strong> 1</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Self-Reported:</strong> 0</div>
                    <div><strong>Overdue:</strong> 0</div>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <div><strong>% of Tasks Verified:</strong> 67%</div>
                  <div><strong>Next Maintenance Due:</strong> Change Air filter (June 2025)</div>
                </div>
              </div>

              {/* Ownership Timeline */}
              <div className="mb-6 relative z-20">
                <h2 className="text-lg font-bold text-blue-600 mb-3">Ownership Timeline</h2>
                <div className="border border-gray-300">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-r border-gray-300">Owner</th>
                        <th className="text-left p-3 border-r border-gray-300">Date Range</th>
                        <th className="text-left p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300"></td>
                        <td className="p-3 border-r border-gray-300">2025-06-11 - Present</td>
                        <td className="p-3">Report Initiator</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Maintenance History */}
              <div className="mb-6 relative z-20">
                <h2 className="text-lg font-bold text-blue-600 mb-3">Maintenance History</h2>
                <div className="border border-gray-300">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-r border-gray-300">Date</th>
                        <th className="text-left p-3 border-r border-gray-300">Task</th>
                        <th className="text-left p-3 border-r border-gray-300">Status</th>
                        <th className="text-left p-3 border-r border-gray-300">Source</th>
                        <th className="text-left p-3 border-r border-gray-300">Notes</th>
                        <th className="text-left p-3">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300">06/17/2025</td>
                        <td className="p-3 border-r border-gray-300">Trim vegetation near home</td>
                        <td className="p-3 border-r border-gray-300">
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Verified
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-300">Rivo Pro – CleanFlow</td>
                        <td className="p-3 border-r border-gray-300">Task completed via modal – Professional service</td>
                        <td className="p-3">Current</td>
                      </tr>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300">06/11/2025</td>
                        <td className="p-3 border-r border-gray-300">Inspect HVAC system</td>
                        <td className="p-3 border-r border-gray-300">
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Verified
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-300">Homeowner</td>
                        <td className="p-3 border-r border-gray-300">Task completed via modal – DIY completion</td>
                        <td className="p-3">Current</td>
                      </tr>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300">06/11/2025</td>
                        <td className="p-3 border-r border-gray-300">Treat for ants and roaches</td>
                        <td className="p-3 border-r border-gray-300">
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Verified
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-300">Rivo Pro – CleanFlow</td>
                        <td className="p-3 border-r border-gray-300">Task completed via modal – Professional service</td>
                        <td className="p-3">Current</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trust Score Breakdown */}
              <div className="mb-6 relative z-20">
                <h2 className="text-lg font-bold text-blue-600 mb-3">Trust Score Breakdown</h2>
                <div className="border border-gray-300">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-r border-gray-300">Task Source</th>
                        <th className="text-left p-3 border-r border-gray-300">Count</th>
                        <th className="text-left p-3 border-r border-gray-300">Weight</th>
                        <th className="text-left p-3">Score Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300">
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Verified Pro
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-300">2</td>
                        <td className="p-3 border-r border-gray-300">1.0</td>
                        <td className="p-3">200 pts</td>
                      </tr>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300">
                          <span className="flex items-center">
                            <Home className="h-4 w-4 text-blue-500 mr-1" />
                            DIY + Upload
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-300">1</td>
                        <td className="p-3 border-r border-gray-300">0.9</td>
                        <td className="p-3">90 pts</td>
                      </tr>
                      <tr className="border-t border-gray-300">
                        <td className="p-3 border-r border-gray-300">
                          <span className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            Overdue/Skipped
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-300">0</td>
                        <td className="p-3 border-r border-gray-300">0.0</td>
                        <td className="p-3">0 pts</td>
                      </tr>
                      <tr className="border-t border-gray-300 bg-gray-50 font-semibold">
                        <td className="p-3 border-r border-gray-300">Total Score</td>
                        <td className="p-3 border-r border-gray-300">—</td>
                        <td className="p-3 border-r border-gray-300">—</td>
                        <td className="p-3">97/100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Service Recommendations */}
              <div className="mb-6 relative z-20">
                <h2 className="text-lg font-bold text-blue-600 mb-3">Service Recommendations</h2>
                <div className="text-sm text-gray-600">
                  <p>Based on your property's maintenance history and current condition, we recommend continuing with regular preventive maintenance to maintain your excellent trust score.</p>
                </div>
              </div>

              {/* Footer Notes */}
              <div className="text-xs text-gray-500 space-y-2 border-t pt-4 relative z-20">
                <h3 className="font-bold text-blue-600">Footer Notes</h3>
                <div>
                  <strong>Powered by RivoHome</strong><br />
                  Trusted by homeowners and professionals nationwide.
                </div>
                <div>
                  <strong>Privacy & Trust Balance:</strong> Maintenance tasks are labeled by verification level. Personal identifiers from prior owners are anonymized upon transfer.
                </div>
                <div>
                  <strong>Disclaimer:</strong> This report is based on user-submitted or third-party data. RivoHome is not liable for accuracy of self-reported information.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                This is a sample report. <span className="font-medium">Sign up to get your real property report!</span>
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
} 