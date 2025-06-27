'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Slot {
  slot_start: string;
  slot_end: string;
}

interface AvailabilityResponse {
  slots: Slot[];
  grouped_slots: Record<string, Slot[]>;
  total_slots: number;
}

export function AvailabilityTester({ providerId }: { providerId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [groupedSlots, setGroupedSlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const from = '2025-06-02T09:00:00Z'; // Monday
      const to = '2025-06-06T18:00:00Z';   // Friday
      
      const response = await fetch(
        `/api/availability?provider_id=${providerId}&from=${from}&to=${to}&slot_mins=30`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      
      const data: AvailabilityResponse = await response.json();
      setSlots(data.slots);
      setGroupedSlots(data.grouped_slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async (slot: Slot) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id: providerId,
          start_ts: slot.slot_start,
          end_ts: slot.slot_end,
          service_type: 'Test Service',
          description: 'Test booking from slot generator'
        })
      });

      if (response.ok) {
        alert('Booking created successfully!');
        fetchSlots(); // Refresh to show the new booking conflict
      } else {
        const error = await response.json();
        alert(`Booking failed: ${error.error}`);
      }
    } catch (error) {
      alert(`Booking error: ${error}`);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchSlots();
  }, [providerId]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Available Slots Tester</CardTitle>
        <p className="text-sm text-gray-600">
          Provider ID: {providerId}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={fetchSlots} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Slots'}
          </Button>

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Found {slots.length} available slots
          </div>

          {Object.entries(groupedSlots).map(([date, daySlots]) => (
            <div key={date} className="border rounded p-4">
              <h3 className="font-semibold mb-2">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daySlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => bookSlot(slot)}
                    className="text-xs"
                  >
                    {formatTime(slot.slot_start)}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {slots.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No available slots found for the selected time range.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 