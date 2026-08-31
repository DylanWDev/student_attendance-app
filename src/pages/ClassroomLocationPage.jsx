import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../libs/api.js'
import { friendlyError } from '../libs/errorMessages.js'
import FriendlyError from '../components/FriendlyError.jsx'

export default function ClassroomLocationPage() {
  const [current, setCurrent] = useState(undefined) // undefined = loading, null = unset
  const [radius, setRadius] = useState('150')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    apiGet('/teacher/classroom-location')
      .then((res) => {
        setCurrent(res)
        if (res) setRadius(String(res.radius_m))
      })
      .catch(() => setError('Could not load the classroom location.'))
  }, [])

  function handleUseCurrentLocation() {
    setError('')
    setSaved(false)

    if (!navigator.geolocation) {
      setError('This browser cannot access location. Try entering coordinates on another device.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await apiPost('/teacher/classroom-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusM: Number(radius),
          })
          setCurrent(res)
          setSaved(true)
        } catch (err) {
          setError(friendlyError(err))
        } finally {
          setLocating(false)
        }
      },
      () => {
        setError('Could not get your location — check the browser permission and try again.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="max-w-sm space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Classroom location</h2>
        {current === undefined ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : current ? (
          <div className="text-sm text-slate-600 space-y-1">
            <p className="font-mono">
              {current.latitude.toFixed(5)}, {current.longitude.toFixed(5)}
            </p>
            <p>Radius: {current.radius_m} m</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Not set yet.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="radius" className="block text-sm font-medium text-slate-700">
            Radius (meters)
          </label>
          <span className="text-xs text-slate-400">Max 5000 m</span>
        </div>
        <input
          id="radius"
          type="number"
          min="1"
          max="5000"
          required
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <FriendlyError message={error} />
        {saved && <p className="text-sm text-green-600">Saved!</p>}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-60"
        >
          {locating ? 'Finding your location…' : 'Use my current location'}
        </button>
        <p className="text-xs text-slate-400">
          Stand in the classroom before pressing this — it sets the location check-ins are
          measured against.
        </p>
      </div>
    </div>
  )
}
