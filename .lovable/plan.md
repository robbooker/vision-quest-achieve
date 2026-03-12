

# Rob's Two-Week Goal Sprint

## What We're Building

A daily goal checklist system for the Today page that replaces the current routines/daily steps section during the active sprint period (Mar 12-26). Each day shows the relevant goals to check off, with alternating strength exercises on even/odd days. Full API support for logging and querying progress.

## Database

**New table: `goal_sprint_logs`**
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, NOT NULL)
- `sprint_date` (date, NOT NULL) — the day being logged
- `goal_key` (text, NOT NULL) — one of: `diet`, `cardio`, `reading`, `morning_routine`, `nighttime_routine`, `strength`
- `completed` (boolean, default false)
- `notes` (text, nullable)
- `created_at`, `updated_at` (timestamps)
- Unique constraint on `(user_id, sprint_date, goal_key)`
- RLS: users can only CRUD their own rows

The sprint definition (dates, goal descriptions, even/odd logic) will be hardcoded in a shared constants file since this is a personal sprint. No template table needed.

## Frontend Changes

**New file: `src/data/goalSprint.ts`** — Sprint config constant with start/end dates, goal definitions including which days each applies to (daily vs even vs odd), descriptions.

**New file: `src/hooks/useGoalSprint.ts`** — Hook to query/upsert `goal_sprint_logs` for a given date. Computes which goals apply today (all daily + even/odd strength). Returns completion state and toggle function.

**New file: `src/components/dashboard/GoalSprintWidget.tsx`** — Replaces routines/daily steps on the Today page during the sprint. Shows:
- Sprint header with progress bar (days elapsed / 14)
- Today's goals as a checklist (6 items: 5 daily + 1 strength)
- Each item shows the goal description and check/uncheck toggle
- Date picker to view/edit previous days
- Week and overall sprint stats at bottom

**Edit: `src/pages/Today.tsx`** — Import GoalSprintWidget. In the daily steps slot (line ~362), check if the goal sprint is active (today is between Mar 12-26). If active, render GoalSprintWidget instead of routines/daily steps.

## API (export-data edge function)

**New resource: `goal_sprint`**

- **GET** `?resource=goal_sprint` — Returns all logs with computed summary stats:
  - Per-day completion (which goals done each day)
  - Current day stats, current week stats, full sprint stats
  - Percentage complete overall
  
- **POST** `?resource=goal_sprint` — Log/toggle a goal: `{ date, goal_key, completed, notes? }`

- **PATCH** `?resource=goal_sprint` — Update an existing log: `{ date, goal_key, completed?, notes? }`

The response always includes a `summary` block with today/week/sprint rollups so any API call also serves as a status check.

## Build Error Fixes

Replace all `NodeJS.Timeout` references with `ReturnType<typeof setTimeout>` across 6 files — these are pre-existing TypeScript errors unrelated to this feature.

## File Summary

| Action | File |
|--------|------|
| Create | `src/data/goalSprint.ts` |
| Create | `src/hooks/useGoalSprint.ts` |
| Create | `src/components/dashboard/GoalSprintWidget.tsx` |
| Edit | `src/pages/Today.tsx` |
| Edit | `supabase/functions/export-data/index.ts` |
| Migration | Create `goal_sprint_logs` table with RLS |
| Fix | 6 files with `NodeJS.Timeout` → `ReturnType<typeof setTimeout>` |

