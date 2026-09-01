import { randomUUID } from 'node:crypto'
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED must be set in .env (used for migrations, not the pooled DATABASE_URL)')
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED)

// BUS 305 roster (79 students), transcribed verbatim from the source spreadsheet.
const roster = [
  ['901844790', 'Maya', 'Adkins'],
  ['901844635', 'Darius', 'Akal'],
  ['901801537', 'Olivia', 'Allen'],
  ['901806812', 'Diego', 'Alvarez'],
  ['901806841', 'Brandon', 'Anderson'],
  ['901810554', 'Alex', 'Bacalla'],
  ['901833034', 'Ava', 'Baxter'],
  ['901843113', 'Jenna Jade', 'Bevins'],
  ['901862011', 'Johnny', 'Bingham'],
  ['901817280', 'Nate', 'Blankenship'],
  ['901846583', 'Caden', 'Bowles'],
  ['901434078', 'Tyler', 'Bransom'],
  ['901409090', 'Kerri', 'Bratcher'],
  ['901828541', 'Lilly', 'Brigham'],
  ['901650913', 'Ben', 'Brown'],
  ['901852375', 'Kyle', 'Brueckman'],
  ['901820435', 'Dylan', 'Callaway'],
  ['901843894', 'Blake', 'Caudill'],
  ['901830626', 'Lewey', 'Childers'],
  ['901827205', 'Allison', 'Collins'],
  ['901855782', 'Iteriteka', 'Delfin'],
  ['901869934', 'Emma', 'Dowell'],
  ['901846288', 'Cameron', 'Ealey'],
  ['901847151', 'Ava', 'Fillhardt'],
  ['901829351', 'Earl', 'Fletcher'],
  ['901820721', 'Jaylon', 'Forbes'],
  ['901885090', 'Sarah', 'Foster'],
  ['901808254', 'Caden', 'Fuller'],
  ['901873576', 'Laura', 'Graham'],
  ['901826489', 'Mikayla', 'Hammond'],
  ['901833050', 'Jaxon', 'Hampton'],
  ['901827136', 'Mary', 'Hoerter'],
  ['901850757', 'Jack', 'Howard'],
  ['901830226', 'Brady', 'Hutchins'],
  ['901836066', 'Kaden', 'Jones'],
  ['901858771', 'Nathaniel', 'Kincaid'],
  ['901827347', 'Nathan', 'Kirst'],
  ['901824746', 'Alexandrea', 'Knight'],
  ['901846048', 'MaKayla', 'Laguna'],
  ['901839742', 'Marcus', 'Lashbrook'],
  ['901852393', 'Jacob', 'Lewallen'],
  ['901839534', 'Tenzing', 'Lindeman'],
  ['901884560', 'Joshua', 'Lowe'],
  ['901849649', 'Owen', 'Lowe'],
  ['901828458', 'Casey', 'Martis'],
  ['901833417', 'Jack', 'McGrath'],
  ['901878467', 'Payne', 'Miller'],
  ['901820617', 'Jack', 'Mitrovich'],
  ['901801959', 'Colin', 'Monohan'],
  ['901841844', 'Malachi', 'Muncy'],
  ['901836978', 'Abbie', 'Neice'],
  ['901852162', 'Ethan', 'Nichols'],
  ['901839405', 'John', 'Orlandi'],
  ['901795759', 'Rebekah', 'Parks'],
  ['901828615', 'Riley', 'Parsons'],
  ['901846094', 'Nick', 'Patel'],
  ['901852215', 'Rantz', 'Payton'],
  ['901864816', 'Jaycelyn', 'Pearson'],
  ['901822279', 'Matilyn', 'Perkins'],
  ['901818503', 'Kaison', 'Phillips'],
  ['901821743', 'Mason', 'Price'],
  ['901704217', 'Kamryn', 'Randall'],
  ['901832057', 'Nate', 'Richmond'],
  ['901803816', 'Xavier', 'Rose'],
  ['901848484', 'Samuel', 'Salgado'],
  ['901808128', 'Evan', 'Searcy'],
  ['901826256', 'Jacob', 'Smith'],
  ['901886600', 'Jalen', 'Smith'],
  ['901843413', 'Jolene', 'Spears'],
  ['901837141', 'Caden', 'Spicer'],
  ['901834469', 'Avery', 'Stewart'],
  ['901831422', 'Luke', 'Swiger'],
  ['901880085', 'Laci', 'Tanner'],
  ['901817369', 'Brinley', 'Taylor'],
  ['901836309', 'Noah', 'Thompson'],
  ['901884142', 'Luna', 'Ueda'],
  ['901860778', 'Michael', 'Waugerman'],
  ['901884149', 'Maurice', 'Wells'],
  ['901828669', 'Cooper', 'Yuhas'],
]

let added = 0
let skipped = 0

for (const [number, first, last] of roster) {
  const [row] = await sql`
    INSERT INTO students (id, first_name, last_name, student_number)
    VALUES (${randomUUID()}, ${first}, ${last}, ${number})
    ON CONFLICT (lower(student_number)) DO NOTHING
    RETURNING id
  `
  if (row) {
    added += 1
  } else {
    skipped += 1
  }
}

console.log(`Added ${added}, skipped ${skipped}.`)

// One-off cleanup: '0001' (Noah W) was a test row. Soft-deleted so it drops off the
// roster and dashboard; its attendance history is kept, same as the Remove button.
await sql`UPDATE students SET active = false WHERE student_number = '0001'`
