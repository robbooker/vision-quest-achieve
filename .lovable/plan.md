

# Goal Sprint Restructure: Split Day + Set-Based Pushups

## New Goal Structure

The current 6 goals become **9 goals**, organized into sections:

**Morning Block** (check off in the AM):
- `morning_meditation` — Morning meditation & affirmations
- `morning_diet` — Ate clean (morning/lunch)
- `evening_routine_prev` — Did evening routine last night (bed by 10:30, screen curfew, etc.)

**General Block** (anytime):
- `strength` — Pushups (even days) or Squats (odd days), logged in sets of 10 with a counter UI
- `reading` — 1 hour reading
- `cardio` — 45 min cardio

**Afternoon Block** (check off in the PM):
- `afternoon_meditation` — Afternoon meditation
- `afternoon_diet` — Ate clean (afternoon/dinner)

### Pushup/Squat Set Tracking

Instead of a single checkbox, strength gets a **counter UI** (0-5 sets of 10). Stored as `completed_sets` (integer, 0-5) in the DB. Goal is "complete" when sets = 5. The API accepts `{ goal_key: "strength", completed_sets: 3 }` — setting `completed` automatically when sets reach 5.

## Database Changes

Add a `completed_sets` column (integer, nullable, default null) to `goal_sprint_logs`. No other schema changes needed — the `goal_key` values just expand.

## File Changes

| File | Change |
|------|--------|
| `src/data/goalSprint.ts` | Replace 6 goals with 9 goals, add `section` field (morning/general/afternoon), update GOALS_PER_DAY to 8 (strength counts as 1) |
| `src/hooks/useGoalSprint.ts` | Add `updateSets` mutation for strength. Update stats calc for 8 goals/day. Handle `completed_sets` field |
| `src/components/dashboard/GoalSprintWidget.tsx` | Render goals grouped by section with headers. Strength item gets +/- counter (sets of 10) instead of checkbox. Show "3/5 sets" progress |
| `supabase/functions/export-data/index.ts` | Update GOAL_KEYS array to new 8 keys, GOALS_PER_DAY to 8. Accept `completed_sets` in POST/PATCH body. Auto-set `completed=true` when sets=5. Update help text |
| Migration | `ALTER TABLE goal_sprint_logs ADD COLUMN completed_sets integer DEFAULT NULL` |

## API Changes

**Valid `goal_key` values change to:** `morning_meditation`, `morning_diet`, `evening_routine_prev`, `strength`, `reading`, `cardio`, `afternoon_meditation`, `afternoon_diet`

**POST/PATCH body** now also accepts `completed_sets` (integer 0-5) for strength:
```json
{ "date": "2026-03-12", "goal_key": "strength", "completed_sets": 3 }
```
When `completed_sets` reaches 5, `completed` is auto-set to `true`.

All other goals remain simple `completed: true/false` toggles.

**GET** response unchanged in shape — strength rows include `completed_sets` field, summary stats use 8 goals/day.

