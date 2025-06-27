import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { getUserPlan } from '@/lib/getUserPlan';
import React from 'react';

// Register a font for better PDF rendering
Font.register({
  family: 'Open Sans',
  src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0bf8pkAg.woff2'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Open Sans'
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  label: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold'
  },
  value: {
    fontSize: 12,
    color: '#6b7280'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  statBox: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    width: '23%',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10
  }
});

interface ReportData {
  properties: Array<{
    id: string;
    name: string;
    address: string;
    purchase_date: string;
    property_type: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    completed: boolean;
    completed_at?: string;
    completed_by?: 'diy' | 'professional';
    priority: string;
    category: string;
    property_id: string;
  }>;
  documents: Array<{
    id: string;
    file_name: string;
    file_type: string;
    upload_date: string;
    property_id: string;
  }>;
  completionStats: {
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
    diyCompleted: number;
    professionalCompleted: number;
  };
}

const PDFReport = ({ reportData, userEmail, dateRange }: { 
  reportData: ReportData; 
  userEmail: string;
  dateRange: string;
}) => {
  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'RivoHome Maintenance Report'),
        React.createElement(Text, { style: styles.subtitle }, 
          `Generated on ${new Date().toLocaleDateString()} • ${userEmail}`
        ),
        React.createElement(Text, { style: styles.subtitle }, 
          `Report Period: Last ${dateRange} days`
        )
      ),

      // Summary Statistics
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Summary Statistics'),
        React.createElement(View, { style: styles.statsGrid },
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statNumber }, reportData.properties.length.toString()),
            React.createElement(Text, { style: styles.statLabel }, 'Properties')
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statNumber }, reportData.completionStats.completed.toString()),
            React.createElement(Text, { style: styles.statLabel }, 'Completed')
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statNumber }, reportData.completionStats.diyCompleted.toString()),
            React.createElement(Text, { style: styles.statLabel }, 'DIY')
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statNumber }, reportData.completionStats.professionalCompleted.toString()),
            React.createElement(Text, { style: styles.statLabel }, 'Professional')
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statNumber }, reportData.completionStats.overdue.toString()),
            React.createElement(Text, { style: styles.statLabel }, 'Overdue')
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: styles.statNumber }, reportData.completionStats.upcoming.toString()),
            React.createElement(Text, { style: styles.statLabel }, 'Upcoming')
          )
        )
      ),

      // Properties
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Properties'),
        ...reportData.properties.map((property) =>
          React.createElement(View, { key: property.id, style: styles.row },
            React.createElement(Text, { style: styles.label }, property.name),
            React.createElement(Text, { style: styles.value }, property.address)
          )
        )
      ),

      // Recent Tasks
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Recent Maintenance Activities'),
        ...reportData.tasks.slice(0, 10).map((task) =>
          React.createElement(View, { key: task.id, style: styles.row },
            React.createElement(Text, { style: styles.label }, 
              `${task.completed ? '✓' : '○'} ${task.title}${
                task.completed && task.completed_by ? 
                  ` (${task.completed_by === 'diy' ? 'DIY' : 'Professional'})` : 
                  ''
              }`
            ),
            React.createElement(Text, { style: styles.value }, 
              task.completed && task.completed_at ? 
                new Date(task.completed_at).toLocaleDateString() :
                new Date(task.due_date).toLocaleDateString()
            )
          )
        )
      ),

      // Documents
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Document Summary'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Total Documents'),
          React.createElement(Text, { style: styles.value }, reportData.documents.length.toString())
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Recent Uploads'),
          React.createElement(Text, { style: styles.value }, 
            `${reportData.documents.filter(doc => 
              new Date(doc.upload_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length} in last 30 days`
          )
        )
      ),

      // Footer
      React.createElement(Text, { style: styles.footer }, 
        'This report was generated by RivoHome • For questions, contact support@rivohome.com'
      )
    )
  );
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Premium plan
    const userPlan = await getUserPlan();
    if (!userPlan || userPlan.name !== 'Premium') {
      return NextResponse.json(
        { error: 'PDF reports are only available for Premium plan users' },
        { status: 403 }
      );
    }

    // Parse request body
    const { propertyId, dateRange, reportData } = await request.json();

    if (!reportData) {
      return NextResponse.json({ error: 'Report data is required' }, { status: 400 });
    }

    // Generate PDF
    const pdfDoc = React.createElement(PDFReport, { 
      reportData, 
      userEmail: user.email || 'Unknown User',
      dateRange: dateRange || '90'
    });
    
    const buffer = await pdf(pdfDoc).toBuffer();

    // Return PDF as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rivo-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
} 