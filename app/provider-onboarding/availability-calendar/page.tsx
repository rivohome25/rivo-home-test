'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Slot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  buffer_min: number
}

export default function AvailabilityCalendarStep() {
  const router = useRouter()
  const [slots, setSlots]       = useState<Slot[]>([])
  const [day, setDay]           = useState(1)
  const [start, setStart]       = useState('09:00')
  const [end, setEnd]           = useState('17:00')
  const [buffer, setBuffer]     = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string|null>(null)

  // fetch existing slots
  useEffect(() => {
    fetch('/api/provider-availability')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setSlots(data) : setError(data.error))
      .catch(err => setError(err.message))
  }, [])

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const addSlot = async () => {
    setLoading(true); setError(null)
    const res = await fetch('/api/provider-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: day, start_time: start, end_time: end, buffer_min: buffer })
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to add slot')
    } else {
      // refresh
      const updated = await fetch('/api/provider-availability').then(r => r.json())
      setSlots(updated)
    }
    setLoading(false)
  }

  const deleteSlot = async (id: string) => {
    setLoading(true); setError(null)
    const res = await fetch(`/api/provider-availability?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to delete slot')
    } else {
      setSlots(slots.filter(s => s.id !== id))
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Step 9: Availability Calendar</h1>
      {error && <p className="text-red-600">{error}</p>}

      <section className="space-y-2">
        <h2 className="font-medium">Add a Time Slot</h2>
        <div className="flex space-x-2">
          <select
            value={day}
            onChange={e => setDay(+e.target.value)}
            className="rivo-input"
          >
            {days.map((d,i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
          <input
            type="time"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="rivo-input"
          />
          <input
            type="time"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="rivo-input"
          />
          <input
            type="number"
            min={0}
            value={buffer}
            onChange={e => setBuffer(+e.target.value)}
            className="rivo-input w-20"
            placeholder="Buffer (min)"
          />
          <button
            onClick={addSlot}
            disabled={loading}
            className="rivo-button"
          >
            {loading ? '…' : 'Add'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-medium">Your Slots</h2>
        {slots.length === 0 && <p className="text-gray-500">No slots yet.</p>}
        <ul className="mt-2 space-y-2">
          {slots.map(s => (
            <li key={s.id} className="flex items-center justify-between border p-2 rounded">
              <span>
                <strong>{days[s.day_of_week]}</strong>{' '}
                {s.start_time}–{s.end_time}{' '}
                {s.buffer_min > 0 && `(buffer ${s.buffer_min}m)`}
              </span>
              <button
                onClick={() => deleteSlot(s.id)}
                disabled={loading}
                className="text-red-600 hover:underline text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex justify-between">
        <button
          onClick={() => router.back()}
          className="rivo-button-outline"
        >
          Back
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="rivo-button"
        >
          Finish Onboarding
        </button>
      </div>
    </div>
  )
} 