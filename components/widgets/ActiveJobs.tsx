export default function ActiveJobs() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active Jobs</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Current service jobs that need your attention.</p>
        
        <div className="border-t pt-3">
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-3 border rounded-lg bg-orange-50 border-orange-200">
              <div>
                <p className="font-medium">Johnson Residence</p>
                <p className="text-sm text-gray-600">HVAC repair - Main unit not cooling</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled: Tomorrow, 2:00 PM</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 mb-2">High Priority</span>
                <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">View Details</button>
              </div>
            </li>
            
            <li className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Smith Townhouse</p>
                <p className="text-sm text-gray-600">Plumbing - Leaking kitchen sink</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled: Wednesday, 10:00 AM</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mb-2">Normal</span>
                <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">View Details</button>
              </div>
            </li>
            
            <li className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium">Garcia Apartment</p>
                <p className="text-sm text-gray-600">Electrical - Replace outlets in kitchen</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled: Friday, 1:30 PM</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mb-2">Normal</span>
                <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">View Details</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 