'use client'
import { useState } from 'react'

interface Application {
  id: string;
  name: string;
  email: string;
  company: string;
  services: string[];
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export default function ProviderApplications() {
  const [applications] = useState<Application[]>([
    {
      id: '1',
      name: 'Robert Johnson',
      email: 'robert@acmeplumbing.com',
      company: 'Acme Plumbing Services',
      services: ['Plumbing Repairs', 'Water Heater Installation'],
      status: 'pending',
      appliedAt: '2024-05-20'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria@eliteelectrical.com',
      company: 'Elite Electrical Solutions',
      services: ['Electrical Repairs', 'Smart Home Installation'],
      status: 'pending',
      appliedAt: '2024-05-18'
    },
    {
      id: '3',
      name: 'Thomas Wilson',
      email: 'thomas@superiorroofing.com',
      company: 'Superior Roofing Co.',
      services: ['Roof Inspection', 'Leak Repair', 'Full Roof Replacement'],
      status: 'approved',
      appliedAt: '2024-05-10'
    },
    {
      id: '4',
      name: 'Jennifer Lee',
      email: 'jennifer@greenlandscaping.com',
      company: 'Green Landscaping',
      services: ['Lawn Care', 'Tree Trimming', 'Seasonal Maintenance'],
      status: 'rejected',
      appliedAt: '2024-05-16'
    }
  ])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Provider Applications</h2>
      <div className="space-y-4">
        <div className="flex justify-between mb-4">
          <p className="text-gray-500 text-sm">Review and manage service provider applications.</p>
          <div className="flex gap-2">
            <select className="text-sm border rounded-md px-2 py-1">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className={`border rounded-lg p-4 ${
              app.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
              app.status === 'approved' ? 'border-green-200 bg-green-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{app.company}</h3>
                  <p className="text-sm text-gray-600">{app.name} • {app.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {app.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">Services: {app.services.join(', ')}</p>
              <p className="text-xs text-gray-500">Applied on: {app.appliedAt}</p>
              
              {app.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition">
                    Approve
                  </button>
                  <button className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition">
                    Reject
                  </button>
                  <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
                    View Details
                  </button>
                </div>
              )}
              
              {app.status !== 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
                    View Details
                  </button>
                  <button className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition">
                    {app.status === 'approved' ? 'Revoke Approval' : 'Reconsider'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end items-center mt-4">
          <span className="text-sm text-gray-500 mr-2">Showing 4 of 12 applications</span>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All →
          </button>
        </div>
      </div>
    </div>
  )
} 