"use client"

export function DateTimePicker({
  date,
  time,
  onChange,
}: {
  date: string
  time: string
  onChange: (d: { date: string; time: string }) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Date</span>
        <input
          type="date"
          className="h-10 rounded border border-gray-300 px-3"
          value={date}
          onChange={(e) => onChange({ date: e.target.value, time })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">Time</span>
        <input
          type="time"
          className="h-10 rounded border border-gray-300 px-3"
          value={time}
          onChange={(e) => onChange({ date, time: e.target.value })}
        />
      </label>
    </div>
  )
}
