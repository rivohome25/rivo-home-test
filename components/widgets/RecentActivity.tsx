export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">This widget will display your recent home maintenance activities.</p>
        
        <div className="border-t pt-3">
          <ul className="space-y-2">
            <li className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">HVAC Filter Changed</p>
                <p className="text-sm text-gray-600">Replaced air filter in living room unit</p>
              </div>
              <span className="text-sm text-gray-500">2 days ago</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Scheduled Plumbing Inspection</p>
                <p className="text-sm text-gray-600">Annual inspection for main water lines</p>
              </div>
              <span className="text-sm text-gray-500">5 days ago</span>
            </li>
            <li className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Roof Repair Completed</p>
                <p className="text-sm text-gray-600">Fixed leak in master bedroom corner</p>
              </div>
              <span className="text-sm text-gray-500">1 week ago</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 