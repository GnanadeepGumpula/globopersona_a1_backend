# Globopersona Backend

Next.js 15 App Router backend for Globopersona. It replaces mock data with Supabase-backed endpoints for campaigns, contacts, segments, settings, notifications, activities, and dashboard analytics.

## Stack

- Next.js 15 App Router
- TypeScript
- Supabase Postgres
- Supabase Auth
- Supabase Storage ready
- Zod for validation
- Vitest for service-level tests

## Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_WORKSPACE_SLUG`
- `NEXT_PUBLIC_WORKSPACE_ID`

## Database

Run the SQL in `supabase/migrations` against your Supabase project. The migration creates:

- workspace, profile, campaign, contact, audience segment, activity, notification, settings, and dashboard metric tables
- search and foreign key indexes
- row level security policies
- helper functions for workspace access control and dashboard summaries

The seed file adds sample marketing data that mirrors the dashboard content this backend expects.

For the fastest setup, you can also run `supabase/setup.sql`, which combines the schema and the seed data into one script for the Supabase SQL editor.

## Run locally

```bash
npm install
npm run dev
```

## API

The following routes are implemented:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/performance`
- `GET /api/dashboard/recent-campaigns`
- `GET /api/activities`
- `GET /api/notifications`
- `POST /api/notifications/mark-all-read`
- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/campaigns`
- `PATCH /api/campaigns/:id`
- `DELETE /api/campaigns/:id`
- `POST /api/campaigns/:id/schedule`
- `POST /api/campaigns/:id/send`
- `GET /api/contacts`
- `GET /api/contacts/:id`
- `POST /api/contacts`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`
- `GET /api/segments`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/search?q=`

## Frontend fetch pattern

From the Next.js frontend, fetch the API from server components, route handlers, or client components as needed:

```ts
const response = await fetch('/api/dashboard/summary', {
  credentials: 'include'
});

if (!response.ok) {
  throw new Error('Failed to load dashboard summary');
}

const data = await response.json();
```

For authenticated browser requests, keep Supabase Auth session cookies enabled. The backend reads the current session from Supabase on the server and applies workspace and role checks before writing data.

## Testing

```bash
npm run test
```

The tests cover service-level CRUD flows, validation, and dashboard aggregation logic with mocked Supabase clients.
