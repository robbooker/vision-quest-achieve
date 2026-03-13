

# Fix Timezone Issues on Today Page

## Problem
Multiple places use `date.toISOString().split('T')[0]` to get "today's" date string. `toISOString()` converts to UTC, so at 10:20 PM Central (UTC-6), it returns tomorrow's date. This affects:

1. **`formatDateStr()` in `src/data/goalSprint.ts`** — used by GoalSprintWidget to determine current sprint day and query logs
2. **`startOfDay().toISOString()` in Today.tsx** — used for calendar event queries  
3. **Date display headers** — these use `format(new Date(), ...)` which is local-time-aware (already correct)
4. **Practice completion localStorage keys** — uses `format()` (already correct)

## Root Cause
`Date.toISOString()` always outputs UTC. At 10:20 PM CST (UTC-6), `new Date().toISOString()` returns `2026-03-13T04:20:00Z` — March 13, not March 12.

## Fix

### 1. `src/data/goalSprint.ts` — Fix `formatDateStr()`
Replace the UTC-based implementation:
```ts
// BEFORE (broken)
export function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// AFTER (local time)
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

This single fix corrects `isSprintActive()`, `getSprintDayNumber()`, and all GoalSprintWidget date comparisons since they all use `formatDateStr`.

### 2. `src/pages/Today.tsx` — Fix calendar event query window
Replace `startOfDay(selectedDate).toISOString()` / `endOfDay(selectedDate).toISOString()` with timezone-safe local midnight calculations that don't shift the day.

### 3. `src/hooks/useCycles.tsx` — Fix `end_date` calculation
The `createCycle` mutation uses `endDate.toISOString().split('T')[0]` — fix to use local date formatting.

### Files Changed
- `src/data/goalSprint.ts` — fix `formatDateStr`
- `src/pages/Today.tsx` — fix calendar query date range
- `src/hooks/useCycles.tsx` — fix end_date formatting

