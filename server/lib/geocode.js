import { sql } from '../db.js'

const MAX_ADDRESS_LENGTH = 60

export function coordKey(lat, lng) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

function composeAddress(data) {
  const a = data?.address
  if (!a) return data?.display_name?.slice(0, MAX_ADDRESS_LENGTH) ?? null

  const street = [a.house_number, a.road].filter(Boolean).join(' ')
  const place = a.city || a.town || a.village
  const parts = [street, place].filter(Boolean)

  const address = parts.length > 0 ? parts.join(', ') : data.display_name
  return address ? address.slice(0, MAX_ADDRESS_LENGTH) : null
}

// Never throws: a geocoder outage or a missing GEOCODE_USER_AGENT must never break a
// check-in. Every failure path resolves to null instead.
export async function reverseGeocode(lat, lng) {
  const userAgent = process.env.GEOCODE_USER_AGENT
  if (!userAgent) return null

  const key = coordKey(lat, lng)

  try {
    const [cached] = await sql`SELECT address FROM geocode_cache WHERE coord_key = ${key}`
    if (cached) return cached.address

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`
    const res = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return null

    const data = await res.json()
    const address = composeAddress(data)
    if (!address) return null

    await sql`
      INSERT INTO geocode_cache (coord_key, address) VALUES (${key}, ${address})
      ON CONFLICT (coord_key) DO NOTHING
    `
    return address
  } catch {
    return null
  }
}
