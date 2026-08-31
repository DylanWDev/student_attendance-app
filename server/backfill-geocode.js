import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { coordKey, reverseGeocode } from './lib/geocode.js'

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED must be set in .env')
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Only verified rows are ever geocoded — an unverified row's coordinates could point at a
// student's home rather than the school, so it must never be resolved to an address.
const rows = await sql`
  SELECT DISTINCT latitude, longitude FROM attendance
  WHERE location_status = 'verified' AND address IS NULL
    AND latitude IS NOT NULL AND longitude IS NOT NULL
`

const uniqueKeys = new Map()
for (const row of rows) {
  uniqueKeys.set(coordKey(row.latitude, row.longitude), row)
}

console.log(`Backfilling ${uniqueKeys.size} unique coordinate(s)...`)

for (const [key, { latitude, longitude }] of uniqueKeys) {
  const address = await reverseGeocode(latitude, longitude)
  if (address) {
    await sql`
      UPDATE attendance
      SET address = ${address}
      WHERE location_status = 'verified'
        AND address IS NULL
        AND round(latitude::numeric, 4) = round(${latitude}::numeric, 4)
        AND round(longitude::numeric, 4) = round(${longitude}::numeric, 4)
    `
    console.log(key, '->', address)
  } else {
    console.log(key, '-> (no address resolved)')
  }
  await sleep(1100)
}

console.log('Backfill complete.')
