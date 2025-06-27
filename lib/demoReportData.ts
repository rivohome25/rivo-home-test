/**
 * demoReportData.ts
 * Conceptual sample data for demonstrating planned RivoReport features on public pages
 * This represents how RivoReport might work when integrated with the RivoHome platform
 */

export const demoReportData = {
  property: {
    property_id: "demo-property-001",
    address: "1247 Maple Grove Drive, Orlando, FL, 32801",
    rivo_id: "RIV-FL-32801-DEMO",
    property_type: "Single Family",
    square_footage: 2150,
    purchase_date: "2023-06-15",
    region: "Southeast",
    year_built: 2018,
    home_health_score: 87,
    upcoming_tasks_count: 3,
    overdue_tasks_count: 1,
    completed_tasks_count: 24,
    total_maintenance_cost: 2850.00,
    estimated_home_value: 385000,
    last_updated: "2024-01-15T10:30:00Z"
  },
  
  taskHistory: [
    {
      id: "task-001",
      task_name: "HVAC Filter Replacement",
      category: "HVAC",
      status: "completed",
      priority: "medium",
      completion_date: "2024-01-10",
      cost: 45.00,
      provider_name: "AirFlow Professionals",
      provider_rating: 4.8,
      notes: "Replaced with high-efficiency filter. Next replacement due in 3 months."
    },
    {
      id: "task-002", 
      task_name: "Gutter Cleaning & Inspection",
      category: "Exterior",
      status: "completed",
      priority: "high",
      completion_date: "2024-01-05",
      cost: 185.00,
      provider_name: "Sunshine Gutters",
      provider_rating: 4.9,
      notes: "Cleaned all gutters, minor repair to downspout. Excellent condition overall."
    },
    {
      id: "task-003",
      task_name: "Water Heater Maintenance",
      category: "Plumbing",
      status: "completed",
      priority: "medium",
      completion_date: "2023-12-20",
      cost: 125.00,
      provider_name: "Reliable Plumbing Co.",
      provider_rating: 4.7,
      notes: "Flushed tank, checked anode rod. Good condition for 2 more years."
    },
    {
      id: "task-004",
      task_name: "Smoke Detector Battery Check",
      category: "Safety",
      status: "upcoming",
      priority: "high",
      due_date: "2024-01-25",
      estimated_cost: 25.00,
      notes: "Annual battery replacement and testing required."
    },
    {
      id: "task-005",
      task_name: "Exterior Paint Touch-up",
      category: "Exterior",
      status: "overdue",
      priority: "medium",
      due_date: "2024-01-01",
      estimated_cost: 350.00,
      notes: "South-facing trim needs attention due to sun exposure."
    }
  ],

  trustScoreData: [
    {
      month: "2023-07",
      score: 72,
      tasks_completed: 2,
      preventive_maintenance: 1,
      emergency_repairs: 1
    },
    {
      month: "2023-08",
      score: 75,
      tasks_completed: 3,
      preventive_maintenance: 2,
      emergency_repairs: 1
    },
    {
      month: "2023-09",
      score: 78,
      tasks_completed: 2,
      preventive_maintenance: 2,
      emergency_repairs: 0
    },
    {
      month: "2023-10",
      score: 81,
      tasks_completed: 4,
      preventive_maintenance: 3,
      emergency_repairs: 1
    },
    {
      month: "2023-11",
      score: 84,
      tasks_completed: 3,
      preventive_maintenance: 3,
      emergency_repairs: 0
    },
    {
      month: "2023-12",
      score: 87,
      tasks_completed: 3,
      preventive_maintenance: 3,
      emergency_repairs: 0
    }
  ],

  maintenanceInsights: {
    seasonal_recommendations: [
      "Winter prep: Check heating system efficiency",
      "Spring: Inspect roof for winter damage",
      "Summer: Service AC before peak season",
      "Fall: Clean gutters and check weatherstripping"
    ],
    cost_savings: {
      preventive_vs_reactive: 65,
      annual_savings: 1250,
      roi_percentage: 340
    },
    upcoming_priorities: [
      {
        task: "HVAC Annual Service",
        urgency: "High",
        estimated_cost: 185,
        due_date: "2024-02-15"
      },
      {
        task: "Roof Inspection",
        urgency: "Medium", 
        estimated_cost: 125,
        due_date: "2024-03-01"
      }
    ]
  }
};

export const generateDemoReportId = () => {
  return `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}; 