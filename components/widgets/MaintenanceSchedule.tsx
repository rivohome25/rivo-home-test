export default function MaintenanceSchedule() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Maintenance Schedule</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">This widget displays your upcoming maintenance tasks.</p>
        
        <div className="border-t pt-3">
          <ul className="space-y-2">
            <li className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Gutter Cleaning</p>
                <p className="text-sm text-gray-600">Remove debris from gutters and downspouts</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Due in 3 days</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">HVAC Service</p>
                <p className="text-sm text-gray-600">Annual system inspection and tune-up</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Due in 2 weeks</span>
            </li>
            <li className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Smoke Detector Test</p>
                <p className="text-sm text-gray-600">Replace batteries and test all units</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Due in 1 month</span>
            </li>
          </ul>
        </div>
        
        <button className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
          Add New Task
        </button>
      </div>
    </div>
  )
} 