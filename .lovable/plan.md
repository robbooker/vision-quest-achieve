

# Team Tasks — Command Center

## Overview
Create a shared task board for Rob, Liz, and Buddy at `/team`. Includes a new database table, three API edge functions for Buddy, and a polished React page with real-time updates.

## Database

New `team_tasks` table with columns: id, title, description, status (open/done), priority (high/normal/low), created_by, assigned_to, completed_by, completed_at, created_at, updated_at. No RLS — this is a team-internal table accessible to authenticated users and via edge functions. An `updated_at` trigger will keep timestamps fresh. Enable Supabase Realtime on the table.

A new secret `GROOVY_AUTH_TOKEN` will be needed for the edge function API key auth.

## Edge Functions

Three functions, each validating `x-api-key` header against `GROOVY_AUTH_TOKEN` secret:

1. **`get-team-tasks`** — Returns all tasks, supports `?status=open|done` filter. Uses service role client.
2. **`create-team-task`** — Accepts JSON body `{ title, description, priority, created_by, assigned_to }`, inserts row, returns it.
3. **`update-team-task`** — Accepts JSON body `{ id, status, completed_by }`. If status becomes `done`, sets `completed_at = now()` and `completed_by`.

## React Page (`src/pages/Team.tsx`)

Premium mobile-first design (max-w-md centered). Components:

- **Header**: "Command Center" bold heading + "Scout HQ · Active Tasks" subtitle
- **Filter bar**: Pill toggles for All / Open / Done
- **Task list**: Cards with generous padding, soft shadows, 12px radius
  - Circular checkbox on left (animated scale+fade on complete)
  - Title (16px medium), optional muted description
  - Priority pill badge (amber/slate/green)
  - Assigned-to avatar circle with initials: R (indigo), L (rose), B (emerald)
  - "Added by..." muted footer text
  - Done tasks: strikethrough title, green check badge with completer name
- **Empty state**: Icon + "All clear. Nothing on the board."
- **FAB**: Bottom-right floating indigo button → opens bottom sheet with title, description, priority, assigned_to, created_by fields
- **Real-time**: Supabase channel subscription on `team_tasks` table for instant updates

## Navigation

Add `{ href: '/team', label: 'Team', icon: Users }` to `dropdownNavItems` in `DashboardLayout.tsx`.

## Route

Add `<Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />` in `App.tsx`.

## Files Changed
- **Migration**: Create `team_tasks` table + `updated_at` trigger + realtime
- **Secret**: Request `GROOVY_AUTH_TOKEN` from user
- `supabase/functions/get-team-tasks/index.ts` — new
- `supabase/functions/create-team-task/index.ts` — new
- `supabase/functions/update-team-task/index.ts` — new
- `src/pages/Team.tsx` — new (page component with all UI)
- `src/hooks/useTeamTasks.ts` — new (data fetching + realtime + mutations)
- `src/App.tsx` — add route + import
- `src/components/layout/DashboardLayout.tsx` — add nav link

