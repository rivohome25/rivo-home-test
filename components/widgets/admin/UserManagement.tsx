'use client'
import { useState } from 'react'

interface User {
  id: string;
  email: string;
  role: string;
  tier: number;
  status: string;
  joinedAt: string;
}

export default function UserManagement() {
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'johndoe@example.com',
      role: 'homeowner',
      tier: 1,
      status: 'active',
      joinedAt: '2024-05-10'
    },
    {
      id: '2',
      email: 'janedoe@example.com',
      role: 'homeowner',
      tier: 0,
      status: 'active',
      joinedAt: '2024-05-15'
    },
    {
      id: '3',
      email: 'mike@servicepro.com',
      role: 'provider',
      tier: 0,
      status: 'active',
      joinedAt: '2024-05-02'
    },
    {
      id: '4',
      email: 'susan@repairtech.com',
      role: 'provider',
      tier: 0,
      status: 'pending',
      joinedAt: '2024-05-18'
    },
    {
      id: '5',
      email: 'bob@example.com',
      role: 'homeowner',
      tier: 0,
      status: 'inactive',
      joinedAt: '2024-04-25'
    }
  ])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">User Management</h2>
      <div className="space-y-4">
        <div className="flex justify-between mb-4">
          <p className="text-gray-500 text-sm">Manage all system users.</p>
          <div className="flex gap-2">
            <select className="text-sm border rounded-md px-2 py-1">
              <option value="all">All Roles</option>
              <option value="homeowner">Homeowners</option>
              <option value="provider">Providers</option>
            </select>
            <select className="text-sm border rounded-md px-2 py-1">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">{user.email}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'provider' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{user.tier}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{user.joinedAt}</td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
                        Edit
                      </button>
                      <button className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition">
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Add New User
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Showing 5 of 24 users</span>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 