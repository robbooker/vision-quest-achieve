
## Fix the Tasks Export API

### What's Wrong Today

The `tasks` resource in the export-data function has two problems:

1. **Both `from` and `to` are required** — the query filters by `created_at`, and without `to`, the query has no upper bound but the caller still gets an error if they omit it (the developer confirmed this).
2. **No `category` field returned** — the `quick_tasks` table has `personal` and `business` categories, but the export handler doesn't select or return that field.
3. **No `status` filter** — there's no way to request only open or only completed tasks server-side.
4. **No `pillar` field returned** — also present in the table but missing from the export.

### Changes to Make

**File: `supabase/functions/export-data/index.ts`** — update only the `tasks` handler (lines 135–151):

1. **Add `category` and `pillar` to the SELECT and output columns** so callers can see whether a task is personal or business.
2. **Make `to` optional** — default to today's date (`new Date().toISOString().split("T")[0]`) if not provided. This removes the error when only `from` is passed.
3. **Add a `status` query parameter** — if `?status=open` is passed, filter `completed = false`; if `?status=completed`, filter `completed = true`; if omitted, return all tasks. The handler signature will need to accept an extra `params` object (or we can read from the URL in a different way). The cleanest approach given the existing architecture is to pass the raw URL params through as an extra argument to handlers that need it.

### Updated API Docs (for GROOVYPLANNING.md)

```
GET /functions/v1/export-data?resource=tasks

Parameters:
  resource=tasks        (required)
  from=YYYY-MM-DD       (optional) — filter by created_at start date
  to=YYYY-MM-DD         (optional) — defaults to today if omitted
  status=open|completed (optional) — filter by task status; omit for all tasks
  format=json|csv       (optional) — defaults to json

Response fields:
  title         — task title
  category      — "personal" or "business"
  pillar        — associated pillar (or empty string)
  completed     — true / false
  completed_at  — ISO timestamp, or empty string
  due_date      — YYYY-MM-DD, or empty string
  created_at    — ISO timestamp

Examples:
  # All open tasks (no date filter needed)
  GET ?resource=tasks&status=open

  # Personal tasks completed this week
  GET ?resource=tasks&category=personal&status=completed&from=2026-02-14&to=2026-02-20

  # All tasks created in January as CSV
  GET ?resource=tasks&from=2026-01-01&to=2026-01-31&format=csv
```

### Technical Implementation Detail

The existing handler signature is:
```typescript
(supabase, userId, from, to) => Promise<{columns, rows}>
```

To support `status` filtering cleanly without rewriting every handler, the tasks handler will be updated to also accept an optional `extraParams` object. The main `serve` function will pass `url.searchParams` down to the handler. Since only the tasks handler uses it, the change is isolated.

Alternatively (simpler, no signature change needed): read the `status` param at the top of the `serve` function alongside `from` and `to`, then pass it as a 5th argument. The existing handlers all ignore extra arguments in JavaScript, so this is fully backward-compatible.

### Deployment

The edge function will be redeployed automatically after the code change. No database migration needed — this is purely a query-layer fix.
