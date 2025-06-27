import { AvailabilityTester } from '@/components/scheduling/AvailabilityTester';

export default function TestSlotsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Slot Generator Test</h1>
        <p className="text-gray-600 mt-2">
          Test the real-time slot generation with conflict detection
        </p>
      </div>
      
      <AvailabilityTester providerId="a70fe297-bd1a-4c55-8f26-a0bc053cf51e" />
      
      <div className="mt-8 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">How it works:</h2>
        <div className="bg-gray-50 p-6 rounded-lg space-y-3 text-sm">
          <p><strong>1. Real-time slot generation:</strong> The system generates 30-minute slots based on the provider's weekly schedule</p>
          <p><strong>2. Conflict detection:</strong> Existing bookings and unavailability blocks are automatically excluded</p>
          <p><strong>3. Interactive booking:</strong> Click any time slot to create a test booking</p>
          <p><strong>4. Dynamic updates:</strong> After booking, refresh to see the slot disappear from availability</p>
          <p><strong>5. Multiple days:</strong> The system shows availability across the entire week</p>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Current test schedule:</strong> Monday 9AM-5PM, Tuesday 10AM-6PM, Wednesday 9AM-5PM, 
            Thursday 8AM-4PM, Friday 9AM-3PM. Notice existing bookings create gaps in availability.
          </p>
        </div>
      </div>
    </div>
  );
} 