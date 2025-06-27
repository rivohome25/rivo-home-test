export default function DIYLibrary() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">DIY Library</h2>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Premium</span>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Access our library of DIY maintenance guides and videos.</p>
        
        <div className="border-t pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium">HVAC Maintenance 101</h3>
                <p className="text-sm text-gray-600">Learn how to maintain your HVAC system for optimal performance</p>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium">Basic Plumbing Repairs</h3>
                <p className="text-sm text-gray-600">Fix common household plumbing issues without calling a professional</p>
              </div>
            </div>
          </div>
        </div>
        
        <button className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
          Browse All DIY Content
        </button>
      </div>
    </div>
  )
} 