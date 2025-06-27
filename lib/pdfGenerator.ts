/**
 * pdfGenerator.ts
 * PDF generation utility for property reports with watermark protection
 */

import { format } from 'date-fns';

// Define interfaces for data structures
interface PropertyReportData {
  reportData: any;
  taskHistory: any[];
  trustScoreData: any[];
  reportId: string;
  userInfo?: {
    email?: string;
    id?: string;
    full_name?: string;
  };
}

// Enhanced PDF generation with watermark protection
const generatePropertyReportPDF = async (data: PropertyReportData) => {
  const { reportData, taskHistory, trustScoreData, reportId, userInfo } = data;

  // Generate user watermark info
  const userWatermark = userInfo?.email || userInfo?.full_name || 'AUTHORIZED USER';
  const timestamp = format(new Date(), 'MM/dd/yyyy HH:mm:ss');

  try {
    // Create a comprehensive HTML document with watermark protection
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rivo Property Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px; 
              line-height: 1.4; 
              margin: 20px;
              color: #374151;
              position: relative;
              
              /* Disable text selection and context menu */
              -webkit-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
              -webkit-touch-callout: none;
            }
            
            /* Main diagonal watermark */
            .watermark-main {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              pointer-events: none;
              z-index: 1000;
              opacity: 0.08;
              font-size: 48px;
              font-weight: bold;
              color: #2563eb;
              white-space: nowrap;
              text-align: center;
              line-height: 1.2;
            }
            
            /* Repeating pattern watermark */
            .watermark-pattern {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 999;
              opacity: 0.03;
              background-image: 
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 80px,
                  rgba(37, 99, 235, 0.1) 80px,
                  rgba(37, 99, 235, 0.1) 85px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 80px,
                  rgba(37, 99, 235, 0.1) 80px,
                  rgba(37, 99, 235, 0.1) 85px
                );
            }
            
            /* Corner watermarks */
            .watermark-corner {
              position: fixed;
              pointer-events: none;
              z-index: 998;
              opacity: 0.06;
              font-size: 10px;
              color: #2563eb;
              font-weight: bold;
              transform: rotate(-45deg);
            }
            
            .watermark-top-left {
              top: 20px;
              left: 20px;
            }
            
            .watermark-top-right {
              top: 20px;
              right: 20px;
              transform: rotate(45deg);
            }
            
            .watermark-bottom-left {
              bottom: 20px;
              left: 20px;
            }
            
            .watermark-bottom-right {
              bottom: 20px;
              right: 20px;
              transform: rotate(45deg);
            }
            
            /* Content styling */
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
              position: relative;
              z-index: 2;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb; 
              margin-bottom: 15px; 
            }
            .subtitle { 
              font-size: 14px; 
              margin-bottom: 5px; 
            }
            .section { 
              margin-bottom: 25px; 
              position: relative;
              z-index: 2;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #2563eb; 
              margin-bottom: 12px; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 5px; 
            }
            .table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            .table th, .table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left; 
              font-size: 11px; 
            }
            .table th { 
              background-color: #f9fafb; 
              font-weight: bold; 
            }
            .grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 15px; 
            }
            .text { 
              margin-bottom: 8px; 
            }
            .bold { 
              font-weight: bold; 
            }
            .link { 
              color: #2563eb; 
            }
            
            /* Print-specific styles */
            @media print {
              body { margin: 0; }
              .watermark-main, .watermark-pattern, .watermark-corner { 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            
            /* Prevent common manipulation attempts */
            * {
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
              user-select: none !important;
            }
          </style>
        </head>
        <body>
          <!-- Multiple watermark layers -->
          <div class="watermark-main">
            CONFIDENTIAL<br/>
            RIVO PROPERTY REPORT<br/>
            ${reportData.rivo_id}<br/>
            ${userWatermark}<br/>
            ${timestamp}
          </div>
          
          <div class="watermark-pattern"></div>
          
          <div class="watermark-corner watermark-top-left">
            CONFIDENTIAL - ${reportData.rivo_id}
          </div>
          
          <div class="watermark-corner watermark-top-right">
            ${userWatermark}
          </div>
          
          <div class="watermark-corner watermark-bottom-left">
            ${timestamp}
          </div>
          
          <div class="watermark-corner watermark-bottom-right">
            RIVO PROTECTED
          </div>

          <div class="header">
            <div class="title">Rivo Report – Ownership Timeline Sample</div>
            <div class="subtitle"><strong>Property:</strong> ${reportData.address}</div>
            <div class="subtitle"><strong>Rivo ID:</strong> ${reportData.rivo_id}</div>
            <div class="subtitle"><strong>Report ID:</strong> ${reportId}</div>
            <div class="subtitle"><strong>Report Generated:</strong> ${format(new Date(), 'MMMM d, yyyy')}</div>
            <div class="subtitle"><strong>Generated for:</strong> ${userWatermark}</div>
          </div>

          <div class="section">
            <div class="section-title">Summary Snapshot</div>
            <div class="grid">
              <div>
                <div class="text"><span class="bold">Home Health Score:</span> ${reportData.home_health_score >= 80 ? 'B+' : reportData.home_health_score >= 60 ? 'C' : 'D'} (${reportData.home_health_score}/100)</div>
                <div class="text"><span class="bold">Verified Tasks:</span> ${taskHistory.filter(t => t.source === 'verified_pro').length}</div>
                <div class="text"><span class="bold">Verified External Tasks:</span> ${taskHistory.filter(t => t.source === 'verified_external').length}</div>
                <div class="text"><span class="bold">DIY with Upload:</span> ${taskHistory.filter(t => t.source === 'diy_upload').length}</div>
              </div>
              <div>
                <div class="text"><span class="bold">Self-Reported:</span> ${taskHistory.filter(t => t.source === 'self_reported').length}</div>
                <div class="text"><span class="bold">Overdue:</span> ${reportData.overdue_tasks_count}</div>
              </div>
            </div>
            <div class="text"><span class="bold">% of Tasks Verified:</span> ${taskHistory.length > 0 ? Math.round((taskHistory.filter(t => t.source === 'verified_pro' || t.source === 'verified_external').length / taskHistory.length) * 100) : 0}%</div>
            <div class="text"><span class="bold">Next Maintenance Due:</span> Change Air filter (June 2025)</div>
          </div>

          ${reportData.owners && reportData.owners.length > 0 ? `
          <div class="section">
            <div class="section-title">Ownership Timeline</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Date Range</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.owners.map(owner => `
                  <tr>
                    <td>${owner.owner_name}</td>
                    <td>${format(new Date(owner.start_date), 'yyyy-MM-dd')}${owner.end_date ? ` - ${format(new Date(owner.end_date), 'yyyy-MM-dd')}` : ' - Present'}</td>
                    <td>${owner.notes}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Maintenance History</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Notes</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                ${taskHistory.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280;">No maintenance history available</td>
                  </tr>
                ` : taskHistory.map(task => `
                  <tr>
                    <td>${format(new Date(task.task_date), 'MM/dd/yyyy')}</td>
                    <td>${task.task_type}</td>
                    <td>Verified</td>
                    <td>${task.source === 'verified_pro' ? 'Rivo Pro – CleanFlow' :
                          task.source === 'verified_external' ? 'CoolTech HVAC' : 'Homeowner'}</td>
                    <td>${task.notes || '—'}</td>
                    <td>Current</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Trust Score Breakdown</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Task Source</th>
                  <th>Count</th>
                  <th>Weight</th>
                  <th>Score Contribution</th>
                </tr>
              </thead>
              <tbody>
                ${trustScoreData.map(score => `
                  <tr>
                    <td>${score.verification_source === 'verified_pro' ? 'Verified RivoHome Pro' :
                          score.verification_source === 'verified_external' ? 'Verified Homeowner-Pro Technician' :
                          score.verification_source === 'diy_upload' ? 'DIY + Upload' :
                          score.verification_source === 'self_reported' ? 'Self-Reported' : 'Overdue/Skipped'}</td>
                    <td>${score.task_count}</td>
                    <td>${score.weight.toFixed(1)}</td>
                    <td>${score.contribution} pts</td>
                  </tr>
                `).join('')}
                <tr style="background-color: #f9fafb; font-weight: bold;">
                  <td>Total Score</td>
                  <td>—</td>
                  <td>—</td>
                  <td>${reportData.home_health_score}/100</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total Score -->
          <div class="section" style="text-align: center; margin: 30px 0;">
            <div style="font-size: 20px; font-weight: bold; color: #374151;">
              Total Score: ${reportData.home_health_score}/100
            </div>
          </div>

          ${taskHistory.some(t => t.source === 'verified_pro' || t.source === 'verified_external') ? `
          <!-- Report Label for Homeowner-Verified Professionals -->
          <div class="section" style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <div style="font-weight: bold; margin-bottom: 10px;">*Report Label for Homeowner-Verified Professionals:</div>
            <div style="font-size: 12px;">
              This task was completed by the homeowner, a verified [Electrician/HVAC Tech], and meets 
              professional self-service standards.
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Service Recommendations</div>
            ${(() => {
              const recommendations = [];
              if (reportData.overdue_tasks_count > 0) {
                recommendations.push(`${reportData.overdue_tasks_count} overdue task${reportData.overdue_tasks_count > 1 ? 's' : ''} – schedule to maintain seasonal protection.`);
              }
              if (taskHistory.filter(t => t.source === 'self_reported').length > 0) {
                recommendations.push('Several tasks were last self-reported with no verification – we recommend scheduling a verified service to ensure optimal system life.');
              }
              const hasPestControl = taskHistory.some(t => t.task_type.toLowerCase().includes('pest'));
              if (!hasPestControl) {
                recommendations.push('Pest control task not recorded last year – schedule to maintain seasonal protection.');
              }
              if (recommendations.length === 0) {
                recommendations.push('Continue your excellent maintenance routine to preserve your home\'s health score.');
              }
              return recommendations.map(rec => `<div class="text">- ${rec}</div>`).join('');
            })()}
          </div>

          <div class="section">
            <div class="section-title">Grade Range</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Score Range</th>
                  <th>Grade</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>90-100</td>
                  <td style="font-weight: bold;">A</td>
                  <td>Excellent upkeep</td>
                </tr>
                <tr>
                  <td>80-89</td>
                  <td style="font-weight: bold;">B</td>
                  <td>Good upkeep, minimal issues</td>
                </tr>
                <tr>
                  <td>70-79</td>
                  <td style="font-weight: bold;">C</td>
                  <td>Average upkeep, room for improvement</td>
                </tr>
                                 <tr>
                   <td>60-69</td>
                   <td style="font-weight: bold;">D</td>
                   <td>Below average upkeep, several skipped/missed</td>
                 </tr>
                <tr>
                  <td>Below 60</td>
                  <td style="font-weight: bold;">F</td>
                  <td>Poor upkeep, significant neglect</td>
                </tr>
              </tbody>
            </table>
                     </div>

          <div class="section">
            <div class="section-title">How Total Score is Calculated:</div>
            <div class="text" style="font-family: monospace; background-color: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px;">
              [(Sum of score contribution)/(Sum of count * 10)] * 100
            </div>
            <div class="text" style="font-family: monospace; background-color: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px;">
              (${trustScoreData.reduce((sum, score) => sum + score.contribution, 0)}/${trustScoreData.reduce((sum, score) => sum + (score.task_count * 10), 0)}) * 100 = ${reportData.home_health_score}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Footer Notes</div>
            <div class="text"><span class="bold">Powered by RivoHome</span><br>Trusted by homeowners and professionals nationwide.</div>
            <div class="text"><span class="bold">Privacy & Trust Balance:</span> Maintenance tasks are labeled by verification level. Personal identifiers from prior owners are anonymized upon transfer.</div>
            <div class="text"><span class="bold">Disclaimer:</span> This report is based on user-submitted or third-party data. RivoHome is not liable for missed tasks, inaccurate entries, or technology disruptions affecting data integrity. Use this report as a tool—not a substitute—for professional inspections.</div>
            <div class="text"><span class="link">View the live, most recent version of this report: www.rivohome.com/report/${reportData.rivo_id}</span></div>
            <div class="text" style="margin-top: 20px; font-size: 10px; color: #6b7280;">
              <span class="bold">CONFIDENTIAL DOCUMENT:</span> This report is generated exclusively for ${userWatermark} and contains proprietary information. 
              Unauthorized distribution, copying, or modification is strictly prohibited and may be subject to legal action.
              Report generated on ${timestamp} - Document ID: ${reportId}
            </div>
          </div>
          
          <script>
            // Additional protection measures
            (function() {
              // Disable common shortcuts and interactions
              document.addEventListener('keydown', function(e) {
                // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+P (in browser)
                if (e.keyCode === 123 || 
                    (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
                    (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83))) {
                  e.preventDefault();
                  return false;
                }
              });

              // Disable right-click context menu
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
              });

              // Add dynamic watermarks to each section
              function addSectionWatermarks() {
                const sections = document.querySelectorAll('.section');
                sections.forEach((section, index) => {
                  const watermark = document.createElement('div');
                  watermark.style.cssText = \`
                    position: absolute;
                    top: 30%;
                    right: 10%;
                    transform: rotate(-15deg);
                    font-size: 14px;
                    color: rgba(37, 99, 235, 0.04);
                    pointer-events: none;
                    font-weight: bold;
                    z-index: 1;
                    white-space: nowrap;
                  \`;
                  watermark.textContent = '${reportData.rivo_id} - ${userWatermark}';
                  section.style.position = 'relative';
                  section.appendChild(watermark);
                });
              }

              // Run watermark functions
              document.addEventListener('DOMContentLoaded', addSectionWatermarks);
              window.addEventListener('beforeprint', addSectionWatermarks);
              
              // Periodic watermark refresh to prevent static removal
              setInterval(() => {
                const watermarks = document.querySelectorAll('.watermark-main');
                watermarks.forEach(watermark => {
                  watermark.style.transform = \`translate(-50%, -50%) rotate(\${-45 + Math.random() * 2}deg)\`;
                });
              }, 30000);
            })();
          </script>
        </body>
      </html>
    `;

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in a new window and trigger print
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        // Clean up
        URL.revokeObjectURL(url);
        
        // Focus and print
        printWindow.focus();
        printWindow.print();
        
        // Optional: Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    } else {
      // Fallback: create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `rivo-report-${reportData.rivo_id}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

export { generatePropertyReportPDF }; 