'use client'
import { useState } from 'react'

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  updatedAt: string;
}

export default function Documents() {
  const [documents] = useState<Document[]>([
    {
      id: 1,
      name: 'Home Inspection Report',
      type: 'PDF',
      size: '2.4 MB',
      updatedAt: '2024-05-15'
    },
    {
      id: 2,
      name: 'Warranty Documents',
      type: 'PDF',
      size: '1.8 MB',
      updatedAt: '2024-05-10'
    },
    {
      id: 3,
      name: 'Appliance Manuals',
      type: 'ZIP',
      size: '5.2 MB',
      updatedAt: '2024-04-22'
    }
  ])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Access and manage your important home documents.</p>
        
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-blue-600 font-medium">{doc.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{doc.type}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{doc.size}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{doc.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Upload Document
        </button>
      </div>
    </div>
  )
} 