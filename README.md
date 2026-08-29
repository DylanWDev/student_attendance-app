# Attendance

A simple classroom attendance app.

- Students go to the site, enter their first name, last name, student ID, and the password announced in class that day, and click a button to mark themselves present.
- The teacher logs in at `/teacher` with a separate teacher password to view a dashboard of who attended which days, manage the student roster, and set each day's password.

## Stack

- React + Vite frontend, Tailwind CSS for styling
- Express backend on Vercel serverless functions, Postgres (Neon) for storage
- Teacher auth is a stateless HMAC-signed cookie (no session store)

## Setup

1. Create a [Neon](https://neon.tech) project and get its Postgres connection string (a free-tier database works fine; a separate branch/database for local dev is recommended).

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in real values:

   ```
   TEACHER_PASSWORD=choose-a-password
   SESSION_SECRET=a-long-random-string
   DATABASE_URL=postgresql://...
   API_PORT=3001
   ```

4. Run the schema migration against your database (only needed once per database):

   ```bash
   npm run db:migrate
   ```

5. Start the app in development (runs the Vite dev server and the API together):

   ```bash
   npm run dev
   ```

   Open http://localhost:5173 — students check in there, and the teacher area is at http://localhost:5173/teacher.

## Production (Vercel)

1. Create a Vercel project linked to this repo.
2. Set `TEACHER_PASSWORD`, `SESSION_SECRET`, and `DATABASE_URL` (a production Neon connection string) as environment variables on the Vercel project.
3. Run `npm run db:migrate` once against the production database (e.g. locally with `DATABASE_URL` temporarily pointed at prod).
4. Deploy. Vercel builds the frontend (`npm run build`) and serves it as static assets, with `/api/*` routed to a serverless function (see `vercel.json`).

## Notes

- The daily student password is set by the teacher from `/teacher` → "Today's Password" each day.
- Students must already be on the roster (added via `/teacher` → "Roster") for check-in to succeed — this catches typos and prevents made-up entries.
- Removing a student from the roster keeps their past attendance history.
